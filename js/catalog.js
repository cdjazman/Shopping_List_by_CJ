(function (global) {
  const STORE_CYCLE = ["Aldi", "Coles", "Woolworths"];

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function addProduct(catalog, itemInput, aisleSelect, qtyInput, priceInput, selectedStore, editingItemId, setEditingItemId, onComplete) {
    const name = itemInput.value.trim();
    if (!name) {
      itemInput.focus();
      return false;
    }

    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    const price = parseFloat(priceInput.value);

    if (editingItemId) {
      const item = catalog.find((i) => i.id === editingItemId);
      if (item) {
        item.name = name;
        item.aisle = aisleSelect.value;
        item.qty = qty;
        item.store = selectedStore;
        item.price = isNaN(price) ? null : price;
      }
      setEditingItemId(null);
    } else {
      catalog.push({
        id: uid(),
        name,
        aisle: aisleSelect.value,
        qty,
        store: selectedStore,
        price: isNaN(price) ? null : price,
        inList: false,
        checked: false,
        pinned: false
      });
    }

    if (typeof onComplete === 'function') onComplete();
    return true;
  }

  function editProduct(catalog, id, itemInput, aisleSelect, qtyInput, priceInput, setSelectedStore, setEditingItemId, setSaveLabel, updateStoreToggleUI, showView) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return false;

    setEditingItemId(item.id);
    itemInput.value = item.name || '';
    aisleSelect.value = item.aisle || 'Fresh & Produce';
    priceInput.value = (item.price != null && !isNaN(item.price)) ? item.price : '';
    qtyInput.value = item.qty || 1;
    setSelectedStore(item.store || 'Aldi');
    document.getElementById('liveSearchInput').value = '';
    setSaveLabel('Update Product');
    updateStoreToggleUI();
    showView();
    setTimeout(() => itemInput.focus(), 50);
    return true;
  }

  function deleteProduct(catalog, id, onDeleteBlocked) {
    const item = catalog.find((i) => i.id === id);
    if (item && item.pinned) {
      if (typeof onDeleteBlocked === 'function') onDeleteBlocked();
      return false;
    }
    const nextCatalog = catalog.filter((i) => i.id !== id);
    return { removed: true, catalog: nextCatalog };
  }

  function searchCatalogue(catalog, query) {
    const term = (query || '').trim().toLowerCase();
    if (!term) return catalog;
    return catalog.filter((item) => {
      const haystack = [item.name, item.aisle, item.store, item.notes].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }

  function cycleStore(catalog, id) {
    const item = catalog.find((i) => i.id === id);
    if (!item) return null;
    const idx = STORE_CYCLE.indexOf(item.store);
    item.store = STORE_CYCLE[(idx + 1) % STORE_CYCLE.length];
    return item;
  }

  global.shoppingListCatalog = {
    addProduct,
    editProduct,
    deleteProduct,
    searchCatalogue,
    cycleStore
  };
})(window);
