let startBtn = document.getElementById("start")
window.onload = function(){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url
        if(!(tabs[0].url.includes("/campus/nav-wrapper/student/portal/student/classroom/") && url.includes("grades"))){
            startBtn.disabled = true; // current url is not gradebook, disable button
        }
    })
}

startBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "save"}, function(res) { // send message to collect grades from content script
            chrome.storage.local.set({"data": res}, () => { // save data sent from inject.js
                chrome.tabs.create({ // open grade editor
                    url: "/pages/editor/public/index.html"
                })
                console.log(res)
            })
        })
    })
})