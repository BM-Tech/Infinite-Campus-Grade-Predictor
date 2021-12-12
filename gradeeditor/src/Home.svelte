<script>
    export let classes
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()

	function getGradeFromClass(details){
        let text = ""
		for(let term of details){
			if(term.task.progressScore != undefined){
				text = term.task.progressScore + " (" + term.task.progressPercent + "%)"
			}
		}
        return text
	}

	function openEditor(index){
		let g = classes[index]
		console.log(g)
        dispatch('message', {m: "openEditor", data: classes[index]})
	}
</script>

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
