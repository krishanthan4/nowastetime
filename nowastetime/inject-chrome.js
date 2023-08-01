var pageInfo = { url: document.URL, referrer: document.referrer, idleTime: 0 };
chrome.extension.sendRequest({ name: "checkURL", message: pageInfo });
