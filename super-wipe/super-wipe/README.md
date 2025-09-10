# TrustWipe - Secure Drive Sanitization Tool

A comprehensive Electron-based application for securely wiping drives with NIST 800-88 compliance, featuring enhanced security, logging, and cross-platform support.

## Features

### 🔒 Security Features
- **Input Validation**: Comprehensive validation for all user inputs
- **Rate Limiting**: Prevents abuse with configurable attempt limits
- **Authentication**: Secure username/password authentication
- **Confirmation Dialogs**: User confirmation before destructive operations
- **Audit Logging**: Complete operation logging for compliance

### 🖥️ Cross-Platform Support
- **Windows**: PowerShell-based wiping with cipher and custom overwrite
- **Linux**: Native hdparm/nvme-cli support for hardware-level sanitization
- **macOS**: Limited support (development mode)

### 🧹 Wipe Methods
- **Sanitize**: Hardware-level sanitization using ATA/NVMe commands
- **Overwrite**: Software-based zero-fill overwrite

### 📊 Enhanced Backend
- **Real-time Drive Detection**: Automatic drive enumeration and filtering
- **Progress Monitoring**: Real-time operation status updates
- **Error Handling**: Comprehensive error handling and recovery
- **Logging System**: Detailed audit trails for compliance

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd super-wipe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Usage

### Basic Operation
1. Launch the application
2. Select a target drive from the dropdown
3. Choose a wipe method (Sanitize or Overwrite)
4. Enter authentication credentials
5. Confirm the operation
6. Monitor progress in the status area

### Authentication
- **Username**: `admin`
- **Password**: `password123`

*Note: Change these credentials in production environments*

### Wipe Methods

#### Sanitize (Recommended)
- Uses hardware-level ATA/NVMe sanitization commands
- Faster and more secure
- Requires drive support for sanitization commands
- NIST 800-88 compliant

#### Overwrite
- Software-based zero-fill overwrite
- Works on all drives
- Slower but more universally compatible
- Progress monitoring available

## Backend Architecture

### Main Process (`src/main.js`)
- **IPC Handlers**: Secure communication between renderer and main process
- **Drive Detection**: Real-time drive enumeration using `drivelist`
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: Prevents abuse with configurable limits
- **Logging**: Centralized logging system with file output
- **Security**: Authentication and confirmation dialogs

### Preload Script (`src/preload.js`)
- **Context Bridge**: Secure API exposure to renderer
- **Channel Validation**: Whitelist-based IPC channel management
- **Security**: Prevents unauthorized access to Node.js APIs

### Wipe Scripts
- **Linux** (`wipe_linux.sh`): Enhanced bash script with logging and validation
- **Windows** (`wipe_windows.ps1`): PowerShell script with comprehensive error handling

## Security Considerations

### Input Validation
- Drive path format validation
- Username/password format checking
- Method validation against whitelist
- Length and character restrictions

### Rate Limiting
- Maximum 3 attempts per 5-minute window
- Per-client tracking
- Automatic cleanup of old attempts

### Logging
- All operations logged with timestamps
- Sensitive data redacted in logs
- Log files stored in `logs/` directory
- Audit trail for compliance

### Authentication
- Hardcoded credentials (change in production)
- Session-based rate limiting
- Failed attempt tracking

## File Structure

```
super-wipe/
├── src/
│   ├── main.js          # Main Electron process
│   ├── preload.js       # Preload script for security
│   ├── renderer.js      # Frontend logic
│   └── styles/
│       └── index.css    # Application styles
├── logs/                # Log files (created at runtime)
├── wipe_linux.sh        # Linux wipe script
├── wipe_windows.ps1     # Windows wipe script
├── package.json         # Dependencies and scripts
├── index.html           # Main application UI
└── README.md           # This file
```

## Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Electron 25+

### Scripts
- `npm start`: Start the application in development mode
- `npm run build`: Build the application for distribution

### Environment Variables
- `NODE_ENV=development`: Enables development features (DevTools)

## Compliance

This tool is designed to meet NIST 800-88 guidelines for media sanitization:
- **Clear**: Basic file deletion
- **Purge**: Overwrite with zeros
- **Destroy**: Physical destruction (not implemented)

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure the application is run with appropriate privileges
   - On Linux, the user may need sudo access for drive operations

2. **Drive Not Detected**
   - Check if the drive is properly connected
   - Ensure the drive is not in use by other applications

3. **Wipe Operation Fails**
   - Check the log files in the `logs/` directory
   - Verify drive permissions and availability
   - Ensure required tools (hdparm, nvme-cli) are installed on Linux

### Log Files
- Application logs: `logs/app.log`
- Wipe operation logs: `/tmp/wipe_*.log` (Linux) or `%TEMP%\wipe_*.log` (Windows)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review log files for error details
3. Create an issue with detailed information

---

**⚠️ Warning**: This tool permanently destroys data. Always verify the target drive before proceeding. Use in a controlled environment and ensure you have proper backups of important data.