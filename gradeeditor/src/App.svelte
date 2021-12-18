<script>
	import Home from './Home.svelte'
	import Editor from './Editor.svelte'
	import { slide } from 'svelte/transition'

	chrome.tabs.create({url: "https://fremontunifiedca.infinitecampus.org/campus/resources/portal/grades?q=" + Date.now()})

	let classes = []
	chrome.runtime.onMessage.addListener(
		(req, who, res) => {
			if(req.m == "getGradeDetails"){
				classes.push(req.data)
				classes = classes
				//currentCourse = classes[0]
			}
		}
	)

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
			<li><a href="#/"><small>Help</small></a></li>
			<li><a href="#/"><small>Contribute</small></a></li>
		</ul>
	</nav>
</div>
