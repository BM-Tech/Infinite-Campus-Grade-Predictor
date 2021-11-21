chrome.storage.local.get(["data"], (res) => {
    console.log(res)
    document.getElementById("className").innerText = res.data.className
    document.getElementById("grade").innerText = res.data.grade + " (" + res.data.score + "%)"
})