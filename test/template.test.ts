import { describe, it, expect } from 'vitest';
import { flushSync, mount } from 'svelte';
import renderer, { FakeNode } from './fake-renderer';
import { TemplateProps } from '../src/dom/svelte/TemplateProps';
import ListConsumer from './fixtures/ListConsumer.svelte';

function templates() {
    const root = new FakeNode('fragment');
    mount(ListConsumer as any, { target: root, renderer });
    flushSync();
    const list = root.elements.find((n) => n.name === 'listView')!;
    return Object.fromEntries(list.elements.filter((n) => n.name === 'template').map((t) => [t.attrs.key, t]));
}

function mountRow(template: FakeNode, item: any, index: number) {
    const props = new TemplateProps(item, index);
    const cell = new FakeNode('element', 'cell');
    mount(template.attrs.component, { target: cell, props: props.props, renderer });
    flushSync();
    return { cell, props, label: () => cell.elements[0] };
}

describe('Template', () => {
    it('renders a <template> element carrying its attributes and a component function', () => {
        const { slot } = templates();
        expect(slot.attrs.extra).toBe('passed');
        expect(typeof slot.attrs.component).toBe('function');
    });

    for (const key of ['slot', 'snippet']) {
        it(`renders the ${key} content with item and index`, () => {
            const row = mountRow(templates()[key], 'first', 0);
            expect(row.label().attrs.text).toBe(`${key} first #0`);
        });

        it(`updates the ${key} content in place when the row is recycled`, () => {
            const row = mountRow(templates()[key], 'first', 0);
            const label = row.label();
            row.props.update('second', 7);
            expect(row.label()).toBe(label);
            expect(label.attrs.text).toBe(`${key} second #7`);
        });
    }

    it('repaints when the same item object is passed again after mutation', () => {
        const item = { name: 'one' };
        const row = mountRow(templates().object, item, 0);
        item.name = 'two';
        row.props.update(item, 0);
        expect(row.label().attrs.text).toBe('two');
    });

    it('gives rows the context of the component that declared the template', () => {
        const row = mountRow(templates().context, null, 0);
        expect(row.label().attrs.text).toBe('from page');
    });

    it('keeps rows independent', () => {
        const { slot } = templates();
        const a = mountRow(slot, 'a', 0);
        const b = mountRow(slot, 'b', 1);
        a.props.update('a2', 2);
        expect(a.label().attrs.text).toBe('slot a2 #2');
        expect(b.label().attrs.text).toBe('slot b #1');
    });
});
