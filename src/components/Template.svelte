<!-- `component` is applied by an attachment: Svelte drops function values from spread
     attributes when a custom renderer is active. Instances mounted from the template (e.g.
     ListView rows) are separate roots: they get the context this template was declared in,
     and are unmounted with it. -->
<template {...$$restProps} {@attach (node) => { node.context = contexts; node.setAttribute('component', template); }} {@attach (node) => () => node.unmountInstances?.()} xmlns="tns"></template>
<AsComponent bind:component="{template}" let:props>
    <slot item="{(props ? props.item : null)}" index={(props ? props.index : null)}></slot>
</AsComponent>


<script>
    import { getAllContexts } from "svelte"
    import AsComponent from "./AsComponent.svelte"

    const contexts = getAllContexts()
    let template;
</script>
