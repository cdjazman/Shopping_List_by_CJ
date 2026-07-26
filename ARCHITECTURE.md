# Shopping List by CJ Architecture

## Purpose

This document describes the technical architecture of Shopping List by CJ.
It should be kept updated as the project evolves so that future changes remain consistent with the application’s goals.

---

# System Overview

Shopping List by CJ is an offline-first Progressive Web App (PWA).

The application is designed around:

- HTML
- CSS
- JavaScript
- Local Storage
- Service Worker
- Manifest
- Personal product catalogue

No backend is currently required.

---

# High Level Architecture

                Browser
                    │
        ┌───────────┴───────────┐
        │                       │
   index.html              Service Worker
        │                       │
        ▼                       ▼
     css/style.css         Cached Assets
        │
        ▼
      js/app.js
        │
        ▼
  Local Storage
        │
        ▼
Personal Catalogue
Shopping Lists
Settings
Backup Data

---

# Application Layers

## Presentation Layer

Responsibilities:

- Display UI
- User interaction
- Navigation
- Dialogs
- Forms

The presentation layer is responsible for rendering the shopping list experience and capturing user input in the browser.

---

## Business Logic Layer

Responsibilities:

- Shopping list management
- Catalogue management
- Categories
- Quantities
- Shopping mode
- Settings
- Backup

This layer coordinates the behaviour of the application and ensures that user actions are interpreted consistently.

---

## Storage Layer

Responsibilities:

- Local Storage
- Import
- Export
- Data migration
- Version compatibility

The storage layer ensures that application data remains accessible even when the browser is offline and that data can be backed up or restored safely.

---

# Current Folder Structure

The repository is intentionally lightweight, with the refactor split into focused JavaScript modules.

/
├── api/
├── assets/
│   ├── icons/
│   └── images/
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── catalog.js
│   ├── defaults.js
│   ├── settings.js
│   ├── shopping.js
│   ├── storage.js
│   └── ui.js
├── index.html
├── manifest.json
├── service-worker.js
├── PROJECT.md
├── DECISIONS.md
├── ARCHITECTURE.md
└── README.md

---

# Current Module Responsibilities

The JavaScript layer is now split into focused modules:

- app.js: application bootstrap, event wiring, and orchestration
- ui.js: rendering, DOM updates, and view switching
- storage.js: browser storage access, persistence, and data migration
- catalog.js: product catalogue add/edit/delete behavior
- shopping.js: shopping list selection, quantity changes, and list creation
- settings.js: backup export/import and search-store preference handling
- defaults.js: seed catalogue data for first use

---

# Data Model

The application is expected to work with simple, browser-stored objects.

## Product Object

A product entry should include fields such as:

- id
- name
- category
- quantity
- notes
- store
- checked
- created
- updated

These fields allow the user to manage personal products and track whether they have been collected while shopping.

## Shopping List Object

A shopping list object should include the items currently selected by the user along with any metadata needed to represent the current state of the trip.

Typical fields may include:

- id
- name
- items
- created
- updated
- completed

## Settings Object

Settings should be stored as a small, versioned object.

Typical fields may include:

- theme
- defaults
- preferences
- lastUpdated

---

# Local Storage

The application relies on browser Local Storage for persistence.

Responsibilities include:

- automatic save
- automatic load
- backup compatibility
- future migrations

The app should save data whenever the user changes the catalog, list contents, or settings.

Data should be loaded on startup and restored into the current application state.

Future releases should preserve compatibility with older stored data and support migration paths where needed.

---

# Backup Format

The application should support a simple JSON backup format.

## Export JSON

Exported data should contain the user’s catalogue, shopping list state, and settings in a single JSON document.

## Import JSON

Imported data should be validated before use and should restore the appropriate application state.

## Version Compatibility

Backup files should include a version field so future changes can be interpreted safely.

## Future Migration Strategy

If the data format changes, the app should support migration from older versions to newer versions without data loss.

---

# Service Worker

The service worker is responsible for enabling PWA behaviour.

Responsibilities include:

- offline cache
- update flow
- asset caching
- manifest
- install process

The service worker should cache core application assets so the app remains available without a network connection.

When updates are published, the app should handle the refresh flow in a controlled way so users do not lose their current experience.

---

# Performance Goals

The application should:

- load quickly
- remain lightweight
- minimise DOM updates
- minimise Local Storage writes
- avoid unnecessary libraries

The architecture should remain efficient even as the feature set grows.

---

# Future API Layer

A future API layer may support supermarket integrations.

Potential providers include:

- Aldi
- Coles
- Woolworths

These integrations should remain optional.

The application must continue functioning completely offline even if external APIs are unavailable.

---

# Security

The application should remain simple and local-first.

Security principles include:

- no user accounts
- no cloud requirement
- data remains local
- exported backups belong to the user

The application should avoid introducing unnecessary authentication or remote data dependencies.

---

# AI Development Notes

Future AI assistants should:

- preserve architecture
- avoid unnecessary dependencies
- preserve offline-first behaviour
- preserve backup compatibility
- avoid introducing breaking changes
- modularise only when requested

Changes should remain aligned with the project’s existing lightweight and dependable approach.

---

# Architectural Principles

The application should always remain:

- Offline First
- Personal Catalogue
- Fast
- Simple
- Reliable
- Easy to Maintain
- Backwards Compatible

---

# Future Expansion

The following capabilities may be considered in future versions, but only as optional architecture extensions:

- Cloud Sync
- Barcode Scanner
- Receipt Scanner
- Price Comparison
- Shared Lists
- Notifications
- Shopping Packs

These features should be introduced only when they support the core offline-first experience without undermining the project’s simplicity.
