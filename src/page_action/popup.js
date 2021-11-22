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
            chrome.storage.local.set({"data": res}, () => {
                chrome.tabs.create({
                    url: "/pages/editor/public/index.html"
                })
                console.log(res)
            })
        })
    })
})