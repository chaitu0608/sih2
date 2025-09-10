# TrustWipe Troubleshooting Guide

## Common Issues and Solutions

### 1. Native Module Compilation Error

**Error:** `Module did not self-register: drivelist.node`

**Cause:** The drivelist native module needs to be compiled for Electron's specific Node.js version.

**Solutions:**

#### Option A: Install Python and Build Tools (Recommended)

**macOS:**
```bash
# Install Xcode command line tools
xcode-select --install

# Install Python (if not already installed)
brew install python

# Rebuild native modules
npm install --build-from-source
npx electron-rebuild
```

**Linux (Ubuntu/Debian):**
```bash
# Install build tools
sudo apt update
sudo apt install build-essential python3 python3-pip

# Rebuild native modules
npm install --build-from-source
npx electron-rebuild
```

**Windows:**
```bash
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Install Python
# Download from: https://www.python.org/downloads/

# Rebuild native modules
npm install --build-from-source
npx electron-rebuild
```

#### Option B: Use Alternative Drive Detection

If native module compilation continues to fail, you can use a fallback method:

1. **Edit `src/main.js`** and replace the drivelist import with a fallback:

```javascript
// Replace this line:
const drivelist = require("drivelist");

// With this fallback:
let drivelist;
try {
  drivelist = require("drivelist");
} catch (error) {
  console.warn("drivelist not available, using fallback");
  drivelist = {
    list: async () => {
      // Fallback drive detection
      return [
        {
          device: "/dev/sda",
          description: "Fallback Drive",
          size: 1000000000,
          isSystem: false,
          isRemovable: true
        }
      ];
    }
  };
}
```

2. **Update the drive detection handler** in `src/main.js`:

```javascript
// In the get-drives handler, add error handling:
ipcMain.on("get-drives", async (event) => {
  try {
    log("INFO", "Fetching drive list");
    const drives = await drivelist.list();
    
    // Rest of the code remains the same...
  } catch (error) {
    log("ERROR", "Failed to fetch drives, using fallback", { error: error.message });
    
    // Fallback drive list
    const fallbackDrives = [
      {
        name: "Fallback Drive (Manual Selection Required)",
        path: "/dev/sda",
        size: "Unknown",
        mountpoint: "N/A",
        isRemovable: true,
      }
    ];
    
    event.sender.send("drives-list", fallbackDrives);
  }
});
```

### 2. Permission Errors

**Error:** Permission denied when running wipe scripts

**Solutions:**

**Linux/macOS:**
```bash
# Make scripts executable
chmod +x wipe_linux.sh

# Run with proper permissions
sudo ./wipe_linux.sh /dev/sda sanitize admin password123
```

**Windows:**
```powershell
# Run PowerShell as Administrator
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the script
powershell -ExecutionPolicy Bypass -File wipe_windows.ps1 -Drive "C:\" -Method "sanitize" -Username "admin" -Password "password123"
```

### 3. Application Won't Start

**Error:** Electron application fails to launch

**Solutions:**

1. **Check Node.js version:**
```bash
node --version  # Should be 16+
```

2. **Clear cache and reinstall:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

3. **Try development mode:**
```bash
npm run dev
```

4. **Check for port conflicts:**
```bash
# Kill any existing Electron processes
pkill -f electron
```

### 4. Drive Detection Issues

**Error:** No drives detected or incorrect drive information

**Solutions:**

1. **Check system permissions:**
```bash
# Linux/macOS - check if user can access /dev
ls -la /dev/sd*

# Windows - check disk management
diskmgmt.msc
```

2. **Manual drive specification:**
   - Edit the drive list manually in the application
   - Use absolute paths for drives

3. **Test with different drives:**
   - Try USB drives
   - Try different drive letters/paths

### 5. Wipe Operation Failures

**Error:** Wipe operations fail or hang

**Solutions:**

1. **Check drive permissions:**
```bash
# Ensure drive is not mounted
sudo umount /dev/sda

# Check if drive is in use
lsof /dev/sda
```

2. **Verify required tools:**
```bash
# Linux
which hdparm nvme pv

# Install missing tools
sudo apt install hdparm nvme-cli pv
```

3. **Test with smaller drives first:**
   - Use USB drives for testing
   - Start with drives under 10GB

### 6. Build Failures

**Error:** `npm run build` fails

**Solutions:**

1. **Check Electron Builder:**
```bash
npm install -g electron-builder
```

2. **Clear build cache:**
```bash
rm -rf dist/ build/
npm run build
```

3. **Platform-specific builds:**
```bash
# Build for current platform only
npm run build -- --dir

# Build for specific platform
npm run build -- --win --linux --mac
```

### 7. Test Failures

**Error:** `npm test` fails

**Solutions:**

1. **Check test environment:**
```bash
# Ensure all dependencies are installed
npm install

# Run tests individually
node test-backend.js
```

2. **Fix configuration issues:**
   - Check `config.json` syntax
   - Verify file permissions

3. **Update test expectations:**
   - Some tests may fail on different platforms
   - Check test output for specific failures

## Getting Help

### Debug Mode

Run the application with debug information:

```bash
# Enable debug logging
DEBUG=* npm start

# Or with Electron debug
npm run dev
```

### Log Files

Check these locations for error information:

- **Application logs:** `logs/app.log`
- **System logs:** 
  - Linux: `journalctl -f`
  - macOS: Console.app
  - Windows: Event Viewer

### Support Information

When reporting issues, include:

1. **System information:**
```bash
node --version
npm --version
uname -a  # Linux/macOS
systeminfo  # Windows
```

2. **Error messages:** Full error output
3. **Log files:** Relevant log entries
4. **Steps to reproduce:** What you were doing when the error occurred

## Quick Fixes

### Reset Everything
```bash
# Complete reset
rm -rf node_modules package-lock.json logs/
npm install
npm test
npm start
```

### Minimal Test
```bash
# Test just the backend
node test-backend.js

# Test just the utilities
node -e "const utils = require('./src/utils'); console.log(utils.getSystemInfo());"
```

### Alternative Installation
```bash
# Use yarn instead of npm
npm install -g yarn
yarn install
yarn start
```

---

**Still having issues?** Check the logs in `logs/app.log` and review the specific error messages for more detailed troubleshooting information.
