import { createRenderer } from 'svelte/renderer';
import { flushSync, mount, unmount, type Component } from 'svelte';
import type { CommentNode, DocumentNode, ElementNode, TextNode, ViewNode } from './basicdom';

type EventHandler = (...args: any[]) => any;
type EventTargetNode = ViewNode & {
	addEventListener?(type: string, handler: EventHandler): void;
	removeEventListener?(type: string, handler: EventHandler): void;
};

function doc(): DocumentNode {
	return (globalThis as any).document;
}

// svelte-native also has a `<fragment>` element, so Svelte's own fragments are marked rather
// than recognised by tag name.
const svelteFragment = Symbol('svelte-fragment');

function isFragment(node: ViewNode) {
	return (node as any)[svelteFragment] === true;
}

function insertNode(parent: ViewNode, node: ViewNode, anchor: ViewNode | null) {
	if (isFragment(node)) {
		for (const child of [...node.childNodes]) {
			insertNode(parent, child, anchor);
		}
		return;
	}

	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}

	if (anchor) {
		parent.insertBefore(node, anchor);
	} else {
		parent.appendChild(node);
	}
}

// NativeScript's `addEventListener(type, handler, thisArg)` treats its third argument as the
// handler's `this`, so DOM-style options can't be forwarded. `once` is emulated here; `capture`
// and `passive` have no NativeScript equivalent since events don't propagate.
const onceWrappers = new WeakMap<ViewNode, Map<string, Map<EventHandler, EventHandler>>>();

function onceWrappersFor(target: ViewNode, type: string) {
	let byType = onceWrappers.get(target);
	if (!byType) onceWrappers.set(target, (byType = new Map()));
	let byHandler = byType.get(type);
	if (!byHandler) byType.set(type, (byHandler = new Map()));
	return byHandler;
}

type Nodes = { fragment: ElementNode; element: ElementNode; text: TextNode; comment: CommentNode };
type AnyNode = Nodes[keyof Nodes];

function asNode(node: ViewNode | undefined): AnyNode | null {
	return (node ?? null) as AnyNode | null;
}

const renderer = createRenderer<Nodes>({
	createFragment(): ElementNode {
		const fragment = doc().createElement('fragment');
		(fragment as any)[svelteFragment] = true;
		return fragment;
	},

	createElement(name: string): ElementNode {
		// svelte-native-preprocessor encodes `<parent.prop>` as `<parent--prop>`, since Svelte 5
		// parses dotted tag names as member expressions
		const sep = name.indexOf('--');
		if (sep >= 0) {
			name = name.substring(0, sep) + '.' + name.substring(sep + 2);
		}
		return doc().createElement(name);
	},

	createText(data: string): TextNode {
		return doc().createTextNode(data);
	},

	createComment(data: string): CommentNode {
		return doc().createComment(data);
	},

	getNodeType(node) {
		if (isFragment(node)) return 'fragment';
		switch (node.nodeType) {
			case 3:
				return 'text';
			case 8:
				return 'comment';
			default:
				return 'element';
		}
	},

	getText(node) {
		return node.text;
	},

	getAttribute(element, name) {
		return element.getAttribute(name);
	},

	setAttribute(element, key, value) {
		// Svelte applies `checked` with HTML boolean-attribute semantics: '' to set, removal to clear.
		if (key === 'checked' && value === '') value = true;
		element.setAttribute(key, value);
	},

	removeAttribute(element, name) {
		if (name === 'checked') {
			element.setAttribute(name, false);
			return;
		}
		element.removeAttribute(name);
	},

	hasAttribute(element, name) {
		return element.hasAttribute(name);
	},

	setText(node, text) {
		node.text = text;
		node.parentNode?.updateText();
	},

	getFirstChild(element) {
		return asNode(element.firstChild);
	},

	getLastChild(element) {
		return asNode(element.lastChild);
	},

	getNextSibling(node) {
		return asNode(node.nextSibling);
	},

	insert: insertNode,

	remove(node) {
		node.parentNode?.removeChild(node);
	},

	getParent(node) {
		return asNode(node.parentNode);
	},

	addEventListener(target: EventTargetNode, type: string, handler: EventHandler, options?: AddEventListenerOptions | boolean) {
		if (!target.addEventListener) return;

		if (typeof options === 'object' && options?.once) {
			const wrappers = onceWrappersFor(target, type);
			const wrapped: EventHandler = function (this: unknown, ...args) {
				wrappers.delete(handler);
				target.removeEventListener?.(type, wrapped);
				return handler.apply(this, args);
			};
			wrappers.set(handler, wrapped);
			target.addEventListener(type, wrapped);
			return;
		}

		target.addEventListener(type, handler);
	},

	removeEventListener(target: EventTargetNode, type: string, handler: EventHandler) {
		if (!target.removeEventListener) return;

		const wrappers = onceWrappers.get(target)?.get(type);
		const wrapped = wrappers?.get(handler);
		if (wrapped) {
			wrappers.delete(handler);
			target.removeEventListener(type, wrapped);
			return;
		}

		target.removeEventListener(type, handler);
	}
});

export interface RenderResult<Exports = Record<string, any>> {
	component: Exports;
	unmount: () => void;
}

/**
 * Mounts a Svelte component into a svelte-native node using the NativeScript renderer.
 */
export function render<Props extends Record<string, any>, Exports extends Record<string, any> = Record<string, any>>(
	component: Component<Props, Exports, any>,
	options: { target: ViewNode; anchor?: ViewNode; props?: Props; context?: Map<any, any>; intro?: boolean }
): RenderResult<Exports> {
	const instance = mount(component, {
		renderer,
		target: options.target as ElementNode,
		anchor: options.anchor as ElementNode,
		props: (options.props ?? {}) as Props,
		context: options.context,
		intro: options.intro
	});
	// Native callers (navigation, list cells) use the view as soon as this returns, so run
	// mount effects (onMount, attachments such as element refs) now rather than in a microtask.
	flushSync();
	return {
		component: instance,
		unmount: () => {
			unmount(instance);
		}
	};
}

export default renderer;
