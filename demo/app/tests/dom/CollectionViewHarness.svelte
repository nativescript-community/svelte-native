<svelte:options accessors={true}/>

<collectionview bind:this={test_subject} {items}>
  <Template let:item let:index>
    <label text="cv {item} #{index}" />
  </Template>
</collectionview>

<script>
    import { Template } from '@nativescript-community/svelte-native/components'
    export let test_subject;
    export let items = ['a', 'b', 'c'];
</script>
