<script>
	let data = {
		"grade": "A",
		"score": 100,
		"className": "",
		"categories": []
	}

	let modifications = {}

	let newGrade = 100
	chrome.storage.local.get(["data"], (res) => {
		data = res.data
		for(let i of data.categories){
			modifications[i.name] = []
		}
		console.log(data.categories)
	})

	function percent(grade){
		return ((grade.val / grade.outOf) * 100).toFixed(2)
	}

	let theme = document.getElementsByTagName("html")[0].getAttribute("data-theme")
	$: if(localStorage.getItem("theme") != null){
		theme = localStorage.getItem("theme")
	}

	if(theme=="dark"){theme="light"}else{theme="dark"}
	function toggleTheme(){
		if(theme=="dark"){theme="light"}else{theme="dark"}
		localStorage.setItem("theme", theme)
	}

	$:{
		document.getElementsByTagName("html")[0].setAttribute("data-theme", theme)
	}
	
	let currentMod = {
		"name": "",
		"type": "NEW",
		"category": "",
		"score": {
			"val": null,
			"outOf": null
		}
	}
	let defaultMod = Object.assign({}, currentMod)

	function handleSubmit(){
		modifications[currentMod.category].push(Object.assign({}, currentMod))
		modifications = modifications
		currentMod = Object.assign({}, defaultMod)
		calculateGrades()
	}

	function calculateGrades(){
		for(let category of data.categories){
			if(modifications[category] != null){
				for(let mod of modifications[category]){
					console.log(mod)
				}
			}
		}
	}
</script>

<main>
    <div class="container">
        <article style="margin-top: 0px; margin-bottom: 10px;">
            <header>
                <h1>{data.className}</h1>
				<div>
					<strong>Origional Grade:</strong>
					<strong style="float: right;">{data.grade} ({data.score}%)</strong>
				</div>
				<div>
					<strong>New Grade: </strong>
					<strong style="float: right;">{newGrade}%</strong>
				</div>
            </header>

			<input type="text" placeholder="Assignment Name" bind:value={currentMod.name}>

			<div class="grid">
				<input type="number" placeholder="Score" bind:value={currentMod.score.val}>
				<input type="number" placeholder="Out Of" bind:value={currentMod.score.outOf}>
			</div>

			<div class="grid">
				<select name="category" bind:value={currentMod.category}>
					{#each data.categories as category}
						<option value={category.name}>{category.name}</option>
					{/each}
				</select>
				<fieldset>
					<label for="add">
						<input type="radio" id="small" name="size" value="NEW" checked on:change={(e)=>{currentMod.type = e.target.value}}>
						Adding New Grade
					</label>
					<label for="modify">
						<input type="radio" id="medium" name="size" value="EDITED" on:change={(e)=>{currentMod.type = e.target.value}}>
						Modifying Existing Grade
					</label>
				</fieldset>
			</div>

			<button on:click={handleSubmit}>Submit</button>

			{#each data.categories as category}
				<hr>
				<strong>{category.name} (Weight: {category.weight}%)</strong>
				<strong style="float: right;">{percent(category.score)}% ({category.score.val}/{category.score.outOf})</strong>
				<br>
				{#if modifications[category.name] != null}
					{#each modifications[category.name] as mod}
						<small>
							<i><ins>{mod.type}</ins></i> 
							{mod.name}
							<small>
								<a href="#d">Edit</a>
								<a href="#d">Delete</a>
							</small>
						</small>
						<small style="float: right;">100%</small>
						<br>
					{/each}
				{/if}
			{/each}
        </article>

		<small class="f">Infinite Campus Grade Predictor | 
			<a href="https://github.com">Github</a> |
			<a href="#f" on:click={toggleTheme}>Toggle Dark Mode</a>
		</small>
    </div>
</main>