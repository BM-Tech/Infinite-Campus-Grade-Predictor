var contextMenuAction = function(event){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "save"}, function(res) {
            var parser = new DOMParser()
            var doc = parser.parseFromString(res, "text/html")
            console.log(doc)
            console.log(res)
        })
    })
}

chrome.contextMenus.create({
    title: "Start Predicting",
    onclick: contextMenuAction
})