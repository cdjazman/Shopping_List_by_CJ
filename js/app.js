const AISLES = [
  "Fresh & Produce",
  "Bakery",
  "Meat & Seafood",
  "Dairy, Eggs & Fridge",
  "Pantry & Dry Goods",
  "Freezer",
  "Drinks & Beverages",
  "Household & Personal Care"
];

let catalog = [];
let currentStoreFilter = "ALL";
let editingItemId = null;
let selectedSearchStore = "Aldi";

const itemInput = document.getElementById('itemInput');
const aisleSelect = document.getElementById('aisleSelect');
const priceInput = document.getElementById('priceInput');
const qtyInput = document.getElementById('qtyInput');
const storeToggle = document.getElementById('storeToggle');
const openAddBtn = document.getElementById('openAddBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const addView = document.getElementById('addView');
const catalogWrap = document.getElementById('catalogWrap');
const emptyState = document.getElementById('emptyState');
const goShopBtn = document.getElementById('goShopBtn');
const tabMain = document.getElementById('tabMain');
const tabShop = document.getElementById('tabShop');
const tabSettings = document.getElementById('tabSettings');
const mainView = document.getElementById('mainView');
const shopView = document.getElementById('shopView');
const settingsView = document.getElementById('settingsView');
const aisleGroups = document.getElementById('aisleGroups');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const doneBanner = document.getElementById('doneBanner');
const backToListBtn = document.getElementById('backToListBtn');
const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
const newRunBtn = document.getElementById('newRunBtn');
const storeFilterBar = document.getElementById('storeFilterBar');
const checkUpdateBtn = document.getElementById('checkUpdateBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const deleteCatalogBtn = document.getElementById('deleteCatalogBtn');
const costSummaryBox = document.getElementById('costSummaryBox');
const estimatedTotalAmount = document.getElementById('estimatedTotalAmount');

let selectedStore = "Aldi";

AISLES.forEach(a=>{
  const opt = document.createElement('option');
  opt.value = a; opt.textContent = a;
  aisleSelect.appendChild(opt);
});

function save(){
  shoppingListStorage.saveCatalog(catalog);
}

function load(){
  catalog = shoppingListStorage.loadCatalog(DEFAULT_ITEMS);
  renderMain();
}

// Custom Modal Replacement for window.confirm
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

function addItem(){
  const name = itemInput.value.trim();
  if(!name){ itemInput.focus(); return; }
  const qty = Math.max(1, parseInt(qtyInput.value,10) || 1);
  const price = parseFloat(priceInput.value);

  if(editingItemId) {
    const item = catalog.find(i => i.id === editingItemId);
    if(item) {
      item.name = name;
      item.aisle = aisleSelect.value;
      item.qty = qty;
      item.store = selectedStore;
      item.price = isNaN(price) ? null : price;
    }
    editingItemId = null;
  } else {
    catalog.push({
      id: uid(),
      name,
      aisle: aisleSelect.value,
      qty,
      store: selectedStore,
      price: isNaN(price) ? null : price,
      inList:false,
      checked:false,
      pinned:false
    });
  }

  save();
  showMain();
}

function openAddView(){
  editingItemId = null;
  itemInput.value = '';
  priceInput.value = '';
  qtyInput.value = '1';
  document.getElementById('liveSearchInput').value = '';
  selectedStore = "Aldi";
  saveProductBtn.textContent = "Save Product";
  updateStoreToggleUI();
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  settingsView.classList.add('hidden');
  addView.classList.remove('hidden');
  setTimeout(()=> itemInput.focus(), 50);
}

function openEditView(id){
  const item = catalog.find(i => i.id === id);
  if(!item) return;

  editingItemId = item.id;
  itemInput.value = item.name || '';
  aisleSelect.value = item.aisle || AISLES[0];
  priceInput.value = (item.price != null && !isNaN(item.price)) ? item.price : '';
  qtyInput.value = item.qty || 1;
  selectedStore = item.store || "Aldi";
  document.getElementById('liveSearchInput').value = '';
  
  saveProductBtn.textContent = "Update Product";
  updateStoreToggleUI();

  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  settingsView.classList.add('hidden');
  addView.classList.remove('hidden');
  setTimeout(()=> itemInput.focus(), 50);
}

function updateStoreToggleUI(){
  storeToggle.querySelectorAll('.store-opt').forEach(btn=>{
    btn.classList.toggle('selected', btn.dataset.store===selectedStore);
  });
}

storeToggle.querySelectorAll('.store-opt').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    selectedStore = btn.dataset.store;
    updateStoreToggleUI();
  });
});

const STORE_LETTER = { "Aldi":"A", "Coles":"C", "Woolworths":"W" };
const STORE_CYCLE = ["Aldi","Coles","Woolworths"];

function cycleStore(id){
  const item = catalog.find(i=>i.id===id);
  if(!item) return;
  const idx = STORE_CYCLE.indexOf(item.store);
  item.store = STORE_CYCLE[(idx+1) % STORE_CYCLE.length];
  save();
  renderShop();
}

function togglePin(id){
  const item = catalog.find(i=>i.id===id);
  if(!item) return;
  item.pinned = !item.pinned;
  save();
  renderMain();
}

function removeFromCatalog(id){
  const item = catalog.find(i=>i.id===id);
  if(item && item.pinned) {
    alert("This item is pinned and cannot be deleted.");
    return;
  }
  catalog = catalog.filter(i=>i.id!==id);
  save();
  renderMain();
}

function toggleInList(id){
  const item = catalog.find(i=>i.id===id);
  if(!item) return;
  item.inList = !item.inList;
  if(!item.inList) {
    item.checked = false;
    item.qty = 1;
  }
  save();
  renderMain();
}

function changeQty(id, delta){
  const item = catalog.find(i=>i.id===id);
  if(!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  save();
  renderMain();
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderMain(){
  catalogWrap.innerHTML='';
  const selectedItems = catalog.filter(i=>i.inList);
  const selectedCount = selectedItems.length;

  if(catalog.length===0){
    emptyState.classList.remove('hidden');
  }else{
    emptyState.classList.add('hidden');
  }
  goShopBtn.disabled = selectedCount===0;
  goShopBtn.textContent = selectedCount===0 ? "Start Shopping →" : `Start Shopping (${selectedCount}) →`;

  let estimatedTotal = 0;
  selectedItems.forEach(item => {
    if(item.price != null && !isNaN(item.price)) {
      estimatedTotal += Number(item.price) * (item.qty || 1);
    }
  });

  if(selectedCount > 0) {
    costSummaryBox.classList.remove('hidden');
    clearAllBtn.classList.remove('hidden');
    estimatedTotalAmount.textContent = `$${estimatedTotal.toFixed(2)}`;
  } else {
    costSummaryBox.classList.add('hidden');
    clearAllBtn.classList.add('hidden');
  }

  const sorted = [...catalog].sort((a,b)=> a.name.localeCompare(b.name, undefined, {sensitivity:'base'}));

  sorted.forEach(item=>{
    const row = document.createElement('div');
    row.className='catalog-item' + (item.inList ? ' selected':'');
    const priceStr = (item.price!=null && !isNaN(item.price)) ? `<span class="price-tag">$${Number(item.price).toFixed(2)}</span>` : '';
    const storeStr = item.store ? `<span class="store-badge" data-store="${escapeHtml(item.store)}">${STORE_LETTER[item.store]||'?'}</span>` : '';
    
    const qtyMod = item.inList ? `
      <div style="display:flex; align-items:center; gap:6px; margin-left:10px;" onclick="event.stopPropagation()">
        <button type="button" class="ghost-btn" style="padding:2px 8px; font-size:0.75rem;" data-dec="${item.id}">-</button>
        <span style="font-weight:700; font-size:0.875rem;">${item.qty || 1}</span>
        <button type="button" class="ghost-btn" style="padding:2px 8px; font-size:0.75rem;" data-inc="${item.id}">+</button>
      </div>
    ` : '';

    const removeOrLock = item.pinned 
      ? `<span title="Pinned item (protected)" style="padding:4px 6px; font-size:0.85rem; opacity:0.6;">🔒</span>`
      : `<button class="remove-btn" data-remove="${item.id}" title="Delete Product">✕</button>`;

    row.innerHTML = `
      <div class="catalog-left" data-id="${item.id}">
        <div class="checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div>
          <span class="name">${escapeHtml(item.name)}${!item.inList && item.qty>1?`<span class="qty">×${item.qty}</span>`:''}</span>
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

  catalogWrap.querySelectorAll('.catalog-left').forEach(el=>{
    el.addEventListener('click', ()=> toggleInList(el.dataset.id));
  });
  catalogWrap.querySelectorAll('[data-pin]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      togglePin(btn.dataset.pin);
    });
  });
  catalogWrap.querySelectorAll('[data-inc]').forEach(btn=>{
    btn.addEventListener('click', ()=> changeQty(btn.dataset.inc, 1));
  });
  catalogWrap.querySelectorAll('[data-dec]').forEach(btn=>{
    btn.addEventListener('click', ()=> changeQty(btn.dataset.dec, -1));
  });
  catalogWrap.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      openEditView(btn.dataset.edit);
    });
  });
  catalogWrap.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      removeFromCatalog(btn.dataset.remove);
    });
  });
}

storeFilterBar.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    storeFilterBar.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentStoreFilter = btn.dataset.filter;
    renderShop();
  });
});

function renderShop(){
  aisleGroups.innerHTML='';
  
  const allActive = catalog.filter(i=>i.inList);
  const active = allActive.filter(item => {
    if(currentStoreFilter === 'ALL') return true;
    return item.store === currentStoreFilter;
  });

  const total = active.length;
  const checkedCount = active.filter(i=>i.checked).length;
  const pct = total===0 ? 0 : Math.round((checkedCount/total)*100);
  
  progressFill.style.width = pct+'%';
  progressText.textContent = `${checkedCount} of ${total} collected`;
  progressPct.textContent = pct+'%';
  doneBanner.classList.toggle('hidden', !(total>0 && checkedCount===total));

  AISLES.forEach(aisle=>{
    const groupItems = active.filter(i=>i.aisle===aisle).sort((a,b)=> a.name.localeCompare(b.name, undefined, {sensitivity:'base'}));
    if(groupItems.length===0) return;
    const wrap = document.createElement('div');
    wrap.className='aisle-group';
    const collectedInGroup = groupItems.filter(i=>i.checked).length;
    wrap.innerHTML = `<div class="aisle-heading">${escapeHtml(aisle)} <span style="font-family:'DM Sans',sans-serif;font-weight:400;font-size:0.6875rem;color:var(--ink-soft);">(${collectedInGroup}/${groupItems.length})</span></div>`;
    groupItems.forEach(item=>{
      const row = document.createElement('div');
      row.className='shop-item' + (item.checked ? ' checked':'');
      row.dataset.id = item.id;
      const priceStr = (item.price!=null && !isNaN(item.price)) ? `<span class="price-tag">$${(Number(item.price)*(item.qty||1)).toFixed(2)}</span>` : '';
      const storeStr = item.store ? `<span class="store-badge" data-store="${escapeHtml(item.store)}" data-cyclestore="${item.id}">${STORE_LETTER[item.store]||'?'}</span>` : '';
      row.innerHTML = `
        <div class="checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div>
          <span class="name">${escapeHtml(item.name)}${item.qty>1?`<span class="qty">×${item.qty}</span>`:''}</span>
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
        item.checked = !item.checked;
        save();
        renderShop();
      });
      wrap.appendChild(row);
    });
    aisleGroups.appendChild(wrap);
  });
}

function showMain(){
  mainView.classList.remove('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  tabMain.classList.add('active');
  tabShop.classList.remove('active');
  tabSettings.classList.remove('active');
  renderMain();
}
function showShop(){
  mainView.classList.add('hidden');
  shopView.classList.remove('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  tabMain.classList.remove('active');
  tabShop.classList.add('active');
  tabSettings.classList.remove('active');
  renderShop();
}
function showSettings(){
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  tabMain.classList.remove('active');
  tabShop.classList.remove('active');
  tabSettings.classList.add('active');
}

openAddBtn.addEventListener('click', openAddView);
cancelAddBtn.addEventListener('click', showMain);
saveProductBtn.addEventListener('click', addItem);
itemInput.addEventListener('keydown', e=>{ if(e.key==='Enter') addItem(); });
goShopBtn.addEventListener('click', showShop);
backToListBtn.addEventListener('click', showMain);
backFromSettingsBtn.addEventListener('click', showMain);
tabMain.addEventListener('click', showMain);
tabShop.addEventListener('click', ()=>{ if(catalog.some(i=>i.inList)) showShop(); });
tabSettings.addEventListener('click', showSettings);

// Clear All Selected Items Listener (Using Custom Modal)
clearAllBtn.addEventListener('click', () => {
  showConfirm("Are you sure you want to unselect all items from this week's list?", (confirmed) => {
    if(confirmed) {
      catalog.forEach(i => { i.inList = false; i.checked = false; i.qty = 1; });
      save();
      renderMain();
    }
  });
});

// Delete Unpinned Catalogue Listener (Using Custom Modal)
deleteCatalogBtn.addEventListener('click', () => {
  showConfirm("⚠️ This will permanently delete all unpinned items in your catalogue. Pinned items will be kept safe. Continue?", (confirmed) => {
    if(confirmed) {
      catalog = catalog.filter(i => i.pinned);
      save();
      showMain();
    }
  });
});

// Store-Specific or Global Shop Done Listener (Using Custom Modal)
newRunBtn.addEventListener('click', async ()=>{
  if(currentStoreFilter === 'ALL') {
    showConfirm("Reset the list? This will unselect, uncheck, and reset all quantities to 1 ready for next time.", (confirmed) => {
      if(confirmed){
        catalog.forEach(i=>{ i.inList=false; i.checked=false; i.qty=1; });
        save();
        showMain();
      }
    });
  } else {
    showConfirm(`Finish shopping for ${currentStoreFilter}? This will clear only the ${currentStoreFilter} items from your current run.`, (confirmed) => {
      if(confirmed){
        catalog.forEach(i=>{
          if(i.store === currentStoreFilter) {
            i.inList = false;
            i.checked = false;
            i.qty = 1;
          }
        });
        save();
        if(!catalog.some(i => i.inList)) {
          showMain();
        } else {
          renderShop();
        }
      }
    });
  }
});

// Export Catalog (Prompts user to choose save location via File System Access API)
async function exportCatalog() {
  if (!catalog || catalog.length === 0) {
    alert("Your catalogue is empty, nothing to export!");
    return;
  }

  const dataStr = JSON.stringify(catalog, null, 2);
  const fileName = `shopping-list-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (window.showSaveFilePicker) {
    try {
      const options = {
        suggestedName: fileName,
        types: [{
          description: 'JSON Backup Files',
          accept: { 'application/json': ['.json'] },
        }],
      };
      
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(dataStr);
      await writable.close();
      
      alert("Backup saved successfully!");
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = fileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

// Import Catalog from a JSON file (Using Custom Modal for confirmation)
function importCatalog(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        showConfirm("This will overwrite your current catalogue with the backup file. Continue?", (confirmed) => {
          if (confirmed) {
            catalog = importedData;
            save();
            showMain();
            alert("Catalogue successfully restored!");
          }
        });
      } else {
        alert("Invalid backup file format.");
      }
    } catch (err) {
      alert("Could not parse the backup file.");
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportCatalog);
document.getElementById('importFile').addEventListener('change', importCatalog);

// Search Store Toggle Listener
document.querySelectorAll('#searchStoreSelect .filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#searchStoreSelect .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSearchStore = btn.dataset.searchstore;
  });
});

// Direct Web Search Handler
document.getElementById('searchApiBtn').addEventListener('click', () => {
  const query = document.getElementById('liveSearchInput').value.trim();
  
  if(!query) {
    alert("Please enter a search term first.");
    return;
  }

  let searchUrl = '';
  const encodedQuery = encodeURIComponent(query);

  if (selectedSearchStore === 'Woolworths') {
    searchUrl = `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodedQuery}`;
  } else if (selectedSearchStore === 'Coles') {
    searchUrl = `https://www.coles.com.au/search?q=${encodedQuery}`;
  } else if (selectedSearchStore === 'Aldi') {
    searchUrl = `https://www.aldi.com.au/products/search?q=${encodedQuery}`;
  }

  if (searchUrl) {
    window.open(searchUrl, '_blank');
  }
});

load();

// Service Worker Registration
let swRegistration = null;
let newWorker = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      swRegistration = reg;
      reg.update();

      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            document.getElementById('updateBanner').classList.remove('hidden');
          }
        });
      });
    }).catch(()=>{});

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });

  checkUpdateBtn.addEventListener('click', () => {
    checkUpdateBtn.textContent = "🔄 Checking...";
    if (swRegistration) {
      swRegistration.update().then(() => {
        setTimeout(() => {
          if (!newWorker) {
            checkUpdateBtn.textContent = "✓ Up to date";
            setTimeout(() => { checkUpdateBtn.textContent = "🔄 Check for updates"; }, 2000);
          }
        }, 1000);
      }).catch(() => {
        checkUpdateBtn.textContent = "🔄 Check for updates";
      });
    } else {
      window.location.reload();
    }
  });

  document.getElementById('reloadAppBtn').addEventListener('click', () => {
    const banner = document.getElementById('updateBanner');
    banner.querySelector('span').textContent = "⚡ Updating...";
    banner.querySelector('button').style.display = 'none';
    
    setTimeout(() => {
      if (newWorker) {
        newWorker.postMessage({ action: 'skipWaiting' });
      } else {
        window.location.reload();
      }
    }, 600);
  });
}
