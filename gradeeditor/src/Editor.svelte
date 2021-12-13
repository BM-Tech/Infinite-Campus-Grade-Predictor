<script>
    export let course
    import { createEventDispatcher } from 'svelte'
	import { slide } from 'svelte/transition'

    const dispatch = createEventDispatcher()
    console.log(course)

    function getCurrentGrade(){
        let text = ""
		for(let term of course.details){
			if(term.task.progressScore != undefined){
				text = term.task.progressScore + " (" + term.task.progressPercent + "%)"
			}
		}
        return text
	}

    let newGrade = 100
    let categories = {}
    let categoryWeights = {}
    for(let term of course.details){
        for(let categroy of term.categories){
            categories[categroy.name] = []
            categoryWeights[categroy.name] = categroy.weight
            for(let assignment of categroy.assignments){
                categories[categroy.name].push({
                    name: assignment.assignmentName,
                    grade: {
                        score: parseFloat(assignment.scorePoints) * assignment.multiplier,
                        outof: assignment.totalPoints * assignment.multiplier
                    }
                })
            }
        }
    }

    let categoryScores = {}
    $: {
        for(const [category, assignments] of Object.entries(categories)){
            let sum = {score: 0, outof: 0}
            for(let assignment of assignments){
                console.log(assignment)
                if(assignment.grade.score != undefined){
                    sum.score += assignment.grade.score
                    sum.outof += assignment.grade.outof
                }
            }
            categoryScores[category] = sum
            console.log(categoryScores)
        }

        let grade = 0
        for(const [category, score] of Object.entries(categoryScores)){
            if(score.score != undefined){
                grade += (score.score / score.outof) * (categoryWeights[category] / 100)
            }
        }
        newGrade = grade
    }

    let showAreas = {
        newAssig : false,
        addFinal : false,
        showGraph : false
    }

    function toggleArea(area){
        for(let a of Object.keys(showAreas)){
            showAreas[a] = false
        }
        if(showAreas[area]){
            showAreas[area] = false
        } else{
            showAreas[area] = true
        }
    }
</script>

<nav>
    <ul>
        <li><h3>{course.details[0].task.courseName}</h3></li>
    </ul>
    <ul>
        <li><a href="#/" on:click={() => {dispatch('message', {m: "goHome"})}}>Back</a></li>
    </ul>
</nav>

<div class="grid">
    <p><strong>Origional: </strong> {getCurrentGrade()}</p>
    <p><strong>New: </strong> {(newGrade*100).toFixed(2)}%</p>
</div>
<div class="grid">
    <button on:click={() => {toggleArea("newAssig")}}>New Assignment</button>
    <button on:click={() => {toggleArea("addFinal")}}>Add Final</button>
    <button on:click={() => {toggleArea("showGraph")}}>Show graph</button>
</div>

{#if showAreas.newAssig}
    <article>
        <p>New Assignment</p>
    </article>
{/if}

{#if showAreas.addFinal}
    <article>
        <p>Add Final</p>
    </article>
{/if}

{#if showAreas.showGraph}
    <article>
        <p>Show Graph</p>
    </article>
{/if}

<hr>
{#each Object.entries(categories) as [categoryName, assignments]}
    <details>
        <summary>{categoryName}</summary>
        <ul class="longlist">
            {#each assignments as assignment}
                <li>
                    <nav>
                        <ul><li>{assignment.name}</li></ul>
                        <ul><li>
                            <div class="grid">
                                <input type="number" placeholder="Score" bind:value={assignment.grade.score}>
                                <input type="number" placeholder="Out of" bind:value={assignment.grade.outof}>
                            </div>
                        </li></ul>
                    </nav>
                </li>
            {/each}
        </ul>
    </details>
{/each}