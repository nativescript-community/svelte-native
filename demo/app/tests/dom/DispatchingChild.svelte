<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export function fire(detail) {
    dispatch('done', detail);
  }
</script>
