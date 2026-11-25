<gridLayout rows="auto, auto, *, auto, 130">
    <stackLayout row="0" class="p-4">
        <label text="CollectionView + Pager" class="text-2xl font-bold text-purple-800" />
        <label text="Plugin lists mount their templates through TemplateElement.mount and rebind recycled cells in place." textWrap={true} class="text-sm text-gray-600" />
    </stackLayout>

    <gridLayout row="1" columns="*, *, *, *" class="px-4 mb-2">
        <button col="0" text="Shuffle" class="bg-purple-700 text-white rounded-lg m-1" ontap={shuffle} />
        <button col="1" text="Bump #0" class="bg-purple-700 text-white rounded-lg m-1" ontap={bumpFirst} />
        <button col="2" text="Mutate #0" class="bg-purple-700 text-white rounded-lg m-1" ontap={mutateFirst} />
        <button col="3" text="Refresh" class="bg-purple-700 text-white rounded-lg m-1" ontap={() => collection?.nativeView.refresh()} />
    </gridLayout>

    <collectionview row="2" bind:this={collection} {items} colWidth="50%" rowHeight="70" itemTemplateSelector={(item) => (item.id % 5 === 0 ? 'wide' : 'default')} onitemTap={(e) => (lastTap = items[e.index].name)}>
        <Template let:item let:index>
            <gridLayout columns="*, auto" class="bg-purple-50 m-1 p-2 rounded-lg">
                <label col="0" text={`#${index} ${item.name}`} class="text-base text-gray-800" />
                <label col="1" text={`♥ ${item.likes}`} class="text-purple-700 font-bold" />
            </gridLayout>
        </Template>
        <Template key="wide" let:item let:index>
            <label text={`#${index} ${item.name} (wide template)`} class="bg-purple-200 m-1 p-2 rounded-lg text-base font-bold text-purple-900" />
        </Template>
    </collectionview>

    <label row="3" text={`Last tapped: ${lastTap} · pager page ${page + 1}/${pages.length}`} class="text-sm text-center text-gray-700 p-2" />

    <pager row="4" items={pages} selectedIndex={page} onselectedIndexChange={(e) => (page = e.value)} peaking="24" spacing="8">
        <Template let:item let:index>
            <stackLayout class="bg-purple-700 rounded-xl m-2 p-4">
                <label text={item.title} class="text-xl font-bold text-white" />
                <label text={`page ${index + 1} · ${item.visits} visits`} class="text-base text-purple-100" />
            </stackLayout>
        </Template>
    </pager>
</gridLayout>

<script lang="ts">
    import { Template } from '@nativescript-community/svelte-native/components';
    import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
    import type { CollectionView } from '@nativescript-community/ui-collectionview';

    type Row = { id: number; name: string; likes: number };

    let items: Row[] = $state(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}`, likes: 0 })));
    let pages = $state(Array.from({ length: 6 }, (_, i) => ({ title: `Page ${i + 1}`, visits: 0 })));
    let collection: NativeViewElementNode<CollectionView> | null = $state(null);
    let lastTap = $state('none');
    let page = $state(0);

    function shuffle() {
        items = [...items].sort(() => Math.random() - 0.5);
    }

    function bumpFirst() {
        items = [{ ...items[0], likes: items[0].likes + 1 }, ...items.slice(1)];
    }

    // items is deeply reactive: the visible cell updates without any rebind or refresh
    function mutateFirst() {
        items[0].likes++;
    }
</script>
