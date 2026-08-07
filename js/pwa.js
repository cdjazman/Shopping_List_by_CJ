/**
 * js/pwa.js
 * ------------------------------------------------------------------------
 * Owns everything related to "being a PWA":
 *   - Service worker registration and lifecycle
 *   - Update detection and the update banner
 *   - The custom Install App experience:
 *       Android / Desktop -> native beforeinstallprompt flow
 *       iPhone / iOS Safari -> "Add to Home Screen" instructions
 *       Already installed (standalone) -> no install UI at all
 *
 * This file deliberately knows nothing about shopping lists, products, or
 * catalogue state. It only reads/writes DOM elements that belong to the
 * PWA install/update UI (#updateBanner, #installCard, #iosInstallCard,
 * #checkUpdateBtn). app.js has no dependency on anything in this file.
 * ------------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const SW_URL = '/service-worker.js';
  const SW_SCOPE = '/';

  // Message contract sent to a waiting worker to activate it immediately.
  // service-worker.js's `message` listener must match this exact shape
  // (see the companion change in that file).
  const SKIP_WAITING_MESSAGE = { type: 'SKIP_WAITING' };

  // Remembers which version the person explicitly said "Not Now" to, so
  // the banner doesn't nag again about that same version. A genuinely
  // new version (different CACHE_VERSION) always shows the banner again.
  const DECLINED_UPDATE_KEY = 'shopping-list-declined-update-version';

  // ------------------------------------------------------------------
  // DOM references
  // ------------------------------------------------------------------
  // All lookups are optional-safe (elements may be absent in a stripped-
  // down test page), so every usage below uses the `?.` operator.
  const els = {};

  function cacheElements() {
    els.updateBanner = document.getElementById('updateBanner');
    els.updateBannerLabel = els.updateBanner?.querySelector('span') || null;
    els.reloadAppBtn = document.getElementById('reloadAppBtn');
    els.dismissUpdateBtn = document.getElementById('dismissUpdateBtn');
    els.checkUpdateBtn = document.getElementById('checkUpdateBtn');

    els.installCard = document.getElementById('installCard');
    els.installAppBtn = document.getElementById('installAppBtn');

    els.iosInstallCard = document.getElementById('iosInstallCard');
    els.iosInstallToggleBtn = document.getElementById('iosInstallToggleBtn');
    els.iosInstallSteps = document.getElementById('iosInstallSteps');
  }

  // ------------------------------------------------------------------
  // Platform / install-state detection
  // ------------------------------------------------------------------

  /**
   * True if the app is currently running as an installed app rather than
   * a regular browser tab, across Android/Desktop (display-mode media
   * query), iOS Safari (the legacy `navigator.standalone` flag), and the
   * Android TWA/Trusted Web Activity referrer pattern.
   */
  function isStandalone() {
    const standaloneQuery = global.matchMedia && global.matchMedia('(display-mode: standalone)');
    return Boolean(
      (standaloneQuery && standaloneQuery.matches) ||
      global.navigator.standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  }

  /** True on iPhone, iPod, iPad, and iPadOS 13+ (which reports as "MacIntel"). */
  function isIOSDevice() {
    const ua = global.navigator.userAgent || '';
    const isAppleTouchDevice = /iPhone|iPad|iPod/i.test(ua);
    const isIPadOS13Plus = global.navigator.platform === 'MacIntel' && global.navigator.maxTouchPoints > 1;
    return isAppleTouchDevice || isIPadOS13Plus;
  }

  /**
   * True only for actual Safari. Chrome, Firefox, and Edge on iOS all use
   * WebKit and include "Safari" in their user-agent string too, so they
   * must be explicitly excluded here.
   */
  function isSafariBrowser() {
    const ua = global.navigator.userAgent || '';
    return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android/i.test(ua);
  }

  // ------------------------------------------------------------------
  // Install card visibility
  // ------------------------------------------------------------------

  // Captured from the `beforeinstallprompt` event. Only Android/Desktop
  // Chromium browsers ever fire this; Safari never does.
  let deferredInstallPrompt = null;

  function hideAllInstallCards() {
    els.installCard?.classList.add('hidden');
    els.iosInstallCard?.classList.add('hidden');
  }

  /**
   * Single source of truth for which install card (if any) is visible.
   * Called on init and every time install-eligibility state changes.
   */
  function refreshInstallCardVisibility() {
    if (!els.installCard && !els.iosInstallCard) return;

    if (isStandalone()) {
      hideAllInstallCards();
      return;
    }

    if (deferredInstallPrompt) {
      els.installCard?.classList.remove('hidden');
      els.iosInstallCard?.classList.add('hidden');
      return;
    }

    if (isIOSDevice() && isSafariBrowser()) {
      els.iosInstallCard?.classList.remove('hidden');
      els.installCard?.classList.add('hidden');
      return;
    }

    hideAllInstallCards();
  }

  function initInstallPrompt() {
    global.addEventListener('beforeinstallprompt', (event) => {
      // Suppress the browser's own mini-infobar so our card is the only
      // install entry point the person sees.
      event.preventDefault();
      deferredInstallPrompt = event;
      refreshInstallCardVisibility();
    });

    els.installAppBtn?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;

      els.installAppBtn.disabled = true;

      try {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
      } finally {
        // A captured beforeinstallprompt event can only be used once,
        // regardless of what the person chose. Chrome may fire a fresh
        // one later (e.g. after enough engagement); until then, hide.
        deferredInstallPrompt = null;
        els.installAppBtn.disabled = false;
        refreshInstallCardVisibility();
      }
    });

    global.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      refreshInstallCardVisibility();
    });

    // Covers the case where display-mode flips to standalone without an
    // `appinstalled` event reaching this tab (e.g. installed from another
    // tab in the same session).
    const standaloneQuery = global.matchMedia && global.matchMedia('(display-mode: standalone)');
    standaloneQuery?.addEventListener?.('change', refreshInstallCardVisibility);
  }

  function initIOSInstallCard() {
    if (!els.iosInstallToggleBtn || !els.iosInstallSteps) return;

    els.iosInstallToggleBtn.addEventListener('click', () => {
      const isExpanded = els.iosInstallToggleBtn.getAttribute('aria-expanded') === 'true';
      els.iosInstallToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      els.iosInstallSteps.classList.toggle('hidden', isExpanded);
    });
  }

  // ------------------------------------------------------------------
  // Service worker registration, update detection, update banner
  // ------------------------------------------------------------------

  let swRegistration = null;
  let waitingWorker = null;
  // CACHE_VERSION string of the update currently sitting in `waitingWorker`,
  // read directly out of the deployed service-worker.js. Used to compare
  // against DECLINED_UPDATE_KEY so a "Not Now" only silences *that*
  // version, not every future update.
  let pendingUpdateVersion = null;

  function getDeclinedVersion() {
    try {
      return global.localStorage.getItem(DECLINED_UPDATE_KEY);
    } catch (error) {
      return null;
    }
  }

  function setDeclinedVersion(version) {
    if (!version) return;
    try {
      global.localStorage.setItem(DECLINED_UPDATE_KEY, version);
    } catch (error) {
      // Ignore storage failures (e.g. private browsing) - worst case the
      // banner reappears next visit, which is a safe default.
    }
  }

  /**
   * Reads CACHE_VERSION straight out of the live service-worker.js file.
   * `cache: 'no-store'` bypasses the HTTP cache so this always reflects
   * whatever was just deployed, not a stale copy.
   */
  async function getServiceWorkerVersion() {
    try {
      const response = await fetch(SW_URL, { cache: 'no-store' });
      const text = await response.text();
      const match = text.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  function showUpdateBanner() {
    els.updateBanner?.classList.remove('hidden');
  }

  function resetUpdateBannerUI() {
    if (!els.updateBanner) return;
    if (els.updateBannerLabel) els.updateBannerLabel.textContent = '🎉 New version available!';
    if (els.reloadAppBtn) {
      els.reloadAppBtn.style.display = '';
      els.reloadAppBtn.disabled = false;
    }
    if (els.dismissUpdateBtn) els.dismissUpdateBtn.style.display = '';
  }

  /**
   * A worker is waiting to activate. By default this respects a prior
   * "Not Now" for this exact version and stays silent - the update is
   * still there (and reachable via "Check for updates") but doesn't nag.
   * `forceShow` (used by the manual check-for-updates button) always
   * surfaces the banner, since that's an explicit ask.
   */
  async function handleWaitingWorker(worker, { forceShow = false } = {}) {
    if (!worker) return;
    waitingWorker = worker;

    const version = await getServiceWorkerVersion();
    pendingUpdateVersion = version;

    if (!forceShow && version && version === getDeclinedVersion()) {
      return;
    }

    resetUpdateBannerUI();
    showUpdateBanner();
  }

  function trackInstallingWorker(installingWorker) {
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      const hasExistingController = Boolean(navigator.serviceWorker.controller);
      // "installed" + an existing controller means this is an update to
      // an already-running app, not the very first install.
      if (installingWorker.state === 'installed' && hasExistingController) {
        handleWaitingWorker(installingWorker);
      }
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    global.addEventListener('load', () => {
      navigator.serviceWorker
        .register(SW_URL, { scope: SW_SCOPE })
        .then((registration) => {
          swRegistration = registration;

          // A worker may already be waiting from a previous session, e.g.
          // the person closed the tab before deciding on "Update Now".
          if (registration.waiting && navigator.serviceWorker.controller) {
            handleWaitingWorker(registration.waiting);
          }

          registration.addEventListener('updatefound', () => {
            trackInstallingWorker(registration.installing);
          });
        })
        .catch((error) => {
          // Registration failures should be visible during development
          // rather than silently swallowed.
          console.error('Service worker registration failed:', error);
        });

      let hasReloadedForUpdate = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasReloadedForUpdate) return;
        hasReloadedForUpdate = true;
        global.location.reload();
      });
    });
  }

  function initUpdateCheckButton() {
    if (!els.checkUpdateBtn) return;

    const IDLE_LABEL = '🔄 Check for updates';

    els.checkUpdateBtn.addEventListener('click', () => {
      if (!swRegistration) {
        global.location.reload();
        return;
      }

      els.checkUpdateBtn.textContent = '🔄 Checking...';

      swRegistration
        .update()
        .then(() => {
          // `update()` resolving doesn't tell us whether a new version
          // was found — that arrives asynchronously via `updatefound`.
          // Give it a moment, then report "up to date" if nothing showed up.
          setTimeout(() => {
            if (waitingWorker) {
              // Explicit ask - show the banner even if this exact version
              // was previously dismissed with "Not Now".
              resetUpdateBannerUI();
              showUpdateBanner();
              els.checkUpdateBtn.textContent = IDLE_LABEL;
              return;
            }
            els.checkUpdateBtn.textContent = '✓ Up to date';
            setTimeout(() => {
              els.checkUpdateBtn.textContent = IDLE_LABEL;
            }, 2000);
          }, 1000);
        })
        .catch(() => {
          els.checkUpdateBtn.textContent = IDLE_LABEL;
        });
    });
  }

  function initReloadButton() {
    if (!els.reloadAppBtn) return;

    els.reloadAppBtn.addEventListener('click', () => {
      if (els.updateBannerLabel) els.updateBannerLabel.textContent = '⚡ Updating...';
      if (els.reloadAppBtn) els.reloadAppBtn.style.display = 'none';
      if (els.dismissUpdateBtn) els.dismissUpdateBtn.style.display = 'none';

      setTimeout(() => {
        if (waitingWorker) {
          waitingWorker.postMessage(SKIP_WAITING_MESSAGE);
        } else {
          global.location.reload();
        }
      }, 600);
    });
  }

  /**
   * "Not Now": the person has seen the update and chosen to keep using
   * the current version. Remembers *this* version as declined (so the
   * banner won't reappear for it) and hides the banner. The update
   * itself isn't discarded — `waitingWorker` stays set, so "Check for
   * updates" or a future genuinely-new version will still surface it.
   */
  function initDismissButton() {
    if (!els.dismissUpdateBtn) return;

    els.dismissUpdateBtn.addEventListener('click', () => {
      setDeclinedVersion(pendingUpdateVersion);
      els.updateBanner?.classList.add('hidden');
    });
  }

  // ------------------------------------------------------------------
  // Bootstrap
  // ------------------------------------------------------------------

  function init() {
    cacheElements();
    refreshInstallCardVisibility();
    initInstallPrompt();
    initIOSInstallCard();
    initUpdateCheckButton();
    initReloadButton();
    initDismissButton();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Small public surface — mainly useful for debugging from the console
  // (e.g. `shoppingListPWA.isStandalone()`). Nothing in app.js depends on this.
  global.shoppingListPWA = {
    isStandalone,
    refreshInstallCardVisibility
  };
})(window);
