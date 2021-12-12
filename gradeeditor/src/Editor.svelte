<script>
    export let course
    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()
</script>

<nav>
    <ul>
        <li><h3>{course.details[0].task.courseName}</h3></li>
    </ul>
    <ul>
        <li><button on:click={() => {dispatch('message', {m: "goHome"})}}>Back</button></li>
    </ul>
</nav>