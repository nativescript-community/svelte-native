<svelte:options accessors={true}/>

<script>
  import { setContext } from 'svelte';
  import { Template } from "@nativescript-community/svelte-native/components";
  import ContextReader from './ContextReader.svelte';
  export let test_subject;

  setContext('demo-context', 'from the declaring component');
</script>

<Template bind:this={test_subject}><ContextReader /></Template>
