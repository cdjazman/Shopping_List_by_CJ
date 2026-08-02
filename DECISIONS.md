# DECISIONS.md

## Purpose

This document records important project decisions so future development remains consistent.

---

## Decision 001 - Personal Catalogue

Status: Accepted

The product catalogue intentionally starts empty.

Reason:
Users build their own personalised catalogue over time.

Consequences:
- Faster searching
- Smaller backups
- Personalised experience
- No bundled supermarket database

Never populate defaults.js automatically.

---

## Decision 002 - Offline First

Status: Accepted

The application must continue to function without an internet connection.

Reason:
Shopping lists should always be available.

---

## Decision 003 - User Owns Their Data

Status: Accepted

No account is required.

All shopping lists remain stored locally unless the user chooses to export a backup.

---

## Decision 004 - Simplicity Over Features

Status: Accepted

Every feature added must reduce effort rather than increase complexity.

Avoid feature creep.

---

## Decision 005 - Refactor Before New Features

Status: Accepted

Version 0.9 focuses on improving architecture.

No new features should be introduced during refactoring.

---

## Decision 006 - Small Git Commits

Status: Accepted

Each commit should contain one logical change only.

Every change must be tested before committing.

---

## Decision 007 - AI Development Rules

Status: Accepted

AI assistants must:

- Preserve functionality.
- Stop after each completed task.
- Never redesign unless requested.
- Never populate defaults.js.
- Never combine refactoring with feature development.

---

## Decision 008 - PWA Install Experience Exception to Decision 005

Status: Accepted

Decision 005 states that no new features should be introduced during the
architecture refactor (v0.9). The custom Install App experience (Android
native prompt, iOS Safari "Add to Home Screen" instructions, standalone
detection) is new functionality, not a like-for-like refactor of existing
behaviour.

This work is being carried out alongside the v0.9 refactor as a deliberate,
explicit exception, made with the project owner's approval on 2026-08-01.

Reason:
The PWA install flow was broken across platforms (no iOS support, no
standalone detection, install code out of sync with the HTML after prior
merges) and is core to the app's stated goal of working well on Android,
iPhone, and Desktop. Fixing it required going beyond a pure bug-fix.

Consequences:
- PWA-specific code (service worker registration, update checking, update
  banner, install prompt handling, standalone detection) is isolated into
  its own module, js/pwa.js, so it does not entangle with the shopping-list
  refactor.
- This exception applies only to the PWA install/update experience. Other
  new features remain out of scope until v0.9 refactor work is complete.

---

## Decision 009 - Logo Tap Navigation Exception to Decision 005

Status: Accepted

Same situation as Decision 008: the header logo now navigates back to
My Lists on tap/click, which is new behaviour rather than a like-for-like
refactor. Approved by the project owner on 2026-08-02 as a small,
explicitly requested exception.

Implementation reused the existing showLists() function and the existing
bindNavAction() touch/click handler already used by the bottom nav and
tabs, so no new interaction pattern was introduced - just a new entry
point into an existing one.

---

## Future Decisions

Leave space for future architectural decisions.
