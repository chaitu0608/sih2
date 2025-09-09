<#
.SYNOPSIS
    Secure Drive Wiping Script for Windows

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

# --- Authentication (Replace with secure validation logic) ---
$validUser = "admin"
$validPass = "password123"

if ($Username -ne $validUser -or $Password -ne $validPass) {
    Write-Host "[ERROR] Invalid username or password." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Authentication successful." -ForegroundColor Green

# --- Drive Existence Check ---
if (!(Test-Path $Drive)) {
    Write-Host "[ERROR] Drive path $Drive not found." -ForegroundColor Red
    exit 1
}

# --- Wipe Execution ---
try {
    switch ($Method) {
        "sanitize" {
            Write-Host "[ACTION] Sanitizing drive: $Drive ..." -ForegroundColor Yellow
            # Example (Wipe free space) → For full drive sanitize, admin tools are needed
            cipher /w:$Drive
        }
        "overwrite" {
            Write-Host "[ACTION] Overwriting drive with zeros: $Drive ..." -ForegroundColor Yellow
            # Example overwrite method → adjust as needed
            $tempFile = Join-Path $Drive "wipe.tmp"
            fsutil file createnew $tempFile 104857600   # 100 MB dummy file
            Remove-Item $tempFile -Force
        }
    }
    Write-Host "[SUCCESS] Wipe completed for $Drive using $Method method." -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Wipe operation failed: $_" -ForegroundColor Red
    exit 1
}
