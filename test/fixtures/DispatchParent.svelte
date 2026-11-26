<svelte:options accessors={true} />

<script>
  import Dispatcher from './Dispatcher.svelte';
  export let received = [];
  export let child;
</script>

<Dispatcher bind:this={child} on:done={(e) => (received = [...received, e.detail])} on:done={(e) => (received = [...received, 'also:' + e.detail])} />
