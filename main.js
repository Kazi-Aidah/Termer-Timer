console.log('[Main Process] Script start. Attempting to require electron...');
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
console.log('[Main Process] Successfully required electron.');

console.log('[Main Process] Attempting to require path...');
const path = require('path');
console.log('[Main Process] Successfully required path.');

// electron-store will be loaded dynamically and asynchronously in app.whenReady

function createWindow() {
  console.log('[Main Process] createWindow: Function started.');
  // Create the browser window.
  console.log('[Main Process] createWindow: Attempting to create BrowserWindow...');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.png'), // Add this line for the application icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Re-enabling for settings functionality
      contextIsolation: true,
      nodeIntegration: false // Recommended for security; use preload scripts for Node.js access in renderer
    }
  });
  console.log('[Main Process] createWindow: BrowserWindow created.');

  // Load the index.html of the app.
  console.log('[Main Process] createWindow: Attempting to loadFile("index.html")...');
  mainWindow.loadFile('index.html');
  console.log('[Main Process] createWindow: loadFile("index.html") called.');

  console.log('[Main Process] createWindow: Attempting to setMenu(null)...');
  mainWindow.setMenu(null); // Add this line to remove the menu bar
  console.log('[Main Process] createWindow: setMenu(null) called.');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  console.log('[Main Process] createWindow: Function finished.');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  let store; // Declared here to be accessible by IPC handlers within this block
  console.log('[Main Process] app.whenReady: Event triggered.'); // Original log preserved

  // Set app name for notifications
  app.setAppUserModelId('com.termer.app');
  app.setName('Termer');

  console.log('[Main Process] Attempting to dynamically import electron-store...');
  try {
    const { default: Store } = await import('electron-store');
    console.log('[Main Process] Successfully dynamically imported electron-store.');
    store = new Store(); // Initialize the store
    console.log('[Main Process] Successfully instantiated electron-store. Store object:', store ? 'OK' : 'Failed');
  } catch (error) {
    console.error('[Main Process] Critical error: Failed to load or instantiate electron-store. App will exit.', error);
    app.quit(); // Quit if store is essential for the app to run
    return;     // Stop further execution in this whenReady block
  }

  // The 'store' variable is now initialized and accessible to the rest of the code in this block,
  // including the IPC handlers defined further down (e.g., 'get-settings', 'set-settings').
  // These IPC handlers should now correctly use the asynchronously loaded 'store'.
  console.log('[Main Process] app.whenReady: Calling createWindow()...');
  createWindow();
  console.log('[Main Process] app.whenReady: createWindow() returned.');

  console.log('[Main Process] app.whenReady: Setting up "activate" event listener...');
  app.on('activate', function () {
    console.log('[Main Process] "activate" event triggered.');
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Main Process] "activate": No windows open, calling createWindow().');
      createWindow();
      console.log('[Main Process] "activate": createWindow() returned.');
    }
  });
  console.log('[Main Process] app.whenReady: "activate" event listener set up.');

  // IPC handler to get settings
  console.log('[Main Process] app.whenReady: Setting up "get-settings" IPC handler...');
  ipcMain.handle('get-settings', async (event) => {
    console.log('[Main Process] IPC get-settings: Handler invoked. Retrieving settings. Current store:', store.store);
    const settings = store.store;
    console.log('[Main Process] IPC get-settings: Returning settings.');
    return settings; // Returns the entire settings object
  });
  console.log('[Main Process] app.whenReady: "get-settings" IPC handler set up.');

  // IPC handler to set settings
  console.log('[Main Process] app.whenReady: Setting up "set-settings" IPC handler...');
  ipcMain.on('set-settings', async (event, settings) => {
    console.log('[Main Process] IPC set-settings: Handler invoked. Received settings to save:', settings);
    store.set(settings); // Sets the entire settings object
    console.log('[Main Process] IPC set-settings: Settings saved. Current store:', store.store);
  });
  console.log('[Main Process] app.whenReady: "set-settings" IPC handler set up.');

  // IPC handler to show desktop notifications
  console.log('[Main Process] app.whenReady: Setting up "show-notification" IPC handler...');
  ipcMain.handle('show-notification', async (event, options) => {
    console.log('[Main Process] IPC show-notification: Handler invoked. Options:', options);
    
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: options.title || 'Termer - Timer Finished',
          body: options.body || 'Your timer has completed!',
          icon: path.join(__dirname, 'icon.png'),
          sound: true,
          urgency: 'critical',
          silent: false
        });
        
        notification.show();
        
        // Handle notification click to focus the app window
        notification.on('click', () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            const mainWindow = windows[0];
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          }
        });
        
        console.log('[Main Process] IPC show-notification: Notification shown successfully');
        return { success: true };
      } else {
        console.log('[Main Process] IPC show-notification: Notifications not supported');
        return { success: false, error: 'Notifications not supported' };
      }
    } catch (error) {
      console.error('[Main Process] IPC show-notification: Error showing notification:', error);
      return { success: false, error: error.message };
    }
  });
  console.log('[Main Process] app.whenReady: "show-notification" IPC handler set up.');

  console.log('[Main Process] app.whenReady: All setup complete in this block.');
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Optional: A basic preload script example (create preload.js if you use this)
/*
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Example: expose a function to send a message to main process
  // sendMessage: (message) => ipcRenderer.send('message-from-renderer', message)
})
*/