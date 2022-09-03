let rep = setInterval(() => {
    let nav = document.querySelector(".header__logo")
    if(nav != null || nav != undefined){
        clearInterval(rep)
    } 

    let btn = document.createElement("button")
    btn.style.cssText = "margin-left:20px; background-color: lightgreen; border: none; border-radius: 5px; padding: 5px; font-size: 1.2em; font-weight: bold; cursor: pointer;"
    btn.innerText = "Open Grade Predictor"
    btn.onclick = function() {
        console.log(chrome.tabs)
        chrome.runtime.sendMessage({m: "openEditor"})
        return false
    }
    nav.appendChild(btn)

    let littleMessages = [
        "Thanks for using Infinite Campus Grade Predictor! <br> <a href='https://chrome.google.com/webstore/detail/infinite-campus-grade-pre/ggakloicnidnfjbdfeapcjdhoeikpmbc?hl=en&authuser=0' target='_blank'> Leave us a review! </a>",
        "Found a bug? Have a feature in mind? <br> <a href='https://docs.google.com/forms/d/e/1FAIpQLSdDfQd5363XU4uyr-AIMLo-oKTjlxPSgJzK9tNknEFsXGCRag/viewform' target='_blank'> Let us know! </a>",
        "Grades don't define you as a person &#128588; &#128588; &#128588;",
        "Keep it up, you're doing great! <br> &#x1f4aa; &#x1f4aa; &#x1f4aa; &#x1f4aa; &#x1f4aa;",
        "Those grades do be lookin mighty fine &#x1f60e;",
    ]
    let message = littleMessages[Math.floor(Math.random()*littleMessages.length)];
    let promo = document.createElement("small")
    promo.style.cssText = "margin-left:20px;"
    promo.innerHTML = message
    nav.appendChild(promo)
}, 500)


console.log("Infinite Campus Grade Predictor")