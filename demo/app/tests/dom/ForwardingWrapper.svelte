<script>
  import ForwardingButton from './ForwardingButton.svelte';
</script>

<!-- forwards a component event that is itself forwarded from a native element -->
<ForwardingButton label="wrapped" on:tap />
