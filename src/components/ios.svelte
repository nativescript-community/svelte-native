<script>
    let { children } = $props();
</script>
{#if __IOS__}
    {@render children?.()}
{/if}
