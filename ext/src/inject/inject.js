chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// This part of the script triggers when page is done loading
			console.log("Hello. This message was sent from scripts/inject.js");
			//alert("hello, world");
			// ----------------------------------------------------------
			chrome.runtime.onMessage.addListener((res, send) => {
				console.log(res)
			})
			window.onpushstate = (e) => {
				console.log("hmm")
				if(window.location.match("https://*.infinitecampus.org/*/campus/nav-wrapper/student/portal/student/classroom/*/grades*")){
					alert("WOAH!!!")
				} else{
					alert("braeugh")
				}
			}
		}
	}, 10);
});