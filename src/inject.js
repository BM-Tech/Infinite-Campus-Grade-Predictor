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

    let promo = document.createElement("small")
    promo.style.cssText = "margin-left:20px;"
    promo.innerHTML = "Thanks for using Infinite Campus Grade Predictor! <br> <a href='https://chrome.google.com/webstore/detail/infinite-campus-grade-pre/ggakloicnidnfjbdfeapcjdhoeikpmbc?hl=en&authuser=0' target='_blank'> Leave us a review! </a>"
    nav.appendChild(promo)
}, 500)


console.log("Infinite Campus Grade Predictor")