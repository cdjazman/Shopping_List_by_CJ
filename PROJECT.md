# Shopping List by CJ

**Project Version:** 0.9 Foundation  
**Platform:** Progressive Web App (PWA)  
**Target:** Android (Play Store), iOS (Web App), Windows, macOS, Linux

---

# Project Vision

Shopping List by CJ is an offline-first shopping list application designed to be the fastest and simplest grocery shopping app available.

Unlike traditional shopping list applications, every user builds their own personalised catalogue over time.

The application is designed to feel lightweight, fast, reliable and clutter-free.

---

# Core Philosophy

## Personal Catalogue

The catalogue intentionally starts empty.

**This is not a bug.**

Users create their own catalogue by adding products they actually purchase.

Advantages:

- No unnecessary products.
- Faster searching.
- Smaller backups.
- Fully personalised.
- No bundled supermarket database.
- No maintenance of thousands of products.

This behaviour must never be "fixed" by automatically populating the catalogue.

---

# Design Principles

The application should always prioritise:

- Simplicity
- Speed
- Reliability
- Offline capability
- Minimal taps
- Clean interface
- User ownership of data

If a feature makes the app more complicated than useful, it should be reconsidered.

---

# Target Users

Australian shoppers who want:

- A fast shopping list.
- Their own product catalogue.
- Offline functionality.
- No advertisements.
- No subscriptions.
- No account required.

---

# Current Architecture

```
Shopping_List/

├── api/
├── assets/
│   ├── icons/
│   └── images/
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── defaults.js
├── index.html
├── manifest.json
├── service-worker.js
├── README.md
└── PROJECT.md
```

This structure will evolve during the Version 0.9 refactor.

---

# Version Roadmap

## Version 0.9

Goal:

Create a stable, maintainable codebase.

Focus:

- Refactoring only
- Folder organisation
- Better maintainability
- No functionality changes

Features retained:

- Shopping lists
- Personal catalogue
- Categories
- Shop mode
- Settings
- Backup & Restore
- Local Storage
- Offline PWA

---

## Version 1.0

Goals:

- Modern UI refresh
- Better product editing
- Improved search
- Faster navigation
- Cleaner settings
- Improved onboarding

---

## Future Versions

Potential features:

- Cloud Sync
- Shared Lists
- Barcode Scanner
- Receipt Scanner
- Price Comparison
- Aldi Integration
- Coles Integration
- Woolworths Integration
- Shopping Packs
- Favourites
- AI Product Suggestions

These features are optional and should never compromise the app's simplicity.

---

# Coding Standards

The project should follow these rules:

- No inline CSS.
- No inline JavaScript.
- One responsibility per function.
- Keep functions small.
- Avoid duplicated logic.
- Use descriptive variable names.
- Preserve backwards compatibility.
- Minimise global variables.

---

# Folder Standards

Assets belong inside:

```
assets/icons/
assets/images/
```

Styles belong inside:

```
css/
```

JavaScript belongs inside:

```
js/
```

---

# Git Workflow

Never develop directly on **main**.

Workflow:

1. Create feature/refactor branch.
2. Complete one logical task.
3. Test thoroughly.
4. Commit.
5. Merge after verification.

Example commits:

```
refactor: extract inline css
refactor: extract javascript
refactor: move assets
feat: add category editor
fix: backup restore regression
```

---

# AI Development Rules

Any AI assistant working on this project must:

- Preserve existing functionality.
- Never redesign the interface unless requested.
- Never combine refactoring and feature development.
- Stop after each completed task for approval.
- Prefer multiple small commits over one large commit.
- Preserve existing backup compatibility.
- Preserve Local Storage compatibility.
- Keep the app offline-first.

### Important

Do **NOT** populate `defaults.js`.

The catalogue intentionally starts empty.

This is a product decision.

---

# Testing Checklist

Every completed task must verify:

- Application loads.
- No console errors.
- Shopping list functions correctly.
- Product add/edit/delete works.
- Categories work.
- Shop mode works.
- Settings work.
- Backup export works.
- Backup import works.
- Local Storage works.
- Refresh restores data.
- PWA installs correctly.
- Service Worker registers successfully.

---

# Performance Goals

The application should:

- Load quickly.
- Work offline.
- Feel responsive.
- Require minimal memory.
- Avoid unnecessary dependencies.

---

# Long-Term Vision

Shopping List by CJ should become the easiest shopping list app to use.

The focus is not on providing millions of products.

The focus is helping every user build **their own perfect shopping catalogue** over time.

The application should remain:

- Fast
- Clean
- Reliable
- Personal
- Offline-first

Every future feature should support those goals rather than increase complexity.