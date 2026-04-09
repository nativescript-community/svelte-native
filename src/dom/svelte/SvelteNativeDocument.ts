import { DocumentNode, ElementNode, createElement, TextNode, logger as log } from '../basicdom';

export default class SvelteNativeDocument extends DocumentNode {
    head: ElementNode;
    constructor() {
        super()

        this.head = this.createElement('head')
        this.appendChild(this.head);

        log.debug(() => `created ${this}`)
    }

    createTextNode(text: string) {
        const el = new TextNode(text)
        log.debug(() => `created ${el}`)
        return el;
    }

    createElementNS(namespace: string, tagName: string): ElementNode {
        return this.createElement(tagName);
    }

    createEvent(type: string) {
        let e: any = {};
        e.initCustomEvent = (type: string, ignored1: boolean, ignored2: boolean, detail: any) => {
            e.type = type;
            e.detail = detail;
            e.eventName = type;
        }
        return e;
    }

    // Required by svelte 5's create_fragment() in operations.js
    createDocumentFragment(): ElementNode {
        const { ElementNode: ENode } = require('../basicdom');
        const frag = new ENode('fragment');
        frag.nodeType = 11; // DOCUMENT_FRAGMENT_NODE
        frag._ownerDocument = this;
        return frag;
    }

    // Required by svelte 5's from_html() in template.js when use_import_node || is_firefox
    importNode(node: ElementNode, deep?: boolean): ElementNode {
        return node.cloneNode(deep) as ElementNode;
    }

    // No-op addEventListener for svelte 5 event delegation setup on document
    addEventListener(_event: string, _handler: any, _options?: any): void {
        // NativeScript doesn't use browser-style event delegation on document
    }

    removeEventListener(_event: string, _handler: any, _options?: any): void {
        // no-op
    }

    // Needed by svelte 5's event function (dom === document check)
    get body(): ElementNode {
        return this.head; // Return head as a stand-in; no real body in NativeScript
    }
}
