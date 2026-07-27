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

## Future Decisions

Leave space for future architectural decisions.
