function waitForElement(selector, callback, interval = 100, timeout = 5000) {
    const start = Date.now();

    const checkExist = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(checkExist);
            callback(element);
        } else if (Date.now() - start > timeout) {
            clearInterval(checkExist);
        }
    });
}

function loadLatestHash() {
    try {
        const element = document.querySelector('.tabs-content table tbody tr td:nth-child(3)');
        if (element) {
            const value = element.textContent.trim();
            chrome.storage.local.get(["latestHash"], (result) => {
                if (result.latestHash !== value) {
                    chrome.storage.local.set({ latestHash: value }, () => {
                        console.log('New value stored:', value);
                    });
                }
            });
        }
    } catch (error) {
        console.log(error)
    }
}

function captureTableChanged() {
    const table = document.querySelector('.tabs-content');
    if (table) {
        const observer = new MutationObserver(() => {
            try {
                loadLatestHash();
            } catch (error) {
                console.log(error)
            }
        });
        observer.observe(table, { childList: true, subtree: true });
    }
}

function checkHistorySelected() {
    waitForElement('.tabs-btn.btn-like:nth-child(2)', (btn) => {
        if (!btn.hasAttribute('aria-selected')) {
            console.log('history selected')
            btn.click();
        }

        waitForElement('.tabs-content table', () => {
            loadLatestHash();
            captureTableChanged();
        });
    });
}

checkHistorySelected();