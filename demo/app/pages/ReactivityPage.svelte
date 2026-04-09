<scrollView>
    <stackLayout class="p-6">
        <!-- Counter -->
        <label text="Reactive Counter" class="text-2xl font-bold text-purple-800 mb-4" />
        <gridLayout columns="auto, *, auto" class="bg-gray-100 rounded-xl p-4 mb-6">
            <button col="0" text="-" class="bg-purple-700 text-white text-2xl w-12 h-12 rounded-lg" ontap={() => count--} />
            <label col="1" text={count.toString()} class="text-4xl font-bold text-center text-purple-900" />
            <button col="2" text="+" class="bg-purple-700 text-white text-2xl w-12 h-12 rounded-lg" ontap={() => count++} />
        </gridLayout>

        <!-- Derived values -->
        <label text="Derived Values" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <gridLayout columns="*, auto" class="mb-2">
                <label col="0" text="Doubled" class="text-base text-gray-600" />
                <label col="1" text={doubled.toString()} class="text-base font-bold text-purple-700" />
            </gridLayout>
            <gridLayout columns="*, auto" class="mb-2">
                <label col="0" text="Squared" class="text-base text-gray-600" />
                <label col="1" text={squared.toString()} class="text-base font-bold text-purple-700" />
            </gridLayout>
            <gridLayout columns="*, auto">
                <label col="0" text="Is Even?" class="text-base text-gray-600" />
                <label col="1" text={isEven ? 'Yes' : 'No'} class="text-base font-bold text-purple-700" />
            </gridLayout>
        </stackLayout>

        <!-- Text binding -->
        <label text="Two-Way Binding" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <textField text={name} hint="Type your name..." class="bg-white rounded-lg p-3 mb-3 text-base border border-gray-300" onblur={(e) => name = e.object.text} />
            <label class="text-base text-gray-700">
                <formattedString>
                    <span text="Hello, " class="text-gray-500" />
                    <span text={name || 'World'} class="font-bold text-purple-700" />
                    <span text="!" class="text-gray-500" />
                </formattedString>
            </label>
        </stackLayout>

        <!-- Conditional rendering -->
        <label text="Conditional Rendering" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-2">
            <gridLayout columns="*, *" class="mb-3">
                <button col="0" text="Show" class="bg-green-600 text-white rounded-lg mr-1 p-2" ontap={() => visible = true} />
                <button col="1" text="Hide" class="bg-red-500 text-white rounded-lg ml-1 p-2" ontap={() => visible = false} />
            </gridLayout>
            {#if visible}
                <label text="Now you see me!" class="text-center text-lg font-semibold text-green-700 bg-green-100 rounded-lg p-4" />
            {:else}
                <label text="Gone!" class="text-center text-lg text-gray-400 italic p-4" />
            {/if}
        </stackLayout>
    </stackLayout>
</scrollView>

<script>
    let count = 0;
    let name = '';
    let visible = true;

    $: doubled = count * 2;
    $: squared = count * count;
    $: isEven = count % 2 === 0;
</script>
