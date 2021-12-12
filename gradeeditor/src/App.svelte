<script>
	chrome.tabs.create({url: "https://fremontunifiedca.infinitecampus.org/campus/resources/portal/grades"})

	let classes = []
	chrome.runtime.onMessage.addListener(
		(req, who, res) => {
			if(req.m == "getGradeDetails"){
				console.log(req)
				classes.push(req.data)
				classes = classes
			}
		}
	)

	function getGradeFromClass(details){
		for(let term of details){
			if(term.task.score != undefined){
				return term.task.score + " (" + term.task.percent + "%)"
			}
		}
	}

	function openEditor(index){
		let g = classes[index]
		console.log(g)
	}
</script>

<div class="container">
	<br>
	<article>
		{#each classes as cl, i}
			<nav>
				<ul><li>
					<p><strong>{cl.details[0].task.courseName}</strong>
					{getGradeFromClass(cl.details)}</p>
				</li></ul>
				<ul><li>
					<button on:click={() => openEditor(i)}>Edit Grades</button>
				</li></ul>
			</nav>
		{/each}
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
