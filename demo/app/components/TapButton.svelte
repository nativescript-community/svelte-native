<script>
  export let text = '';
</script>

<!-- on:tap / on:longPress without a handler forward the native event to whoever uses <TapButton> -->
<button {text} {...$$restProps} class="bg-purple-700 text-white rounded-lg m-1" on:tap on:longPress />
