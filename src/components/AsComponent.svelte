<script>
    import SlotComponent from './SlotComponent.svelte'

    //copy our slot content and scope
    let slots = $$slots;

    // Svelte 5 components are functions, not classes.
    // Create a wrapper function that passes our captured slots through.
    export const component = function($$anchor, $$props) {
        return SlotComponent($$anchor, Object.assign({}, $$props, { $$slots: slots }));
    }
</script>