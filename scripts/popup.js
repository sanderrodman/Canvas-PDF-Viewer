document.addEventListener("DOMContentLoaded", async () => {
    const refreshButton = document.getElementById("refresh-button");
    const pdfButton = document.getElementById("pdf-button");

    try {
        const response = await chrome.runtime.sendMessage({ action: "getPopupData" });
        
        if (!response || !response.path || !response.pdfUrl) {
            console.log("No file detected yet.");
            return;
        }

        const { path, pdfUrl } = response;
        pdfButton.classList.remove("hidden");

        const items = await chrome.downloads.search({ url: pdfUrl, exists: true, limit: 1 });
        let fileId = items.length > 0 ? items[0].id : null;

        if (fileId) {
            refreshButton.classList.remove("hidden");
            pdfButton.textContent = "Open File";
        }

        const startDownloadFlow = async () => {
            pdfButton.disabled = true;
            pdfButton.textContent = "Downloading...";
            
            const res = await chrome.runtime.sendMessage({ action: "getDownloadId", path, pdfUrl });
            if (res?.error) {
                pdfButton.textContent = "Error";
                alert(res.error);
            } else {
                handleDownloadAndOpen(res.downloadId, pdfButton);
            }
        };

        pdfButton.addEventListener("click", () => {
            if (fileId) {
                chrome.downloads.open(fileId);
            } else {
                startDownloadFlow();
            }
        });

        refreshButton.addEventListener("click", startDownloadFlow);

    } catch (err) {
        console.error("Popup Error:", err.message);
    }
});

function handleDownloadAndOpen(downloadId, button) {
    const listener = (delta) => {
        if (delta.id === downloadId && delta.state?.current === "complete") {
            chrome.downloads.onChanged.removeListener(listener);
            
            // Update UI
            button.disabled = false;
            button.textContent = "Open File";
            
            chrome.downloads.open(downloadId);
        }
    };
    chrome.downloads.onChanged.addListener(listener);
}