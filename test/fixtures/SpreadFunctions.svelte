<svelte:options accessors={true} />

<script>
  export let rest = {};
  export let selector = undefined;
</script>

<collectionview {...rest} itemTemplateSelector={selector} rowHeight="70" />
