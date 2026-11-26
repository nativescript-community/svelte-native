<svelte:options accessors={true} />

<script>
  import ForwardingButton from './ForwardingButton.svelte';
  import ForwardingWrapper from './ForwardingWrapper.svelte';
  import DispatchingChild from './DispatchingChild.svelte';
  export let taps = [];
  export let wrappedTaps = [];
  export let longPresses = [];
  export let done = [];
  export let child;
</script>

<stackLayout>
  <ForwardingButton label="direct" on:tap={(e) => (taps = [...taps, e])} on:longPress={(e) => (longPresses = [...longPresses, e])} />
  <ForwardingWrapper on:tap={(e) => (wrappedTaps = [...wrappedTaps, e])} />
  <DispatchingChild bind:this={child} on:done={(e) => (done = [...done, e])} />
</stackLayout>
