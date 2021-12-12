<script>
    export let classes

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
