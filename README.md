# Shopping List by CJ 🛒

> *tick it, shop it*

A clean, fast, offline-first Progressive Web App (PWA) designed to manage, estimate, and streamline your weekly grocery runs across major Australian supermarkets (Aldi, Coles, and Woolworths).

---

## ✨ Key Features

* **Multi-Store Support & Filtering:** Organize items by store (**Aldi**, **Coles**, **Woolworths**) and filter your active shopping run on the fly. Cycle through store tags directly from the checklist view with a single tap.
* **Real-Time Cost Counter:** Automatically calculates your estimated total cost based on quantities and item prices as you build your list.
* **Smart Item Pinning:** Pin essential or recurring items with lock protection (`🔒`) to keep them safe during catalogue resets.
* **PWA & Offline-First:** Fully installable on mobile and desktop devices with lightning-fast updates via Service Workers.
* **Backup & Restore:** Easily export your custom product catalogue and prices to a `.json` backup file or restore from a previous file via the Settings menu.
* **Custom Branded Experience:** Features custom-styled modal confirmation dialogs and a vintage paper-themed aesthetic.

---

## 📁 Project Structure

```text
Shopping-List-App/
├── index.html           # Main application file & UI logic
├── js/defaults.js       # Default catalogue items (can be left blank for pristine start)
├── manifest.json        # PWA manifest configuration
├── service-worker.js    # Offline caching and background updates
├── CHANGELOG.md         # Detailed project version history
└── assets/images/LOGO.png # App branding icon