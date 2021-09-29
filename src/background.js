chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    console.log(details)
    chrome.tabs.executeScript(null,{file:"src/inject.js"});
});