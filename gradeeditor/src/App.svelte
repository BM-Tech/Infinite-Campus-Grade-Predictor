<script>
	import Home from './Home.svelte'
	import Editor from './Editor.svelte'
	import { NullCourse } from './NullCourse.js'
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
					console.log(req.data)
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
	// import {x} from './testing'
	// classes = x

	window["debugger"] = {
		getCurrentClass: () => {return currentCourse},
		getAllClasses: () => {return classes},
		setClasses: (cl) => {classes = cl}
	}

	let currentPage = "Home"
	let currentCourse
	function openEditor(event){
		currentCourse = event.detail.data
		currentPage = "Editor"
	}

	function openPlayground(){
		currentPage = "Playground"
	}
</script>

<div class="container">
	<br>

	<!-- <article> -->
	<div class="container">
		{#if loadingState == "loading"}
			<a href="/#" aria-busy="true">Loading, please wait...</a> <br>
		{:else if loadingState == "error"}
			<p><strong>Something went wrong.</strong></p>
			<p>Did you <a href={icURL}>log in</a> to Infinite Campus?</p>
		{/if}

		{#if currentPage == "Home"}
			<div transition:slide><Home classes={classes} on:editor={openEditor} on:playground={openPlayground}></Home></div>
		{:else if currentPage == "Playground"}
			<div transition:slide><Editor isPlayground={true} course={NullCourse} on:home={() => {currentPage="Home"}}></Editor></div>
		{:else}
			<div transition:slide><Editor course={currentCourse} on:home={() => {currentPage="Home"}}></Editor></div>
		{/if}
	</div>
	<!-- </article> -->

	<nav>
		<ul>
			<li><small>Infinite Campus Grade Predictor</small></li>
		</ul>
		<ul>
			<li><a href="https://benman604.github.io/Infinite-Campus-Grade-Predictor/"><small>About</small></a></li>
			<li><a href="https://github.com/bm-tech/Infinite-Campus-Grade-Predictor"><small>Github</small></a></li>
		</ul>
	</nav>
</div>
