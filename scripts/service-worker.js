chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getDownloadId") {
        const path = message.path
        const pdfUrl = message.pdfUrl

        if (!path || !pdfUrl) {
            sendResponse({ error: "Missing File info" });
        return;
        }

        chrome.downloads.download(
            { url: pdfUrl, filename: path, saveAs: false, conflictAction: "overwrite" },
            (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ downloadId });
            }
        }
        );

        return true;
    }
});

let cachedFileData = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "CANVAS_TARGET_FOUND") {
        cachedFileData = msg.data;
        chrome.action.openPopup();
    }

    // When popup opens, it can ask for the cached data
    if (msg.action === "getFileInfo") {
        sendResponse(cachedFileData);
    }
});