<script>
	import Home from './Home.svelte'

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
</script>

<div class="container">
	<br>
	<article>
		<Home classes={classes}></Home>
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
