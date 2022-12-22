/**
 * Script running in background to handle messages from popup to browser to grade editor
 */

let classes = []

chrome.runtime.onMessage.addListener( 
	(req, who, res) => {
		console.log("Recieved request " + req.m + " from " + who.tab.url)

		if(req.m == "getGrades"){
			chrome.storage.local.get(['IC_subdomain'], (x) => {
				if(x.IC_subdomain == undefined){x.IC_subdomain = "fremontunifiedca"}
				fetch(`https://${x.IC_subdomain}.infinitecampus.org/campus/resources/portal/grades?q=${Date.now()}`)
				.then(data => data.json())
				.then(data => {
					try{
						for(let i of data[0].courses){
							fetch(`https://${x.IC_subdomain}.infinitecampus.org/campus/resources/portal/grades/detail/${i.sectionID}?q=${Date.now()}`)
							.then(data => data.json())
							.then(data => {
								// console.log(data)
								chrome.runtime.sendMessage({m: "recieveGrades", data: data})
							})
							.catch(e => {
								chrome.runtime.sendMessage({m: "recieveGrades", data: {fetchError: "can't fetch course"}})
							})
						}
					} catch(e) {
						chrome.runtime.sendMessage({m: "recieveGrades", data: {fetchError: "no data"}})
					}
				})
				.catch(e => {
					chrome.runtime.sendMessage({m: "recieveGrades", data: {fetchError: "can't fetch data"}})
				})
			})

			res(0)
		}

		if(req.m == "openEditor"){
			chrome.tabs.create({url: '/gradeeditor/public/index.html'})
		}
	}
)

chrome.runtime.onInstalled.addListener((dt) => {
	if(dt.reason == "install"){
		chrome.storage.local.set({IC_subdomain: "fremontunifiedca"})
		chrome.tabs.create({url: "/welcome/index.html"})
	}
})