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
const tabProducts = document.getElementById('tabProducts');
const tabShop = document.getElementById('tabShop');
const brandLogoBtn = document.getElementById('brandLogoBtn');
const mainView = document.getElementById('mainView');
const shopView = document.getElementById('shopView');
const settingsView = document.getElementById('settingsView');
const privacyPolicyView = document.getElementById('privacyPolicyView');
const licencesView = document.getElementById('licencesView');
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
const clearAllBtn = document.getElementById('clearAllBtn');
const addFavouritesBtn = document.getElementById('addFavouritesBtn');
const settingsGearBtn = document.getElementById('settingsGearBtn');
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
const openPrivacyPolicyBtn = document.getElementById('openPrivacyPolicyBtn');
const backToSettingsFromPrivacyBtn = document.getElementById('backToSettingsFromPrivacyBtn');
const openLicencesBtn = document.getElementById('openLicencesBtn');
const backToSettingsFromLicencesBtn = document.getElementById('backToSettingsFromLicencesBtn');
const thirdPartyLicencesList = document.getElementById('thirdPartyLicencesList');
const noThirdPartyLicencesMessage = document.getElementById('noThirdPartyLicencesMessage');

const THIRD_PARTY_LICENCES = [];
const DEMO_SEED_DONE_KEY = 'shopping-demo-seeded-v1';
const THEME_PREFERENCE_KEY = 'shopping-theme-preference';
const THEME_OPTIONS = ['light', 'dark', 'system'];
const systemThemeMediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

let currentThemePreference = 'system';

let selectedStore = "Aldi";
let activeView = 'lists';
let currentListId = 'weekly';
let mainScrollTop = 0;
let activeProductDeleteDialog = null;
let productsSearchQuery = '';
let productsFavouriteFilter = 'all';
window.__shoppingAppOpenList = null;

const appearanceThemeButtons = Array.from(document.querySelectorAll('[data-theme-option]'));

function getStoredThemePreference() {
  const saved = localStorage.getItem(THEME_PREFERENCE_KEY);
  return THEME_OPTIONS.includes(saved) ? saved : 'system';
}

function resolveTheme(preference) {
  if (preference === 'system') {
    return systemThemeMediaQuery && systemThemeMediaQuery.matches ? 'dark' : 'light';
  }
  return preference === 'light' ? 'light' : 'dark';
}

function getThemeColorForMeta(theme) {
  return theme === 'dark' ? '#C85A1F' : '#F7F7F5';
}

function updateAppearanceThemeUI() {
  appearanceThemeButtons.forEach((button) => {
    const isActive = button.dataset.themeOption === currentThemePreference;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function syncBrandLogo(theme) {
  const brandImage = document.querySelector('.brand-image');
  if (!brandImage) return;

  const nextSource = theme === 'dark'
    ? 'assets/images/LOGO pill dark.png'
    : 'assets/images/LOGO pill.png';

  if (brandImage.getAttribute('src') !== nextSource) {
    brandImage.setAttribute('src', nextSource);
  }
}

function applyTheme(preference, options = {}) {
  const shouldPersist = options.persist !== false;
  currentThemePreference = THEME_OPTIONS.includes(preference) ? preference : 'system';
  const resolvedTheme = resolveTheme(currentThemePreference);

  document.documentElement.setAttribute('data-theme-preference', currentThemePreference);
  document.documentElement.setAttribute('data-theme', resolvedTheme);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', getThemeColorForMeta(resolvedTheme));
  }

  syncBrandLogo(resolvedTheme);
  updateAppearanceThemeUI();

  if (shouldPersist) {
    localStorage.setItem(THEME_PREFERENCE_KEY, currentThemePreference);
  }
}

function handleSystemThemeChange() {
  if (currentThemePreference !== 'system') return;
  applyTheme('system', { persist: false });
}

function initializeTheme() {
  applyTheme(getStoredThemePreference(), { persist: false });

  if (!systemThemeMediaQuery) return;
  if (typeof systemThemeMediaQuery.addEventListener === 'function') {
    systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
    return;
  }

  if (typeof systemThemeMediaQuery.addListener === 'function') {
    systemThemeMediaQuery.addListener(handleSystemThemeChange);
  }
}

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

function shouldSeedFirstRunDemoData() {
  try {
    const alreadySeeded = localStorage.getItem(DEMO_SEED_DONE_KEY) === '1';
    if (alreadySeeded) return false;

    const hasLists = localStorage.getItem('shopping-lists') != null;
    const hasCatalog = localStorage.getItem(shoppingListStorage.STORAGE_KEY) != null;
    const hasLegacyActive = localStorage.getItem('shopping-active-list') != null;
    const hasActive = localStorage.getItem('shopping-lists-active') != null;

    return !hasLists && !hasCatalog && !hasLegacyActive && !hasActive;
  } catch (e) {
    return false;
  }
}

function applyDemoSeedToHomeList() {
  const activeList = window.shoppingLists?.getActiveList?.();
  if (!activeList || !activeList.id) return;

  catalog.forEach((item) => {
    if (!item || !item.id) return;
    window.shoppingListStorage.addProductToList(item.id, activeList.id);
  });

  try {
    localStorage.setItem(DEMO_SEED_DONE_KEY, '1');
  } catch (e) {}
}

function load(){
  const shouldSeedDemo = shouldSeedFirstRunDemoData();
  catalog = shoppingListStorage.loadCatalog(DEFAULT_ITEMS, { seedDefaults: shouldSeedDemo });
  renderLists();

  if (shouldSeedDemo) {
    applyDemoSeedToHomeList();
    save();
    renderLists();
  }

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
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
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
      if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
      if (licencesView) licencesView.classList.add('hidden');
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

function toggleFavourite(id){
  const item = catalog.find((entry) => entry.id === id);
  if (!item) return;
  item.favourite = !item.favourite;
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

function addFavouriteProductsToCurrentList() {
  const activeListId = getActiveListId();
  const favouriteProducts = catalog.filter((item) => Boolean(item.favourite));
  const addedProducts = [];

  favouriteProducts.forEach((item) => {
    if (!item.lists?.[activeListId]) {
      window.shoppingListStorage.addProductToList(item.id, activeListId);
      addedProducts.push(item);
    }
  });

  save();
  renderMain();
  renderLists();
  updateActiveListHeader();

  const alreadyExistingCount = favouriteProducts.length - addedProducts.length;
  const message = addedProducts.length === 0
    ? 'All favourite products are already in this list.'
    : alreadyExistingCount > 0
      ? `${addedProducts.length} added, ${alreadyExistingCount} already existed.`
      : `${addedProducts.length} favourite products added.`;

  showConfirm(message, () => {});
}

function getFilteredProducts() {
  const query = (productsSearchQuery || '').trim().toLowerCase();
  const favouritesOnly = productsFavouriteFilter === 'favourites';

  return catalog.filter((item) => {
    const matchesFilter = favouritesOnly ? Boolean(item.favourite) : true;
    if (!matchesFilter) return false;

    const searchableText = [item.name, item.aisle]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .join(' ');

    if (!query) return true;
    return searchableText.includes(query);
  });
}

function updateProductsSearchUI() {
  const searchInput = document.getElementById('productsSearchInput');
  const clearBtn = document.getElementById('productsSearchClearBtn');

  if (!searchInput || !clearBtn) return;

  clearBtn.classList.toggle('hidden', !searchInput.value.trim());
}

function bindNavAction(element, handler) {
  if (!element) return;

  let touchHandled = false;

  const invoke = (event) => {
    if (event?.type === 'touchend') {
      touchHandled = true;
      handler(event);
      return;
    }

    if (event?.type === 'click') {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      handler(event);
    }
  };

  element.addEventListener('click', invoke);
  element.addEventListener('touchend', invoke, { passive: false });
}

function renderMain(){
  const activeListId = getActiveListId();
  const selectedItems = catalog.filter((item) => Boolean(item.lists?.[activeListId]));
  const selectedCount = selectedItems.length;
  const completedCount = selectedCount;
  let estimatedTotal = 0;
  selectedItems.forEach((item) => {
    const entry = item.lists?.[activeListId];
    const qty = Number(entry?.qty || 1);
    if(item.price != null && !isNaN(item.price)) {
      estimatedTotal += Number(item.price) * qty;
    }
  });
  const visibleCatalog = getFilteredProducts();
  const sorted = shoppingListShopping.sortCatalogItems(visibleCatalog);
  shoppingListUI.renderMain(catalogWrap, emptyState, goShopBtn, costSummaryBox, clearAllBtn, estimatedTotalAmount, visibleCatalog, catalog, selectedItems, selectedCount, completedCount, estimatedTotal, sorted, STORE_LETTER, toggleInList, togglePin, changeQty, openEditView, removeFromCatalog, toggleFavourite, escapeHtml, activeListId, productsSearchQuery);
}

function renderLists(){
  if (shoppingLists.getActiveList?.() && shoppingLists.getActiveList().id) {
    currentListId = shoppingLists.getActiveList().id;
  }

  shoppingLists.loadLists();
  window.__shoppingAppOpenList = (list) => {
    currentListId = list.id;
    updateActiveListHeader();
    showMain();
  };
  shoppingLists.render(listsWrap, catalog, window.__shoppingAppOpenList);
}

function removeActiveListEntries(filterFn = () => true) {
  const activeListId = getActiveListId();
  let removedCount = 0;

  catalog.forEach((item) => {
    if (filterFn(item) && item.lists?.[activeListId]) {
      delete item.lists[activeListId];
      removedCount += 1;
    }
  });

  if (removedCount > 0) {
    catalog = window.shoppingListStorage.saveCatalog(catalog);
  }

  return catalog;
}

function syncStoreFilterButtons(activeButton) {
  storeFilterBar.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn === activeButton);
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
  mainScrollTop = window.scrollY || window.pageYOffset || 0;
}

function restoreMainScrollPosition(){
  requestAnimationFrame(() => {
    window.scrollTo({ top: mainScrollTop, left: 0, behavior: 'auto' });
  });
}

function showLists(){
  activeView = 'lists';
  myListsView.classList.remove('hidden');
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabProducts, tabShop, 'lists');
  topTabs.classList.remove('hidden');
  bottomNav.classList.add('hidden');
  updateActiveListHeader();
  renderLists();
}

function showMain(){
  activeView = 'main';
  myListsView.classList.add('hidden');
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabProducts, tabShop, 'main');
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
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabProducts, tabShop, 'shop');
  topTabs.classList.remove('hidden');
  bottomNav.classList.add('hidden');
  renderShop();
}
function showSettings(){
  captureMainScrollPosition();
  activeView = 'settings';
  myListsView.classList.add('hidden');
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
  shoppingListUI.showView(mainView, shopView, addView, settingsView, tabMain, tabProducts, tabShop, 'settings');
  topTabs.classList.add('hidden');
  bottomNav.classList.add('hidden');
}

function showPrivacyPolicy() {
  captureMainScrollPosition();
  activeView = 'privacy-policy';
  myListsView.classList.add('hidden');
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  if (licencesView) licencesView.classList.add('hidden');
  if (privacyPolicyView) {
    privacyPolicyView.classList.remove('hidden');
    privacyPolicyView.scrollTop = 0;
  }
  topTabs.classList.add('hidden');
  bottomNav.classList.add('hidden');
}

function renderThirdPartyLicences() {
  if (!thirdPartyLicencesList || !noThirdPartyLicencesMessage) return;

  thirdPartyLicencesList.innerHTML = '';

  if (!Array.isArray(THIRD_PARTY_LICENCES) || THIRD_PARTY_LICENCES.length === 0) {
    thirdPartyLicencesList.classList.add('hidden');
    noThirdPartyLicencesMessage.classList.remove('hidden');
    return;
  }

  THIRD_PARTY_LICENCES.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'licences-third-party-item';

    const title = document.createElement('div');
    title.className = 'licences-third-party-title';
    title.textContent = entry.name || 'Unnamed component';
    item.appendChild(title);

    if (entry.licence) {
      const licence = document.createElement('p');
      licence.textContent = `Licence: ${entry.licence}`;
      item.appendChild(licence);
    }

    if (entry.url) {
      const linkLine = document.createElement('p');
      const link = document.createElement('a');
      link.className = 'licences-link';
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = entry.url;
      linkLine.appendChild(link);
      item.appendChild(linkLine);
    }

    thirdPartyLicencesList.appendChild(item);
  });

  noThirdPartyLicencesMessage.classList.add('hidden');
  thirdPartyLicencesList.classList.remove('hidden');
}

function showLicences() {
  captureMainScrollPosition();
  activeView = 'licences';
  myListsView.classList.add('hidden');
  mainView.classList.add('hidden');
  shopView.classList.add('hidden');
  addView.classList.add('hidden');
  settingsView.classList.add('hidden');
  if (privacyPolicyView) privacyPolicyView.classList.add('hidden');
  if (licencesView) {
    renderThirdPartyLicences();
    licencesView.classList.remove('hidden');
    licencesView.scrollTop = 0;
  }
  topTabs.classList.add('hidden');
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
if (settingsGearBtn) {
  bindNavAction(settingsGearBtn, showSettings);
}

const productsSearchInput = document.getElementById('productsSearchInput');
const productsSearchClearBtn = document.getElementById('productsSearchClearBtn');
const productsFilterAllBtn = document.getElementById('productsFilterAllBtn');
const productsFilterFavouritesBtn = document.getElementById('productsFilterFavouritesBtn');

function updateFavouriteFilterUI() {
  if (productsFilterAllBtn) {
    productsFilterAllBtn.classList.toggle('active', productsFavouriteFilter === 'all');
  }
  if (productsFilterFavouritesBtn) {
    productsFilterFavouritesBtn.classList.toggle('active', productsFavouriteFilter === 'favourites');
  }
}

if (productsSearchInput) {
  productsSearchInput.addEventListener('input', () => {
    productsSearchQuery = productsSearchInput.value;
    updateProductsSearchUI();
    renderMain();
  });
}

if (productsSearchClearBtn) {
  productsSearchClearBtn.addEventListener('click', () => {
    if (productsSearchInput) {
      productsSearchInput.value = '';
    }
    productsSearchQuery = '';
    updateProductsSearchUI();
    renderMain();
  });
}

if (productsFilterAllBtn) {
  productsFilterAllBtn.addEventListener('click', () => {
    productsFavouriteFilter = 'all';
    updateFavouriteFilterUI();
    renderMain();
  });
}

if (productsFilterFavouritesBtn) {
  productsFilterFavouritesBtn.addEventListener('click', () => {
    productsFavouriteFilter = 'favourites';
    updateFavouriteFilterUI();
    renderMain();
  });
}

updateFavouriteFilterUI();
if (backFromSettingsBtn) {
  backFromSettingsBtn.addEventListener('click', () => {
    showLists();
    renderLists();
  });
}
if (openPrivacyPolicyBtn) {
  openPrivacyPolicyBtn.addEventListener('click', showPrivacyPolicy);
}
if (backToSettingsFromPrivacyBtn) {
  backToSettingsFromPrivacyBtn.addEventListener('click', showSettings);
}
if (openLicencesBtn) {
  openLicencesBtn.addEventListener('click', showLicences);
}
if (backToSettingsFromLicencesBtn) {
  backToSettingsFromLicencesBtn.addEventListener('click', showSettings);
}
if (backToListsBtn) {
  backToListsBtn.addEventListener('click', showLists);
}
if (brandLogoBtn) {
  bindNavAction(brandLogoBtn, showLists);
}
if (tabMain) {
  bindNavAction(tabMain, showLists);
}
if (tabProducts) {
  bindNavAction(tabProducts, showMain);
}
if (tabShop) {
  bindNavAction(tabShop, showShop);
}
if (newListBtn) {
  newListBtn.addEventListener('click', openNewListModal);
}
if (newListCancelBtn) {
  newListCancelBtn.addEventListener('click', closeNewListModal);
}
if (newListForm) {
  newListForm.addEventListener('submit', saveNewList);
}
if (bottomNav) {
  Array.from(bottomNav.querySelectorAll('[data-nav]')).forEach((btn) => {
    bindNavAction(btn, () => {
      if (btn.dataset.nav === 'settings') showSettings();
      else showLists();
    });
  });
}

appearanceThemeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.themeOption || 'system');
  });
});

// Clear All Selected Items Listener (Using Custom Modal)
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', () => {
    showConfirm("Are you sure you want to clear all completed items from this week's list?", (confirmed) => {
      if (confirmed) {
        const activeListId = getActiveListId();
        removeActiveListEntries((item) => Boolean(item.lists?.[activeListId]));
        renderMain();
      }
    });
  });
}

if (addFavouritesBtn) {
  addFavouritesBtn.addEventListener('click', () => {
    const favouriteProducts = catalog.filter((item) => Boolean(item.favourite));
    if (favouriteProducts.length === 0) {
      showConfirm('You do not have any favourite products yet.', () => {});
      return;
    }

    showConfirm('Add all favourite products to this shopping list?', (confirmed) => {
      if (!confirmed) return;

      const activeListId = getActiveListId();
      const addedProducts = [];

      favouriteProducts.forEach((item) => {
        if (!item.lists?.[activeListId]) {
          window.shoppingListStorage.addProductToList(item.id, activeListId);
          addedProducts.push(item);
        }
      });

      save();
      renderMain();
      renderLists();
      updateActiveListHeader();

      const alreadyExistingCount = favouriteProducts.length - addedProducts.length;
      const message = addedProducts.length === 0
        ? 'All favourite products are already in this list.'
        : alreadyExistingCount > 0
          ? `${addedProducts.length} added, ${alreadyExistingCount} already existed.`
          : `${addedProducts.length} favourite products added.`;

      showConfirm(message, () => {});
    });
  });
}

// Delete Unpinned Catalogue Listener (Using Custom Modal)
if (deleteCatalogBtn) {
  deleteCatalogBtn.addEventListener('click', () => {
    showConfirm("⚠️ This will permanently delete all unpinned items in your catalogue. Pinned items will be kept safe. Continue?", (confirmed) => {
      if(confirmed) {
        catalog = catalog.filter(i => i.pinned);
        save();
        showMain();
      }
    });
  });
}

// Store-Specific or Global Shop Done Listener (Using Custom Modal)
if (newRunBtn) {
  newRunBtn.addEventListener('click', async () => {
    if (currentStoreFilter === 'ALL') {
      showConfirm("Reset the list? This will unselect, uncheck, and reset all quantities to 1 ready for next time.", (confirmed) => {
        if (confirmed) {
          removeActiveListEntries();
          showMain();
        }
      });
    } else {
      showConfirm(`Finish shopping for ${currentStoreFilter}? This will clear only the ${currentStoreFilter} items from your current run.`, (confirmed) => {
        if (confirmed) {
          removeActiveListEntries((item) => item.store === currentStoreFilter);
          if (!catalog.some((item) => Boolean(item.lists?.[getActiveListId()]))) {
            showMain();
          } else {
            renderShop();
          }
        }
      });
    }
  });
}

// Export Catalog (Prompts user to choose save location via File System Access API)
async function exportCatalog() {
  await shoppingListSettings.exportCatalog();
}

// Import Catalog from a JSON file (Using Custom Modal for confirmation)
function importCatalog(event) {
  shoppingListSettings.importCatalog(event, {
    showConfirm,
    refreshUI: () => {
      window.location.reload();
    }
  });
}

const exportBtn = document.getElementById('exportBtn');
const restoreBtn = document.getElementById('restoreBtn');
const importFileInput = document.getElementById('importFile');
const searchApiBtn = document.getElementById('searchApiBtn');
const liveSearchInput = document.getElementById('liveSearchInput');

if (exportBtn) {
  exportBtn.addEventListener('click', exportCatalog);
}
if (importFileInput) {
  importFileInput.addEventListener('change', importCatalog);
}
if (restoreBtn && importFileInput) {
  restoreBtn.addEventListener('click', () => {
    importFileInput.click();
  });
}

// Search Store Toggle Listener
if (shoppingListSettings?.attachSearchStoreHandlers) {
  shoppingListSettings.attachSearchStoreHandlers(
    Array.from(document.querySelectorAll('#searchStoreSelect .filter-btn')),
    (value) => { selectedSearchStore = value; }
  );
}

// Direct Web Search Handler
if (searchApiBtn && liveSearchInput) {
  searchApiBtn.addEventListener('click', () => {
    const query = liveSearchInput.value.trim();

    if (!query) {
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
}

initializeTheme();
load();
