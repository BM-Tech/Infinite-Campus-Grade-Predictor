chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			if(window.location.href.includes("student/classroom") && window.location.href.includes("/grades")){
				console.log("You can now edit grades")
				let button = document.createElement("button")
				button.innerText = "Start Editing"
				button.onclick = (j) => {
					alert("wowzies")
				}
				document.body.style.backgroundColor = "yellow"
				//console.log(document.querySelectorAll("body > app-root > ng-component > app-section > app-portal-page > div.workspace-content.workspace-content--with-toolbar > div > div > div > h2"))
				document.querySelector("body > app-root > ng-component > app-section > app-portal-page > div.toolbar").appendChild(button)
				console.log(document.getElementById("main-workspace").contentWindow.document)

			}
		}
	}, 10);
});

document.addEventListener("load", () => {
	console.log("ok")
	document.querySelector("body > app-root > ng-component > app-section > app-portal-page > div.toolbar").appendChild(button)
})