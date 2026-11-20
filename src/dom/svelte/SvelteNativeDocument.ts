
import { DocumentNode, ElementNode, createElement, TextNode, logger as log } from '../basicdom';
import SvelteNativeCustomEvent from './CustomEvent';

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
        return new SvelteNativeCustomEvent(type);
    }
}
