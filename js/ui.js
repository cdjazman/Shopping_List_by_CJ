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

  function renderMain(catalogWrap, emptyState, goShopBtn, costSummaryBox, clearAllBtn, estimatedTotalAmount, catalog, selectedItems, selectedCount, estimatedTotal, sorted, STORE_LETTER, toggleInList, togglePin, changeQty, openEditView, removeFromCatalog, escapeHtml, activeListId) {
    catalogWrap.innerHTML='';

    if(catalog.length===0){
      emptyState.classList.remove('hidden');
    }else{
      emptyState.classList.add('hidden');
    }
    goShopBtn.disabled = selectedCount===0;
    goShopBtn.textContent = selectedCount===0 ? "Start Shopping →" : `Start Shopping (${selectedCount}) →`;

    if(selectedCount > 0) {
      costSummaryBox.classList.remove('hidden');
      clearAllBtn.classList.remove('hidden');
      estimatedTotalAmount.textContent = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(estimatedTotal);
    } else {
      costSummaryBox.classList.add('hidden');
      clearAllBtn.classList.add('hidden');
    }

    sorted.forEach((item) => {
      const entry = item.lists?.[activeListId];
      const isSelected = Boolean(entry);
      const qty = Number(entry?.qty || 1);
      const row = document.createElement('div');
      row.className='catalog-item' + (isSelected ? ' selected':'');
      const priceStr = (item.price!=null && !isNaN(item.price)) ? `<span class="price-tag">${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(item.price))}</span>` : '';
      const storeStr = item.store ? `<span class="store-badge" data-store="${escapeHtml(item.store)}">${STORE_LETTER[item.store]||'?'}</span>` : '';
      const qtyMod = isSelected ? `
        <div style="display:flex; align-items:center; gap:6px; margin-left:10px;" onclick="event.stopPropagation()">
          <button type="button" class="ghost-btn" style="padding:2px 8px; font-size:0.75rem;" data-dec="${item.id}">-</button>
          <span style="font-weight:700; font-size:0.875rem;">${qty}</span>
          <button type="button" class="ghost-btn" style="padding:2px 8px; font-size:0.75rem;" data-inc="${item.id}">+</button>
        </div>
      ` : '';
      const removeOrLock = item.pinned
        ? `<span title="Pinned item (protected)" style="padding:4px 6px; font-size:0.85rem; opacity:0.6;">🔒</span>`
        : `<button class="remove-btn" data-remove="${item.id}" title="Delete Product">✕</button>`;

      row.innerHTML = `
        <div class="catalog-left" data-id="${item.id}">
          <div class="checkbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <span class="name">${escapeHtml(item.name)}${!isSelected && qty>1?`<span class="qty">×${qty}</span>`:''}</span>
            <div class="item-meta">
              <span class="aisle-tag">${escapeHtml(item.aisle)}</span>
              ${storeStr}
              ${priceStr}
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center;">
          ${qtyMod}
          <div class="action-btns" style="margin-left:6px;">
            <button class="pin-btn" data-pin="${item.id}" title="${item.pinned ? 'Unpin item' : 'Pin item'}">${item.pinned ? '📌' : '📍'}</button>
            <button class="edit-btn" data-edit="${item.id}" title="Edit Product">✎</button>
            ${removeOrLock}
          </div>
        </div>
      `;
      catalogWrap.appendChild(row);
    });

    catalogWrap.querySelectorAll('.catalog-left').forEach((el)=>{
      el.addEventListener('click', ()=> toggleInList(el.dataset.id));
    });
    catalogWrap.querySelectorAll('[data-pin]').forEach((btn)=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        togglePin(btn.dataset.pin);
      });
    });
    catalogWrap.querySelectorAll('[data-inc]').forEach((btn)=>{
      btn.addEventListener('click', ()=> changeQty(btn.dataset.inc, 1));
    });
    catalogWrap.querySelectorAll('[data-dec]').forEach((btn)=>{
      btn.addEventListener('click', ()=> changeQty(btn.dataset.dec, -1));
    });
    catalogWrap.querySelectorAll('[data-edit]').forEach((btn)=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        openEditView(btn.dataset.edit);
      });
    });
    catalogWrap.querySelectorAll('[data-remove]').forEach((btn)=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        removeFromCatalog(btn.dataset.remove);
      });
    });
  }

  function renderShop(aisleGroups, active, AISLES, STORE_LETTER, escapeHtml, cycleStore, save, renderShopFn) {
    aisleGroups.innerHTML='';

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
      wrap.innerHTML = `<div class="aisle-heading">${escapeHtml(aisle)} <span style="font-family:'DM Sans',sans-serif;font-weight:400;font-size:0.6875rem;color:var(--ink-soft);">(${collectedInGroup}/${groupItems.length})</span></div>`;
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
        row.addEventListener('click', (e)=>{
          if(e.target.closest('[data-cyclestore]')){
            e.stopPropagation();
            cycleStore(e.target.closest('[data-cyclestore]').dataset.cyclestore);
            return;
          }
          if (entry) {
            window.shoppingListStorage.toggleChecked(item.id, activeListId);
          } else {
            const created = window.shoppingListStorage.addProductToList(item.id, activeListId);
            if (created) created.checked = true;
          }
          save();
          renderShopFn();
        });
        wrap.appendChild(row);
      });
      aisleGroups.appendChild(wrap);
    });
  }

  function showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, view) {
    if (view === 'shop') {
      mainView.classList.add('hidden');
      shopView.classList.remove('hidden');
      addView.classList.add('hidden');
      settingsView.classList.add('hidden');
      tabMain.classList.remove('active');
      tabShop.classList.add('active');
      tabSettings.classList.remove('active');
    } else if (view === 'settings') {
      mainView.classList.add('hidden');
      shopView.classList.add('hidden');
      addView.classList.add('hidden');
      settingsView.classList.remove('hidden');
      tabMain.classList.remove('active');
      tabShop.classList.remove('active');
      tabSettings.classList.add('active');
    } else {
      mainView.classList.remove('hidden');
      shopView.classList.add('hidden');
      addView.classList.add('hidden');
      settingsView.classList.add('hidden');
      tabMain.classList.add('active');
      tabShop.classList.remove('active');
      tabSettings.classList.remove('active');
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
