<script>
  import { getContext } from 'svelte';
  const value = getContext('demo-context');
</script>

<label text={value} />
