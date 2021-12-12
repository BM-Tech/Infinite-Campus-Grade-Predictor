document.getElementById("start").addEventListener('click', () => {
    chrome.tabs.create({url: "/gradeeditor/public/index.html"})
})