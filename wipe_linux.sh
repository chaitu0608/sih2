#!/bin/bash
# Secure Drive Wiping Script (Linux)
# Enhanced version with better error handling and security
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

# --- Configuration ---
VALID_USER="admin"
VALID_PASS="password123"
LOG_FILE="/tmp/wipe_$(date +%Y%m%d_%H%M%S).log"

# --- Logging Function ---
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# --- Input Validation ---
if [[ $# -ne 4 ]]; then
    log "ERROR" "Usage: $0 <drive> <method> <username> <password>"
    exit 1
fi

DRIVE="$1"
METHOD="$2"
USERNAME="$3"
PASSWORD="$4"

# Validate drive path format
if [[ ! "$DRIVE" =~ ^/dev/[a-zA-Z0-9]+$ ]]; then
    log "ERROR" "Invalid drive path format: $DRIVE"
    exit 1
fi

# Validate method
if [[ "$METHOD" != "sanitize" && "$METHOD" != "overwrite" ]]; then
    log "ERROR" "Invalid method: $METHOD. Use 'sanitize' or 'overwrite'"
    exit 1
fi

# Validate username format
if [[ ! "$USERNAME" =~ ^[a-zA-Z0-9_-]+$ ]] || [[ ${#USERNAME} -lt 3 ]] || [[ ${#USERNAME} -gt 50 ]]; then
    log "ERROR" "Invalid username format"
    exit 1
fi

# Validate password format
if [[ ${#PASSWORD} -lt 6 ]] || [[ ${#PASSWORD} -gt 100 ]]; then
    log "ERROR" "Invalid password format"
    exit 1
fi

log "INFO" "Starting wipe operation for drive: $DRIVE, method: $METHOD"

# --- Authentication ---
if [[ "$USERNAME" != "$VALID_USER" || "$PASSWORD" != "$VALID_PASS" ]]; then
    log "ERROR" "Authentication failed"
    exit 1
fi
log "INFO" "Authentication successful"

# --- Drive Validation ---
if [[ ! -b "$DRIVE" ]]; then
    log "ERROR" "$DRIVE is not a valid block device"
    exit 1
fi

# Check if drive is mounted
if mount | grep -q "$DRIVE"; then
    log "WARN" "Drive $DRIVE appears to be mounted. Unmounting..."
    if ! sudo umount "$DRIVE" 2>/dev/null; then
        log "ERROR" "Failed to unmount $DRIVE. Please unmount manually."
        exit 1
    fi
fi

# Get drive information
DRIVE_SIZE=$(lsblk -b -d -n -o SIZE "$DRIVE" 2>/dev/null || echo "unknown")
log "INFO" "Target drive: $DRIVE, Size: $DRIVE_SIZE bytes"

# --- Wipe Logic ---
case $METHOD in
    sanitize)
        log "INFO" "Starting sanitize operation on $DRIVE"
        
        # Check for NVMe drives
        if [[ "$DRIVE" =~ nvme ]]; then
            if command -v nvme &>/dev/null; then
                log "INFO" "Using nvme-cli for NVMe sanitize"
                if sudo nvme sanitize "$DRIVE" --sanitize-type=1 --ause; then
                    log "INFO" "NVMe sanitize command sent successfully"
                else
                    log "ERROR" "NVMe sanitize failed"
                    exit 1
                fi
            else
                log "ERROR" "nvme-cli not found for NVMe drive"
                exit 1
            fi
        else
            # Regular SATA/SCSI drives
            if command -v hdparm &>/dev/null; then
                log "INFO" "Using hdparm for ATA sanitize"
                if sudo hdparm --user-master u --security-set-pass p "$DRIVE"; then
                    if sudo hdparm --user-master u --security-erase p "$DRIVE"; then
                        log "INFO" "ATA sanitize completed successfully"
                    else
                        log "ERROR" "ATA security erase failed"
                        exit 1
                    fi
                else
                    log "ERROR" "Failed to set security password"
                    exit 1
                fi
            else
                log "ERROR" "hdparm not found for ATA drive"
                exit 1
            fi
        fi
        ;;
    
    overwrite)
        log "INFO" "Starting overwrite operation on $DRIVE (this may take hours)"
        
        # Calculate estimated time (rough estimate)
        if [[ "$DRIVE_SIZE" != "unknown" ]]; then
            ESTIMATED_HOURS=$((DRIVE_SIZE / 1000000000 / 100)) # Very rough estimate
            log "INFO" "Estimated completion time: $ESTIMATED_HOURS hours"
        fi
        
        # Use dd with progress monitoring
        if command -v pv &>/dev/null; then
            log "INFO" "Using pv for progress monitoring"
            if sudo dd if=/dev/zero bs=1M 2>/dev/null | pv -s "$DRIVE_SIZE" | sudo dd of="$DRIVE" bs=1M; then
                log "INFO" "Overwrite completed successfully"
            else
                log "ERROR" "Overwrite operation failed"
                exit 1
            fi
        else
            log "INFO" "Using dd without progress monitoring"
            if sudo dd if=/dev/zero of="$DRIVE" bs=1M status=progress; then
                log "INFO" "Overwrite completed successfully"
            else
                log "ERROR" "Overwrite operation failed"
                exit 1
            fi
        fi
        
        # Sync to ensure data is written
        log "INFO" "Syncing filesystem"
        sync
        ;;
esac

log "SUCCESS" "Wipe completed for $DRIVE using '$METHOD' method"
log "INFO" "Log file saved to: $LOG_FILE"
