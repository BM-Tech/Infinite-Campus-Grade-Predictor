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
        console.log(pct)
        return pct
    }

	function openEditor(index){
        dispatch('message', {m: "openEditor", data: classes[index]})
	}
    console.log(classes)
    let storageGrades = {}
    for(let i = 0; i < classes.length; i++){
        let cname = classes[i].details[0].task.courseName
        storageGrades[cname] = getPercentFromClass(classes[i].details)
    }
    console.log(storageGrades)
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
</script>

<br>
{#each classes as cl, i}
    <button on:click={() => openEditor(i)} style="padding: 5 !important">
        <strong>{cl.details[0].task.courseName}</strong> {getGradeFromClass(cl.details)}
    </button>
{/each}