import { app, BrowserWindow } from "electron";
import path from "path";

const isDev = !app.isPackaged;
const PORT = 3001;

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Set env vars BEFORE importing server (which initializes the DB)
  if (!isDev) {
    const userDataPath = app.getPath("userData");
    process.env.VOICETEX_DB_PATH = path.join(userDataPath, "voicetex.db");
    process.env.NODE_ENV = "production";
    process.env.VOICETEX_DIST_PATH = path.join(process.resourcesPath, "dist");
  }

  // Dynamic import so env vars are set before DB initialization
  const { startServer } = await import("../server/index.js");
  await startServer(PORT);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "VoiceTeX",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
