# Changelog: Shopping List by CJ

### v0.1
* Initial release of the core shopping list interface with category and store tags.
* Added support for multiple supermarket options including Aldi, Coles, and Woolworths.

### v0.2
* Introduced the estimated total cost counter to track expected spending in real time.
* Added interactive shopping progress bars and trolley-full completion banners.

### v0.3
* Added inline quantity adjustment buttons for selected items.
* Configured item quantities to automatically reset to x1 when clearing or finishing a shop run.

### v0.4
* Added a dedicated Settings page tab for app configurations.
* Introduced a catalogue deletion option within the settings menu.

### v0.5
* Added an item pinning (`📌`) feature with lock protection (`🔒`) to prevent important items from being accidentally deleted.
* Protected pinned items so they remain safe during catalogue resets.

### v0.6
* Widened the category dropdown selection box to cleanly fit long names without crowding.
* Upgraded the "Shop Done" button to selectively clear only the items belonging to the active store filter tab.

### v0.7
* Separated default items into an external `defaults.js` file for independent list management.
* Configured clean blank initial states for new users and testers.

# v0.9.0

Release Date: TBD

## Changed

- Refactored project into a modular architecture.
- Extracted inline CSS into css/style.css.
- Extracted inline JavaScript into dedicated modules.
- Organised project assets into a cleaner folder structure.
- Updated Service Worker for modular asset caching.
- Updated PWA manifest asset references.
- Removed unused code.
- Improved project maintainability.
- Updated project documentation.

## Added

- PROJECT.md
- DECISIONS.md
- ARCHITECTURE.md
- CONTRIBUTING.md

## Notes

This release focuses entirely on improving the internal architecture and maintainability of the application.

No user-facing features were intentionally changed.

### v0.8
* Added JSON Export and Import functionality in Settings for manual list backups.
* Replaced native browser alerts with custom branded confirmation popup boxes ("Shopping List by CJ says").