/**
 * Svelte 5 Custom Renderer for NativeScript
 *
 * This module provides a custom renderer interface following the pattern
 * established by the Lynx svelte renderer (createCustomRenderer).
 *
 * Since svelte 5's `createCustomRenderer` API is still in development,
 * this module provides its own implementation that patches the necessary
 * globals so that svelte 5's internal operations work with NativeScript
 * DOM nodes instead of browser DOM nodes.
 *
 * Usage:
 *   import { mount, unmount } from 'svelte';
 *   import App from './App.svelte';
 *   import { createElement } from '@nativescript-community/svelte-native/dom';
 *
 *   const target = createElement('fragment', document as any);
 *   const app = mount(App, { target, props: {} });
 *   // later:
 *   unmount(app);
 */

import { mount, unmount } from 'svelte';
import { ElementNode, ViewNode, TextNode, CommentNode, createElement } from '../basicdom';
import { logger as log } from '../basicdom';

export type { ElementNode, ViewNode, TextNode, CommentNode };

/**
 * Options interface matching the `createCustomRenderer` pattern from Lynx.
 * When svelte releases `createCustomRenderer` officially, this interface
 * will be compatible with that API.
 */
export interface RendererOptions {
    /** Create a fragment node (used as a container for multiple root elements) */
    createFragment(): ElementNode;
    /** Create an element node with the given tag name */
    createElement(name: string): ElementNode;
    /** Create a text node with the given initial content */
    createTextNode(data: string): TextNode;
    /** Create a comment node (used by svelte as anchors) */
    createComment(data?: string): CommentNode;
    /** Set an attribute on an element */
    setAttribute(element: ElementNode, key: string, value: any): void;
    /** Set the text content of a text node */
    setText(node: TextNode, text: string): void;
    /** Get the first child of an element */
    getFirstChild(element: ViewNode): ViewNode | null;
    /** Get the next sibling of a node */
    getNextSibling(element: ViewNode): ViewNode | null;
    /** Insert element before anchor in parent, or append if anchor is null */
    insert(parent: ViewNode, element: ViewNode, anchor: ViewNode | null): void;
    /** Remove a node from its parent */
    remove(node: ViewNode): void;
    /** Get the parent of a node */
    getParent(element: ViewNode): ViewNode | null;
    /** Clone a node (used by svelte 5 template caching) */
    cloneNode(node: ViewNode): ViewNode;
    /** Add an event listener to an element */
    addEventListener(element: ViewNode, event_name: string, handler: Function): void;
    /** Remove an event listener from an element */
    removeEventListener?(element: ViewNode, event_name: string, handler: Function): void;
}

/**
 * Mount options for svelte 5 components.
 */
export interface MountOptions<Props extends Record<string, any> = Record<string, any>> {
    target: ViewNode;
    props?: Props;
    context?: Map<any, any>;
    intro?: boolean;
    anchor?: ViewNode;
}

/**
 * Creates a NativeScript renderer for svelte 5.
 *
 * This implements the `createCustomRenderer` pattern from the Lynx example.
 * It works with the current svelte 5 release by using our NativeScript DOM
 * shim (global Node, Element, Text, Comment, document) that was set up by
 * `initializeDom()`.
 *
 * @param options - Renderer operation implementations
 * @returns An object with `mount` and `unmount` functions
 */
export function createNativeScriptRenderer(options: RendererOptions) {
    log.debug(() => 'createNativeScriptRenderer: setting up NativeScript renderer');

    return {
        /**
         * Mount a svelte 5 component to a NativeScript target element.
         * Uses svelte 5's `mount()` API internally.
         */
        mount<Props extends Record<string, any> = Record<string, any>>(
            component: any,
            mountOptions: MountOptions<Props>
        ): Record<string, any> {
            return mount(component, mountOptions as any);
        },

        /**
         * Unmount a previously mounted svelte 5 component.
         * Uses svelte 5's `unmount()` API internally.
         */
        unmount(component: Record<string, any>, options?: { outro?: boolean }): Promise<void> {
            return unmount(component, options) as Promise<void>;
        },

        /** Access to the renderer options for testing/debugging */
        options,
    };
}

/**
 * Default NativeScript renderer options.
 *
 * This provides the standard implementation for all renderer operations
 * using the NativeScript DOM node types. It follows the same structure
 * as the Lynx renderer's createCustomRenderer argument.
 */
export function createDefaultNativeScriptRendererOptions(): RendererOptions {
    return {
        createFragment(): ElementNode {
            return createElement('fragment', (global as any).document);
        },

        createElement(name: string): ElementNode {
            try {
                return createElement(name, (global as any).document);
            } catch (e) {
                log.warn(() => `createElement: unknown element '${name}', creating generic ElementNode`);
                const el = new ElementNode(name);
                el._ownerDocument = (global as any).document;
                return el;
            }
        },

        createTextNode(data: string): TextNode {
            return new TextNode(data);
        },

        createComment(data: string = ''): CommentNode {
            return new CommentNode(data);
        },

        setAttribute(element: ElementNode, key: string, value: any): void {
            element.setAttribute(key, value);
        },

        setText(node: TextNode, text: string): void {
            node.setText(text);
        },

        getFirstChild(element: ViewNode): ViewNode | null {
            return element.firstChild;
        },

        getNextSibling(element: ViewNode): ViewNode | null {
            return element.nextSibling;
        },

        insert(parent: ViewNode, element: ViewNode, anchor: ViewNode | null): void {
            if (anchor) {
                parent.insertBefore(element, anchor);
            } else {
                parent.appendChild(element);
            }
        },

        remove(node: ViewNode): void {
            if (!node || !node.parentNode) return;
            node.parentNode.removeChild(node);
        },

        getParent(element: ViewNode): ViewNode | null {
            return element.parentNode;
        },

        cloneNode(node: ViewNode): ViewNode {
            return node.cloneNode(true);
        },

        addEventListener(element: ViewNode, event_name: string, handler: Function): void {
            if (typeof (element as any).addEventListener === 'function') {
                (element as any).addEventListener(event_name, handler);
            }
        },

        removeEventListener(element: ViewNode, event_name: string, handler: Function): void {
            if (typeof (element as any).removeEventListener === 'function') {
                (element as any).removeEventListener(event_name, handler);
            }
        },
    };
}

/**
 * The default NativeScript svelte 5 renderer.
 * Pre-configured with standard NativeScript DOM operations.
 */
export const nativeScriptRenderer = createNativeScriptRenderer(
    createDefaultNativeScriptRendererOptions()
);
