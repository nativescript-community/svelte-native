import { svelteNativeNoFrame } from "@nativescript-community/svelte-native";
import CollectionViewElement from "@nativescript-community/ui-collectionview/svelte";
import PagerElement from "@nativescript-community/ui-pager/svelte";
import "./globals";
import App from "./App.svelte";

CollectionViewElement.register();
PagerElement.register();

svelteNativeNoFrame(App, {});
