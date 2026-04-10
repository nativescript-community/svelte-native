<template {...$$restProps} component="{template}" xmlns="tns"></template>
<AsComponent bind:component="{template}" let:props>
    <slot item="{(props ? props.item : null)}" index={(props ? props.index : null)}></slot>
</AsComponent>


<script>
    import AsComponent from "./AsComponent.svelte"
    let template;
</script>