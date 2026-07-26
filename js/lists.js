(function (global) {
  const STORAGE_KEY = 'shopping-lists';
  const ACTIVE_STORAGE_KEY = 'shopping-lists-active';
  const DEFAULT_LIST_NAME = 'Weekly Shop';
  const DEFAULT_LIST_ICON = 'shopping_cart';
  const DEFAULT_LIST_BUDGET = 200;

  const ICON_LOOKUP = {
    shopping_cart: '🛒',
    home: '🏠',
    party: '🎉',
    school: '🎒',
    work: '💼',
    travel: '✈️',
    gift: '🎁',
    food: '🍽️',
    health: '💊'
  };

  let lists = [];
  let activeListId = null;
  let listsWrap = null;
  let activeListMenu = null;
  let activeDeleteDialog = null;
  let latestOnOpen = null;

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function normalizeIcon(icon) {
    const value = String(icon || '').trim().toLowerCase();

    if (!value) {
      return DEFAULT_LIST_ICON;
    }

    const emojiMap = {
      '🛒': 'shopping_cart',
      '🏠': 'home',
      '🎉': 'party',
      '📝': 'shopping_cart',
      '🎒': 'school',
      '💼': 'work',
      '✈️': 'travel',
      '🎁': 'gift',
      '🍽️': 'food',
      '💊': 'health'
    };

    return emojiMap[value] || value;
  }

  function getIconDisplay(icon) {
    return ICON_LOOKUP[normalizeIcon(icon)] || ICON_LOOKUP.shopping_cart;
  }

  function normalizeColour(colour) {
    const value = String(colour || '').trim().toLowerCase();
    return value || 'orange';
  }

  function getListIconClass(list) {
    return `list-card__icon list-card__icon--${normalizeColour(list.colour)}`;
  }

  function escapeText(value) {
    if (typeof global.shoppingListUI?.escapeHtml === 'function') {
      return global.shoppingListUI.escapeHtml(value);
    }

    return String(value ?? '');
  }

  function createDefaultList() {
    return {
      id: uid(),
      name: DEFAULT_LIST_NAME,
      icon: DEFAULT_LIST_ICON,
      colour: 'orange',
      budget: DEFAULT_LIST_BUDGET,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      pinned: false
    };
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function normalizeLists(rawLists) {
    if (!Array.isArray(rawLists)) return [];

    return rawLists
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: item.id || uid(),
        name: item.name || DEFAULT_LIST_NAME,
        icon: normalizeIcon(item.icon),
        colour: normalizeColour(item.colour),
        budget: Number(item.budget) || DEFAULT_LIST_BUDGET,
        created: item.created || new Date().toISOString(),
        updated: item.updated || new Date().toISOString(),
        pinned: Boolean(item.pinned)
      }));
  }

  function loadLists() {
    if (lists.length > 0 && activeListId) {
      return lists;
    }

    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeLists(parsed);
        const existingDefault = normalized.find((item) => item.name === DEFAULT_LIST_NAME && item.budget === DEFAULT_LIST_BUDGET);

        lists = normalized.length > 0
          ? normalized
          : [createDefaultList()];

        if (!existingDefault && normalized.length === 0) {
          lists = [createDefaultList()];
        }
      } else {
        lists = [createDefaultList()];
        saveLists();
      }
    } catch (e) {
      lists = [createDefaultList()];
      saveLists();
    }

    try {
      const storedActive = global.localStorage.getItem(ACTIVE_STORAGE_KEY);

      if (storedActive) {
        const match = lists.find((item) => item.id === storedActive);
        activeListId = match ? match.id : lists[0] && lists[0].id;
      } else {
        activeListId = lists[0] && lists[0].id;
      }
    } catch (e) {
      activeListId = lists[0] && lists[0].id;
    }

    return lists;
  }

  function saveLists() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (e) {}
  }

  function persistActiveList() {
    try {
      if (activeListId) {
        global.localStorage.setItem(ACTIVE_STORAGE_KEY, activeListId);
      }
    } catch (e) {}
  }

  function getSortedLists() {
    return [...lists].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return Number(b.pinned) - Number(a.pinned);
      }

      return new Date(b.updated || 0) - new Date(a.updated || 0);
    });
  }

  function createList(data = {}) {
    const normalized = normalizeLists(lists);
    const existingDefault = normalized.find((item) => item.name === DEFAULT_LIST_NAME && item.budget === DEFAULT_LIST_BUDGET);

    const newList = {
      id: uid(),
      name: data.name || 'New List',
      icon: normalizeIcon(data.icon || 'shopping_cart'),
      colour: normalizeColour(data.colour || 'orange'),
      budget: Number(data.budget || 200),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      pinned: false
    };

    if (data.name === DEFAULT_LIST_NAME && existingDefault) {
      return existingDefault;
    }

    lists.unshift(newList);
    activeListId = newList.id;
    saveLists();
    persistActiveList();
    render();
    return newList;
  }

  function updateList(id, updates) {
    const target = lists.find((item) => item.id === id);

    if (!target) return null;

    Object.assign(target, updates, {
      updated: new Date().toISOString()
    });

    saveLists();
    render();
    return target;
  }

  function deleteList(id) {
    if (lists.length <= 1) {
      return null;
    }

    const nextLists = lists.filter((item) => item.id !== id);

    if (nextLists.length === 0) {
      return null;
    }

    lists = nextLists;

    if (activeListId === id) {
      activeListId = lists[0] && lists[0].id;
    }

    saveLists();
    persistActiveList();
    render();
    return lists;
  }

  function togglePinned(id) {
    const target = lists.find((item) => item.id === id);

    if (!target) return null;

    target.pinned = !target.pinned;
    target.updated = new Date().toISOString();
    lists = getSortedLists();
    saveLists();
    render();
    return target;
  }

  function setActiveList(id) {
    const match = lists.find((item) => item.id === id);

    if (!match) {
      return null;
    }

    activeListId = match.id;
    persistActiveList();
    render();
    return match;
  }

  function getActiveList() {
    return lists.find((item) => item.id === activeListId) || lists[0] || null;
  }

  function getRelativeDate(timestamp) {
    const value = Date.parse(timestamp || new Date().toISOString());

    if (!Number.isFinite(value)) {
      return 'Today';
    }

    const now = Date.now();
    const diffMs = now - value;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 24 && new Date(value).toDateString() === new Date(now).toDateString()) {
      if (diffHours < 1) return 'Just now';
      if (diffHours < 2) return '1 hour ago';
      return `${Math.floor(diffHours)} hours ago`;
    }

    if (diffDays < 2) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    }

    if (diffDays < 14) {
      return 'Last week';
    }

    return 'Last month';
  }

  function closeListMenu() {
    if (activeListMenu && activeListMenu.parentNode) {
      activeListMenu.parentNode.removeChild(activeListMenu);
    }
    activeListMenu = null;
  }

  function closeDeleteDialog() {
    if (activeDeleteDialog && activeDeleteDialog.parentNode) {
      activeDeleteDialog.parentNode.removeChild(activeDeleteDialog);
    }
    activeDeleteDialog = null;
  }

  function showDeleteDialog(list, onConfirm) {
    closeDeleteDialog();

    const dialog = document.createElement('div');
    dialog.className = 'list-card__delete-dialog';
    dialog.innerHTML = `
      <div class="list-card__delete-card">
        <div class="list-card__delete-title">Delete "${escapeText(list.name)}"?</div>
        <div class="list-card__delete-copy">This removes the shopping list only. Products remain in your catalogue.</div>
        <div class="list-card__delete-actions">
          <button class="ghost-btn list-card__delete-cancel" type="button">Cancel</button>
          <button class="go-shop-btn list-card__delete-confirm" type="button">Delete</button>
        </div>
      </div>
    `;

    dialog.querySelector('.list-card__delete-cancel').addEventListener('click', (event) => {
      event.stopPropagation();
      closeDeleteDialog();
    });

    dialog.querySelector('.list-card__delete-confirm').addEventListener('click', (event) => {
      event.stopPropagation();
      closeDeleteDialog();
      onConfirm();
    });

    document.body.appendChild(dialog);
    activeDeleteDialog = dialog;
  }

  function showListMenu(list, triggerButton, card) {
    closeListMenu();

    const menu = document.createElement('div');
    menu.className = 'list-card__menu';
    menu.dataset.listId = list.id;
    menu.innerHTML = `
      <button class="list-card__menu-item" data-action="rename" type="button">Rename List</button>
      <button class="list-card__menu-item" data-action="pin" type="button">${list.pinned ? 'Unpin List' : 'Pin List'}</button>
      <button class="list-card__menu-item list-card__menu-item--danger" data-action="delete" type="button">Delete List</button>
    `;

    const renameBtn = menu.querySelector('[data-action="rename"]');
    const pinBtn = menu.querySelector('[data-action="pin"]');
    const deleteBtn = menu.querySelector('[data-action="delete"]');

    renameBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeListMenu();
      const nextName = global.prompt('Rename list', list.name);
      const trimmedName = (nextName || '').trim();
      if (!trimmedName || trimmedName === list.name) return;
      updateList(list.id, { name: trimmedName });
    });

    pinBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeListMenu();
      togglePinned(list.id);
    });

    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      closeListMenu();
      if (lists.length <= 1) return;
      showDeleteDialog(list, () => {
        deleteList(list.id);
      });
    });

    card.appendChild(menu);
    activeListMenu = menu;
  }

  function readCatalogSummary(listId) {
    const storage = global.shoppingListStorage;
    const products = storage && typeof storage.getProductsForList === 'function'
      ? storage.getProductsForList(listId)
      : [];

    let estimatedTotal = 0;

    products.forEach((product) => {
      const entry = product && product.lists && product.lists[listId];
      const qty = Number(entry && entry.qty ? entry.qty : 1);
      const price = Number(product.price);

      if (!Number.isNaN(price)) {
        estimatedTotal += price * qty;
      }
    });

    return {
      itemCount: products.length,
      estimatedTotal
    };
  }

  function render(container, catalog, onOpen) {
    const targetContainer = container || listsWrap || document.getElementById('listsWrap');

    if (!targetContainer) return;

    closeListMenu();
    closeDeleteDialog();
    listsWrap = targetContainer;

    if (typeof onOpen === 'function') {
      latestOnOpen = onOpen;
    }

    if (!targetContainer.__shoppingListClickBound) {
      targetContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.list-card');
        if (!card || !card.dataset.listId) {
          return;
        }
        if (event.target.closest('.list-card__menu-button, .list-card__menu, .list-card__menu-item')) {
          return;
        }

        const updatedList = setActiveList(card.dataset.listId);
        const openHandler = latestOnOpen;
        if (updatedList && typeof openHandler === 'function') {
          openHandler(updatedList);
        }
      });

      targetContainer.addEventListener('keydown', (event) => {
        const card = event.target.closest('.list-card');
        if (!card || !card.dataset.listId) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('.list-card__menu-button, .list-card__menu, .list-card__menu-item')) return;

        event.preventDefault();
        const updatedList = setActiveList(card.dataset.listId);
        const openHandler = latestOnOpen;
        if (updatedList && typeof openHandler === 'function') {
          openHandler(updatedList);
        }
      });

      targetContainer.__shoppingListClickBound = true;
    }

    const summary = readCatalogSummary();
    const visibleLists = getSortedLists();

    targetContainer.innerHTML = '';

    visibleLists.forEach((list) => {
      const card = document.createElement('div');
      card.className = 'list-card';
      card.dataset.listId = list.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const isActive = list.id === activeListId;
      const listSummary = readCatalogSummary(list.id);
      const budget = Number(list.budget || 0);
      const estimatedTotal = listSummary.estimatedTotal;
      const remainingBudget = budget - estimatedTotal;
      const progressPercent = budget > 0 ? Math.min(100, Math.max(0, (estimatedTotal / budget) * 100)) : 0;
      const isOverBudget = estimatedTotal > budget;
      const relativeDate = getRelativeDate(list.updated);

      if (isActive) {
        card.classList.add('is-active');
      }

      if (list.pinned) {
        card.classList.add('is-pinned');
      }

      card.innerHTML = `
        <div class="list-card__top">
          <div class="list-card__identity">
            <div class="${getListIconClass(list)}">${getIconDisplay(list.icon)}</div>
            <div>
              <div class="list-card__title">${escapeText(list.name)}</div>
              <div class="list-card__subtext">${listSummary.itemCount} ${listSummary.itemCount === 1 ? 'product' : 'products'}</div>
            </div>
          </div>
          <div class="list-card__controls">
            <div class="list-card__pin ${list.pinned ? '' : 'list-card__pin--muted'}">${list.pinned ? '📌' : ''}</div>
            <button class="list-card__menu-button" type="button" aria-label="Open list actions">⋮</button>
          </div>
        </div>

        <div class="list-card__body">
          <div class="list-card__meta-row">
            <span class="list-card__pill">Updated ${relativeDate}</span>
          </div>

          <div class="list-card__stats">
            <div class="list-card__stat">
              <span class="list-card__stat-label">Estimated</span>
              <strong>${formatCurrency(estimatedTotal)}</strong>
            </div>
            <div class="list-card__stat">
              <span class="list-card__stat-label">Budget</span>
              <strong>${formatCurrency(budget)}</strong>
            </div>
            <div class="list-card__stat">
              <span class="list-card__stat-label">Remaining</span>
              <strong>${formatCurrency(remainingBudget)}</strong>
            </div>
          </div>

          <div class="list-card__progress">
            <div class="list-card__progress-track">
              <span class="list-card__progress-fill ${isOverBudget ? 'is-over-budget' : ''}" style="width:${progressPercent}%"></span>
            </div>
          </div>
        </div>
      `;

      const menuButton = card.querySelector('.list-card__menu-button');
      menuButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (activeListMenu && activeListMenu.dataset.listId === list.id) {
          closeListMenu();
          return;
        }
        showListMenu(list, menuButton, card);
      });

      targetContainer.appendChild(card);
    });
  }

  function init() {
    if (lists.length > 0 && activeListId) {
      return;
    }

    loadLists();
    render();
  }

  global.shoppingLists = {
    loadLists,
    saveLists,
    createList,
    updateList,
    deleteList,
    togglePinned,
    render,
    setActiveList,
    getActiveList
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);