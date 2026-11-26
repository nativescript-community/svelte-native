<svelte:options accessors={true} />

<script>
  import Forwarder from './Forwarder.svelte';
  export let taps = [];
</script>

<Forwarder on:tap={(e) => (taps = [...taps, e])} on:tap={() => (taps = [...taps, 'second'])} />
