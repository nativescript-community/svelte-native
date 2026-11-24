<script>
    import { getAllContexts, setContext } from 'svelte';

    // Instances are mounted as separate roots (e.g. by a ListView), so they would not otherwise
    // see the context of the component tree the template was declared in.
    const contexts = getAllContexts();

    // A component built from this instance's default slot. Each mount renders the slot
    // content with the props it was mounted with, read live so reactive props stay reactive.
    export const component = ($$anchor, props) => {
        for (const [key, value] of contexts) setContext(key, value);
        return content($$anchor, () => props);
    };

    // Referenced by the snippet so the compiler keeps it inside the component instead of
    // hoisting it to module scope, where the slot it renders is not available.
    const instance = {};
</script>

{#snippet content(props)}<slot props={props} {instance}></slot>{/snippet}
