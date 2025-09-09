document.addEventListener("DOMContentLoaded", () => {
  const driveSelect = document.getElementById("drive-select");
  const methodSelect = document.getElementById("method-select");
  const wipeButton = document.getElementById("wipe-button");
  const statusMessage = document.getElementById("status-message");
  const osMessage = document.getElementById("os-message");

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

    const username = prompt("Enter username:");
    const password = prompt("Enter password:");

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
