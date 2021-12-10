document.getElementById("start").addEventListener('click', () => {
    chrome.tabs.create({url: "https://fremontunifiedca.infinitecampus.org/campus/resources/portal/grades"})
})