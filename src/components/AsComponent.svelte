<script>
    // A component built from this instance's default slot. Each mount renders the slot
    // content with the props it was mounted with, read live so reactive props stay reactive.
    // Mounted as a separate root (e.g. by a ListView), so the context comes from the mount options.
    export const component = ($$anchor, props) => {
        return content($$anchor, () => props);
    };

    // Referenced by the snippet so the compiler keeps it inside the component instead of
    // hoisting it to module scope, where the slot it renders is not available.
    const instance = {};
</script>

{#snippet content(props)}<slot props={props} {instance}></slot>{/snippet}
