<script>
    export let course
    import { createEventDispatcher } from 'svelte'
    import { slide } from 'svelte/transition'
    import { Category, Assignment, Term, calculateGradeGivenList } from './helpers'
    import Chart from 'svelte-frappe-charts'
    export let isPlayground = false
    
    const dispatch = createEventDispatcher()
    
    let courseSettings = {
        equalWeighting: {},
        termEnabled: {},
        allCategoriesWeightedSame: false
    }
    
    let key
    key = 'courseSettings' + course.details[0].task.courseName
    chrome.storage.local.get(key, (result) => {
        if(result[key] != undefined) {
            courseSettings = result[key]
            console.log(courseSettings)
        }
    })
    
    $: {
        if(!isPlayground)
        chrome.storage.local.set({[key] : courseSettings})
    }
    
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
    
    // charts data initialization
    let gradesOverTime = {
        labels: [],
        datasets: [{
            values: []
        }]
    }
    
    let SORTED_LIST_OF_ASSIGNMENTS = []
    
    // Reformat course object to list of categories 
    let newGrade = 100
    let categories = []
    for(let term of course.details){ 
        for(let category of term.categories){ 
            // If category is already in the array, it was already created from a previous term
            // In this case, add following assignments to the existing Category object
            let currentCategory = new Category(category.weight, category.name)
            let existance = currentCategory.alreadyExists(categories)
            if(existance.true){
                currentCategory = categories[existance.in]
            }
            
            // Add assignments to category
            for(let assignment of category.assignments){
                let thisassig = new Assignment(
                parseFloat(assignment.scorePoints) * assignment.multiplier,
                assignment.totalPoints * assignment.multiplier,
                assignment.assignmentName,
                ((assignment.scorePoints * assignment.multiplier)/(assignment.totalPoints * assignment.multiplier)*100).toFixed(2),
                assignment.termIDs[0],
                assignment.dueDate,
                new Category(category.weight, category.name)
                )
                currentCategory.addAssignment(thisassig)
                SORTED_LIST_OF_ASSIGNMENTS.push(thisassig)
            }
            
            if(!existance.true)
            categories.push(currentCategory)
        }
    }
    
    // console.log(categories)
    if(categories.length == 1){
        categories[0].initialWeight = 100
        categories[0].weight = 100
        categories = categories
        // console.log(categories)
    }
    
    // Generate list of grading periods
    let terms = {}
    let tids = []
    for(let term of course.terms){
        let newTerm = new Term(term.termID, term.termName, term.termSeq, term.startDate, term.endDate)
        terms[term.termID] = newTerm
        courseSettings.termEnabled[term.termID] = newTerm.inRange()
        tids.push(term.termID)
    }
    if(course.terms.length == 4){
        // console.log(courseSettings.termEnabled[tids[0]])
        if(courseSettings.termEnabled[tids[1]]){
            courseSettings.termEnabled[tids[0]] = true
            
        }
        if(courseSettings.termEnabled[tids[3]]){
            courseSettings.termEnabled[tids[2]] = true
        }
        
        courseSettings = courseSettings
    }
    
    // Normalize weights
    function normalizeWeights(){
        let weightSum = 0
        for(let cat of categories){
            weightSum += cat.initialWeight
        }
        for(let cat of categories){
            cat.weight = cat.initialWeight / weightSum * 100
        }
    }
    normalizeWeights()
    
    // Sort SORTED_LIST_OF_ASSIGNMENTS by i.duedate
    SORTED_LIST_OF_ASSIGNMENTS.sort((a, b) => (a.duedate.getTime() > b.duedate.getTime()) ? 1 : -1)
    $: {
        courseSettings
        gradesOverTime.labels = []
        gradesOverTime.datasets[0].values = []
        for(let i=0; i<SORTED_LIST_OF_ASSIGNMENTS.length; i++){
            let l = SORTED_LIST_OF_ASSIGNMENTS[i]
            let res = calculateGradeGivenList(SORTED_LIST_OF_ASSIGNMENTS, i, courseSettings)
            // console.log(l, res)
            gradesOverTime.labels.push(l.duedate.toLocaleString().split(',')[0] + " " + l.name + " (" + l.category.name + ", " + l.score + "/" + l.outof + ")")
            gradesOverTime.datasets[0].values.push((res*100).toFixed(2))
        }
    }
    
    // On change, update new grade with sum of weighted categories
    $: {
        newGrade = 0
        let renormalize = false
        let subtractThisWeight = 0
        
        for(let cat of categories){
            let wieghtEqually = courseSettings.equalWeighting[cat.name]
            if(wieghtEqually == null) wieghtEqually = false
            
            let wg = cat.getWeightedGrade(wieghtEqually, courseSettings.termEnabled)
            
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
        
        // If all categories are weighted equally, recalculate accordingly
        if(courseSettings.allCategoriesWeightedSame){
            newGrade = 0 
            let catCount = 0
            for(let cat of categories){
                let x = cat.calculateGrade(courseSettings.equalWeighting[cat.name], courseSettings.termEnabled).getPercent()
                if(!isNaN(x)){
                    newGrade += x
                    catCount++
                }
            }
            
            newGrade /= catCount
        }
        newGrade = newGrade
    }
    
    // Toggleable areas
    let showAreas = {
        newAssig:       false,
        newCategory:    false,
        showGraph:      false,
        equalWeighting: false,
        gradingPeriods: false,
        whatToMaintain: false,
        saveLoad:       false
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
    
    function copy(ob){
        return Object.assign({}, ob)
    }
    
    // New assignment on submit
    let newAssig = new Assignment(10, 10, "")
    function submitAssignment(){
        for(let cat of categories){
            if(cat.name == newAssig["catName"]){
                let c = copy(newAssig)
                let t = new Assignment(c.score, c.outof, c.name)
                categories[categories.indexOf(cat)].addAssignment(t)
                newAssig = new Assignment(10, 10, "")
                categories = categories
                return
            }
        }
    }
    
    // New category on submit
    let newCategory = new Category(0, "")
    function submitCategory(){
        let c = copy(newCategory)
        let t = new Category(newCategory.weight, newCategory.name)
        categories.push(t)
        normalizeWeights()
        categories = categories
    }
    
    // Activate sticky grade div when scrolled past
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
        }
    })
    
    let moreToolsOpen = true
    
    // Minimum need (doesnt work bruh)
    let gradeWanted = 90
    let minNeedAssig = new Assignment(10, 10, "")
    $: {
        let gradeWoNewcat = copy(newGrade)
        let categ = categories[0]
        for(let cat of categories){
            if(cat.name == minNeedAssig["catName"]){
                gradeWoNewcat -= cat.getWeightedGrade(courseSettings.equalWeighting[cat.name], courseSettings.termEnabled)
                categ = cat
            }
        }
        let neededCatGrade = gradeWanted - gradeWoNewcat
        // console.log("you need a " + neededCatGrade + " in " + categ.name + " to get a " + gradeWanted + " overall")
        /*
        currScore + newScore 
        ____________________ = neededCatGrade
        currOutof + newOutof
        
        newScore = (neededCatGrade)(currOutof + newOutof) - currScore
        */
        try{
            let categGrade = categ.calculateGrade()
            let newScore = neededCatGrade * (categGrade.outof + minNeedAssig.outof) - categGrade.score
            minNeedAssig.score = newScore
        } catch(e){
            console.log(e)
        }
    }
    
    function makeAssigVariable(outOf, cat){
        minNeedAssig.outof = outOf
        minNeedAssig["catName"] = cat
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Save and load (Playground only)
    let saveCourseName
    function saveCourseAs(){
        let course = {
            name: saveCourseName,
            categories: categories
        }
        chrome.storage.local.get(['GRADES'], (result) => {
            if(result.GRADES == undefined){
                let save = {}
                save[saveCourseName] = course
                chrome.storage.local.set({GRADES: save})
            } else {
                let courses = result.GRADES
                courses[saveCourseName] = course
                chrome.storage.local.set({GRADES: courses})
            }
        })
        dispatch('home')
    }
    
    let loadCourseName
    let savedCourses = []
    
    if(isPlayground) {
        chrome.storage.local.get(['GRADES'], (result) => {
            if(result.GRADES != undefined){
                savedCourses = result.GRADES
            }
        })
    }
    
    function loadCourse(){
        let course = savedCourses[loadCourseName]
        console.log(course.categories)
        categories = []
        for(let i of course.categories){
            let cat = new Category(i.weight, i.name)
            for(let j of i.assignments){
                let assig = new Assignment(j.score, j.outof, j.name)
                cat.addAssignment(assig)
            }
            categories.push(cat)
        }
        saveCourseName = loadCourseName
    }
    
    function deleteCourse(){
        try {        
            delete savedCourses[saveCourseName]
            chrome.storage.local.set({GRADES: savedCourses})
            dispatch('home')
        } catch(e){
            console.log(e)
        }
    }
</script>

<!-- Heading title and back button -->
<nav>
    <ul>
        <li><h3>{course.details[0].task.courseName}</h3></li>
    </ul>
    <ul>
        <li><a role="button" class="outline" href="#/" on:click={() => {dispatch('home')}}><strong>Back</strong></a></li>
    </ul>
</nav>

<!-- New and old grades display -->
<div bind:this={sticky}>
    <p><strong>Original: </strong> {getCurrentGrade()} | <strong>New: </strong> {(newGrade*100).toFixed(2)}%</p>
    
    {#if isNaN(newGrade)}
    <p>
        <strong>Nothing to calculate yet. </strong> 
        {#if !isPlayground}
        Try opening "Grading Periods" to enable terms.
        {/if}
    </p>
    {/if}
    
    <!-- {#if (newGrade >= getCurrentGrade() + 0.01 || newGrade <= getCurrentGrade() - 0.01) }
        <p>Calculations may be off by +/- 0.01% due to rounding errors.</p>
        {/if} -->
    </div>
    
    {#if issticky}
    <div class="sticky">
        <p><strong>Original: </strong> {getCurrentGrade()} | <strong>New: </strong> {(newGrade*100).toFixed(2)}%</p>
    </div>
    {/if}
    
    <!-- Area-toggle buttons -->
    <div class="grid">
        <button on:click={() => {toggleArea("newAssig")}}>New Assignment</button>
        <button on:click={() => {toggleArea("newCategory")}}>New Category</button>
        {#if isPlayground}
        <button on:click={() => {toggleArea("saveLoad")}}>Save/Load</button>
        {:else}
        <button on:click={() => {toggleArea("showGraph")}}>Show Graph</button>
        {/if}
    </div>
    
    <!-- More tools -->
    {#if !isPlayground}
    <small class="sidewayslist">
        <a href="#a" on:click={()=>{moreToolsOpen = !moreToolsOpen}}>More Tools</a>
        {#if moreToolsOpen}
        <a href="#a" on:click={()=>{toggleArea("equalWeighting")}}>Equal Weighting</a>
        <a href="#a" on:click={()=>{toggleArea("gradingPeriods")}}>Grading Periods</a>
        <!-- <a href="#a" on:click={()=>{toggleArea("whatToMaintain")}}>Minimum Need</a> -->
        {/if}
    </small>
    {/if}
    
    <!-- Equal weighting setting -->
    {#if showAreas.equalWeighting}
    <article class="subcard" transition:slide>
        <div>
            <h4>Equal Weighting</h4>
            <p>Categories with this enabled will have all assignments weighted the same.</p>
            {#each categories as cat}
            <nav style="width:100%">
                <ul>
                    <li>{cat.name}</li>
                </ul>
                <ul>
                    <li><label for="switch">
                        <input type="checkbox" name="switch" id="switch" role="switch"
                        bind:checked={courseSettings.equalWeighting[cat.name]}>
                    </label></li>
                </ul>
            </nav>
            {/each}
            
            <hr><br>
            <nav style="width: 100%">
                <ul><li>All categories weighted same</li></ul>
                <ul><li>
                    <label for="category">
                        <input type="checkbox" name="category" role="switch" bind:checked={courseSettings.allCategoriesWeightedSame}>
                    </label>
                </li></ul>
            </nav>
        </div>
    </article>
    {/if}
    
    <!-- Grading periods -->
    {#if showAreas.gradingPeriods}
    <article class="subcard" transition:slide>
        <div>
            <h4>Grading Periods</h4>
            <p>Enable/disable assignments in certain grading periods to be considered in calculation.</p>
            {#each Object.keys(terms) as term}
            <nav style="width:100%">
                <ul>
                    <li>{terms[term].name}</li>
                </ul>
                <ul>
                    <li><label for="switch">
                        <input type="checkbox" name="switch" id="switch" role="switch"
                        bind:checked={courseSettings.termEnabled[term.toString()]}>
                    </label></li>
                </ul>
            </nav>
            {/each}
        </div>
    </article>
    {/if}
    
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
                    <input type="number" name="aScore" step="0.01" required bind:value={newAssig.score}>
                </label>
                <label for="aOutOf">Out of
                    <input type="number" name="aOutOf" step="0.01" required bind:value={newAssig.outof}>
                </label>
            </div>
            
            <input type="submit" value="Add">
        </form>
    </article>
    {/if}
    
    <!-- New category form -->
    {#if showAreas.newCategory}
    <article transition:slide class="subcard">
        <form action="#" on:submit|preventDefault={submitCategory}>
            <div class="grid">
                <label for="cName">Category Name
                    <input type="text" name="cName" required bind:value={newCategory.name}>
                </label>
                <label for="cWeight">Weight (%)
                    <input type="number" min="0" max="100" name="cWeight" required bind:value={newCategory.weight}>
                </label>
            </div>
            <input type="submit" value="Add">
        </form>
    </article>
    {/if}
    
    <!-- Save/Load -->
    {#if showAreas.saveLoad}
    <article transition:slide class="subcard">
        <h4>Save & Load</h4>
        <p>Save your current course to a file, or load a course from a file.</p>
        <form on:submit|preventDefault={saveCourseAs} style="margin-bottom: 0;">
            <div class="grid">
                <input type="text" placeholder="Save Name..." bind:value={saveCourseName}>
                <input type="submit" value="Save As">
            </div>
        </form>
        <div class="grid">
            <select name="loadCourse" bind:value={loadCourseName}>
                {#each Object.entries(savedCourses) as [name, course]}
                <option value={name}>{name}</option>
                {/each}
            </select>
            <button on:click={loadCourse}>Load</button>
        </div>
        
        <div class="sidewayslist">
            <a href="#1" role="button" class="secondary outline" on:click|preventDefault={deleteCourse}>Delete</a>
        </div>
    </article>
    {/if}
    
    <!-- Graph -->
    {#if showAreas.showGraph}
    <article transition:slide class="subcard">
        <h4>Grade Trends</h4>
        <p><strong>This feature is in beta.</strong> Exact grades shown here are likely inaccurate.</p>
        <Chart data={gradesOverTime} type="line" />
    </article>
    {/if}
    
    <!-- What do I need to maintain X grade? -->
    {#if showAreas.whatToMaintain}
    <article transition:slide class="subcard">
        <h4>What do I need to maintain X grade?</h4>
        <p>Create a variable assignment or choose an existing one to predict the lowest score you need to maintain a certain grade.</p>
        <div class="grid">
            <p>Grade wanted (percent):</p>
            <input type="number" placeholder="%" bind:value={gradeWanted}>
        </div>
        <p>Variable assignment:</p>
        <div class="grid">
            <label for="aCat">Category
                <select name="aCat" required bind:value={minNeedAssig["catName"]}>
                    {#each categories as cat}
                    <option value={cat.name}>{cat.name}</option>
                    {/each}
                </select>
            </label>
            
            <label for="aOutOf">Out of
                <input type="number" name="aOutOf" required bind:value={minNeedAssig.outof}>
            </label>
        </div>
        
        <p>You need a minimum of <strong>{minNeedAssig.score}/{minNeedAssig.outof} ({minNeedAssig.toString()}%)</strong> on this assignment to maintain a grade of {gradeWanted}%.</p>
    </article>
    {/if}
    
    <br><br>
    <!-- List of expandable categories -->
    <hr>
    {#each categories as cat}
    <details>
        <summary>{cat.toString(courseSettings.equalWeighting[cat.name], courseSettings.termEnabled)}</summary>
        <ul class="longlist">
            <nav>
                <ul><li>Weight: </li></ul>
                <ul><li>
                    <div class="grid">
                        <input type="number" bind:value={cat.weight}> 
                        <p>%</p>
                    </div>
                </li></ul>
            </nav>
            
            <nav>
                <ul>
                    <li><input type="text" placeholder="New Assignment Name..." bind:value={newAssig.name}></li>
                    <li><a href="#1" role="button" class="primary outline" on:click={
                        () => {
                            newAssig.catName = cat.name
                            submitAssignment()
                        }
                    }>Add</a></li>
                </ul>
                <ul><li>
                    <div class="grid">
                        <input type="number" placeholder="Score" bind:value={newAssig.score}>
                        <input type="number" placeholder="Out Of" bind:value={newAssig.outof}>
                    </div>
                </li></ul>
            </nav>
            <br>
            {#each cat.assignments as assig}
            <!-- Assignment inside category -->
            {#if assig.isEnabled(courseSettings.termEnabled)}
            <li><nav>
                <ul><li>
                    {assig.name} 
                    {assig.toString()}% {assig.getOgGrade()} &nbsp;
                    <small class="modifiers">
                        <a on:click|preventDefault={deleteAssignment(cat, assig)} href="#a">delete</a> &nbsp;
                        {#if showAreas.whatToMaintain}
                        <a on:click|preventDefault={makeAssigVariable(assig.outof, cat.name)} href="#a">make variable</a>
                        {/if}
                    </small>
                </li></ul>
                <ul><li>
                    <div class="grid">
                        <input type="number" placeholder="Score" bind:value={assig.score}>
                        <input type="number" placeholder="Out Of" bind:value={assig.outof}>
                    </div>
                </li></ul>
            </nav></li>
            {/if}
            {/each}
        </ul>
    </details>
    {/each}