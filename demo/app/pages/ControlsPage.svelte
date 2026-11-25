<scrollView>
    <stackLayout class="p-6">
        <label text="Native Controls" class="text-2xl font-bold text-purple-800 mb-4" />

        <!-- Slider -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Slider" class="text-lg font-bold text-purple-700 mb-1" />
            <slider bind:value={() => sliderValue, (v) => (sliderValue = Math.round(v))} minValue="0" maxValue="100" class="text-purple-700" />
            <label class="text-center text-base text-gray-600">
                <formattedString>
                    <span text="Value: " />
                    <span text={sliderValue.toString()} class="font-bold text-purple-700" />
                </formattedString>
            </label>
            <progress value={sliderValue} maxValue="100" class="text-purple-700 mt-2" />
        </stackLayout>

        <!-- Switch -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Switch" class="text-lg font-bold text-purple-700 mb-2" />
            <gridLayout columns="*, auto" class="mb-2">
                <label col="0" text="Enable notifications" class="text-base text-gray-700" />
                <switch col="1" class="text-purple-700" bind:checked={notifications} />
            </gridLayout>
            <gridLayout columns="*, auto">
                <label col="0" text="Auto-save" class="text-base text-gray-700" />
                <switch col="1" class="text-purple-700" bind:checked={autoSave} />
            </gridLayout>
        </stackLayout>

        <!-- Status summary -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Settings Summary" class="text-lg font-bold text-purple-700 mb-2" />
            <label text={'Notifications: ' + (notifications ? 'On' : 'Off')} class={'text-base mb-1 ' + (notifications ? 'text-green-700' : 'text-red-500')} />
            
            <label text={'Auto-Save: ' + (autoSave ? 'On' : 'Off')} class={'text-base ' + (autoSave ? 'text-green-700' : 'text-red-500')} />
        </stackLayout>

        <!-- Event forwarding -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Event forwarding" class="text-lg font-bold text-purple-700 mb-1" />
            <label text="TapButton forwards tap and longPress with on:tap on:longPress; Stepper uses createEventDispatcher." textWrap={true} class="text-sm text-gray-600 mb-2" />
            <Stepper value={stepValue} on:change={(e) => (stepValue = e.detail.value)} />
            <TapButton text="Tap or long-press me" on:tap={(e) => (lastEvent = `tap from ${e.object.constructor.name}`)} on:longPress={(e) => (lastEvent = `longPress (${e.eventName})`)} />
            <label text={`Stepper: ${stepValue} · last event: ${lastEvent}`} textWrap={true} class="text-base text-center text-gray-700 mt-2" />
        </stackLayout>

        <!-- Transitions -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Transitions" class="text-lg font-bold text-purple-700 mb-1" />
            <label text="Native animations through attachments: the intro plays when an element is added after mount, the outro keeps it on screen until done." textWrap={true} class="text-sm text-gray-600 mb-2" />
            <gridLayout columns="*, *, *" class="mb-2">
                <button col="0" text={showFade ? 'Hide fade' : 'Show fade'} class="bg-purple-700 text-white rounded-lg m-1" ontap={() => (showFade = !showFade)} />
                <button col="1" text={showSlide ? 'Hide slide' : 'Show slide'} class="bg-purple-700 text-white rounded-lg m-1" ontap={() => (showSlide = !showSlide)} />
                <button col="2" text="Add row" class="bg-purple-700 text-white rounded-lg m-1" ontap={() => rows = [...rows, nextRow++]} />
            </gridLayout>
            {#if showFade}
                <label text="I fade" class="bg-purple-200 text-purple-900 rounded-lg p-3 mb-1" {@attach fade({ duration: 300 })} />
            {/if}
            {#if showSlide}
                <label text="I slide open" class="bg-purple-300 text-purple-900 rounded-lg p-3 mb-1" {@attach slide({ duration: 300 })} />
            {/if}
            {#each rows as row (row)}
                <gridLayout columns="*, auto" class="bg-white rounded-lg p-2 mb-1" {@attach fly({ x: 120, duration: 250 })}>
                    <label col="0" text={`Row ${row}`} class="text-base text-gray-800" />
                    <button col="1" text="✕" class="text-red-500" ontap={() => (rows = rows.filter((r) => r !== row))} />
                </gridLayout>
            {/each}
        </stackLayout>

        <!-- Segmented bar -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-2">
            <label text="Segmented Bar" class="text-lg font-bold text-purple-700 mb-2" />
            <segmentedBar bind:selectedIndex={selectedPriority}>
                <segmentedBarItem title="Low" />
                <segmentedBarItem title="Medium" />
                <segmentedBarItem title="High" />
            </segmentedBar>
            <label text={'Priority: ' + priorities[selectedPriority]} class="text-base text-center text-gray-700 mt-3 font-semibold" />
        </stackLayout>
    </stackLayout>
</scrollView>

<script>
    import Stepper from '../components/Stepper.svelte';
    import TapButton from '../components/TapButton.svelte';
    import { fade, fly, slide } from '@nativescript-community/svelte-native/transitions';

    let showFade = true;
    let showSlide = false;
    let rows = [1, 2];
    let nextRow = 3;

    let stepValue = 0;
    let lastEvent = 'none';
    let sliderValue = 50;
    let notifications = false;
    let autoSave = false;
    let selectedPriority = 1;
    const priorities = ['Low', 'Medium', 'High'];
</script>
