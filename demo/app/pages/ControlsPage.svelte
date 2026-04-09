<scrollView>
    <stackLayout class="p-6">
        <label text="Native Controls" class="text-2xl font-bold text-purple-800 mb-4" />

        <!-- Slider -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Slider" class="text-lg font-bold text-purple-700 mb-1" />
            <slider value={sliderValue} minValue="0" maxValue="100" class="text-purple-700" onvalueChange={(e) => sliderValue = Math.round(e.value)} />
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
                <switch col="1" checked={notifications} class="text-purple-700" oncheckedChange={(e) => notifications = e.value} />
            </gridLayout>
            <gridLayout columns="*, auto">
                <label col="0" text="Auto-save" class="text-base text-gray-700" />
                <switch col="1" checked={autoSave} class="text-purple-700" oncheckedChange={(e) => autoSave = e.value} />
            </gridLayout>
        </stackLayout>

        <!-- Status summary -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Settings Summary" class="text-lg font-bold text-purple-700 mb-2" />
            <label text={'Notifications: ' + (notifications ? 'On' : 'Off')} class={'text-base mb-1 ' + (notifications ? 'text-green-700' : 'text-red-500')} />
            
            <label text={'Auto-Save: ' + (autoSave ? 'On' : 'Off')} class={'text-base ' + (autoSave ? 'text-green-700' : 'text-red-500')} />
        </stackLayout>

        <!-- Segmented bar -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-2">
            <label text="Segmented Bar" class="text-lg font-bold text-purple-700 mb-2" />
            <segmentedBar selectedIndex={selectedPriority} onselectedIndexChange={(e) => selectedPriority = e.value}>
                <segmentedBarItem title="Low" />
                <segmentedBarItem title="Medium" />
                <segmentedBarItem title="High" />
            </segmentedBar>
            <label text={'Priority: ' + priorities[selectedPriority]} class="text-base text-center text-gray-700 mt-3 font-semibold" />
        </stackLayout>
    </stackLayout>
</scrollView>

<script>
    let sliderValue = 50;
    let notifications = true;
    let autoSave = true;
    let selectedPriority = 1;
    const priorities = ['Low', 'Medium', 'High'];
</script>
