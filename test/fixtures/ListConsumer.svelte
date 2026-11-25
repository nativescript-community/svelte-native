<script>
  import { setContext } from 'svelte';
  import Template from '../../src/components/Template.svelte';
  import ReadsContext from './ReadsContext.svelte';

  setContext('page', 'from page');

  // records which bindings re-run, see test/template.test.ts
  const track = (kind, value) => (globalThis.__reads?.push(kind), String(value?.name ?? value));
</script>

<listView>
  <Template key="slot" extra="passed" let:item let:index><label text="slot {item} #{index}" /></Template>
  <Template key="snippet">
    {#snippet children({ item, index })}<label text="snippet {item} #{index}" />{/snippet}
  </Template>
  <Template key="object" let:item><label text={item.name} /></Template>
  <Template key="context"><ReadsContext /></Template>
  <Template key="tracked" let:item let:index>
    <label text={track('item', item)} />
    <label text={track('index', index)} />
  </Template>
</listView>
