<svelte:options accessors={true}/>

<script>
  import { fade, fly } from '@nativescript-community/svelte-native/transitions';
  export let show = true;
  export let outer = true;
</script>

<stackLayout>
  {#if show}
    <label text="direct" {@attach fade({ duration: 80 })} />
  {/if}
  {#if outer}
    <stackLayout>
      <label text="nested" {@attach fly({ duration: 80, y: 20 })} />
    </stackLayout>
  {/if}
</stackLayout>
