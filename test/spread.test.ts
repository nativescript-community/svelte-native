import { describe, it, expect } from 'vitest';
import { flushSync, mount } from 'svelte';
import renderer, { FakeNode } from './fake-renderer';
import SpreadFunctions from './fixtures/SpreadFunctions.svelte';

// Svelte drops function values of a spread with a custom renderer; the preprocessor puts them back.
function setup(props: Record<string, any>) {
    const root = new FakeNode('fragment');
    const component = mount(SpreadFunctions as any, { target: root, renderer, props }) as any;
    flushSync();
    return { component, view: root.elements.find((n) => n.name === 'collectionview')! };
}

describe('function attributes on an element with a spread', () => {
    it('keeps a function declared next to the spread', () => {
        const selector = () => 'a';
        const { view } = setup({ selector });
        expect(view.attrs.itemTemplateSelector).toBe(selector);
        expect(view.attrs.rowHeight).toBe('70');
    });

    it('keeps a function that only arrives through the spread', () => {
        const itemIdGenerator = () => 1;
        const { view } = setup({ rest: { itemIdGenerator, items: [1, 2] } });
        expect(view.attrs.itemIdGenerator).toBe(itemIdGenerator);
        expect(view.attrs.items).toEqual([1, 2]);
    });

    it('applies a replaced function', () => {
        const first = () => 'a';
        const second = () => 'b';
        const { component, view } = setup({ selector: first });
        component.selector = second;
        flushSync();
        expect(view.attrs.itemTemplateSelector).toBe(second);
    });

    it('applies a spread function that changes, and drops one that goes away', () => {
        const a = () => 1;
        const b = () => 2;
        const { component, view } = setup({ rest: { itemIdGenerator: a } });
        component.rest = { itemIdGenerator: b };
        flushSync();
        expect(view.attrs.itemIdGenerator).toBe(b);
        component.rest = {};
        flushSync();
        expect(view.attrs.itemIdGenerator).toBeUndefined();
    });

    it('lets the spread override the explicit function like a normal spread would', () => {
        const explicit = () => 'explicit';
        const fromSpread = () => 'spread';
        const { view } = setup({ selector: explicit, rest: { itemTemplateSelector: fromSpread } });
        // the explicit attribute is declared after the spread, so it wins
        expect(view.attrs.itemTemplateSelector).toBe(explicit);
    });
});
