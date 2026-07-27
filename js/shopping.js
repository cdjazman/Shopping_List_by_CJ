(function (global) {
  function getActiveListId() {
    const activeList = global.shoppingLists?.getActiveList?.();
    const activeListId = activeList && activeList.id ? activeList.id : 'default';
    return activeListId;
  }

  function toggleInList(catalog, id) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;

    const activeListId = getActiveListId();
    const hasEntry = Boolean(item.lists?.[activeListId]);

    if (hasEntry) {
      global.shoppingListStorage.removeProductFromList(id, activeListId);
      return item;
    }

    global.shoppingListStorage.addProductToList(id, activeListId);
    return item;
  }

  function toggleChecked(catalog, id) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;

    const activeListId = getActiveListId();
    global.shoppingListStorage.toggleChecked(id, activeListId);
    return item;
  }

  function changeQty(catalog, id, delta) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;

    const activeListId = getActiveListId();
    const state = item.lists?.[activeListId];

    if (!state) {
      global.shoppingListStorage.addProductToList(id, activeListId);
    }

    global.shoppingListStorage.changeQty(id, activeListId, delta);
    return item;
  }

  function setQty(catalog, id, qty) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;

    const activeListId = getActiveListId();
    const state = item.lists?.[activeListId];

    if (!state) {
      global.shoppingListStorage.addProductToList(id, activeListId);
    }

    global.shoppingListStorage.setQty(id, activeListId, qty);
    return item;
  }

  function sortCatalogItems(catalog) {
    return [...catalog].sort((a, b) => {
      if (Boolean(a.favourite) !== Boolean(b.favourite)) {
        return Boolean(a.favourite) ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  function createShoppingList(catalog, currentStoreFilter) {
    const activeListId = getActiveListId();
    const allActive = global.shoppingListStorage.getProductsForList(activeListId);

    return allActive.filter((item) => {
      if (currentStoreFilter === 'ALL') return true;
      return item.store === currentStoreFilter;
    });
  }

  global.shoppingListShopping = {
    toggleInList,
    toggleChecked,
    changeQty,
    setQty,
    sortCatalogItems,
    createShoppingList
  };
})(window);
