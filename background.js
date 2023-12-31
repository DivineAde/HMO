const startRecording = async () => {
  await chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, async function (tabs) {
   
    const currentTab = tabs[0];

   
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('recording_screen.html'),
      pinned: true,
      active: true,
    });

    // Wait for recording screen tab to be loaded and send message to it with the currentTab
    chrome.tabs.onUpdated.addListener(async function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        await chrome.tabs.sendMessage(tabId, {
          name: 'startRecordingOnBackground',
          body: {
            currentTab: currentTab,
          },
        });
      }
    });
  });
};

console.log("extension")

// Listen for startRecording message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.name === 'startRecording') {
    startRecording();
  }
});