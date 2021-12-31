<script>
	import Home from './Home.svelte'
	import Editor from './Editor.svelte'
	import { slide } from 'svelte/transition'

	// chrome.storage.local.get(['IC_subdomain'], (res) => {
	// 	chrome.tabs.create({url: `https://${res.IC_subdomain}.infinitecampus.org/campus/resources/portal/grades?q=${Date.now()}`})
	// })

	let loadingState = "loading"
	let icURL

	chrome.storage.local.get(['IC_subdomain'], (x) => {
		icURL = `https://${x.IC_subdomain}.infinitecampus.org`
	})

	chrome.runtime.sendMessage({m: "getGrades"})
	let classes = []
	chrome.runtime.onMessage.addListener(
		(req, who, res) => {
			if(req.m == "recieveGrades"){
				if(req.data.fetchError != undefined || req.data.errors != undefined){
					console.error(req.data)
					loadingState = "error"
					return
				}
				classes.push(req.data)
				classes = classes
				loadingState = "done"
			}
		}
	)

	// Debugging 
	// window["getAllClasses"] = () => {console.log(classes)}
	// window["setClasses"] = (cl) => {classes = cl}
	// import {x} from './testing'
	// classes = x

	let currentPage = "Home"
	let currentCourse
	function openEditor(event){
		currentCourse = event.detail.data
		currentPage = "Editor"
	}
</script>

<div class="container">
	<br>

	<article>
		{#if loadingState == "loading"}
			<a href="/#" aria-busy="true">Loading, please wait...</a> <br>
		{:else if loadingState == "error"}
			<p><strong>Something went wrong.</strong></p>
			<p>Did you <a href={icURL}>log in</a> to Infinite Campus?</p>
		{/if}

		{#if currentPage == "Home"}
			<div transition:slide><Home classes={classes} on:message={openEditor}></Home></div>
		{:else}
			<div transition:slide><Editor course={currentCourse} on:message={() => {currentPage="Home"}}></Editor></div>
		{/if}
	</article>

	<nav>
		<ul>
			<li><small>Infinite Campus Grade Predictor</small></li>
		</ul>
		<ul>
			<li><a href="#/"><small>About</small></a></li>
			<li><a href="https://github.com/benman604/Infinite-Campus-Grade-Predictor"><small>Github</small></a></li>
		</ul>
	</nav>
</div>
