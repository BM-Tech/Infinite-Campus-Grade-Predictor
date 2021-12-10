/**
 * Script injected to IC JSON data pages 
 * *.infinitecampus.org/campus/resources/portal/grades/ fetches course section IDs
 * *.infinitecampus.org/campus/resources/portal/grades/details/<ID> fetches grades in course
 */

console.log("IC Grade Predictor is reading data on this page...")
let unparsedJson
let data
try{
	unparsedJson = document.querySelector("pre").innerText // fetch plain-text json
	try{
		let data = JSON.parse(unparsedJson) // parse json
		console.log("Recieved the following data:")
		console.log(data)

		if(data.errors != undefined){ // likely a 401 unauthorized error
			alert("Please log in to Infinite Campus: " + data.errors[0].message)
			window.close()
		}

		if(window.location.href.indexOf("/detail/") > -1){ // sent grade details to background
			chrome.runtime.sendMessage({m: "getGradeDetails", data: data})
		} else{ // send grade summary to background
			chrome.runtime.sendMessage({m: "getGradeSummary", data: data})
		}
		window.close()
	} catch(e) {
		alert("Parse Error: " + e)
		window.close()
	}
} catch{
	alert("Can't read file.")
	window.close()
}