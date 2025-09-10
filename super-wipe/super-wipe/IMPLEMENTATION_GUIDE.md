# TrustWipe Implementation Guide

## Step-by-Step Build and Deployment Guide

This guide will walk you through building, testing, and deploying the TrustWipe application from scratch.

## Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Disk Space**: At least 500MB free space
- **Memory**: Minimum 4GB RAM

### Required Tools
- **Git** (for version control)
- **Text Editor** (VS Code recommended)
- **Terminal/Command Prompt**

## Step 1: Environment Setup

### 1.1 Install Node.js
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
# Or use package manager:

# macOS (with Homebrew)
brew install node

# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Windows (with Chocolatey)
choco install nodejs
```

### 1.2 Verify Installation
```bash
node --version  # Should show v16.x.x or higher
npm --version   # Should show 7.x.x or higher
```

## Step 2: Project Setup

### 2.1 Navigate to Project Directory
```bash
cd /Users/chaitu0608/Desktop/trialtrial/sih2/super-wipe/super-wipe
```

### 2.2 Install Dependencies
```bash
# Install all required packages
npm install

# This will install:
# - electron@^25.0.0
# - drivelist@^9.2.4
# - electron-builder@^24.0.0 (dev dependency)
```

### 2.3 Verify Installation
```bash
# Check if node_modules exists
ls -la node_modules/

# Verify package.json
cat package.json
```

## Step 3: Configuration Setup

### 3.1 Review Configuration
```bash
# Check the configuration file
cat config.json
```

### 3.2 Customize Settings (Optional)
Edit `config.json` to customize:
- Authentication credentials
- Logging levels
- UI preferences
- Security settings

```json
{
  "security": {
    "authentication": {
      "username": "your_username",
      "password": "your_secure_password"
    }
  }
}
```

## Step 4: Testing the Backend

### 4.1 Run Backend Tests
```bash
# Run the comprehensive test suite
npm test

# Expected output:
# TrustWipe Backend Test Suite
# ============================
# Tests Passed: 23/23 (100%)
# ✅ All tests passed! Backend is ready.
```

### 4.2 Verify Test Results
If tests fail, check:
- Node.js version compatibility
- File permissions
- Dependencies installation

## Step 5: Development Mode

### 5.1 Start Development Server
```bash
# Start in development mode (with DevTools)
npm run dev

# Or start normally
npm start
```

### 5.2 Verify Application Launch
The application should:
- Open a window (1000x700 pixels)
- Show "TrustWipe" interface
- Display "Detected OS: [Your OS]"
- Show available drives in dropdown

### 5.3 Test Basic Functionality
1. **Check OS Detection**: Should show your operating system
2. **Drive Detection**: Should list available drives
3. **UI Responsiveness**: Buttons and dropdowns should work
4. **Console Logs**: Check for any errors in DevTools console

## Step 6: Production Build

### 6.1 Build for Current Platform
```bash
# Build for your current platform
npm run build

# This creates:
# - dist/ folder with packaged application
# - Platform-specific installer
```

### 6.2 Build for Multiple Platforms
```bash
# Build for Windows (from any platform)
npm run build -- --win

# Build for macOS (from any platform)
npm run build -- --mac

# Build for Linux (from any platform)
npm run build -- --linux
```

### 6.3 Verify Build Output
```bash
# Check dist folder
ls -la dist/

# Should contain:
# - Application executable
# - Installer package
# - Platform-specific files
```

## Step 7: Platform-Specific Setup

### 7.1 Linux Setup
```bash
# Make wipe script executable
chmod +x wipe_linux.sh

# Install required tools (if not present)
sudo apt update
sudo apt install hdparm nvme-cli pv

# Test script manually (optional)
./wipe_linux.sh /dev/sda sanitize admin password123
```

### 7.2 Windows Setup
```bash
# PowerShell execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Test script manually (optional)
powershell -ExecutionPolicy Bypass -File wipe_windows.ps1 -Drive "C:\" -Method "sanitize" -Username "admin" -Password "password123"
```

### 7.3 macOS Setup
```bash
# macOS has limited support
# Ensure you have proper permissions for drive access
# May need to run with sudo for drive operations
```

## Step 8: Security Configuration

### 8.1 Change Default Credentials
```bash
# Edit config.json
nano config.json

# Change these values:
{
  "security": {
    "authentication": {
      "username": "your_secure_username",
      "password": "your_secure_password"
    }
  }
}
```

### 8.2 Set File Permissions
```bash
# Linux/macOS - Secure the scripts
chmod 600 wipe_linux.sh
chmod 600 config.json

# Windows - Use proper file permissions
# Right-click files → Properties → Security → Advanced
```

### 8.3 Configure Logging
```bash
# Create logs directory
mkdir -p logs

# Set appropriate permissions
chmod 755 logs/
```

## Step 9: Testing the Complete Application

### 9.1 Functional Testing
```bash
# Start the application
npm start

# Test scenarios:
# 1. Select a non-system drive
# 2. Choose wipe method
# 3. Enter credentials
# 4. Confirm operation
# 5. Monitor progress
```

### 9.2 Safety Testing
```bash
# IMPORTANT: Test with a non-critical drive first!
# Use a USB drive or secondary drive for testing

# Test with a small partition or USB drive
# Never test on system drives or drives with important data
```

### 9.3 Error Handling Testing
```bash
# Test error scenarios:
# 1. Invalid credentials
# 2. Non-existent drive
# 3. Insufficient permissions
# 4. Network interruptions
```

## Step 10: Deployment

### 10.1 Create Distribution Package
```bash
# Build final distribution
npm run build

# Package for distribution
# The dist/ folder contains your distributable application
```

### 10.2 Create Installation Package
```bash
# For Windows
npm run build -- --win --publish=never

# For macOS
npm run build -- --mac --publish=never

# For Linux
npm run build -- --linux --publish=never
```

### 10.3 Verify Installation
```bash
# Test the installer
# Install the application on a test system
# Verify all functionality works after installation
```

## Step 11: Monitoring and Maintenance

### 11.1 Log Monitoring
```bash
# Check application logs
tail -f logs/app.log

# Check system logs for errors
# Linux: journalctl -f
# Windows: Event Viewer
# macOS: Console.app
```

### 11.2 Performance Monitoring
```bash
# Monitor system resources during wipe operations
# Check CPU, memory, and disk usage
# Ensure system stability during long operations
```

### 11.3 Security Updates
```bash
# Regularly update dependencies
npm audit
npm audit fix

# Update Electron and other packages
npm update
```

## Troubleshooting

### Common Issues

#### 1. Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Permission Errors
```bash
# Linux/macOS
sudo chown -R $USER:$USER .
chmod +x wipe_linux.sh

# Windows
# Run as Administrator
```

#### 3. Drive Detection Issues
```bash
# Check if drivelist is working
node -e "const drivelist = require('drivelist'); drivelist.list().then(console.log);"

# Verify drive permissions
ls -la /dev/sd*
```

#### 4. Wipe Script Errors
```bash
# Check script permissions
ls -la wipe_linux.sh

# Test script manually
bash -x wipe_linux.sh /dev/sda sanitize admin password123
```

#### 5. Build Failures
```bash
# Check Node.js version
node --version

# Update build tools
npm install -g electron-builder

# Clear build cache
rm -rf dist/ build/
```

## Production Checklist

### Before Deployment
- [ ] All tests pass (npm test)
- [ ] Default credentials changed
- [ ] Logging configured
- [ ] File permissions set
- [ ] Platform-specific tools installed
- [ ] Security settings reviewed
- [ ] Backup procedures in place

### After Deployment
- [ ] Application launches successfully
- [ ] Drive detection works
- [ ] Authentication functions
- [ ] Wipe operations complete
- [ ] Logs are generated
- [ ] Error handling works
- [ ] Performance is acceptable

## Support and Maintenance

### Regular Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies
3. **Quarterly**: Security audit
4. **Annually**: Full system review

### Backup Procedures
1. **Configuration**: Backup config.json
2. **Logs**: Archive old log files
3. **Scripts**: Version control wipe scripts
4. **Dependencies**: Lock package versions

## Emergency Procedures

### If Application Fails
1. Check logs in `logs/app.log`
2. Verify system permissions
3. Test with minimal configuration
4. Rollback to previous version

### If Wipe Operation Fails
1. Check system logs
2. Verify drive permissions
3. Test with different drive
4. Review wipe script output

---

## Quick Start Commands

```bash
# Complete setup in one go
cd /Users/chaitu0608/Desktop/trialtrial/sih2/super-wipe/super-wipe
npm install
npm test
npm start
```

This guide provides everything needed to build, test, and deploy the TrustWipe application successfully.
