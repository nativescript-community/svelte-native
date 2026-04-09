<script>
    let { children } = $props();
</script>
{#if __ANDROID__}
    {@render children?.()}
{/if}
