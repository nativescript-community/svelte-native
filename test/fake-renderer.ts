import { createRenderer } from 'svelte/renderer';

export class FakeNode {
    children: FakeNode[] = [];
    parent: FakeNode | null = null;
    attrs: Record<string, any> = {};
    listeners: Record<string, Function[]> = {};
    constructor(public type: 'fragment' | 'element' | 'text' | 'comment', public name?: string, public text?: string) {}
    setAttribute(key: string, value: any) {
        this.attrs[key] = value;
    }
    fire(type: string, event: any = { eventName: type }) {
        for (const handler of [...(this.listeners[type] ?? [])]) handler(event);
    }
    get elements() {
        return this.children.filter((c) => c.type === 'element');
    }
}

function detach(node: FakeNode) {
    if (!node.parent) return;
    const siblings = node.parent.children;
    siblings.splice(siblings.indexOf(node), 1);
    node.parent = null;
}

function insert(parent: FakeNode, node: FakeNode, anchor: FakeNode | null) {
    if (node.type === 'fragment') {
        for (const child of [...node.children]) insert(parent, child, anchor);
        return;
    }
    detach(node);
    const at = anchor ? parent.children.indexOf(anchor) : -1;
    if (at >= 0) parent.children.splice(at, 0, node);
    else parent.children.push(node);
    node.parent = parent;
}

export default createRenderer({
    createFragment: () => new FakeNode('fragment'),
    createElement: (name: string) => new FakeNode('element', name),
    createText: (text: string) => new FakeNode('text', undefined, text),
    createComment: (text: string) => new FakeNode('comment', undefined, text),
    getNodeType: (node) => node.type,
    getText: (node) => node.text ?? null,
    getAttribute: (el, key) => el.attrs[key] ?? null,
    setAttribute: (el, key, value) => el.setAttribute(key, value),
    removeAttribute: (el, key) => {
        delete el.attrs[key];
    },
    hasAttribute: (el, key) => key in el.attrs,
    setText: (node, text) => {
        node.text = text;
    },
    getFirstChild: (el) => el.children[0] ?? null,
    getLastChild: (el) => el.children[el.children.length - 1] ?? null,
    getNextSibling: (node) => (node.parent ? node.parent.children[node.parent.children.indexOf(node) + 1] ?? null : null),
    insert,
    remove: detach,
    getParent: (node) => node.parent,
    addEventListener: (node, type, handler) => {
        (node.listeners[type] ??= []).push(handler);
    },
    removeEventListener: (node, type, handler) => {
        node.listeners[type] = (node.listeners[type] ?? []).filter((h) => h !== handler);
    },
});
