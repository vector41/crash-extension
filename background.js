chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DATA_SCRAPED") {
        console.log("Data received in background script:", message.payload);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "DATA_UPDATE" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to content script:", chrome.runtime.lastError);
                        sendResponse({ success: false });
                    } else {
                        // Relay the scraped data to the popup
                        chrome.runtime.sendMessage({
                            type: "DATA_UPDATE",
                            payload: response?.data || "No data found."
                        });
                        sendResponse({ success: true });
                    }
                });
            }
        });

        chrome.runtime.sendMessage({
            type: "DATA_UPDATE",
            payload: message.payload
        });
        sendResponse({ success: true });
    }
});

// chrome.storage.onChanged.addListener((changes, namespace) => {
//     for (let [hash, { oldValue, newValue }] of Object.entries(changes)) {
//         chrome.runtime.sendMessage({
//             type: "DATA_UPDATE",
//             payload: newValue
//         });
//         console.log(
//             `Key "${hash}" changed in ${namespace} storage:`,
//             `Old value = ${oldValue}, New value = ${newValue}`
//         );
//     }
// });


// Add an event listener to open popup.html in a new tab when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
