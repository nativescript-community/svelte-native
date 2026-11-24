<gridLayout rows="auto, auto, *">
    <stackLayout row="0" class="p-4">
        <label text="ListView + Template" class="text-2xl font-bold text-purple-800" />
        <label text={`${items.length} rows, recycled natively. Tap a row to open it in a modal.`} textWrap={true} class="text-sm text-gray-600" />
        <label text={lastResult} class="text-sm text-purple-700 mt-1" />
    </stackLayout>

    <gridLayout row="1" columns="*, *, *, *" class="px-4 mb-2">
        <button col="0" text="Shuffle" class="bg-purple-700 text-white rounded-lg m-1" ontap={shuffle} />
        <button col="1" text="Bump #0" class="bg-purple-700 text-white rounded-lg m-1" ontap={bumpFirst} />
        <button col="2" text={keyed ? 'Single' : 'Keyed'} class="bg-purple-700 text-white rounded-lg m-1" ontap={() => (keyed = !keyed)} />
        <button col="3" text="Top" class="bg-purple-700 text-white rounded-lg m-1" on:tap={scrollTop} />
    </gridLayout>

    {#if keyed}
        <listView row="2" bind:this={list} {items} itemTemplateSelector={(item) => (item.id % 2 ? 'odd' : 'even')} onitemTap={open}>
            <Template key="even" let:item>
                <label text={`even · ${item.name}`} class="p-4 text-base text-gray-800" />
            </Template>
            <Template key="odd">
                {#snippet children({ item, index })}
                    <label text={`odd · ${item.name} @${index}`} class="p-4 text-base text-purple-700 bg-purple-50" />
                {/snippet}
            </Template>
        </listView>
    {:else}
        <listView row="2" bind:this={list} {items} onitemTap={open}>
            <Template let:item let:index>
                <gridLayout columns="auto, *, auto" class="p-4">
                    <label col="0" text={`#${index}`} class="text-gray-400 w-12" />
                    <label col="1" text={item.name} class="text-base text-gray-800" />
                    <label col="2" text={`♥ ${item.likes}`} class="text-purple-700 font-bold" />
                </gridLayout>
            </Template>
        </listView>
    {/if}
</gridLayout>

<script lang="ts">
    import { Template } from '@nativescript-community/svelte-native/components';
    import { showModal } from '@nativescript-community/svelte-native';
    import ItemModal from './ItemModal.svelte';
    import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
    import type { ListView } from '@nativescript/core';

    type Row = { id: number; name: string; likes: number };

    let items: Row[] = $state(Array.from({ length: 200 }, (_, i) => ({ id: i, name: `Item ${i}`, likes: 0 })));
    let keyed = $state(false);
    let list: NativeViewElementNode<ListView> | null = $state(null);
    let lastResult = $state('No modal result yet');

    function scrollTop() {
        list?.nativeView.scrollToIndexAnimated(0);
    }

    function shuffle() {
        items = [...items].sort(() => Math.random() - 0.5);
    }

    function bumpFirst() {
        items = [{ ...items[0], likes: items[0].likes + 1 }, ...items.slice(1)];
    }

    async function open(e: { index: number }) {
        const row = items[e.index];
        const liked = await showModal<boolean, { row: Row }>({ page: ItemModal, props: { row } });
        if (liked) {
            items = items.map((r) => (r.id === row.id ? { ...r, likes: r.likes + 1 } : r));
        }
        lastResult = `${row.name}: ${liked ? 'liked' : 'dismissed'}`;
    }
</script>
