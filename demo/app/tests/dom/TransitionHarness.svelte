<svelte:options accessors={true}/>

<script>
  import { fade, fly, slide } from '@nativescript-community/svelte-native/transitions';
  export let show = true;
  export let outer = true;
  export let open = true;
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
  {#if open}
    <label text="slid" {@attach slide({ duration: 80 })} />
  {/if}
  {#if show}
    <label text="faded" {@attach fade({ duration: 80, collapse: true })} />
  {/if}
</stackLayout>
