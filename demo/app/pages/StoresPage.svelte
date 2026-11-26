<scrollView>
    <stackLayout class="p-6">
        <label text="Svelte Stores" class="text-2xl font-bold text-purple-800 mb-4" />

        <!-- Timer store -->
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
            <label text="Live Timer" class="text-lg font-bold text-purple-700 mb-2" />
            <label text={$elapsed + 'ms elapsed'} class="text-3xl font-bold text-center text-purple-900 mb-3" />
            <gridLayout columns="*, *, *">
                <button col="0" text={running ? 'Pause' : 'Start'} class={'rounded-lg mr-1 p-2 text-white ' + (running ? 'bg-yellow-600' : 'bg-green-600')} ontap={toggleTimer} />
                <button col="1" text="Reset" class="bg-gray-500 text-white rounded-lg mx-1 p-2" ontap={resetTimer} />
                <button col="2" text="Lap" class="bg-purple-700 text-white rounded-lg ml-1 p-2" ontap={addLap} />
            </gridLayout>
        </stackLayout>

        <!-- Lap times -->
        {#if laps.length > 0}
            <label text="Lap Times" class="text-xl font-bold text-purple-800 mb-2" />
            <stackLayout class="bg-gray-100 rounded-xl p-4 mb-6">
                {#each laps as lap, i}
                    <gridLayout columns="auto, *, auto" class={'py-2 ' + (i < laps.length - 1 ? 'border-b border-gray-200' : '')}>
                        <label col="0" class="text-sm text-gray-400">
                            <formattedString>
                                <span text="Lap " />
                                <span text={(i + 1).toString()} />
                            </formattedString>
                        </label>
                        <label col="2" text={lap + 's'} class="text-base font-bold text-purple-700" />
                    </gridLayout>
                {/each}
            </stackLayout>
        {/if}

        <!-- Writable store -->
        <label text="Shared Counter Store" class="text-xl font-bold text-purple-800 mb-2" />
        <stackLayout class="bg-gray-100 rounded-xl p-4 mb-2">
            <label text={'Store value: ' + $counterStore} class="text-2xl font-bold text-center text-purple-900 mb-3" />
            <gridLayout columns="*, *, *">
                <button col="0" text="-5" class="bg-red-500 text-white rounded-lg mr-1 p-2" ontap={() => counterStore.update(n => n - 5)} />
                <button col="1" text="Reset" class="bg-gray-500 text-white rounded-lg mx-1 p-2" ontap={() => counterStore.set(0)} />
                <button col="2" text="+5" class="bg-green-600 text-white rounded-lg ml-1 p-2" ontap={() => counterStore.update(n => n + 5)} />
            </gridLayout>
        </stackLayout>
    </stackLayout>
</scrollView>

<script>
    import { writable } from 'svelte/store';
    import { onDestroy } from 'svelte';

    // Timer
    let elapsed = writable(0);
    let running = false;
    let interval;
    let laps = [];

    function toggleTimer() {
        if (running) {
            clearInterval(interval);
        } else {
            interval = setInterval(() => {
                elapsed.update(n => n + 1);
            }, 100);
        }
        running = !running;
    }

    function resetTimer() {
        clearInterval(interval);
        running = false;
        elapsed.set(0);
        laps = [];
    }

    function addLap() {
        let currentVal;
        elapsed.subscribe(v => currentVal = v)();
        laps = [...laps, currentVal];
    }

    onDestroy(() => clearInterval(interval));

    // Shared counter
    const counterStore = writable(0);
</script>
