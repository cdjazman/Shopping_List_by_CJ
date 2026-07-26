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
  shoppingListUI.showConfirm(message, callback);
}

function addItem(){
  const didUpdate = shoppingListCatalog.addProduct(
    catalog,
    itemInput,
    aisleSelect,
    qtyInput,
    priceInput,
    selectedStore,
    editingItemId,
    (value) => { editingItemId = value; },
    () => {
      save();
      showMain();
    }
  );

  if (didUpdate === false) return;
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
  shoppingListCatalog.editProduct(
    catalog,
    id,
    itemInput,
    aisleSelect,
    qtyInput,
    priceInput,
    (value) => { selectedStore = value; },
    (value) => { editingItemId = value; },
    (value) => { saveProductBtn.textContent = value; },
    updateStoreToggleUI,
    () => {
      mainView.classList.add('hidden');
      shopView.classList.add('hidden');
      settingsView.classList.add('hidden');
      addView.classList.remove('hidden');
    }
  );
}

function updateStoreToggleUI(){
  shoppingListUI.updateStoreToggleUI(storeToggle, selectedStore);
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
  const item = shoppingListCatalog.cycleStore(catalog, id);
  if(!item) return;
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
  const result = shoppingListCatalog.deleteProduct(catalog, id, () => {
    alert("This item is pinned and cannot be deleted.");
  });
  if (!result || result.removed === false) return;
  catalog = result.catalog;
  save();
  renderMain();
}

function toggleInList(id){
  const item = shoppingListShopping.toggleInList(catalog, id);
  if(!item) return;
  save();
  renderMain();
}

function changeQty(id, delta){
  const item = shoppingListShopping.changeQty(catalog, id, delta);
  if(!item) return;
  save();
  renderMain();
}

function escapeHtml(str){
  return shoppingListUI.escapeHtml(str);
}

function renderMain(){
  const selectedItems = catalog.filter(i=>i.inList);
  const selectedCount = selectedItems.length;
  let estimatedTotal = 0;
  selectedItems.forEach(item => {
    if(item.price != null && !isNaN(item.price)) {
      estimatedTotal += Number(item.price) * (item.qty || 1);
    }
  });
  const sorted = shoppingListShopping.sortCatalogItems(catalog);
  shoppingListUI.renderMain(catalogWrap, emptyState, goShopBtn, costSummaryBox, clearAllBtn, estimatedTotalAmount, catalog, selectedItems, selectedCount, estimatedTotal, sorted, STORE_LETTER, toggleInList, togglePin, changeQty, openEditView, removeFromCatalog, escapeHtml);
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
  const active = shoppingListShopping.createShoppingList(catalog, currentStoreFilter);
  shoppingListUI.renderShop(aisleGroups, active, AISLES, STORE_LETTER, escapeHtml, cycleStore, save, renderShop);
}

function showMain(){
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'main');
  renderMain();
}
function showShop(){
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'shop');
  renderShop();
}
function showSettings(){
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'settings');
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
