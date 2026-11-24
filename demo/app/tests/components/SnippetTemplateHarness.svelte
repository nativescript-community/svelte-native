<script>
  import { Template } from "@nativescript-community/svelte-native/components";
</script>

<Template>
  {#snippet children({ item, index })}
    <label text="snippet {item} #{index}" />
  {/snippet}
</Template>
