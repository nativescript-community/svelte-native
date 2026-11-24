<page>
    <stackLayout class="p-6">
        <label text={row.name} class="text-2xl font-bold text-purple-800 mb-2" />
        <label text={`Currently ♥ ${row.likes}`} class="text-base text-gray-700 mb-6" />
        <button text="Like" class="bg-purple-700 text-white rounded-lg mb-2" ontap={() => closeModal(true)} />
        <button text="Close" class="bg-gray-200 text-gray-800 rounded-lg" ontap={() => closeModal(false)} />
    </stackLayout>
</page>

<script lang="ts">
    import { closeModal } from '@nativescript-community/svelte-native';

    let { row }: { row: { name: string; likes: number } } = $props();
</script>
