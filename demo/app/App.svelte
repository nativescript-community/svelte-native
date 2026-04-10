<page>
    <actionBar title="Svelte 5 + NativeScript" class="bg-purple-800 text-white" />
    <tabView selectedIndex={selectedTab} onselectedIndexChange={(e) => selectedTab = e.value}>
        <tabViewItem title="Reactivity" iconSource={tabIcons.reactivity} class="text-sm">
            <ReactivityPage />
        </tabViewItem>
        <tabViewItem title="Stores" iconSource={tabIcons.stores} class="text-sm">
            <StoresPage />
        </tabViewItem>
        <tabViewItem title="Controls" iconSource={tabIcons.controls} class="text-sm">
            <ControlsPage />
        </tabViewItem>
        <tabViewItem title="About" iconSource={tabIcons.about} class="text-sm">
            <AboutPage />
        </tabViewItem>
    </tabView>
</page>

<script>
    import ReactivityPage from './pages/ReactivityPage.svelte'
    import StoresPage from './pages/StoresPage.svelte'
    import ControlsPage from './pages/ControlsPage.svelte'
    import AboutPage from './pages/AboutPage.svelte'

    const tabIcons = {
        reactivity: __APPLE__ ? 'sys://figure.jumprope.circle.fill' : 'res://ic_tab_reactivity',
        stores: __APPLE__ ? 'sys://storefront.fill' : 'res://ic_tab_stores',
        controls: __APPLE__ ? 'sys://gamecontroller.fill' : 'res://ic_tab_controls',
        about: __APPLE__ ? 'sys://info.circle.fill' : 'res://ic_tab_about',
    };

    let selectedTab = 0;
</script>
