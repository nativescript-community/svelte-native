import { Application, View } from '@nativescript/core';
import { navigate, ViewNode, createElement, initializeDom, FrameElement, NativeElementNode } from './dom';
import { DocumentNode } from './dom/basicdom';
import renderer from './dom/renderer';

// Override this function as the default is currently resetting entire content on NativeScript
global.__onLiveSyncCore = () => {
    Application.getRootView()?._onCssStateChange();
};

export function svelteNativeNoFrame<T>(rootElement: any, data: T): Promise<any> {
    return new Promise((resolve, reject) => {

        let unmountFn: (() => void) | null;
        let componentExports: any;

        const buildElement = () => {
            let frag = createElement('fragment', window.document as unknown as DocumentNode);
            const result = renderer.render(rootElement, {
                target: frag as any,
                props: data || {} as any
            });
            componentExports = result.component;
            unmountFn = result.unmount;
            return (frag.firstChild as NativeElementNode<View>).nativeElement;
        }

        //wait for launch before returning
        Application.on(Application.launchEvent, () => {
            resolve(componentExports);
        })
        Application.on(Application.exitEvent, () => {
            if (unmountFn) {
                unmountFn();
                unmountFn = null;
            }
        })

        try {
            Application.run({ create: buildElement });
        } catch (e) {
            reject(e);
        }
    });
}

export function svelteNative<T>(startPage: any, data: T): Promise<any> {
    let rootFrame: FrameElement;
    let pageInstance: any;

    return new Promise((resolve, reject) => {
        //wait for launch
        Application.on(Application.launchEvent, () => {
            resolve(pageInstance);
        })
        Application.on(Application.exitEvent, () => {
            if (pageInstance?.unmount) {
                pageInstance.unmount();
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
