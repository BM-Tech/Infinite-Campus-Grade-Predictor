let startBtn = document.getElementById("start")
window.onload = function(){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url
        if(!(tabs[0].url.includes("/campus/nav-wrapper/student/portal/student/classroom/") && url.includes("grades"))){
            startBtn.disabled = true;
        }
    })
}

startBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "save"}, function(res) {
            var parser = new DOMParser()
            var doc = parser.parseFromString(res, "text/html")
            console.log(doc)
            console.log(res)
        })
    })
})