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
const openAddFromProductsBtn = document.getElementById('openAddFromProductsBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const backToProductsBtn = document.getElementById('backToProductsBtn');
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
const backToListsBtn = document.getElementById('backToListsBtn');
const activeListHeaderName = document.getElementById('activeListHeaderName');
const newRunBtn = document.getElementById('newRunBtn');
const storeFilterBar = document.getElementById('storeFilterBar');
const checkUpdateBtn = document.getElementById('checkUpdateBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const deleteCatalogBtn = document.getElementById('deleteCatalogBtn');
const costSummaryBox = document.getElementById('costSummaryBox');
const estimatedTotalAmount = document.getElementById('estimatedTotalAmount');
const myListsView = document.getElementById('myListsView');
const listsWrap = document.getElementById('listsWrap');
const topTabs = document.getElementById('topTabs');
const bottomNav = document.getElementById('bottomNav');
const newListBtn = document.getElementById('newListBtn');
const newListModal = document.getElementById('newListModal');
const newListForm = document.getElementById('newListForm');
const newListNameInput = document.getElementById('newListNameInput');
const newListIconSelect = document.getElementById('newListIconSelect');
const newListColourSelect = document.getElementById('newListColourSelect');
const newListBudgetInput = document.getElementById('newListBudgetInput');
const newListCancelBtn = document.getElementById('newListCancelBtn');

let selectedStore = "Aldi";
let activeView = 'lists';
let currentListId = 'weekly';
let mainScrollTop = 0;
let activeProductDeleteDialog = null;

function getActiveListId() {
  return window.shoppingLists?.getActiveList?.()?.id || currentListId || 'default';
}

function updateActiveListHeader() {
  const activeList = window.shoppingLists?.getActiveList?.();
  const name = activeList?.name || 'My List';

  if (activeListHeaderName) {
    activeListHeaderName.textContent = name;
  }
}

AISLES.forEach(a=>{
  const opt = document.createElement('option');
  opt.value = a; opt.textContent = a;
  aisleSelect.appendChild(opt);
});

function save(){
  catalog = shoppingListStorage.saveCatalog(catalog);
}

function load(){
  catalog = shoppingListStorage.loadCatalog(DEFAULT_ITEMS);
  renderLists();
  showLists();
}

function openNewListModal() {
  if (!newListModal) return;

  newListForm.reset();
  newListIconSelect.value = 'shopping_cart';
  newListColourSelect.value = 'orange';
  newListBudgetInput.value = '200';
  newListModal.classList.remove('hidden');
  setTimeout(() => newListNameInput.focus(), 50);
}

function closeNewListModal() {
  if (!newListModal) return;
  newListModal.classList.add('hidden');
}

function saveNewList(event) {
  if (event) event.preventDefault();

  const name = (newListNameInput.value || '').trim();
  if (!name) {
    newListNameInput.focus();
    return;
  }

  const icon = newListIconSelect.value || 'shopping_cart';
  const colour = newListColourSelect.value || 'orange';
  const budget = Number(newListBudgetInput.value || 0);

  const createdList = window.shoppingLists.createList({
    name,
    icon,
    colour,
    budget
  });

  if (createdList) {
    renderLists();
    closeNewListModal();
  }
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
      renderLists();
      showMain();
      renderMain();
      renderShop();
      updateActiveListHeader();
    }
  );

  if (didUpdate === false) return;
}

function closeProductDeleteDialog() {
  if (activeProductDeleteDialog && activeProductDeleteDialog.parentNode) {
    activeProductDeleteDialog.parentNode.removeChild(activeProductDeleteDialog);
  }
  activeProductDeleteDialog = null;
}

function showProductDeleteDialog(product, onConfirm) {
  closeProductDeleteDialog();

  const dialog = document.createElement('div');
  dialog.className = 'list-card__delete-dialog';
  dialog.innerHTML = `
    <div class="list-card__delete-card">
      <div class="list-card__delete-title">Delete Product?</div>
      <div class="list-card__delete-copy">Are you sure you want to delete "${product.name}"? This removes the product from your catalogue and every shopping list that uses it.</div>
      <div class="list-card__delete-actions">
        <button class="ghost-btn list-card__delete-cancel" type="button">Cancel</button>
        <button class="go-shop-btn list-card__delete-confirm" type="button">Delete</button>
      </div>
    </div>
  `;

  dialog.querySelector('.list-card__delete-cancel').addEventListener('click', (event) => {
    event.stopPropagation();
    closeProductDeleteDialog();
  });

  dialog.querySelector('.list-card__delete-confirm').addEventListener('click', (event) => {
    event.stopPropagation();
    closeProductDeleteDialog();
    onConfirm();
  });

  document.body.appendChild(dialog);
  activeProductDeleteDialog = dialog;
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
  myListsView.classList.add('hidden');
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  settingsView.classList.add('hidden');
  addView.classList.remove('hidden');
  topTabs.classList.add('hidden');
  bottomNav.classList.add('hidden');
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
      myListsView.classList.add('hidden');
      mainView.classList.add('hidden');
      shopView.classList.add('hidden');
      settingsView.classList.add('hidden');
      addView.classList.remove('hidden');
      topTabs.classList.add('hidden');
      bottomNav.classList.add('hidden');
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
  const item = catalog.find((entry) => entry.id === id);
  if (!item) return;

  if (item.pinned) return;

  showProductDeleteDialog(item, () => {
    const result = shoppingListCatalog.deleteProduct(catalog, id);
    if (!result || result.removed === false) return;
    catalog = result.catalog;
    save();
    renderMain();
  });
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
  const activeListId = getActiveListId();
  const selectedItems = catalog.filter((item) => Boolean(item.lists?.[activeListId]));
  const selectedCount = selectedItems.length;
  let estimatedTotal = 0;
  selectedItems.forEach((item) => {
    const entry = item.lists?.[activeListId];
    const qty = Number(entry?.qty || 1);
    if(item.price != null && !isNaN(item.price)) {
      estimatedTotal += Number(item.price) * qty;
    }
  });
  const sorted = shoppingListShopping.sortCatalogItems(catalog);
  shoppingListUI.renderMain(catalogWrap, emptyState, goShopBtn, costSummaryBox, clearAllBtn, estimatedTotalAmount, catalog, selectedItems, selectedCount, estimatedTotal, sorted, STORE_LETTER, toggleInList, togglePin, changeQty, openEditView, removeFromCatalog, escapeHtml, activeListId);
}

function renderLists(){
  if (shoppingLists.getActiveList?.() && shoppingLists.getActiveList().id) {
    currentListId = shoppingLists.getActiveList().id;
  }

  shoppingLists.loadLists();
  shoppingLists.render(listsWrap, catalog, (list) => {
    currentListId = list.id;
    updateActiveListHeader();
    showMain();
  });
}

function removeActiveListEntries(filterFn = () => true) {
  const activeListId = getActiveListId();

  catalog.forEach((item) => {
    if (filterFn(item) && item.lists?.[activeListId]) {
      window.shoppingListStorage.removeProductFromList(item.id, activeListId);
    }
  });

  catalog = window.shoppingListStorage.saveCatalog(catalog);
  return catalog;
}

function syncStoreFilterButtons(activeButton) {
  storeFilterBar.querySelectorAll('.filter-btn').forEach((btn) => {
    const isActive = btn === activeButton;
    btn.classList.toggle('active', isActive);

    if (isActive) {
      btn.setAttribute('style', 'background-color:var(--color-text) !important;color:var(--color-bg) !important;border-color:var(--color-text) !important;font-weight:700;');
    } else {
      btn.removeAttribute('style');
    }
  });
}

storeFilterBar.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    syncStoreFilterButtons(btn);
    currentStoreFilter = btn.dataset.filter;
    renderShop();
  });
});

function renderShop(){
  const active = shoppingListShopping.createShoppingList(catalog, currentStoreFilter);
  shoppingListUI.renderShop(aisleGroups, active, AISLES, STORE_LETTER, escapeHtml, cycleStore, save, renderShop);
}

function captureMainScrollPosition(){
  if (catalogWrap) {
    mainScrollTop = catalogWrap.scrollTop || 0;
  }
}

function restoreMainScrollPosition(){
  if (catalogWrap) {
    requestAnimationFrame(() => {
      catalogWrap.scrollTop = mainScrollTop;
    });
  }
}

function showLists(){
  activeView = 'lists';
  myListsView.classList.remove('hidden');
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  topTabs.classList.add('hidden');
  bottomNav.classList.remove('hidden');
  updateActiveListHeader();
  renderLists();
}

function showMain(){
  activeView = 'main';
  myListsView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'main');
  topTabs.classList.remove('hidden');
  bottomNav.classList.add('hidden');
  updateActiveListHeader();
  renderMain();
  renderShop();
  restoreMainScrollPosition();
}
function showShop(){
  activeView = 'shop';
  myListsView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'shop');
  topTabs.classList.remove('hidden');
  bottomNav.classList.add('hidden');
  renderShop();
}
function showSettings(){
  captureMainScrollPosition();
  activeView = 'settings';
  myListsView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabShop, tabSettings, 'settings');
  topTabs.classList.remove('hidden');
  bottomNav.classList.add('hidden');
}

openAddBtn.addEventListener('click', openAddView);
openAddFromProductsBtn.addEventListener('click', openAddView);
backToProductsBtn.addEventListener('click', showMain);
cancelAddBtn.addEventListener('click', showMain);
saveProductBtn.addEventListener('click', addItem);
itemInput.addEventListener('keydown', e=>{ if(e.key==='Enter') addItem(); });
goShopBtn.addEventListener('click', showShop);
backToListBtn.addEventListener('click', showMain);
backFromSettingsBtn.addEventListener('click', () => {
  showLists();
  renderLists();
});
backToListsBtn.addEventListener('click', showLists);
tabMain.addEventListener('click', showMain);
tabShop.addEventListener('click', ()=>{ if(catalog.some((item) => Boolean(item.lists?.[getActiveListId()]))) showShop(); });
tabSettings.addEventListener('click', showSettings);
newListBtn.addEventListener('click', openNewListModal);
newListCancelBtn.addEventListener('click', closeNewListModal);
newListForm.addEventListener('submit', saveNewList);
Array.from(bottomNav.querySelectorAll('[data-nav]')).forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.nav === 'settings') showSettings();
    else showLists();
  });
});

// Clear All Selected Items Listener (Using Custom Modal)
clearAllBtn.addEventListener('click', () => {
  showConfirm("Are you sure you want to unselect all items from this week's list?", (confirmed) => {
    if(confirmed) {
      removeActiveListEntries();
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
        removeActiveListEntries();
        showMain();
      }
    });
  } else {
    showConfirm(`Finish shopping for ${currentStoreFilter}? This will clear only the ${currentStoreFilter} items from your current run.`, (confirmed) => {
      if(confirmed){
        removeActiveListEntries((item) => item.store === currentStoreFilter);
        if(!catalog.some((item) => Boolean(item.lists?.[getActiveListId()]))) {
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
  await shoppingListSettings.exportCatalog(catalog, showConfirm, save, showMain);
}

// Import Catalog from a JSON file (Using Custom Modal for confirmation)
function importCatalog(event) {
  shoppingListSettings.importCatalog(event, {
    showConfirm,
    setCatalog: (value) => { catalog = value; },
    save,
    showMain
  });
}

document.getElementById('exportBtn').addEventListener('click', exportCatalog);
document.getElementById('importFile').addEventListener('change', importCatalog);

// Search Store Toggle Listener
shoppingListSettings.attachSearchStoreHandlers(
  Array.from(document.querySelectorAll('#searchStoreSelect .filter-btn')),
  (value) => { selectedSearchStore = value; }
);

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
