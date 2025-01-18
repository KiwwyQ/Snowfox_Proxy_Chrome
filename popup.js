let address = '';
let enabled = false;
let synced = false;

function getCurrentTime() {
    return new Date().toLocaleString();
}

function logMessage(message) {
    console.log(`[${getCurrentTime()}] ${message}`);
}

function salt() {
    return Math.floor((Math.random() * 2) + (Math.random() * 2)) + Math.random();
}

function getData() {
    const spinner = document.getElementById('loading');
    const btn = document.getElementById('enable');
    const flag_img = document.getElementById('flag');
    const srv_name = document.getElementById('name');
    chrome.storage.local.get(['apiRep', 'state'], (result) => {
        const data = result.apiRep;
        const state = result.state;

        enabled = state || false;
        updateButtonState();

        if (data == 'none'){
            chrome.storage.local.set({ apiRep: "" }, () => {
               logMessage('🗑️ API: Data cleared');
            });
            srv_name.innerText = 'Unavailable';
            btn.style.display = 'initial';
            spinner.style.display = 'none';
            enabled = false;
            chrome.storage.local.set({ state: enabled }, () => {
                logMessage('💾 STATE: Data has been saved');
            });
            updateButtonState();
            clearProxy();
            return;
        }

        if (data && data.address_1) {
            flag_img.src = data.flag;
            srv_name.innerText = data.server_name;
            address = data.address_1;
            synced = true;
            btn.style.display = 'initial';
            spinner.style.display = 'none';
        } else {
            logMessage("🔄 LOADR: Uh-oh, no data available? Asking SERVIC...");
            btn.style.display = 'none';
            spinner.style.display = 'block';
            chrome.runtime.sendMessage({ type: 'GET_DATA' }, (response) => {
                if (!response || response.error) {
                    logMessage(`🔄 LOADR: Error while asking SERVIC: ${response ? response.error : "UNKNOWN"}`);
                } else {
                    logMessage("🔄 LOADR: SERVIC replied");
                }
            });
            if (!enabled){
                clearProxy();
            }
            setTimeout(getData, 500);
            synced = false;
        }
    });
}

function updateButtonState() {
    const btn = document.getElementById('enable');
    if (!enabled) {
        btn.classList.remove('on');
        btn.innerText = 'Connect';
    } else {
        btn.classList.add('on');
        btn.innerText = 'Connected';
    }
}

function proxify() {
    const btn = document.getElementById('enable');

    if (!synced) return;

    if (enabled) {
        enabled = false;
        clearProxy();
        chrome.storage.local.set({ apiRep: "" }, () => {
            logMessage('🗑️ API: Data cleared');
        });
    } else {
        enabled = true;
        if (address) {
            setProxy(address.replaceAll('tcp://', 'http://'));
        }
    }
    updateButtonState();

    chrome.storage.local.set({ state: enabled }, () => {
        logMessage('💾 STATE: Data has been saved');
    });
}

document.addEventListener('DOMContentLoaded', function () {
    getData();
    const button = document.getElementById('enable');
    button.addEventListener('click', function () {
        if (!enabled){
            chrome.storage.local.set({ apiRep: "" }, () => {
                logMessage('🗑️ API: Data cleared');
                getData();
            });
        }
        button.innerText = 'Connecting...';
        button.disabled = true;
        proxify();
        button.innerText = enabled ? 'Connected' : 'Connect';
        button.disabled = false;
    });
});

function setProxy(proxyUrl) {
    const config = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: "http",
                host: proxyUrl.split(':')[1].replace('//', ''),
                port: parseInt(proxyUrl.split(':')[2])
            },
            bypassList: ["localhost", "API_URL_HERE"]
        }
    };

    chrome.proxy.settings.set(
        { value: config, scope: 'regular' },
        () => {
            logMessage('🔧 Proxy set to: ' + proxyUrl);
        }
    );
}

function clearProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        logMessage('🗑️ Proxy cleared');
    });
}