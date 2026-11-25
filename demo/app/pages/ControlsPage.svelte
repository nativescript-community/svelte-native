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

    let stepValue = 0;
    let lastEvent = 'none';
    let sliderValue = 50;
    let notifications = false;
    let autoSave = false;
    let selectedPriority = 1;
    const priorities = ['Low', 'Medium', 'High'];
</script>
