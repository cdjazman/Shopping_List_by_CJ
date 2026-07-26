(function (global) {
  async function exportCatalog(catalog, showConfirm, save, showMain) {
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

  function importCatalog(event, state) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          state.showConfirm("This will overwrite your current catalogue with the backup file. Continue?", (confirmed) => {
            if (confirmed) {
              state.setCatalog(importedData);
              state.save();
              state.showMain();
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
