<script>
    export let course
    import { createEventDispatcher } from 'svelte'
	import { slide } from 'svelte/transition'
    import { Category, Assignment } from './helpers'

    const dispatch = createEventDispatcher()

    // Returns default grade without changes
    function getCurrentGrade(){
        let text = ""
		for(let term of course.details){
			if(term.task.progressScore != undefined){
				text = term.task.progressScore + " (" + term.task.progressPercent + "%)"
			}
		}
        return text
	}

    // Reformat course object to list of categories 
    let newGrade = 100
    let categories = []
    for(let term of course.details){ 
        for(let category of term.categories){ 
            // If category is already in array, it was already created from a previous term
            // In this case, add following assignments to the existing Category object
            let currentCategory = new Category(category.weight, category.name)
            let existance = currentCategory.alreadyExists(categories)
            if(existance.true){
                currentCategory = categories[existance.in]
            }

            // Add assignments to category
            for(let assignment of category.assignments){
                currentCategory.addAssignment(
                    new Assignment(
                        parseFloat(assignment.scorePoints) * assignment.multiplier,
                        assignment.totalPoints * assignment.multiplier,
                        assignment.assignmentName
                    )
                )
            }

            if(!existance.true)
                categories.push(currentCategory)
        }
    }

    // Normalize weights
    function normalizeWeights(){
        let weightSum = 0
        for(let cat of categories){
            weightSum += cat.weight
        }
        for(let cat of categories){
            cat.weight = cat.weight / weightSum * 100
        }
    }
    normalizeWeights()
    console.log(categories)

    // On change, update new grade with sum of weighted categories
    $: {
        newGrade = 0
        let renormalize = false
        let subtractThisWeight = 0
        for(let cat of categories){
            let wg = cat.getWeightedGrade()
            if(!isNaN(wg)){
                newGrade += wg
            } else {
                renormalize = true
                subtractThisWeight += cat.weight
            }
        }

        // If a whole grade category is null, ignore it and renormalize 
        if(renormalize){
            newGrade /= (1 - subtractThisWeight/100)
        }
        newGrade = newGrade
    }

    // Toggleable areas
    let showAreas = {
        newAssig : false,
        addFinal : false,
        showGraph : false
    }

    function toggleArea(area){
        for(let a of Object.keys(showAreas)){
            if(a != area || showAreas[area] == true)
                showAreas[a] = false
            else
                showAreas[area] = true
        }
    }

    function deleteAssignment(cat, assig){
        let i = categories.indexOf(cat)
        let a = categories[i].assignments.indexOf(assig)
        if(a > -1)
            categories[i].assignments.splice(a, 1)
        categories = categories
    }

    let newAssig = new Assignment(10, 10, "")
    function submitAssignment(){
        console.log(newAssig)
        for(let cat of categories){
            if(cat.name == newAssig["catName"]){
                categories[categories.indexOf(cat)].addAssignment(newAssig)
                categories = categories
                return
            }
        }
        //categories[newAssig["catIndex"]].push(newAssig)
    }

    let issticky = false
    let sticky;
    document.addEventListener('scroll', () => {
        try {
            if (window.pageYOffset > sticky.offsetTop) {
                issticky = true
            } else {
                issticky = false;
            }
        } catch(e){
            console.log(e)
        }
    })

</script>

<!-- Heading title and back button -->
<nav>
    <ul>
        <li><h3>{course.details[0].task.courseName}</h3></li>
    </ul>
    <ul>
        <li><a href="#/" on:click={() => {dispatch('message', {m: "goHome"})}}><strong>Back</strong></a></li>
    </ul>
</nav>

<!-- New and old grades display -->
<div bind:this={sticky}>
    <p><strong>Origional: </strong> {getCurrentGrade()} | <strong>New: </strong> {(newGrade*100).toFixed(2)}%</p>
</div>

{#if issticky}
    <div class="sticky">
        <p><strong>Origional: </strong> {getCurrentGrade()} | <strong>New: </strong> {(newGrade*100).toFixed(2)}%</p>
    </div>
{/if}

<!-- Area-toggle buttons -->
<div class="grid">
    <button on:click={() => {toggleArea("newAssig")}}>New Assignment</button>
    <button on:click={() => {toggleArea("addFinal")}}>Add Final</button>
    <button on:click={() => {toggleArea("showGraph")}}>Show graph</button>
</div>

<!-- Toggleable areas -->
<div>
    <!-- New assignment form -->
    {#if showAreas.newAssig}
        <article transition:slide class="subcard">
            <form action="#" on:submit|preventDefault={submitAssignment}>
                <div class="grid">
                    <label for="aName">Assignment name
                        <input type="text" name="aName" bind:value={newAssig.name}>
                    </label>

                    <label for="aCat">Category
                        <select name="aCat" required bind:value={newAssig["catName"]}>
                            {#each categories as cat}
                                <option value={cat.name}>{cat.name}</option>
                            {/each}
                        </select>
                    </label>
                </div>

                <div class="grid">
                    <label for="aScore">Score
                        <input type="number" name="aScore" required bind:value={newAssig.score}>
                    </label>
                    <label for="aOutOf">Out of
                        <input type="number" name="aOutOf" required bind:value={newAssig.outof}>
                    </label>
                </div>

                <input type="submit" value="Add">
            </form>
        </article>
    {/if}

    <!-- Final grade caluclator-->
    {#if showAreas.addFinal}
        <article transition:slide class="subcard">
            <p>Add Final</p>
        </article>
    {/if}

    <!-- Graph -->
    {#if showAreas.showGraph}
        <article transition:slide class="subcard">
            <p>Show Graph</p>
        </article>
    {/if}
</div>

<!-- List of expandable categories -->
<hr>
{#each categories as cat}
    <details>
        <summary>{cat.toString()}</summary>
        <ul class="longlist">
            {#each cat.assignments as assig}
                <!-- Assignment inside category -->
                <li><nav>
                    <ul><li>
                        {assig.name}
                        ({assig.toString()}%) 
                        <a on:click={deleteAssignment(cat, assig)} href="javascript:void(0)">delete</a>
                    </li></ul>
                    <ul><li>
                        <div class="grid">
                            <input type="number" placeholder="Score" bind:value={assig.score}>
                            <input type="number" placeholder="Out Of" bind:value={assig.outof}>
                        </div>
                    </li></ul>
                </nav></li>
            {/each}
        </ul>
    </details>
{/each}