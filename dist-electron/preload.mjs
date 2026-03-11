"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("outreach", {
  projectSlide: (slideData) => {
    electron.ipcRenderer.send("project-slide", slideData);
  },
  blankScreen: () => {
    electron.ipcRenderer.send("blank-screen");
  },
  toggleOutput: () => {
    electron.ipcRenderer.send("toggle-output");
  }
});
electron.contextBridge.exposeInMainWorld("outreachOutput", {
  onSlide: (callback) => {
    electron.ipcRenderer.on("slide-update", (_event, data) => {
      callback(data);
    });
  }
});
