import { createRenderer } from 'svelte/renderer';

function insertNode(parent: any, node: any, anchor: any) {
	// Fragments: insert all children, not the fragment itself
	if (node.tagName === 'fragment') {
		const children = [...node.childNodes];
		for (const child of children) {
			insertNode(parent, child, anchor);
		}
		return;
	}

	// Remove from current parent if needed (DOM insert semantics)
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}

	if (anchor) {
		parent.insertBefore(node, anchor);
	} else {
		parent.appendChild(node);
	}
}

const renderer = createRenderer({
	createFragment() {
		return (globalThis as any).document.createElement('fragment');
	},

	createElement(name: string) {
		// Convert -- separator back to dot notation for property elements
		// (Svelte 5 preprocessor encodes parent.prop as parent--prop)
		let sep = name.indexOf('--');
		if (sep >= 0) {
			name = name.substring(0, sep) + '.' + name.substring(sep + 2);
		}
		return (globalThis as any).document.createElement(name);
	},

	createTextNode(data: string) {
		return (globalThis as any).document.createTextNode(data);
	},

	createComment(data: string) {
		return (globalThis as any).document.createComment(data);
	},

	nodeType(node: any) {
		if (node.tagName === 'fragment') return 'fragment';
		switch (node.nodeType) {
			case 3:
				return 'text';
			case 8:
				return 'comment';
			default:
				return 'element';
		}
	},

	getNodeValue(node: any) {
		if (node.nodeType === 3 || node.nodeType === 8) return node.text;
		return null;
	},

	getAttribute(element: any, name: string) {
		return element.getAttribute(name);
	},

	setAttribute(element: any, key: string, value: any) {
		element.setAttribute(key, value);
	},

	removeAttribute(element: any, name: string) {
		element.removeAttribute(name);
	},

	hasAttribute(element: any, name: string) {
		return element.hasAttribute(name);
	},

	setText(node: any, text: string) {
		if (node.nodeType === 3) {
			node.text = text;
			if (node.parentNode) {
				node.parentNode.updateText();
			}
		} else {
			node.setText(text);
		}
	},

	getFirstChild(element: any) {
		return element.firstChild;
	},

	getLastChild(element: any) {
		return element.lastChild;
	},

	getNextSibling(node: any) {
		return node.nextSibling;
	},

	insert: insertNode,

	remove(node: any) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	},

	getParent(node: any) {
		return node.parentNode;
	},

	addEventListener(target: any, type: string, handler: any, options?: any) {
		if (target.addEventListener) {
			target.addEventListener(type, handler);
		}
	},

	removeEventListener(target: any, type: string, handler: any, options?: any) {
		if (target.removeEventListener) {
			target.removeEventListener(type, handler);
		}
	}
});

export default renderer;
