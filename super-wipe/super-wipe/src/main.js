const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const drivelist = require("drivelist");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler to fetch real-time drives
ipcMain.on("get-drives", async (event) => {
  try {
    const drives = await drivelist.list();
    const driveList = drives.map((drive) => ({
      name: drive.description,
      path: drive.device,
      size: drive.size ? `${(drive.size / 1e9).toFixed(2)} GB` : "Unknown",
    }));
    event.sender.send("drives-list", driveList);
  } catch (error) {
    console.error("Error fetching drives:", error);
    event.sender.send("drives-list", []);
  }
});

ipcMain.on("check-os", (event) => {
  const osType = process.platform; // 'win32' for Windows, 'linux' for Linux
  if (osType === "win32") {
    event.sender.send("os-detected", "Windows");
  } else if (osType === "linux") {
    event.sender.send("os-detected", "Linux");
  } else {
    event.sender.send("os-detected", "Unsupported OS");
  }
});

ipcMain.on("start-wipe", (event, data) => {
  const { drive, method, username, password } = data;
  let scriptPath;
  let command;

  if (process.platform === "win32") {
    scriptPath = path.join(__dirname, "../../wipe_windows.ps1");
    command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Drive "${drive}" -Method "${method}" -Username "${username}" -Password "${password}"`;
  } else if (process.platform === "linux") {
    scriptPath = path.join(__dirname, "../../wipe_linux.sh");
    command = `bash "${scriptPath}" "${drive}" "${method}" "${username}" "${password}"`;
  } else {
    event.sender.send("wipe-status", "Unsupported platform for wiping.");
    return;
  }

  event.sender.send("wipe-status", `Starting wipe on ${process.platform}...`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      event.sender.send("wipe-status", `Error: ${error.message}`);
      return;
    }
    if (stderr) {
      event.sender.send("wipe-status", `Stderr: ${stderr}`);
      return;
    }
    event.sender.send("wipe-status", `Wipe completed: ${stdout}`);
  });
});
