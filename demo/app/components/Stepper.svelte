<script>
  import { createEventDispatcher } from 'svelte';
  import TapButton from './TapButton.svelte';
  export let value = 0;
  const dispatch = createEventDispatcher();
  function step(by) {
    value += by;
    dispatch('change', { value });
  }
</script>

<gridLayout columns="auto, *, auto">
  <TapButton col="0" text="−" on:tap={() => step(-1)} />
  <label col="1" text={value.toString()} class="text-xl text-center font-bold text-purple-800" />
  <TapButton col="2" text="+" on:tap={() => step(1)} />
</gridLayout>
