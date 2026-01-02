function getFileInfo() {
    const pdfUrl = document.querySelector("#content a[href*='download']")?.href 
                || document.querySelector(".ef-file-preview-header a")?.href
                || document.querySelector("#download-icon-button")?.href;

    const fileName = document.querySelector("#content > h2")?.textContent 
                || document.querySelector(".ef-file-preview-header h1")?.textContent
                || document.querySelector("h2[id*='file-preview-title']")?.textContent; // More stable fallback

    const course = document.querySelector("#breadcrumbs ol > li:nth-child(2) a > span")?.textContent;

    if (pdfUrl && fileName && course) {
        return {
            path: `Canvas Files/${sanitizeName(course)}/${sanitizeName(fileName)}`,
            pdfUrl: pdfUrl
        };
    }
    return null;
}

function sanitizeName(name) {
    return name.replace(/[\/\\:*?"<>|]/g, "-");
}

const startObserving = () => {
    // Define the logic to check and send
    const checkAndSend = () => {
        const info = getFileInfo();
        if (info && info.pdfUrl && info.path) {
 
            chrome.runtime.sendMessage({ action: "CANVAS_TARGET_FOUND", data: info });
            return true;
        }
        return false;
    };

    // Run once right now
    if (checkAndSend()) {
        console.log("Data found immediately on script load.");
        return;
    }

    // Run only if the immediate check failed
    const observer = new MutationObserver((mutations, obs) => {
        if (checkAndSend()) {
            // obs.disconnect(); 
        }
    });

    if (document.body) {
        console.log("Observing for future DOM changes...");
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
};

startObserving();