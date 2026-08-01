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

  // ------------------------------------------------------------------
  // DOM references
  // ------------------------------------------------------------------
  // All lookups are optional-safe (elements may be absent in a stripped-
  // down test page), so every usage below uses the `?.` operator.
  const els = {};

  function cacheElements() {
    els.updateBanner = document.getElementById('updateBanner');
    els.reloadAppBtn = document.getElementById('reloadAppBtn');
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

  function showUpdateBanner() {
    els.updateBanner?.classList.remove('hidden');
  }

  function resetUpdateBannerUI() {
    if (!els.updateBanner) return;
    const label = els.updateBanner.querySelector('span');
    const button = els.updateBanner.querySelector('button');
    if (label) label.textContent = '🎉 New version available!';
    if (button) button.style.display = '';
  }

  function trackInstallingWorker(installingWorker) {
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      const hasExistingController = Boolean(navigator.serviceWorker.controller);
      // "installed" + an existing controller means this is an update to
      // an already-running app, not the very first install.
      if (installingWorker.state === 'installed' && hasExistingController) {
        waitingWorker = installingWorker;
        resetUpdateBannerUI();
        showUpdateBanner();
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
          // the person closed the tab before clicking "Update Now".
          if (registration.waiting && navigator.serviceWorker.controller) {
            waitingWorker = registration.waiting;
            resetUpdateBannerUI();
            showUpdateBanner();
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
      const label = els.updateBanner?.querySelector('span');
      const button = els.updateBanner?.querySelector('button');
      if (label) label.textContent = '⚡ Updating...';
      if (button) button.style.display = 'none';

      setTimeout(() => {
        if (waitingWorker) {
          waitingWorker.postMessage(SKIP_WAITING_MESSAGE);
        } else {
          global.location.reload();
        }
      }, 600);
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
