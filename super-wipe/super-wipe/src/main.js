const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const drivelist = require("drivelist");
const TrustWipeUtils = require("./utils");

// Initialize utilities
const utils = new TrustWipeUtils();

// Logging system
const logFile = path.join(__dirname, "..", "logs", "app.log");
const logDir = path.dirname(logFile);

// Ensure log directory exists
utils.ensureDir(logDir);

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? utils.sanitizeForLog(data) : null;
  const logEntry = `[${timestamp}] [${level}] ${message}${sanitizedData ? ` | Data: ${JSON.stringify(sanitizedData)}` : ""}\n`;
  
  console.log(logEntry.trim());
  fs.appendFileSync(logFile, logEntry);
}

// Security: Rate limiting for wipe operations
const wipeAttempts = new Map();
const MAX_ATTEMPTS = utils.getConfig('security.authentication.maxAttempts') || 3;
const ATTEMPT_WINDOW = utils.getConfig('security.authentication.attemptWindow') || 300000;

function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = wipeAttempts.get(identifier) || [];
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < ATTEMPT_WINDOW);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }
  
  recentAttempts.push(now);
  wipeAttempts.set(identifier, recentAttempts);
  return true;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "..", "assets", "icon.png"), // Optional icon
  });

  win.loadFile("index.html");
  
  // Log window creation
  log("INFO", "Application window created");
  
  // Development: Open DevTools (remove in production)
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }
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
    log("INFO", "Fetching drive list");
    const drives = await drivelist.list();
    
    // Filter and validate drives
    const validDrives = drives.filter(drive => {
      return drive.device && 
             drive.description && 
             drive.size > 0 && 
             !drive.isSystem; // Exclude system drives
    });
    
    const driveList = validDrives.map((drive) => ({
      name: drive.description || "Unknown Drive",
      path: drive.device,
      size: drive.size ? `${(drive.size / 1e9).toFixed(2)} GB` : "Unknown",
      mountpoint: drive.mountpoints?.[0]?.path || "N/A",
      isRemovable: drive.isRemovable || false,
    }));
    
    log("INFO", `Found ${driveList.length} valid drives`);
    event.sender.send("drives-list", driveList);
  } catch (error) {
    log("ERROR", "Failed to fetch drives", { error: error.message });
    event.sender.send("drives-list", []);
  }
});

ipcMain.on("check-os", (event) => {
  const osType = process.platform;
  const osInfo = {
    platform: osType,
    arch: process.arch,
    version: process.version,
    supported: ["win32", "linux"].includes(osType)
  };
  
  let osName = "Unsupported OS";
  if (osType === "win32") {
    osName = "Windows";
  } else if (osType === "linux") {
    osName = "Linux";
  } else if (osType === "darwin") {
    osName = "macOS (Limited Support)";
  }
  
  log("INFO", `OS Detection: ${osName}`, osInfo);
  event.sender.send("os-detected", osName);
});

ipcMain.on("start-wipe", async (event, data) => {
  try {
    // Input validation
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format");
    }

    const { drive, method, username, password } = data;

    // Validate all inputs
    if (!utils.validateInput(drive, "drive")) {
      throw new Error("Invalid drive path");
    }
    if (!["sanitize", "overwrite"].includes(method)) {
      throw new Error("Invalid wipe method");
    }
    if (!utils.validateInput(username, "username")) {
      throw new Error("Invalid username format");
    }
    if (!utils.validateInput(password, "password")) {
      throw new Error("Invalid password format");
    }

    // Rate limiting check
    const clientId = event.sender.getURL();
    if (!checkRateLimit(clientId)) {
      throw new Error("Too many wipe attempts. Please wait before trying again.");
    }

    // Platform check
    if (!["win32", "linux"].includes(process.platform)) {
      throw new Error("Unsupported platform for wiping operations");
    }

    // Log the wipe attempt
    log("INFO", "Wipe operation initiated", {
      drive: drive,
      method: method,
      username: username,
      platform: process.platform
    });

    // Show confirmation dialog
    const result = await dialog.showMessageBox({
      type: "warning",
      title: "Confirm Drive Wipe",
      message: `Are you sure you want to wipe drive: ${drive}?`,
      detail: `This action will permanently destroy all data on the selected drive using the ${method} method. This action cannot be undone.`,
      buttons: ["Cancel", "Yes, Wipe Drive"],
      defaultId: 0,
      cancelId: 0
    });

    if (result.response === 0) {
      log("INFO", "Wipe operation cancelled by user");
      event.sender.send("wipe-status", "Wipe operation cancelled");
      return;
    }

    // Determine script path and command
    let scriptPath;
    let command;

    if (process.platform === "win32") {
      scriptPath = path.join(__dirname, "../../wipe_windows.ps1");
      if (!fs.existsSync(scriptPath)) {
        throw new Error("Windows wipe script not found");
      }
      command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Drive "${drive}" -Method "${method}" -Username "${username}" -Password "${password}"`;
    } else if (process.platform === "linux") {
      scriptPath = path.join(__dirname, "../../wipe_linux.sh");
      if (!fs.existsSync(scriptPath)) {
        throw new Error("Linux wipe script not found");
      }
      // Make script executable
      fs.chmodSync(scriptPath, "755");
      command = `bash "${scriptPath}" "${drive}" "${method}" "${username}" "${password}"`;
    }

    event.sender.send("wipe-status", `Starting wipe on ${process.platform}...`);
    log("INFO", "Executing wipe command", { command: command.replace(password, "***") });

    // Execute the wipe command with timeout
    const child = exec(command, { timeout: 3600000 }, (error, stdout, stderr) => {
      if (error) {
        log("ERROR", "Wipe operation failed", { 
          error: error.message,
          code: error.code,
          signal: error.signal
        });
        event.sender.send("wipe-status", `Error: ${error.message}`);
        return;
      }
      
      if (stderr) {
        log("WARN", "Wipe operation completed with warnings", { stderr });
        event.sender.send("wipe-status", `Completed with warnings: ${stderr}`);
        return;
      }
      
      log("INFO", "Wipe operation completed successfully", { stdout });
      event.sender.send("wipe-status", `Wipe completed successfully: ${stdout}`);
    });

    // Handle process events
    child.on("spawn", () => {
      log("INFO", "Wipe process spawned");
      event.sender.send("wipe-status", "Wipe process started...");
    });

    child.on("error", (error) => {
      log("ERROR", "Wipe process error", { error: error.message });
      event.sender.send("wipe-status", `Process error: ${error.message}`);
    });

  } catch (error) {
    log("ERROR", "Wipe operation failed", { error: error.message });
    event.sender.send("wipe-status", `Error: ${error.message}`);
  }
});

// IPC handler for system information
ipcMain.on("get-system-info", (event) => {
  try {
    const systemInfo = utils.getSystemInfo();
    systemInfo.isElevated = utils.isElevated();
    systemInfo.sessionId = utils.generateSessionId();
    
    log("INFO", "System information requested");
    event.sender.send("system-info", systemInfo);
  } catch (error) {
    log("ERROR", "Failed to get system info", { error: error.message });
    event.sender.send("system-info", { error: error.message });
  }
});

// IPC handler for drive details
ipcMain.on("get-drive-details", async (event, drivePath) => {
  try {
    if (!utils.validateInput(drivePath, "drive")) {
      throw new Error("Invalid drive path");
    }

    const drives = await drivelist.list();
    const drive = drives.find(d => d.device === drivePath);
    
    if (!drive) {
      throw new Error("Drive not found");
    }

    const driveDetails = {
      device: drive.device,
      description: drive.description,
      size: drive.size,
      sizeFormatted: utils.formatBytes(drive.size),
      mountpoints: drive.mountpoints,
      isRemovable: drive.isRemovable,
      isSystem: drive.isSystem,
      isUSB: drive.isUSB,
      isSCSI: drive.isSCSI,
      isVirtual: drive.isVirtual
    };

    // Get disk space if drive is mounted
    if (drive.mountpoints && drive.mountpoints.length > 0) {
      const mountpoint = drive.mountpoints[0].path;
      const diskSpace = utils.getDiskSpace(mountpoint);
      driveDetails.diskSpace = diskSpace;
    }

    log("INFO", "Drive details requested", { drive: drivePath });
    event.sender.send("drive-details", driveDetails);
  } catch (error) {
    log("ERROR", "Failed to get drive details", { error: error.message, drive: drivePath });
    event.sender.send("drive-details", { error: error.message });
  }
});

// IPC handler for application status
ipcMain.on("get-app-status", (event) => {
  try {
    const status = {
      isRunning: true,
      startTime: new Date().toISOString(),
      version: utils.getConfig('app.version') || '1.0.0',
      platform: process.platform,
      isElevated: utils.isElevated(),
      logFile: logFile,
      configLoaded: !!utils.config
    };

    event.sender.send("app-status", status);
  } catch (error) {
    log("ERROR", "Failed to get app status", { error: error.message });
    event.sender.send("app-status", { error: error.message });
  }
});
