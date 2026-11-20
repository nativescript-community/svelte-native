import { Application, View } from '@nativescript/core';
import { navigate, createElement, initializeDom, FrameElement, NativeElementNode } from './dom';
import { DocumentNode } from './dom/basicdom';
import type {SvelteComponent} from './ambient.js';

// Override this function as the default is currently resetting entire content on NativeScript
global.__onLiveSyncCore = () => {
    Application.getRootView()?._onCssStateChange();
};

/** Launch and root creation can happen in either order, depending on the native runtime. */
function runApplication<T>(create: () => { instance: SvelteComponent<T>; view: View }): Promise<SvelteComponent<T>> {
    return new Promise((resolve, reject) => {
        let instance: SvelteComponent<T>;
        let launched = false;
        let ended = false;
        let settled = false;

        const removeListeners = () => {
            Application.off(Application.launchEvent, onLaunch);
            Application.off(Application.exitEvent, onExit);
        };
        const destroy = () => {
            const component = instance;
            instance = undefined;
            component?.$destroy();
        };
        const ready = () => {
            if (!ended && !settled && launched && instance) {
                settled = true;
                Application.off(Application.launchEvent, onLaunch);
                resolve(instance);
            }
        };
        const onLaunch = () => {
            launched = true;
            ready();
        };
        const onExit = () => {
            ended = true;
            removeListeners();
            try {
                destroy();
            } finally {
                if (!settled) reject(new Error('Application exited before the root component was ready'));
            }
        };
        const fail = (error: unknown) => {
            ended = true;
            removeListeners();
            try {
                destroy();
            } finally {
                reject(error);
            }
        };

        Application.on(Application.launchEvent, onLaunch);
        Application.on(Application.exitEvent, onExit);
        try {
            Application.run({ create: () => {
                if (ended) throw new Error('Application has already exited or failed to start');
                try {
                    const root = create();
                    instance = root.instance;
                    ready();
                    return root.view;
                } catch (error) {
                    fail(error);
                    throw error;
                }
            }});
        } catch (error) {
            fail(error);
        }
    });
}

export function svelteNativeNoFrame<T>(rootElement: typeof SvelteComponent<T>, data: T): Promise<SvelteComponent<T>> {
    return runApplication(() => {
        const frag = createElement('fragment', window.document as unknown as DocumentNode);
        const instance = new rootElement({ target: frag, props: data || {} });
        return { instance, view: (frag.firstChild as NativeElementNode<View>).nativeElement };
    });
}

export function svelteNative<T>(startPage: typeof SvelteComponent<T>, data: T): Promise<SvelteComponent<T>> {
    return runApplication(() => {
        const rootFrame = createElement('frame', window.document as unknown as DocumentNode) as FrameElement;
        rootFrame.setAttribute("id", "app-root-frame");
        const instance = navigate({ page: startPage, props: data || {}, frame: rootFrame });
        return { instance, view: rootFrame.nativeView };
    });
}

// Svelte looks to see if window is undefined in order to determine if it is running on the client or in SSR.
// any imports of svelte/internals global also bind to the current value of window (during module import) so we need to 
// configure our dom now.
initializeDom()


export { navigate, goBack, showModal, closeModal, isModalOpened, initializeDom, DomTraceCategory } from "./dom"
