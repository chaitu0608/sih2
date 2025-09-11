# Super Wipe — USB Plug‑and‑Play Drive Sanitizer (Windows & Linux)

An Electron desktop app that securely wipes external USB drives. Designed for plug‑and‑play use on Windows and Linux with strong safety checks, confirmations, and audit logging. Ideal for field technicians and IT admins who need a simple, consistent workflow.

## Why this tool?

- **USB‑focused**: Detects attached removable/USB drives for safer selection.
- **Cross‑platform**: Windows (PowerShell) and Linux (bash) support.
- **Two wipe modes**: Hardware sanitize (ATA/NVMe) or software overwrite (zeros).
- **Built‑in safety**: Input validation, confirmations, rate limiting, and logging.

## Quick Start

1. Clone and install
   ```bash
   git clone <your-repo-url>
   cd sih2/super-wipe/super-wipe
   npm install
   ```
2. Run
   ```bash
   npm start
   ```
3. Plug in a USB drive, select it, choose a method, authenticate, and confirm.

## Usage

1. Plug in the target USB drive.
2. Launch the app and select the drive from the list.
3. Choose a method:
   - **Sanitize**: Uses `hdparm`/`nvme-cli` on Linux, `cipher /w` on Windows for free‑space wipe.
   - **Overwrite**: Zero‑fill overwrite (works broadly; may be slower).
4. Enter credentials when prompted:
   - Username: `admin`
   - Password: `password123`
   - Note: Change these for production deployments.
5. Confirm in the warning dialog. Monitor status and logs.

## Requirements

- Node.js 16+
- Windows 10/11 or Linux with `bash`
- Linux: `hdparm` and/or `nvme-cli` for sanitize; `pv` optional for progress

## Features

- **Drive detection**: Enumerates drives and prioritizes removable/USB devices.
- **Safety controls**: Validation, confirmation dialog, attempt rate limiting.
- **Audit logs**: App logs in `logs/app.log`; script logs in temp directories.
- **Renderer isolation**: Secure IPC via a preload bridge.

## Scripts

- `npm start` — Run the Electron app
- `npm run build` — Build distributables (via electron‑builder)
- `npm test` — Run backend test harness

## Project Layout

```
super-wipe/
├─ src/
│  ├─ main.js        # Electron main process (IPC, drive list, execution)
│  ├─ preload.js     # Context bridge for secure IPC
│  ├─ renderer.js    # UI logic (drive/method selection, status)
│  └─ styles/
│     └─ index.css
├─ wipe_linux.sh     # Linux wipe script (sanitize/overwrite)
├─ wipe_windows.ps1  # Windows wipe script (cipher/overwrite)
├─ logs/             # Runtime logs
├─ index.html
├─ package.json
└─ README.md
```

## Security Notes

- The app prompts for confirmation before destructive actions.
- Credentials are currently hardcoded for demo; update in production.
- Logs redact sensitive fields in the Electron layer.

## Compliance

Implements wipe strategies aligned with NIST 800‑88:
- **Purge/Sanitize**: Hardware sanitization where supported (Linux).
- **Clear/Overwrite**: Zero‑fill overwrite.

## Troubleshooting

- On Linux, run with sufficient privileges for `hdparm`/`nvme` and `dd`.
- Ensure the target drive is not mounted or in use.
- Check logs:
  - App: `logs/app.log`
  - Linux: `/tmp/wipe_*.log`
  - Windows: `%TEMP%\wipe_*.log`

## License

MIT

---

⚠️ Warning: This tool permanently destroys data on the selected drive. Double‑check the target device and ensure backups before proceeding. Intended for controlled environments.