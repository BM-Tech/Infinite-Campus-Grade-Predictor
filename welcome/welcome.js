let form = document.getElementById("form")
form.addEventListener("submit", (e) => {
    e.preventDefault()
    let val = form.elements['dist'].value
    chrome.storage.local.set({IC_subdomain: val}, ()=>{
        document.getElementById("iclogin").href = "https://" + val + ".infinitecampus.org/"
        document.getElementById("after").style.display = "block"
        document.getElementById("before").style.display = "none"
    })
})