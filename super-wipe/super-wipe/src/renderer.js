document.addEventListener("DOMContentLoaded", () => {
  const driveSelect = document.getElementById("drive-select");
  const methodSelect = document.getElementById("method-select");
  const wipeButton = document.getElementById("wipe-button");
  const statusMessage = document.getElementById("status-message");
  const osMessage = document.getElementById("os-message");
  const refreshButton = document.getElementById("refresh-drives");
  const usernameInput = document.getElementById("username-input");
  const passwordInput = document.getElementById("password-input");
  const driveDetailsPanel = document.getElementById("drive-details");
  const driveDevice = document.getElementById("drive-device");
  const driveSize = document.getElementById("drive-size");
  const driveMountpoint = document.getElementById("drive-mountpoint");
  const driveType = document.getElementById("drive-type");

  // Check the OS and display the result
  window.api.send("check-os");
  window.api.receive("os-detected", (os) => {
    osMessage.textContent = `Detected OS: ${os}`;
  });

  // Function to refresh the drive list
  const refreshDrives = () => {
    window.api.send("get-drives");
  };

  // Populate drives (query from main process)
  window.api.receive("drives-list", (drives) => {
    driveSelect.innerHTML = ""; // Clear existing options
    drives.forEach((drive) => {
      const option = document.createElement("option");
      option.value = drive.path;
      option.textContent = `${drive.name} (${drive.size})`;
      driveSelect.appendChild(option);
    });
  });

  // Manual refresh button
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      refreshDrives();
    });
  }

  // Drive selection change → fetch details
  driveSelect.addEventListener("change", () => {
    const selectedDrive = driveSelect.value;
    if (!selectedDrive) {
      driveDetailsPanel.style.display = "none";
      return;
    }
    window.api.send("get-drive-details", selectedDrive);
  });

  // Receive drive details
  window.api.receive("drive-details", (details) => {
    if (!details || details.error) {
      driveDetailsPanel.style.display = "none";
      return;
    }
    driveDevice.textContent = details.device || "-";
    driveSize.textContent = details.sizeFormatted || "-";
    driveMountpoint.textContent = (details.mountpoints && details.mountpoints[0] && details.mountpoints[0].path) || "-";
    const types = [];
    if (details.isUSB) types.push("USB");
    if (details.isRemovable) types.push("Removable");
    if (details.isSystem) types.push("System");
    if (details.isVirtual) types.push("Virtual");
    driveType.textContent = types.join(", ") || "-";
    driveDetailsPanel.style.display = "block";
  });

  // Refresh drives every 5 seconds
  setInterval(refreshDrives, 5000);
  refreshDrives(); // Initial fetch

  wipeButton.addEventListener("click", () => {
    const selectedDrive = driveSelect.value;
    const selectedMethod = methodSelect.value;

    if (!selectedDrive) {
      statusMessage.textContent = "Please select a drive.";
      return;
    }

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!username || !password) {
      statusMessage.textContent = "Username and password are required.";
      return;
    }

    statusMessage.textContent = "Starting wipe...";
    wipeButton.disabled = true;

    window.api.send("start-wipe", {
      drive: selectedDrive,
      method: selectedMethod,
      username: username,
      password: password,
    });
  });

  window.api.receive("wipe-status", (message) => {
    statusMessage.textContent = message;
    wipeButton.disabled = false;
  });
});
