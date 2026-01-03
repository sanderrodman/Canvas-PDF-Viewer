let lastFileName = null;
let debounceTimer;

function getFileInfo(domChange) {

    const fileName = document.querySelector("#content > h2")?.textContent 
                || document.querySelector(".ef-file-preview-header h1")?.textContent
                || document.querySelector('[data-testid="file-header"] span')?.textContent;

    if (lastFileName === fileName && domChange) {
        return;
    }

    const pdfUrl = document.querySelector("#content a[download='true']")?.href
                || document.querySelector(".ef-file-preview-header a")?.href
                || document.querySelector("#download-icon-button")?.href;

    const course = document.querySelector("#breadcrumbs ol > li:nth-child(2) a > span")?.textContent;

    if (fileName && pdfUrl && course) {
        lastFileName = fileName;
        path = sanitizeDownloadPath(`Canvas Files/${(course)}/${(fileName)}`)
        chrome.runtime.sendMessage({ action: "getContentData", data: {path, pdfUrl} }); 
    }
}

function startObserving() {
    const observer = new MutationObserver(() => {
        // Clear the previous timer every time a new change happens
        clearTimeout(debounceTimer);

        // Only run the check after 300ms of "silence" from the DOM
        debounceTimer = setTimeout(() => {
            getFileInfo(true);
        }, 300); 
    });

    const config = { childList: true, subtree: true };

    // Helper to start logic
    const init = () => {
        observer.observe(document.body, config);
        getFileInfo(true);
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init, { once: true });
    }
}
startObserving();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action == "tabSwitchCanvas") {
        getFileInfo(false);
    }
});

function sanitizeDownloadPath(input) {
    if (!input || typeof input !== "string") return "file.pdf";

    let path = input.replace(/\\/g, "/");
    path = path.replace(/^[a-zA-Z]:/, "");
    path = path.replace(/^\/+/, "");

    const parts = path.split("/");

    const safeParts = parts
                        .filter(Boolean)
                        .map(segment => {
                        
                            if (segment === "." || segment === "..") return "";
                            
                            segment = segment.trim();
                            segment = segment.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
                            segment = segment.replace(/[. ]+$/, "");

                            if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(segment)) {
                                segment = "_" + segment;
                            }

                            return segment || "file";
        });

        return safeParts.join("/");
}