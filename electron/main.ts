import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
// import { Worker } from "node:worker_threads";
import { sqDelete, sqInsert, sqQuery, sqUpdate, initSqlite } from "./sqlite";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  createWindow();
  await initSqlite();
});

ipcMain.handle("query-db", () => {
  return sqQuery({ sql: "select * from tb_xhs_collect" });
  // return new Promise((resolve, reject) => {
  //   const workerPath = path.join(__dirname, "worker.js");
  //   const worker = new Worker(workerPath);

  //   worker.postMessage("select * from tb_xhs_collect");

  //   worker.on("message", (result) => {
  //     if (result.error) {
  //       reject(result.error);
  //     } else {
  //       resolve(result);
  //     }
  //     worker.terminate();
  //   });

  //   worker.on("error", (error) => {
  //     reject(error);
  //     worker.terminate();
  //   });
  // });
});

ipcMain.handle("insert", () => {
  const timeStamp = new Date().getTime().toString();
  return sqInsert({
    table: "tb_xhs_collect",
    data: {
      note_id: timeStamp,
      display_title: timeStamp,
      desc: timeStamp,
      author_name: "mundane",
      author_id: "111",
      cover_url: "https://www.baidu.com",
      type: "1",
      liked_count: 1,
      download_status: 0,
    },
  });
});
