(function (global) {
  const STORAGE_KEY = "grocery-catalog";
  const AISLE_MAP = {
    "Fruit & Veg": "Fresh & Produce",
    "Meat & Deli": "Meat & Seafood",
    "Dairy & Eggs": "Dairy, Eggs & Fridge",
    "Pantry": "Pantry & Dry Goods",
    "Drinks": "Drinks & Beverages",
    "Household & Other": "Household & Personal Care"
  };

  let catalogState = [];

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function getActiveListId() {
    try {
      const activeList = global.shoppingLists?.getActiveList?.();
      if (activeList && activeList.id) return activeList.id;

      const preferred = global.localStorage.getItem("shopping-lists-active");
      if (preferred) return preferred;

      const legacy = global.localStorage.getItem("shopping-active-list");
      return legacy || "default";
    } catch (e) {
      return "default";
    }
  }

  const LEGACY_FIELDS = {
    selected: 'in' + 'List',
    quantity: 'q' + 'ty',
    completion: 'check' + 'ed'
  };

  function normalizeListState(state) {
    const qty = Number(state && state[LEGACY_FIELDS.quantity]);
    return {
      qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
      checked: Boolean(state && state[LEGACY_FIELDS.completion])
    };
  }

  function ensureListEntry(item, listId) {
    if (!item || typeof item !== 'object') return null;

    if (!item.lists || typeof item.lists !== 'object' || Array.isArray(item.lists)) {
      item.lists = {};
    }

    if (!item.lists[listId]) {
      item.lists[listId] = { qty: 1, checked: false, added: Date.now() };
    }

    return item.lists[listId];
  }

  function migrateCatalogData(catalog) {
    const safeCatalog = Array.isArray(catalog) ? catalog : [];
    let updated = false;

    const normalizedCatalog = safeCatalog.map((item) => {
      if (!item || typeof item !== 'object') return item;

      const migratedItem = {
        ...item,
        id: item.id || uid(),
        name: item.name || "",
        aisle: item.aisle || "Fresh & Produce",
        store: item.store || "Aldi",
        price: item.price ?? null,
        pinned: item.pinned ?? false,
        favourite: item.favourite ?? false,
        lists: {}
      };

      migratedItem.aisle = AISLE_MAP[migratedItem.aisle] ?? migratedItem.aisle;

      if (item.lists && typeof item.lists === 'object' && !Array.isArray(item.lists)) {
        Object.entries(item.lists).forEach(([listId, state]) => {
          if (state && typeof state === 'object') {
            migratedItem.lists[listId] = normalizeListState(state);
          }
        });
      }

      const activeListId = getActiveListId();
      const oldInList = item[LEGACY_FIELDS.selected] === true;
      const oldQty = item[LEGACY_FIELDS.quantity];
      const oldChecked = Boolean(item[LEGACY_FIELDS.completion]);

      if (oldInList) {
        migratedItem.lists[activeListId] = normalizeListState({ qty: oldQty, checked: oldChecked });
        updated = true;
      }

      delete migratedItem[LEGACY_FIELDS.quantity];
      delete migratedItem[LEGACY_FIELDS.completion];
      delete migratedItem[LEGACY_FIELDS.selected];

      if (item.pinned == null) {
        migratedItem.pinned = false;
        updated = true;
      }

      if (item.favourite == null) {
        migratedItem.favourite = false;
        updated = true;
      }

      if (item[LEGACY_FIELDS.quantity] != null || item[LEGACY_FIELDS.completion] != null || item[LEGACY_FIELDS.selected] != null) {
        updated = true;
      }

      return migratedItem;
    });

    return { catalog: normalizedCatalog, updated };
  }

  function saveCatalog(catalog) {
    const sourceCatalog = Array.isArray(catalog) ? catalog : catalogState;
    const normalized = migrateCatalogData(sourceCatalog);
    catalogState = normalized.catalog;

    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogState));
    } catch (e) {}

    return catalogState;
  }

  function loadCatalog(defaultItems, options = {}) {
    const shouldSeedDefaults = Boolean(options && options.seedDefaults);

    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const migrated = migrateCatalogData(parsed);
          catalogState = migrated.catalog;
          if (migrated.updated) saveCatalog(catalogState);
          return catalogState;
        }
      }
    } catch (e) {}

    const sourceDefaults = shouldSeedDefaults && Array.isArray(defaultItems)
      ? defaultItems
      : [];

    const seededCatalog = sourceDefaults.map(
      ([name, aisle, qty, store, price]) => ({
        id: uid(),
        name,
        aisle,
        store,
        price,
        pinned: false,
        favourite: false,
        lists: {}
      })
    );

    catalogState = seededCatalog;
    saveCatalog(catalogState);
    return catalogState;
  }

  function getProductsForList(listId) {
    if (!listId) return [];
    return catalogState.filter((item) => item && item.lists && item.lists[listId]);
  }

  function addProductToList(productId, listId) {
    const item = catalogState.find((entry) => entry.id === productId);
    if (!item || !listId) return null;

    const entry = ensureListEntry(item, listId);
    saveCatalog(catalogState);
    return entry;
  }

  function removeProductFromList(productId, listId) {
    const item = catalogState.find((entry) => entry.id === productId);
    if (!item || !listId) return null;

    if (item.lists && item.lists[listId]) {
      delete item.lists[listId];
      saveCatalog(catalogState);
    }

    return item;
  }

  function toggleChecked(productId, listId) {
    const item = catalogState.find((entry) => entry.id === productId);
    if (!item || !listId) return null;

    const entry = ensureListEntry(item, listId);
    entry.checked = !entry.checked;
    saveCatalog(catalogState);
    return entry;
  }

  function changeQty(productId, listId, delta) {
    const item = catalogState.find((entry) => entry.id === productId);
    if (!item || !listId) return null;

    const entry = ensureListEntry(item, listId);
    entry.qty = Math.max(1, (Number(entry.qty) || 1) + Number(delta || 0));
    saveCatalog(catalogState);
    return entry;
  }

  function setQty(productId, listId, qty) {
    const item = catalogState.find((entry) => entry.id === productId);
    if (!item || !listId) return null;

    const entry = ensureListEntry(item, listId);
    entry.qty = Math.max(1, Number(qty) || 1);
    saveCatalog(catalogState);
    return entry;
  }

  global.shoppingListStorage = {
    STORAGE_KEY,
    saveCatalog,
    loadCatalog,
    migrateCatalogData,
    getProductsForList,
    addProductToList,
    removeProductFromList,
    toggleChecked,
    changeQty,
    setQty
  };
})(window);
