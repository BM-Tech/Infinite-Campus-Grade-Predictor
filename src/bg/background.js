/**
 * Script running in background to handle messages from popup to browser to grade editor
 */

let classes = []

chrome.runtime.onMessage.addListener( 
	(req, who, res) => {
		console.log("Recieved request " + req.m + " from " + who.tab.url)

    if(req.m === "getGradeSummary"){ 
      //console.log(req.data)
      for(let i of req.data[0].courses){
        chrome.storage.local.get(['IC_subdomain'], (st) => {
          chrome.tabls.create({
            url: `https://${st.IC_subdomain}.infinitecampus.org/campus/resources/portal/grades/detail/${i.sectionID}?q=${Date.now()}`
          })
        })

        // if(i == req.data[0].courses.at(-1)){
        //   chrome.tabs.create({url: "/gradeeditor/public/index.html"})
        // }
      }
    }

    if(req.m == "getGradeDetails"){
      classes.push(req.data)
    }
	}
)