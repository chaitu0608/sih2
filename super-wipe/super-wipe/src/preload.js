const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        let validChannels = [
            "toMain", 
            "get-drives", 
            "start-wipe", 
            "check-os",
            "get-system-info",
            "get-drive-details",
            "get-app-status"
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = [
            "fromMain", 
            "drives-list", 
            "wipe-status", 
            "os-detected",
            "system-info",
            "drive-details",
            "app-status"
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});