import { flushSync } from 'svelte';
import { createElement, type ViewNode } from '@nativescript-community/svelte-native/dom';
import { render } from '@nativescript-community/svelte-native/dom/renderer';

export function mountHarness<T = any>(component: any, options: { target?: ViewNode; anchor?: ViewNode; props?: Record<string, any> } = {}) {
    const target = options.target ?? createElement('fragment');
    const { component: instance, unmount } = render(component, { target, anchor: options.anchor, props: options.props });
    return { target, instance: instance as T, unmount, flush: () => flushSync() };
}
