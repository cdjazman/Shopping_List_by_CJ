(function (global) {
  function toggleInList(catalog, id) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;
    item.inList = !item.inList;
    if (!item.inList) {
      item.checked = false;
      item.qty = 1;
    }
    return item;
  }

  function changeQty(catalog, id, delta) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;
    item.qty = Math.max(1, (item.qty || 1) + delta);
    return item;
  }

  function sortCatalogItems(catalog) {
    return [...catalog].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  function createShoppingList(catalog, currentStoreFilter) {
    const allActive = catalog.filter((i) => i.inList);
    return allActive.filter((item) => {
      if (currentStoreFilter === 'ALL') return true;
      return item.store === currentStoreFilter;
    });
  }

  global.shoppingListShopping = {
    toggleInList,
    changeQty,
    sortCatalogItems,
    createShoppingList
  };
})(window);
