<script>
  import { getContext } from 'svelte';
  const value = getContext('page');
</script>

<label text={value} />
