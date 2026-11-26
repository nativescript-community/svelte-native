<svelte:options accessors={true}/>

<listView bind:this="{test_subject}" items={items} itemTemplateSelector={selectTemplate}>
  <Template key="odd" let:item>
     <label text="Odd {item}" />
  </Template>
  <Template key="even" let:item>
      <label text="Even {item}" />
  </Template>
</listView>

<script>
    import { Template } from '@nativescript-community/svelte-native/components'
    export let test_subject;

    let items = ["item 0", "item 1", "item 2"]

    function selectTemplate(item, index, items) {
        return  (index % 2 == 0) ? "even" : "odd";
    }
</script>
