import { svelteNativeNoFrame } from "@nativescript-community/svelte-native";
// import RadSideDrawerElement from "@nativescript-community/svelte-native-nativescript-ui/sidedrawer"

// RadSideDrawerElement.register();

//import * as trace from "@nativescript/core/trace"
//trace.enable();
//trace.addCategories(DomTraceCategory);

import App from "./pages/TransitionsPage.svelte";
svelteNativeNoFrame(App as typeof SvelteComponent, {});
