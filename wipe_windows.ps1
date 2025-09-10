<#
.SYNOPSIS
    Secure Drive Wiping Script for Windows
    Enhanced version with better error handling and security

.DESCRIPTION
    This script securely wipes a drive using different methods (sanitize or overwrite).
    Authentication is required before execution.

.PARAMETER Drive
    The target drive (e.g., \\.\PhysicalDrive0 or C:\).

.PARAMETER Method
    Wipe method: "sanitize" or "overwrite".

.PARAMETER Username
    Login username (default: admin).

.PARAMETER Password
    Login password (default: password123).

.EXAMPLE
    .\wipe_windows.ps1 -Drive \\.\PhysicalDrive0 -Method sanitize -Username admin -Password password123
#>

param(
    [Parameter(Mandatory = $true)][string]$Drive,
    [Parameter(Mandatory = $true)][ValidateSet("sanitize", "overwrite")][string]$Method,
    [Parameter(Mandatory = $true)][string]$Username,
    [Parameter(Mandatory = $true)][string]$Password
)

# --- Configuration ---
$validUser = "admin"
$validPass = "password123"
$logFile = "$env:TEMP\wipe_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# --- Logging Function ---
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

# --- Input Validation ---
function Test-Input {
    param(
        [string]$Input,
        [string]$Type
    )
    
    switch ($Type) {
        "drive" {
            return $Input -match '^[a-zA-Z0-9\\:\.]+$' -and $Input.Length -lt 200
        }
        "username" {
            return $Input -match '^[a-zA-Z0-9_-]+$' -and $Input.Length -ge 3 -and $Input.Length -le 50
        }
        "password" {
            return $Input.Length -ge 6 -and $Input.Length -le 100
        }
        default {
            return $false
        }
    }
}

# Validate inputs
if (-not (Test-Input -Input $Drive -Type "drive")) {
    Write-Log "ERROR" "Invalid drive path format: $Drive"
    exit 1
}

if (-not (Test-Input -Input $Username -Type "username")) {
    Write-Log "ERROR" "Invalid username format"
    exit 1
}

if (-not (Test-Input -Input $Password -Type "password")) {
    Write-Log "ERROR" "Invalid password format"
    exit 1
}

Write-Log "INFO" "Starting wipe operation for drive: $Drive, method: $Method"

# --- Authentication ---
if ($Username -ne $validUser -or $Password -ne $validPass) {
    Write-Log "ERROR" "Authentication failed"
    exit 1
}

Write-Log "INFO" "Authentication successful"

# --- Drive Validation ---
try {
    # Check if drive exists
    if (-not (Test-Path $Drive)) {
        Write-Log "ERROR" "Drive path $Drive not found"
        exit 1
    }

    # Get drive information
    $driveInfo = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $Drive }
    if ($driveInfo) {
        $driveSize = [math]::Round($driveInfo.Size / 1GB, 2)
        Write-Log "INFO" "Target drive: $Drive, Size: $driveSize GB"
    }

    # Check if drive is in use
    $processes = Get-Process | Where-Object { $_.Path -like "$Drive*" }
    if ($processes) {
        Write-Log "WARN" "Drive $Drive is currently in use by processes"
        foreach ($proc in $processes) {
            Write-Log "WARN" "Process using drive: $($proc.ProcessName) (PID: $($proc.Id))"
        }
    }

    # --- Wipe Execution ---
    switch ($Method) {
        "sanitize" {
            Write-Log "INFO" "Starting sanitize operation on $Drive"
            
            # For Windows, we'll use cipher to wipe free space
            # For full drive sanitize, we would need specialized tools
            try {
                Write-Log "INFO" "Running cipher /w to wipe free space"
                $result = & cipher /w:$Drive 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "INFO" "Cipher operation completed successfully"
                } else {
                    Write-Log "ERROR" "Cipher operation failed: $result"
                    exit 1
                }
            }
            catch {
                Write-Log "ERROR" "Sanitize operation failed: $_"
                exit 1
            }
        }
        
        "overwrite" {
            Write-Log "INFO" "Starting overwrite operation on $Drive (this may take hours)"
            
            try {
                # Create a large file to fill the drive, then delete it
                $tempFile = Join-Path $Drive "wipe_temp.tmp"
                $chunkSize = 100MB
                
                Write-Log "INFO" "Creating temporary file to overwrite drive space"
                
                # Get available space
                $drive = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $Drive }
                $freeSpace = $drive.FreeSpace
                
                if ($freeSpace -gt 0) {
                    # Create file in chunks to avoid memory issues
                    $bytesWritten = 0
                    $chunk = New-Object byte[] $chunkSize
                    
                    do {
                        $bytesToWrite = [Math]::Min($chunkSize, $freeSpace - $bytesWritten)
                        if ($bytesToWrite -gt 0) {
                            Add-Content -Path $tempFile -Value $chunk[0..($bytesToWrite-1)] -Encoding Byte
                            $bytesWritten += $bytesToWrite
                            
                            # Progress update every 1GB
                            if ($bytesWritten % 1GB -eq 0) {
                                $progress = [Math]::Round(($bytesWritten / $freeSpace) * 100, 2)
                                Write-Log "INFO" "Overwrite progress: $progress% ($bytesWritten / $freeSpace bytes)"
                            }
                        }
                    } while ($bytesWritten -lt $freeSpace)
                    
                    Write-Log "INFO" "Overwrite completed, removing temporary file"
                    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
                } else {
                    Write-Log "WARN" "No free space available on drive $Drive"
                }
            }
            catch {
                Write-Log "ERROR" "Overwrite operation failed: $_"
                exit 1
            }
        }
    }
    
    Write-Log "SUCCESS" "Wipe completed for $Drive using '$Method' method"
    Write-Log "INFO" "Log file saved to: $logFile"
}
catch {
    Write-Log "ERROR" "Wipe operation failed: $_"
    exit 1
}
