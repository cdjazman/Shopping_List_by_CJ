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

## Decision 010 - Develop Branch for Staging, Main for Production

Status: Accepted

The project uses two long-lived branches: `develop` and `main`.

Reason:
The project owner wants to personally test upcoming changes (and have
early testers try them) before they reach the app's day-to-day users.
A single production branch made that impossible without exposing
untested work to everyone using the app.

Details:
- `main` is the production branch. It is what day-to-day users have
  installed, and should always reflect a working, tested state.
- `develop` is the staging branch. All new feature and fix branches are
  created from `develop`, and their pull requests target `develop`,
  not `main`.
- Once changes on `develop` have been tested - ideally via its own
  separate deployment/preview build, installed and used directly -
  they are promoted to `main` via a single pull request from `develop`
  into `main`.
- `develop` should be kept reasonably close to `main`. It exists to
  buy a short testing window, not to become a long-diverging branch.

Consequences:
- Shipping a change to production now takes two pull requests: one
  merging a feature branch into `develop`, and one later promoting
  `develop` into `main`.
- The project owner can install and use a separate build (e.g. a
  Cloudflare Pages preview deployment of `develop`) to test changes on
  a real device before they reach anyone else.
- If `develop` is ever accidentally deleted (as happened once before
  this decision was written, likely via a "delete branch on merge"
  repo setting), it can simply be recreated from `main` - its own
  history isn't meaningful, only its role as a staging branch is.

Approved by the project owner on 2026-08-02.

---

## Decision 011 - Recipe Import via URL Deep Link

Status: Accepted

The marketing website (`shoppinglistbycj-website`, a separate repo) gained
recipe pages with an "Add to Shopping List" button. The app receives that
data via a `?import=` URL query parameter read on load, not via any API —
see `RECIPE_IMPORT_CONTRACT.md` for the full schema and validation rules,
which is mirrored in both repos and must be kept in sync between them.

Reason:
The app has no backend (Decision 002 - Offline First), so the website has
no way to "push" data into it. A URL carrying the payload, read by the app
on load, is the only mechanism available that doesn't require adding a
server, an account system, or a cloud dependency to either project. A Web
Share Target (`share_target` in the manifest) was considered and rejected
for the initial version — iOS Safari's support for PWAs *receiving* shares
is limited/unreliable, and it adds more moving parts than needed.

Consequences:
- This is purely additive: it never touches Settings → Backup/Restore (the
  existing destructive import), never removes data, and only ever adds to
  the current active list.
- The payload is untrusted input (it arrives via a URL) and is validated
  accordingly: capped array length, capped string lengths, clamped
  quantities, malformed entries dropped rather than erroring.
- The website and app repos now share a documented interface
  (`RECIPE_IMPORT_CONTRACT.md`) that isn't enforced by any build tooling —
  keeping both copies of that file in sync is a manual discipline, not an
  automated one. Any change to the payload shape on either side must update
  both copies in the same change.
- The website's `SHOPPING_LIST_APP_URL` (in `js/recipes.js`) now points at
  the real production URL, `https://shopping-list-by-cj.pages.dev`, with
  `OPEN_IMPORT_IN_NEW_TAB` flipped to `false` — updated 2026-08-09, the
  same day the app's real deployment URL was confirmed.

Approved by the project owner on 2026-08-09.

---

## Decision 012 - Recipe Import Lets the User Choose the Target List

Status: Accepted

Decision 011 originally had recipe imports land silently on whichever list
happened to be active. That's now changed: the person is shown a dialog
listing every existing list and picks which one the ingredients go to
(skipped automatically when there's only one list — nothing to choose
between). Once they pick, the app also navigates back to the recipe page
it came from, via a new `returnUrl` field the website now includes in the
payload.

Reason:
Landing ingredients on "whatever list happens to be active" is surprising
when someone keeps separate lists (e.g. a weekly groceries list vs. a
party-planning list) and imports a recipe while the wrong one is active.
Letting them choose removes that guesswork. Returning to the recipe page
afterwards closes the loop the same way a native "open in app" flow would,
rather than leaving the person stranded in the shopping list app.

Consequences:
- `RECIPE_IMPORT_CONTRACT.md` (mirrored in both repos) documents the new
  optional `returnUrl` payload field and the list-choice behaviour — see
  that file for the full validation rules and app behaviour.
- `returnUrl` is validated against a host allowlist
  (`shoppinglistbycj.app`, `www.shoppinglistbycj.app`, plus `localhost`/
  `127.0.0.1` for local dev) before the app ever navigates to it, since
  it's untrusted input carried in a URL — an unrecognised host is simply
  dropped, not followed. This mirrors the existing "untrusted input"
  posture from Decision 011.
- `js/lists.js` gained two previously-internal functions on the public
  `window.shoppingLists` object — `getSortedLists()` and
  `getIconDisplay()` — needed so the picker dialog can enumerate and
  render the person's lists. No other behaviour of that module changed.
- Cancelling the list-choice dialog imports nothing and navigates nowhere,
  same as an unreadable/malformed import link.

Approved by the project owner on 2026-08-09.

---

## Decision 013 - Recipe Import Can Create a New List, Named After the Recipe

Status: Accepted

Extends Decision 012's list-choice dialog: alongside every existing list,
it now always offers a "Create new list" option too, even when there's
only one existing list. Picking it opens the app's normal new-list form
with the name field pre-filled with the recipe's name (e.g. "Butter
Chicken"), pre-selected so it's a one-keystroke overwrite if the person
wants something else. Saving that form creates the list and finishes the
import into it; cancelling it abandons the import, same as cancelling the
list-choice dialog itself.

Reason:
Decision 012 covered "add to one of my existing lists," but recipes are
often their own occasion — a dinner party, a meal-prep batch — that
doesn't belong on an existing list at all. Requiring the person to
manually create a list first, then separately re-trigger the import, was
extra friction the app can remove by folding list creation into the same
flow and defaulting the name to something already meaningful.

Consequences:
- The single-list auto-skip behaviour introduced in Decision 012 (jump
  straight to the only list, no dialog) is removed. There's always a real
  choice now — the one existing list, or a new one — so the dialog always
  shows.
- Reuses the existing new-list form and `createList()` as-is; no new list
  fields or storage shape were introduced. `openNewListModal()` gained an
  optional pre-fill argument, and `saveNewList()` gained a check for a
  pending recipe import so it can finish that import into the list it just
  created instead of the normal "just close the modal" behaviour.
- `RECIPE_IMPORT_CONTRACT.md` (mirrored in both repos) documents this.

Approved by the project owner on 2026-08-09.

---

## Future Decisions

Leave space for future architectural decisions.