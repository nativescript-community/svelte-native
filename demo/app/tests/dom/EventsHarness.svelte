<svelte:options accessors={true}/>

<script>
  export let button;
  export let taps = 0;
  export let onceTaps = 0;
  export let text = 'start';
</script>

<stackLayout>
  <button bind:this={button} on:tap={() => taps++} on:tap|once={() => onceTaps++} />
  <textField bind:text={text} />
</stackLayout>
