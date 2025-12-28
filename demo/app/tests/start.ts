import { initializeDom, DomTraceCategory } from "@nativescript-community/svelte-native";


import { Trace as trace } from "@nativescript/core"
trace.enable();
trace.addCategories(DomTraceCategory);


before(() => { initializeDom(); });