<script>
    import { fade } from "@nativescript-community/svelte-native/transitions";
  import Header from "../Header.svelte";
  let alive = false;
  function onUnloaded() {
    console.log('onUnlladed')
  }
</script>

<page>
  <Header title="Transitions"/>
  <stackLayout>
    <button on:tap={() => (alive = true)}>Alive</button>
    <button on:tap={() => (alive = false)}>Dead</button>
    {#if alive}
    <label text="This is a text wich should be transitioned" transition:fade={{duration: 1000}} on:unloaded={onUnloaded}>
    </label>
      {/if}
  </stackLayout>

</page>
