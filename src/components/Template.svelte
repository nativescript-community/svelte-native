<script>
    import AsComponent from "./AsComponent.svelte"
    let { children, ...rest } = $props();
    let template = $state(null);
</script>
<template {...rest} component={template} xmlns="tns"></template>
<AsComponent bind:component={template}>
    {#snippet children(props)}
        {@render children?.(props)}
    {/snippet}
</AsComponent>
