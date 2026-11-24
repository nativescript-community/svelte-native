<!-- `component` is applied by an attachment: Svelte drops function values from spread
     attributes when a custom renderer is active. Instances mounted from the template (e.g.
     ListView rows) are unmounted with it. -->
<template {...$$restProps} {@attach (node) => node.setAttribute('component', template)} {@attach (node) => () => node.unmountInstances?.()} xmlns="tns"></template>
<AsComponent bind:component="{template}" let:props>
    <slot item="{(props ? props.item : null)}" index={(props ? props.index : null)}></slot>
</AsComponent>


<script>
    import AsComponent from "./AsComponent.svelte"
    let template;
</script>
