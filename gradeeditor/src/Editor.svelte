<script>
    export let course
    import { createEventDispatcher } from 'svelte'
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
    for(let term of course.details){
        for(let categroy of term.categories){
            categories[categroy.name] = []
            for(let assignment of categroy.assignments){
                categories[categroy.name].push({
                    name: assignment.assignmentName,
                    grade: {
                        score: assignment.scorePoints,
                        outof: assignment.totalPoints
                    }
                })
            }
        }
    }
    $: console.log(categories)
</script>

<nav>
    <ul>
        <li><h3>{course.details[0].task.courseName}</h3></li>
    </ul>
    <ul>
        <li><button on:click={() => {dispatch('message', {m: "goHome"})}}>Back</button></li>
    </ul>
</nav>

<div class="grid">
    <p><strong>Origional: </strong> {getCurrentGrade()}</p>
    <p><strong>New: </strong> {newGrade}%</p>
    <button>Add Final</button>
</div>

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
                                <input type="number" placeholder="Score" value={assignment.grade.score}>
                                <input type="number" placeholder="Out of" value={assignment.grade.outof}>
                            </div>
                        </li></ul>
                    </nav>
                </li>
            {/each}
        </ul>
    </details>
{/each}