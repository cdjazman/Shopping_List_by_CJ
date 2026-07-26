(function (global) {
  const STORAGE_KEY = "grocery-catalog";

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function migrateCatalogData(catalog) {
    const safeCatalog = Array.isArray(catalog) ? catalog : [];
    let updated = false;

    safeCatalog.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      if (item.aisle === "Fruit & Veg") { item.aisle = "Fresh & Produce"; updated = true; }
      if (item.aisle === "Meat & Deli") { item.aisle = "Meat & Seafood"; updated = true; }
      if (item.aisle === "Dairy & Eggs") { item.aisle = "Dairy, Eggs & Fridge"; updated = true; }
      if (item.aisle === "Pantry") { item.aisle = "Pantry & Dry Goods"; updated = true; }
      if (item.aisle === "Drinks") { item.aisle = "Drinks & Beverages"; updated = true; }
      if (item.aisle === "Household & Other") { item.aisle = "Household & Personal Care"; updated = true; }
      if (item.qty == null) { item.qty = 1; updated = true; }
      if (item.pinned == null) { item.pinned = false; updated = true; }
    });

    return { catalog: safeCatalog, updated };
  }

  function saveCatalog(catalog) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
    } catch (e) {}
  }

  function loadCatalog(defaultItems) {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const migrated = migrateCatalogData(parsed);
          if (migrated.updated) saveCatalog(migrated.catalog);
          return migrated.catalog;
        }
      }
    } catch (e) {}

    const seededCatalog = (Array.isArray(defaultItems) ? defaultItems : []).map(
      ([name, aisle, qty, store, price]) => ({
        id: uid(),
        name,
        aisle,
        qty,
        store,
        price,
        inList: false,
        checked: false,
        pinned: false
      })
    );

    saveCatalog(seededCatalog);
    return seededCatalog;
  }

  global.shoppingListStorage = {
    STORAGE_KEY,
    saveCatalog,
    loadCatalog,
    migrateCatalogData
  };
})(window);
