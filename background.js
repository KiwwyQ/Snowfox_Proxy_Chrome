// background.js

const url = "https://API_URL_HERE/";
const interval = 5000;
let enabled = false;

function getCurrentTime() {
    return new Date().toLocaleString();
}

function logMessage(message) {
    console.log(`[${getCurrentTime()}] ${message}`);
}

function salt() {
    return Math.floor((Math.random() * 2) + (Math.random() * 2)) + Math.random();
}

function fetchData() {
    logMessage("🌐 API: Trying to contact " + url);
    fetch(`${url}?s=${salt()}`, { "mode": "no-cors" })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status=(${response.status}).`);
            }
            return response.json();
        })
        .then(data => {
            if (data && JSON.stringify(data).includes('"address_1":"')) {
                logMessage("✨ API: Data synced successfully!");
                chrome.storage.local.set({ apiRep: data }, () => {
                    logMessage('💾 API: Data has been saved');
                });
            } else {
                logMessage("❌ API: No valid data received.");
                if (JSON.stringify(data).includes('"error":"')) {
                    logMessage("⚠️ API: Error = " + data.error);
                    chrome.storage.local.set({ apiRep: "none" }, () => {
                        //logMessage('💾 API: Data has been saved');
                    });
                    return;
                }
                /*setTimeout(fetchData, interval);
                chrome.storage.local.set({ apiRep: "" }, () => {
                    logMessage('🗑️ API: Data cleared');
                });*/
            }
        })
        .catch(error => {
            logMessage('🚨 API: There was a problem with the fetch operation: ' + error);
            setTimeout(fetchData, interval);
            chrome.storage.local.set({ apiRep: "" }, () => {
                logMessage('🗑️ API: Data cleared');
            });
        });
}

fetchData();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_DATA') {
        logMessage('🚨 SERVIC: New Sync request from the client');
        fetchData();
        sendResponse({reply: "OK"});
    }
});

chrome.runtime.onInstalled.addListener(() => {
    logMessage('🎉 Snowfox Proxy extension installed!');
});