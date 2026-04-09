import { ElementNode, ViewNode } from '../basicdom';
import { createElement, normalizeElementName } from '../basicdom';
import DocumentNode from '../basicdom/DocumentNode';

// Simple HTML tokenizer for svelte 5's from_html() generated strings.
// Handles basic element/text/comment patterns that svelte 5 produces.
function parseHtmlToFragment(html: string, doc: DocumentNode): ElementNode {
    const fragment = new ElementNode('fragment');
    fragment.nodeType = 11; // DOCUMENT_FRAGMENT_NODE
    fragment._ownerDocument = doc;

    const stack: ViewNode[] = [fragment];

    // Matches HTML tokens in the order: comments, closing tags, opening/self-closing tags, text content.
    // Groups: [1] closing tag name, [2] opening tag name, [3] attributes, [4] self-close slash, [5] text node
    const tokenRegex = /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9-]*)(?:\s*)>|<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>|([^<]+)/g;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(html)) !== null) {
        const current = stack[stack.length - 1];
        const [full, closeTag, openTag, , selfClose, textContent] = match;

        if (full.startsWith('<!--')) {
            // Comment node anchor (svelte uses these as template anchors)
            const comment = doc.createComment('');
            current.appendChild(comment);
        } else if (closeTag) {
            // Closing tag - pop the stack
            if (stack.length > 1) {
                stack.pop();
            }
        } else if (openTag) {
            const tagName = normalizeElementName(openTag);
            let el: ElementNode;
            try {
                el = createElement(tagName, doc);
            } catch {
                // If not registered, create a plain element
                el = new ElementNode(tagName);
                el._ownerDocument = doc;
            }
            current.appendChild(el);
            if (!selfClose) {
                stack.push(el);
            }
        } else if (textContent) {
            const text = doc.createTextNode(textContent);
            current.appendChild(text);
        }
    }

    return fragment;
}

export default class TemplateElement extends ElementNode {
    _content: ElementNode | null = null;

    constructor() {
        super('template');
    }

    // innerHTML setter: parse HTML and create NativeScript elements
    // This is called by svelte 5's from_html() -> create_fragment_from_html()
    set innerHTML(html: string) {
        this._content = parseHtmlToFragment(html, this.ownerDocument as unknown as DocumentNode);
    }

    get innerHTML(): string {
        return '';
    }

    // content getter: returns the parsed fragment
    // This is called by svelte 5's create_fragment_from_html()
    get content(): ElementNode {
        if (!this._content) {
            this._content = new ElementNode('fragment');
            this._content.nodeType = 11;
            this._content._ownerDocument = this.ownerDocument as unknown as DocumentNode;
        }
        return this._content;
    }

    // Svelte 5 component accessor (for svelte 4 compatibility)
    set component(value: typeof SvelteComponent) {
        this.setAttribute('component', value);
    }

    get component(): typeof SvelteComponent {
        return this.getAttribute('component');
    }

    cloneNode(deep?: boolean): TemplateElement {
        const clone = new TemplateElement();
        clone._ownerDocument = this._ownerDocument;
        if (this._content) {
            clone._content = this._content.cloneNode(deep) as ElementNode;
        }
        return clone;
    }
}
