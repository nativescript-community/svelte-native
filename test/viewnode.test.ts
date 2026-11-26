import { describe, it, expect } from 'vitest';
import { ElementNode } from '../src/dom/basicdom';

function chain(parent: ElementNode) {
    const names: string[] = [];
    for (let node = parent.firstChild; node; node = node.nextSibling) names.push(node.tagName);
    return names;
}

describe('ViewNode sibling links', () => {
    it('stay consistent when inserting before an anchor', () => {
        const parent = new ElementNode('parent');
        const anchor = new ElementNode('anchor');
        parent.appendChild(new ElementNode('first'));
        parent.appendChild(anchor);
        parent.insertBefore(new ElementNode('a'), anchor);
        parent.insertBefore(new ElementNode('b'), anchor);

        expect(chain(parent)).toEqual(parent.childNodes.map((n) => n.tagName));
        expect(chain(parent)).toEqual(['first', 'a', 'b', 'anchor']);
    });
});
