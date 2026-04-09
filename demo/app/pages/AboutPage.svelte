<scrollView>
    <stackLayout class="p-6">
        <!-- Hero -->
        <stackLayout class="bg-purple-800 rounded-2xl p-6 mb-6">
            <label text="Svelte 5" class="text-4xl font-bold text-white text-center" />
            <label text="+" class="text-2xl text-purple-300 text-center" />
            <label text="NativeScript" class="text-4xl font-bold text-white text-center mb-2" />
            <label text="Custom Renderer" class="text-lg text-purple-200 text-center" />
        </stackLayout>

        <!-- Version info -->
        <label text="Technology" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <gridLayout columns="*, auto" class="mb-3">
                <label col="0" text="Svelte" class="text-base text-gray-600" />
                <label col="1" text="5 (Custom Renderer API)" class="text-base font-bold text-purple-700" />
            </gridLayout>
            <gridLayout columns="*, auto" class="mb-3">
                <label col="0" text="NativeScript" class="text-base text-gray-600" />
                <label col="1" text="9.x" class="text-base font-bold text-purple-700" />
            </gridLayout>
            <gridLayout columns="*, auto" class="mb-3">
                <label col="0" text="Styling" class="text-base text-gray-600" />
                <label col="1" text="Tailwind CSS" class="text-base font-bold text-purple-700" />
            </gridLayout>
            <gridLayout columns="*, auto">
                <label col="0" text="Platform" class="text-base text-gray-600" />
                <label col="1" text={platform} class="text-base font-bold text-purple-700" />
            </gridLayout>
        </stackLayout>

        <!-- Features -->
        <label text="What's New" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            {#each features as feature}
                <gridLayout columns="30, *" class="mb-3">
                    <label col="0" text={feature.icon} class="fas text-purple-600 text-base mr-3" />
                    <stackLayout col="1">
                        <label text={feature.title} class="text-base font-bold text-gray-800" />
                        <label text={feature.desc} class="text-sm text-gray-500" textWrap="true" />
                    </stackLayout>
                </gridLayout>
            {/each}
        </stackLayout>

        <!-- Tap counter -->
        <stackLayout class="bg-purple-100 rounded-xl p-4 mb-2">
            <label text={'Tapped ' + tapCount + ' times'} class="text-center text-base text-purple-700 mb-2" />
            <button text="Tap Me!" class="bg-purple-700 text-white rounded-lg p-3 text-base font-bold" ontap={() => tapCount++} />
        </stackLayout>
    </stackLayout>
</scrollView>

<script>
    import { isIOS, isAndroid } from '@nativescript/core/platform';

    let tapCount = 0;
    const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Unknown';

    const features = [
        { icon: '\uf1b2', title: 'Custom Renderer API', desc: 'Svelte 5 native rendering without DOM shims' },
        { icon: '\uf0e7', title: 'Reactive by Default', desc: 'Fine-grained reactivity with Svelte stores' },
        { icon: '\uf3fd', title: 'Truly Native', desc: 'Real native UI components, not web views' },
        { icon: '\uf53f', title: 'Tailwind CSS', desc: 'Utility-first styling for native views' },
    ];
</script>
