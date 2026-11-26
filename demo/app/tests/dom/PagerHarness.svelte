<svelte:options accessors={true}/>

<pager bind:this={test_subject} {items}>
  <Template let:item let:index>
    <label text="page {item} #{index}" />
  </Template>
</pager>

<script>
    import { Template } from '@nativescript-community/svelte-native/components'
    export let test_subject;
    export let items = ['a', 'b', 'c'];
</script>
