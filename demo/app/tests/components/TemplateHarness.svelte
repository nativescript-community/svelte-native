<svelte:options accessors={true}/>

<script>
  import { Template } from "@nativescript-community/svelte-native/components";
  export let test_subject;
</script>

<Template bind:this={test_subject} extra-prop="test extra prop" let:item let:index>
  <label text="test text {item ? item : ''}{index != null ? ` #${index}` : ''}" />
</Template>
