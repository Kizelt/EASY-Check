// index.js - Point d'entrée principal de l'application

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Création de la fenêtre principale
let mainWindow;
let store; // Nous initialiserons cela plus tard

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'src/assets/icon.png')
  });

  // Charger le fichier HTML principal
  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // Ouvrir les DevTools en développement
  // mainWindow.webContents.openDevTools();

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialiser l'application quand elle est prête
app.whenReady().then(async () => {
  // Importer dynamiquement electron-store
  try {
    const { default: Store } = await import('electron-store');
    store = new Store();
    console.log('Store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Store:', error);
    // Continuer même si le store échoue, ce n'est pas critique pour le fonctionnement de base
  }
  
  createWindow();

  app.on('activate', () => {
    // Sur macOS, récréer une fenêtre si le dock est cliqué et qu'aucune fenêtre n'existe
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitter l'application quand toutes les fenêtres sont fermées (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handler pour la sélection de dossiers
ipcMain.handle('select-folders', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections']
  });
  return result;
});

// Handler pour l'exportation Excel
ipcMain.handle('export-excel', async (event, data) => {
  try {
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Excel Report',
      defaultPath: path.join(app.getPath('documents'), 'EASY-Check-Report.xlsx'),
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (savePath.canceled) {
      return { success: false, message: 'Export cancelled' };
    }

    // Importer le module d'exportation Excel
    const excelExporter = require('./src/utils/excelExporter');
    
    // Exporter les données vers Excel
    await excelExporter.exportToExcel(data, savePath.filePath);
    
    return { success: true, path: savePath.filePath };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, message: error.message };
  }
});
