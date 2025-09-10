# TrustWipe Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 16+ installed
- Terminal/Command Prompt access

### Step 1: Run Setup Script

**Linux/macOS:**
```bash
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

### Step 2: Start the Application

```bash
npm start
```

### Step 3: Test the Application

1. **Verify OS Detection**: Should show your operating system
2. **Check Drive List**: Should display available drives
3. **Test Authentication**: Use `admin` / `password123`
4. **⚠️ IMPORTANT**: Only test with non-critical drives (USB drives, etc.)

## 🔧 Quick Commands

```bash
# Development mode (with DevTools)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Install dependencies
npm install
```

## ⚠️ Safety First

- **NEVER** test on system drives
- **ALWAYS** use USB drives or secondary drives for testing
- **CHANGE** default credentials before production use
- **BACKUP** important data before any wipe operations

## 📚 Documentation

- **README.md**: General information and features
- **IMPLEMENTATION_GUIDE.md**: Detailed setup instructions
- **BACKEND_SUMMARY.md**: Technical architecture overview

## 🆘 Troubleshooting

### Common Issues

**Dependencies not installing:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Permission errors (Linux/macOS):**
```bash
chmod +x wipe_linux.sh
sudo chown -R $USER:$USER .
```

**Application won't start:**
```bash
npm test  # Check if tests pass
npm run dev  # Try development mode
```

### Getting Help

1. Check the logs in `logs/app.log`
2. Run `npm test` to verify backend functionality
3. Review the IMPLEMENTATION_GUIDE.md for detailed troubleshooting

## 🎯 What's Next?

1. **Customize Configuration**: Edit `config.json` for your needs
2. **Change Credentials**: Update authentication settings
3. **Test Thoroughly**: Use non-critical drives for testing
4. **Deploy**: Build and distribute your application

---

**Ready to go? Run `./setup.sh` (Linux/macOS) or `setup.bat` (Windows) to get started!**
