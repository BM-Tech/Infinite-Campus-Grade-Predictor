<script>
	let data = {
		"grade": "A",
		"score": 100,
		"className": "",
		"categories": []
	}

	let modifications = {}

	let moddedData = clone(data)
	chrome.storage.local.get(["data"], (res) => {
		data = res.data
		moddedData = clone(data)
		for(let i of data.categories){
			modifications[i.name] = []
		}
		normalizeWeights()
		console.log(data)
	})

	function percent(grade){
		return ((grade.val / grade.outOf) * 100).toFixed(2)
	}

	function clone(e){
		return Object.assign({}, e)
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
	let defaultMod = clone(currentMod)

	function handleSubmit(){
		modifications[currentMod.category].push(clone(currentMod))
		modifications = modifications
		currentMod = clone(defaultMod)
		calculateGrades()
	}

	function calculateGrades(){
		for(let category of moddedData.categories){
			if(modifications[category.name] != null){
				for(let mod of modifications[category.name]){
					console.log(mod)
					let index = 0
					for(let c of data.categories){
						if(c.name == mod.name){
							index = data.categories.indexOf(c)
						}
					}

					if(mod.type == "NEW"){
						moddedData.categories[index].score.val += mod.score.val
						moddedData.categories[index].score.outOf += mod.score.outOf
					}
					else{
						moddedData.categories[index].score.val -= mod.score.outof + mod.score.val
					}
				}
			}
		}

		moddedData.score = 0
		for(let i of moddedData.categories){
			moddedData.score += percent(i.score) * i.normalizedWeight
		}
	}

	function normalizeWeights(){
		let sum = 0
		for(let category of data.categories){
			sum += category.weight
		}
		for(let i=0; i<data.categories.length; i++){
			moddedData.categories[i]["normalizedWeight"] = moddedData.categories[i].weight / sum
		}
	}

</script>

<main>
    <div class="container">
        <article style="margin-top: 0px; margin-bottom: 10px;">
            <header>
                <h1>{data.className}</h1>
				<div class="strong grid">
					<p>Origional Grade:</p>
					<p>{data.grade} ({data.score}%)</p>
				</div>
				<div class="strong grid">
					<p>New Grade: </p>
					<p>{moddedData.score.toFixed(2)}%</p>
				</div>
            </header>

			<label for="name">Assignment Name<input name="name" type="text" placeholder="Assignment Name" autocomplete="off" bind:value={currentMod.name}></label>

			<div class="grid">
				<label for="score"> Score<input name="score" type="number" placeholder="Score" bind:value={currentMod.score.val}> </label>
				<label for="outOf"> {(currentMod.type == "NEW") ? "Out Of" : "Old Score"}<input name="outOf" type="number" placeholder={(currentMod.type == "NEW") ? "Out Of" : "Old Score"} bind:value={currentMod.score.outOf}> </label>
			</div>

			<div class="grid">
				<label for="category">Category<select name="category" bind:value={currentMod.category}>
					{#each data.categories as category}
						<option value={category.name}>{category.name}</option>
					{/each}
				</select></label>
				<fieldset>
					<br>
					<label for="add">
						<input name="type" type="radio" value="NEW" checked on:change={(e)=>{currentMod.type = e.target.value}}>
						Adding New Grade
					</label>
					<label for="modify">
						<input name="type" type="radio" value="EDITED" on:change={(e)=>{currentMod.type = e.target.value}}>
						Modifying Existing Grade
					</label>
				</fieldset>
			</div>

			<button on:click={handleSubmit}>Submit</button>

			{#each moddedData.categories as category}
				<hr>
				<div class="grid strong">
					<p>{category.name} (Weight: {category.weight}%)</p>
					<p>{percent(category.score)}% ({category.score.val}/{category.score.outOf})</p>
				</div>
				{#if modifications[category.name] != null}
					{#each modifications[category.name] as mod}
						<div class="grid">
							<p>
								<i><ins>{mod.type}</ins></i> 
								{mod.name}
								<a href="#d">Edit</a>
								<a href="#d">Delete</a>
							</p>
							{#if mod.type == "NEW"}
								<p>{percent(mod.score)}% ({mod.score.val}/{mod.score.outOf})</p>
							{:else}
								<p>{mod.score.val} (previously {mod.score.outOf})</p>
							{/if}
						</div>
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