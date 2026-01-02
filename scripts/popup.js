document.addEventListener("DOMContentLoaded", async () => {

    const refreshButton = document.getElementById("refresh-button");
    const pdfButton = document.getElementById("pdf-button");

    try {
        const response = await chrome.runtime.sendMessage({ action: "getFileInfo" });
        const { path, pdfUrl } = response;

        if (path && pdfUrl) {
            pdfButton.classList.remove("hidden");
        }

        const items = await chrome.downloads.search({ url: pdfUrl, exists: true, limit: 1 });

        fileExist = false;
        if (items.length > 0) {
            fileExist = true;
            refreshButton.classList.remove("hidden");
            pdfButton.textContent = "Open File";
        }

        pdfButton.addEventListener("click", async () => {

            if (fileExist) {
                chrome.downloads.open(items[0].id);
            } else {
                // Start new download via Service Worker
                const downloadRes = await chrome.runtime.sendMessage({ action: "getDownloadId", path, pdfUrl });
                if (!downloadRes?.downloadId) throw new Error(downloadRes?.error || "Download failed");

                handleDownloadAndOpen(downloadRes.downloadId);
            }
        });

        refreshButton.addEventListener("click", async () => {
            
            const downloadRes = await chrome.runtime.sendMessage({ action: "getDownloadId", path, pdfUrl });
            if (!downloadRes?.downloadId) throw new Error(downloadRes?.error || "Download failed");

            handleDownloadAndOpen(downloadRes.downloadId);
        });


    } catch (err) {
        console.error("Extension Error:", err.message);
    }
});


function handleDownloadAndOpen(downloadId) {
    const listener = (delta) => {
        if (delta.id === downloadId && delta.state?.current === "complete") {
            chrome.downloads.onChanged.removeListener(listener);
            chrome.downloads.open(downloadId);
        }
    };
    chrome.downloads.onChanged.addListener(listener);
}