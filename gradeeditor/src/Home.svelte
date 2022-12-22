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

    function getPercentFromClass(details){
        let pct = 0
        for(let term of details){
            if(term.task.progressPercent != undefined){
                pct = term.task.progressPercent
            }
        }
        return pct
    }

	function openEditor(index){
        dispatch('editor', {m: "openEditor", data: classes[index]})
	}
    let storageGrades = {}
    for(let i = 0; i < classes.length; i++){
        let cname = classes[i].details[0].task.courseName
        storageGrades[cname] = getPercentFromClass(classes[i].details)
    }
    chrome.storage.local.get(['GRADES'], function(result) {
        if(result.GRADES == undefined){
            result.GRADES = []
        }
        result.GRADES.push({date: new Date(), grades: storageGrades})
        if(result.GRADES[result.GRADES.length - 1].grades != storageGrades || result.GRADES.length == 0){
            chrome.storage.local.set({GRADES: result.GRADES}, function() {
                console.log('Saved grades to storage')
            })
        }
    })

    window["cleargrades"] = function(){
        chrome.storage.local.set({GRADES: []}, function() {
            console.log('Cleared grades')
        })
    }
    
    window["getgrades"] = function(){
        console.log(classes)
    }
</script>

<br>
{#each classes as cl, i}
    <button on:click={() => openEditor(i)}>
        <nav>
            <ul><strong>{cl.details[0].task.courseName}</strong></ul>
            <ul>{getGradeFromClass(cl.details)}</ul>
        </nav>
    </button>
{/each}

<a href="#1" role="button" class="secondary" on:click={() => {dispatch('playground')}}>Open Playground</a>
