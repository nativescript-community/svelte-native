<page>
    <actionBar title="Svelte 5 + NativeScript" class="bg-purple-800 text-white" />
    <tabView class="bg-white" selectedIndex={selectedTab} onselectedIndexChange={(e) => selectedTab = e.value}>
        <tabViewItem title="Reactivity" iconSource="sys://figure.jumprope.circle.fill" class="text-sm">
            <ReactivityPage />
        </tabViewItem>
        <tabViewItem title="Stores" iconSource="sys://storefront.fill" class="text-sm">
            <StoresPage />
        </tabViewItem>
        <tabViewItem title="Controls" iconSource="sys://gamecontroller.fill"class="text-sm">
            <ControlsPage />
        </tabViewItem>
        <tabViewItem title="About" iconSource="sys://info.circle.fill"class="text-sm">
            <AboutPage />
        </tabViewItem>
    </tabView>
</page>

<script>
    import ReactivityPage from './pages/ReactivityPage.svelte'
    import StoresPage from './pages/StoresPage.svelte'
    import ControlsPage from './pages/ControlsPage.svelte'
    import AboutPage from './pages/AboutPage.svelte'

    let selectedTab = 0;
</script>
