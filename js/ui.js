(function (global) {
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function showConfirm(message, callback) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalMessage').textContent = message;
    modal.classList.remove('hidden');

    const okBtn = document.getElementById('modalOkBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    document.getElementById('modalOkBtn').addEventListener('click', () => {
      modal.classList.add('hidden');
      callback(true);
    });
    document.getElementById('modalCancelBtn').addEventListener('click', () => {
      modal.classList.add('hidden');
      callback(false);
    });
  }

  function updateStoreToggleUI(storeToggle, selectedStore) {
    storeToggle.querySelectorAll('.store-opt').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.store === selectedStore);
    });
  }

  function renderMain(catalogWrap, emptyState, goShopBtn, costSummaryBox, clearAllBtn, estimatedTotalAmount, visibleCatalog, sourceCatalog, selectedItems, selectedCount, completedCount, estimatedTotal, sorted, STORE_LETTER, toggleInList, togglePin, changeQty, openEditView, removeFromCatalog, toggleFavourite, escapeHtml, activeListId, searchQuery) {
    catalogWrap.innerHTML='';

    if (!catalogWrap.__shoppingListProductBound) {
      catalogWrap.addEventListener('click', (event) => {
        const left = event.target.closest('.catalog-left');
        if (left) {
          event.stopPropagation();
          toggleInList(left.dataset.id);
          return;
        }

        const favouriteBtn = event.target.closest('[data-favourite]');
        if (favouriteBtn) {
          event.stopPropagation();
          toggleFavourite(favouriteBtn.dataset.favourite);
          return;
        }

        const pinBtn = event.target.closest('[data-pin]');
        if (pinBtn) {
          event.stopPropagation();
          togglePin(pinBtn.dataset.pin);
          return;
        }

        const incBtn = event.target.closest('[data-inc]');
        if (incBtn) {
          event.stopPropagation();
          changeQty(incBtn.dataset.inc, 1);
          return;
        }

        const decBtn = event.target.closest('[data-dec]');
        if (decBtn) {
          event.stopPropagation();
          changeQty(decBtn.dataset.dec, -1);
          return;
        }

        const editBtn = event.target.closest('[data-edit]');
        if (editBtn) {
          event.stopPropagation();
          openEditView(editBtn.dataset.edit);
          return;
        }

        const removeBtn = event.target.closest('[data-remove]');
        if (removeBtn) {
          event.stopPropagation();
          removeFromCatalog(removeBtn.dataset.remove);
        }
      });
      catalogWrap.__shoppingListProductBound = true;
    }

    const query = (searchQuery || '').trim();
    const hasSourceItems = sourceCatalog.length > 0;
    const hasVisibleItems = visibleCatalog.length > 0;

    if(!hasSourceItems){
      emptyState.classList.remove('hidden');
      emptyState.querySelector('.big').textContent = 'Your products list is empty';
      emptyState.querySelector('div:last-child').textContent = 'Use the Add Product action below to get started.';
    } else if (query && !hasVisibleItems) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('.big').textContent = 'No products found';
      emptyState.querySelector('div:last-child').textContent = 'Try another search.';
    } else{
      emptyState.classList.add('hidden');
    }
    goShopBtn.disabled = selectedCount===0;
    goShopBtn.textContent = selectedCount===0 ? 'Start ▶' : `Start (${selectedCount}) ▶`;

    if(selectedCount > 0) {
      costSummaryBox.classList.remove('hidden');
      if (completedCount > 0) {
        clearAllBtn.classList.remove('hidden');
        clearAllBtn.textContent = `Clear (${completedCount})`;
      } else {
        clearAllBtn.classList.add('hidden');
        clearAllBtn.textContent = '';
      }
      estimatedTotalAmount.textContent = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(estimatedTotal);
    } else {
      costSummaryBox.classList.add('hidden');
      clearAllBtn.classList.add('hidden');
      clearAllBtn.textContent = '';
    }

    function appendItems(items) {
      items.forEach((item) => {
        const entry = item.lists?.[activeListId];
        const isSelected = Boolean(entry);
        const qty = Number(entry?.qty || 1);
        const row = document.createElement('div');
        row.className='catalog-item' + (isSelected ? ' selected':'');
        const priceStr = (item.price!=null && !isNaN(item.price)) ? `<span class="price-tag">${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.price))}</span>` : '';
        const storeStr = item.store ? `<span class="store-badge" data-store="${escapeHtml(item.store)}">${STORE_LETTER[item.store]||'?'}</span>` : '';
        const qtyMod = isSelected ? `
          <div class="product-qty-controls" aria-label="Quantity controls">
            <button type="button" class="ghost-btn product-qty-btn" data-dec="${item.id}">-</button>
            <span class="product-qty-value">${qty}</span>
            <button type="button" class="ghost-btn product-qty-btn" data-inc="${item.id}">+</button>
          </div>
        ` : '';
        const removeOrLock = item.pinned
          ? `<span title="Pinned item (protected)" style="padding:4px 6px; font-size:0.85rem; opacity:0.6;">🔒</span>`
          : `<button class="remove-btn" data-remove="${item.id}" title="Delete Product">✕</button>`;

        row.innerHTML = `
          <div class="catalog-top-row">
            <div class="catalog-left" data-id="${item.id}">
              <div class="checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
              <div class="catalog-name-wrap">
                <span class="name">${escapeHtml(item.name)}${!isSelected && qty>1?`<span class="qty">×${qty}</span>`:''}</span>
                <div class="item-meta item-meta--top">
                  <span class="aisle-tag">${escapeHtml(item.aisle)}</span>
                </div>
              </div>
            </div>
            <div class="action-btns">
              <button class="favourite-toggle${item.favourite ? ' is-favourite' : ''}" type="button" data-favourite="${item.id}" title="${item.favourite ? 'Remove favourite' : 'Add favourite'}" aria-label="${item.favourite ? 'Remove favourite' : 'Mark favourite'}">${item.favourite ? '★' : '☆'}</button>
              <button class="pin-btn" data-pin="${item.id}" title="${item.pinned ? 'Unpin item' : 'Pin item'}">${item.pinned ? '📌' : '📍'}</button>
              <button class="edit-btn" data-edit="${item.id}" title="Edit Product">✎</button>
              ${removeOrLock}
            </div>
          </div>
          <div class="catalog-bottom-row">
            <div class="item-meta item-meta--bottom">
              ${storeStr}
              ${priceStr}
            </div>
            ${qtyMod}
          </div>
        `;
        catalogWrap.appendChild(row);
      });
    }

    const favouriteItems = sorted.filter((item) => item.favourite);
    const otherItems = sorted.filter((item) => !item.favourite);

    if (searchQuery && favouriteItems.length === 0 && otherItems.length === 0) {
      // handled by empty state above
    } else if (favouriteItems.length > 0 && otherItems.length > 0) {
      const heading = document.createElement('div');
      heading.className = 'products-section-heading';
      heading.textContent = '⭐ Favourite Products';
      catalogWrap.appendChild(heading);
      appendItems(favouriteItems);

      const allHeading = document.createElement('div');
      allHeading.className = 'products-section-heading';
      allHeading.textContent = 'All Products';
      catalogWrap.appendChild(allHeading);
      appendItems(otherItems);
    } else if (favouriteItems.length > 0) {
      const heading = document.createElement('div');
      heading.className = 'products-section-heading';
      heading.textContent = '⭐ Favourite Products';
      catalogWrap.appendChild(heading);
      appendItems(favouriteItems);
    } else {
      appendItems(otherItems);
    }

  }

  function renderShop(aisleGroups, active, AISLES, STORE_LETTER, escapeHtml, cycleStore, save, renderShopFn) {
    aisleGroups.innerHTML='';

    if (!aisleGroups.__shoppingListShopBound) {
      aisleGroups.addEventListener('click', (event) => {
        const shopRow = event.target.closest('.shop-item');
        if (!shopRow) return;

        const cycleButton = event.target.closest('[data-cyclestore]');
        if (cycleButton) {
          event.stopPropagation();
          cycleStore(cycleButton.dataset.cyclestore);
          return;
        }

        const activeListId = window.shoppingLists?.getActiveList?.()?.id;

        // Any row currently in the DOM was, by construction, already part
        // of the active list at the time it was rendered - so we can
        // always toggle it by id directly against live storage, rather
        // than re-checking it against `active`, which is a snapshot
        // captured only once (when this listener was first bound) and
        // never updates on later renders. Relying on that stale snapshot
        // was the cause of items becoming permanently un-untickable.
        window.shoppingListStorage.toggleChecked(shopRow.dataset.id, activeListId);
        save();
        renderShopFn();
      });
      aisleGroups.__shoppingListShopBound = true;
    }

    const activeListId = window.shoppingLists?.getActiveList?.()?.id;
    const total = active.length;
    const checkedCount = active.filter((item) => Boolean(item.lists?.[activeListId]?.checked)).length;
    const pct = total===0 ? 0 : Math.round((checkedCount/total)*100);

    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPct = document.getElementById('progressPct');
    const doneBanner = document.getElementById('doneBanner');
    progressFill.style.width = pct+'%';
    progressText.textContent = `${checkedCount} of ${total} collected`;
    progressPct.textContent = pct+'%';
    doneBanner.classList.toggle('hidden', !(total>0 && checkedCount===total));

    AISLES.forEach((aisle) => {
      const groupItems = active.filter((i)=>i.aisle===aisle).sort((a,b)=> a.name.localeCompare(b.name, undefined, {sensitivity:'base'}));
      if(groupItems.length===0) return;
      const wrap = document.createElement('div');
      wrap.className='aisle-group';
      const collectedInGroup = groupItems.filter((item) => Boolean(item.lists?.[activeListId]?.checked)).length;
      wrap.innerHTML = `<div class="aisle-heading">${escapeHtml(aisle)} <span style="font-weight:400;font-size:0.6875rem;color:var(--ink-soft);">(${collectedInGroup}/${groupItems.length})</span></div>`;
      groupItems.forEach((item)=>{
        const entry = item.lists?.[activeListId];
        const qty = Number(entry?.qty || 1);
        const isCollected = Boolean(entry?.checked);
        const row = document.createElement('div');
        row.className='shop-item' + (isCollected ? ' checked':'');
        row.dataset.id = item.id;
        const priceStr = (item.price!=null && !isNaN(item.price)) ? `<span class="price-tag">${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.price)*qty)}</span>` : '';
        const storeStr = item.store ? `<span class="store-badge" data-store="${escapeHtml(item.store)}" data-cyclestore="${item.id}">${STORE_LETTER[item.store]||'?'}</span>` : '';
        row.innerHTML = `
          <div class="checkbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <span class="name">${escapeHtml(item.name)}${qty>1?`<span class="qty">×${qty}</span>`:''}</span>
            <div class="item-meta">
              ${storeStr}
              ${priceStr}
            </div>
          </div>
        `;
        wrap.appendChild(row);
      });
      aisleGroups.appendChild(wrap);
    });
  }

  function showView(mainView, shopView, addView, settingsView, tabMain, tabProducts, tabShop, view) {
    if (view === 'shop') {
      mainView.classList.add('hidden');
      shopView.classList.remove('hidden');
      addView.classList.add('hidden');
      settingsView.classList.add('hidden');
      tabMain.classList.remove('active');
      tabProducts.classList.remove('active');
      tabShop.classList.add('active');
    } else if (view === 'settings') {
      mainView.classList.add('hidden');
      shopView.classList.add('hidden');
      addView.classList.add('hidden');
      settingsView.classList.remove('hidden');
      tabMain.classList.remove('active');
      tabProducts.classList.remove('active');
      tabShop.classList.remove('active');
    } else if (view === 'lists') {
      mainView.classList.add('hidden');
      shopView.classList.add('hidden');
      addView.classList.add('hidden');
      settingsView.classList.add('hidden');
      tabMain.classList.add('active');
      tabProducts.classList.remove('active');
      tabShop.classList.remove('active');
    } else {
      mainView.classList.remove('hidden');
      shopView.classList.add('hidden');
      addView.classList.add('hidden');
      settingsView.classList.add('hidden');
      tabMain.classList.remove('active');
      tabProducts.classList.add('active');
      tabShop.classList.remove('active');
    }
  }

  global.shoppingListUI = {
    escapeHtml,
    showConfirm,
    updateStoreToggleUI,
    renderMain,
    renderShop,
    showView
  };
})(window);
