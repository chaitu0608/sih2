#!/bin/bash
# filepath: /Users/chaitu0608/Desktop/Trial4/wipe_linux.sh
# Secure Drive Wiping Script (Linux)
#
# Usage:
#   ./wipe_linux.sh <drive> <method> <username> <password>
# Example:
#   ./wipe_linux.sh /dev/sda sanitize admin password123
#
# Methods:
#   sanitize  → Uses hdparm/nvme-cli if supported
#   overwrite → Overwrites with zeros (dd)

set -euo pipefail

DRIVE=$1
METHOD=$2
USERNAME=$3
PASSWORD=$4

# --- Configuration ---
VALID_USER="admin"
VALID_PASS="password123"

# --- Authentication ---
if [[ "$USERNAME" != "$VALID_USER" || "$PASSWORD" != "$VALID_PASS" ]]; then
  echo "[ERROR] Invalid username or password." >&2
  exit 1
fi
echo "[INFO] Authentication successful."

# --- Input Validation ---
if [[ ! -b "$DRIVE" ]]; then
  echo "[ERROR] $DRIVE is not a valid block device." >&2
  exit 1
fi

if [[ "$METHOD" != "sanitize" && "$METHOD" != "overwrite" ]]; then
  echo "[ERROR] Invalid method. Use 'sanitize' or 'overwrite'." >&2
  exit 1
fi

# --- Wipe Logic ---
case $METHOD in
  sanitize)
    echo "[ACTION] Sanitizing $DRIVE ..."
    if command -v hdparm &>/dev/null; then
      sudo hdparm --user-master u --security-set-pass p $DRIVE
      sudo hdparm --user-master u --security-erase p $DRIVE
    elif command -v nvme &>/dev/null; then
      sudo nvme sanitize $DRIVE --sanitize-type=1 --ause
    else
      echo "[ERROR] No supported sanitize tool (hdparm/nvme-cli) found." >&2
      exit 1
    fi
    ;;
  
  overwrite)
    echo "[ACTION] Overwriting $DRIVE with zeros (this may take hours)..."
    sudo dd if=/dev/zero of=$DRIVE bs=1M status=progress || {
      echo "[ERROR] Overwrite failed." >&2
      exit 1
    }
    sync
    ;;
esac

echo "[SUCCESS] Wipe completed for $DRIVE using '$METHOD' method."
