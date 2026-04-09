import { Application, View } from '@nativescript/core';
import { navigate, ViewNode, createElement, initializeDom, FrameElement, NativeElementNode } from './dom';
import { DocumentNode } from './dom/basicdom';
import type {SvelteComponent} from './ambient.js';

// Override this function as the default is currently resetting entire content on NativeScript
global.__onLiveSyncCore = () => {
    Application.getRootView()?._onCssStateChange();
};

// Svelte 5 imports - mount/unmount API
// These are imported lazily to avoid issues if svelte 5 isn't installed
let _svelte5Mount: typeof import('svelte').mount | null = null;
let _svelte5Unmount: typeof import('svelte').unmount | null = null;

function getSvelte5Api() {
    if (_svelte5Mount && _svelte5Unmount) {
        return { mount: _svelte5Mount, unmount: _svelte5Unmount };
    }
    try {
        // Dynamic require to avoid breaking svelte 4 users
        const svelte = require('svelte');
        if (typeof svelte.mount === 'function') {
            _svelte5Mount = svelte.mount;
            _svelte5Unmount = svelte.unmount;
            return { mount: _svelte5Mount, unmount: _svelte5Unmount };
        }
    } catch {
        // svelte 5 not available
    }
    return null;
}

/**
 * Mount a svelte 5 component without a wrapping frame.
 * For svelte 4, falls back to new Component() syntax.
 */
export function svelteNativeNoFrame<T>(rootElement: any, data: T): Promise<any> {
    return new Promise((resolve, reject) => {
        let elementInstance: any;

        const buildElement = () => {
            const frag = createElement('fragment', window.document as unknown as DocumentNode);
            const svelte5 = getSvelte5Api();
            if (svelte5) {
                // Svelte 5 API
                elementInstance = svelte5.mount(rootElement, {
                    target: frag as any,
                    props: (data || {}) as any
                });
            } else {
                // Svelte 4 API (legacy)
                elementInstance = new rootElement({
                    target: frag,
                    props: data || {}
                });
            }
            return (frag.firstChild as NativeElementNode<View>).nativeElement;
        }

        //wait for launch before returning
        Application.on(Application.launchEvent, () => {
            resolve(elementInstance);
        })
        Application.on(Application.exitEvent, () => {
            const svelte5 = getSvelte5Api();
            if (svelte5 && elementInstance) {
                svelte5.unmount(elementInstance);
            } else if (elementInstance && typeof elementInstance.$destroy === 'function') {
                elementInstance.$destroy();
            }
            elementInstance = null;
        })

        try {
            Application.run({ create: buildElement });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Mount a svelte 5 component with a root frame for navigation.
 * For svelte 4, falls back to legacy API.
 */
export function svelteNative<T>(startPage: any, data: T): Promise<any> {
    let rootFrame: FrameElement;
    let pageInstance: any;

    return new Promise((resolve, reject) => {
        //wait for launch
        Application.on(Application.launchEvent, () => {
            resolve(pageInstance);
        })
        Application.on(Application.exitEvent, () => {
            const svelte5 = getSvelte5Api();
            if (pageInstance) {
                if (svelte5) {
                    svelte5.unmount(pageInstance);
                } else if (typeof pageInstance.$destroy === 'function') {
                    pageInstance.$destroy();
                }
                pageInstance = null;
            }
        })

        try {
            Application.run({ create: () => {
                rootFrame = createElement('frame', window.document as unknown as DocumentNode) as FrameElement;
                rootFrame.setAttribute("id", "app-root-frame");

                pageInstance = navigate({
                    page: startPage,
                    props: data || {},
                    frame: rootFrame
                })

                return rootFrame.nativeView;
            }});
        } catch (e) {
            reject(e);
        }
    });
}

// Svelte looks to see if window is undefined in order to determine if it is running on the client or in SSR.
// any imports of svelte/internals global also bind to the current value of window (during module import) so we need to 
// configure our dom now.
initializeDom()


export { navigate, goBack, showModal, closeModal, isModalOpened, initializeDom, DomTraceCategory } from "./dom"
export { createNativeScriptRenderer, createDefaultNativeScriptRendererOptions, nativeScriptRenderer } from "./dom/svelte5"
