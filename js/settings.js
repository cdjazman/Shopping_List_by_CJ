(function (global) {
  const APP_NAME = 'Shopping List by CJ';
  const BACKUP_VERSION = 1;
  const REQUIRED_KEYS = ['grocery-catalog', 'shopping-lists'];
  const KNOWN_KEYS = ['grocery-catalog', 'shopping-lists', 'shopping-lists-active', 'shopping-active-list'];
  const APP_KEY_PREFIXES = ['shopping-', 'grocery-'];

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function buildBackupFileName(date) {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `ShoppingListByCJ_Backup_${year}-${month}-${day}_${hours}${minutes}.json`;
  }

  function shouldIncludeStorageKey(key) {
    if (!key) return false;
    if (KNOWN_KEYS.includes(key)) return true;
    return APP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  function parseStorageValue(rawValue) {
    if (typeof rawValue !== 'string') return rawValue;

    try {
      return JSON.parse(rawValue);
    } catch (e) {
      return rawValue;
    }
  }

  function serializeStorageValue(value) {
    if (value == null) return null;
    if (typeof value === 'string') return value;

    try {
      return JSON.stringify(value);
    } catch (e) {
      return null;
    }
  }

  function collectStorageData(storage) {
    const exported = {};

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!shouldIncludeStorageKey(key)) continue;
      exported[key] = parseStorageValue(storage.getItem(key));
    }

    KNOWN_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(exported, key)) return;
      const value = storage.getItem(key);
      if (value != null) {
        exported[key] = parseStorageValue(value);
      }
    });

    return exported;
  }

  function validateBackupPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return 'Invalid backup file. Expected a backup object.';
    }

    if (!payload.appName || typeof payload.appName !== 'string') {
      return 'Invalid backup file. Missing app name metadata.';
    }

    if (payload.appName !== APP_NAME) {
      return 'Invalid backup file. This backup was not created for Shopping List by CJ.';
    }

    if (payload.backupVersion == null) {
      return 'Invalid backup file. Missing backup version.';
    }

    if (!payload.backupDate || typeof payload.backupDate !== 'string') {
      return 'Invalid backup file. Missing backup date.';
    }

    const exportedData = payload.exportedData;
    if (!exportedData || typeof exportedData !== 'object' || Array.isArray(exportedData)) {
      return 'Invalid backup file. Missing exported data.';
    }

    const localStorageData = exportedData.localStorage;
    if (!localStorageData || typeof localStorageData !== 'object' || Array.isArray(localStorageData)) {
      return 'Invalid backup file. Missing local storage data.';
    }

    const missingRequired = REQUIRED_KEYS.filter((key) => !(key in localStorageData));
    if (missingRequired.length > 0) {
      return `Invalid backup file. Required data is missing: ${missingRequired.join(', ')}.`;
    }

    if (!Array.isArray(localStorageData['grocery-catalog'])) {
      return 'Invalid backup file. Product catalog format is not valid.';
    }

    if (!Array.isArray(localStorageData['shopping-lists'])) {
      return 'Invalid backup file. Shopping lists format is not valid.';
    }

    return null;
  }

  function replaceAppStorage(storage, importedStorageData) {
    const keysToClear = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (shouldIncludeStorageKey(key)) {
        keysToClear.push(key);
      }
    }

    keysToClear.forEach((key) => storage.removeItem(key));

    Object.entries(importedStorageData).forEach(([key, value]) => {
      if (!shouldIncludeStorageKey(key)) return;
      const serialized = serializeStorageValue(value);
      if (serialized == null) return;
      storage.setItem(key, serialized);
    });
  }

  function readFileAsText(file) {
    if (!file) return Promise.resolve('');
    if (typeof file.text === 'function') return file.text();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event?.target?.result || ''));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }

  async function exportCatalog() {
    const storage = global.localStorage;

    if (!storage) {
      alert('Backup failed: local storage is not available.');
      return;
    }

    const exportedStorage = collectStorageData(storage);
    const payload = {
      appName: APP_NAME,
      backupVersion: BACKUP_VERSION,
      backupDate: new Date().toISOString(),
      exportedData: {
        localStorage: exportedStorage
      }
    };

    const dataStr = JSON.stringify(payload, null, 2);
    const fileName = buildBackupFileName(new Date());

    if (global.showSaveFilePicker) {
      try {
        const handle = await global.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON Backup Files',
            accept: { 'application/json': ['.json'] }
          }]
        });

        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        alert('Backup saved successfully.');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
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
    alert('Backup downloaded successfully.');
  }

  async function importCatalog(event, state) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (!/\.json$/i.test(file.name || '')) {
        alert('Invalid file type. Please select a .json backup file.');
        return;
      }

      const rawContent = await readFileAsText(file);
      let parsed;

      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        alert('Backup restore failed: the JSON file appears to be corrupt.');
        return;
      }

      const validationError = validateBackupPayload(parsed);
      if (validationError) {
        alert(validationError);
        return;
      }

      const restoreMessage = 'Restore backup now? This will replace your current shopping data across lists, products, favourites, budgets, and settings.';
      state.showConfirm(restoreMessage, (confirmed) => {
        if (!confirmed) return;

        try {
          replaceAppStorage(global.localStorage, parsed.exportedData.localStorage);
          alert('Backup restored successfully. The app will now refresh.');
          if (typeof state.refreshUI === 'function') {
            state.refreshUI();
          }
        } catch (error) {
          alert('Backup restore failed: unable to import data.');
        }
      });
    } catch (error) {
      alert('Backup restore failed: unable to read the selected file.');
    } finally {
      event.target.value = '';
    }
  }

  function attachSearchStoreHandlers(buttons, onSelect) {
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn.dataset.searchstore);
      });
    });
  }

  global.shoppingListSettings = {
    exportCatalog,
    importCatalog,
    attachSearchStoreHandlers
  };
})(window);
