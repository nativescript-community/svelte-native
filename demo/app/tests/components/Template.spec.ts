import { describe, it, beforeAll, afterAll } from 'vitest';
import { assert } from '../helpers/assert';
import { createElement, TemplateProps, type NativeViewElementNode, type ViewNode } from '@nativescript-community/svelte-native/dom';
import type { Label } from '@nativescript/core';
import TemplateHarness from './TemplateHarness.svelte';
import SnippetTemplateHarness from './SnippetTemplateHarness.svelte';
import { mountHarness } from '../helpers/mount';

function templateComponent(target: ViewNode) {
    return (target.firstChild as any).component;
}

function labelText(target: ViewNode) {
    return (target.firstElement() as NativeViewElementNode<Label>).getAttribute('text');
}

describe('Template', () => {
    let target: ViewNode;
    let unmount: () => void;

    beforeAll(() => {
        const mounted = mountHarness(TemplateHarness);
        target = mounted.target;
        unmount = mounted.unmount;
    });

    afterAll(() => unmount());

    it('adds a template element to the dom', () => {
        assert.equal(target.firstChild.tagName, 'template');
    });

    it('exposes the slot content as a component', () => {
        assert.isFunction(templateComponent(target));
    });

    it('passes down its props to the template element', () => {
        assert.equal((target.firstChild as any).getAttribute('extra-prop'), 'test extra prop');
    });

    it('renders the slot with the provided item and index', () => {
        const row = mountHarness(templateComponent(target), { props: { item: 'prop_value', index: 3 } });
        assert.equal((row.target.firstElement() as any).tagName, 'label');
        assert.equal(labelText(row.target), 'test text prop_value #3');
        row.unmount();
    });

    it('keeps instances independent', () => {
        const a = mountHarness(templateComponent(target), { props: { item: 'a', index: 0 } });
        const b = mountHarness(templateComponent(target), { props: { item: 'b', index: 1 } });
        assert.equal(labelText(a.target), 'test text a #0');
        assert.equal(labelText(b.target), 'test text b #1');
        a.unmount();
        b.unmount();
    });

    it('updates a mounted instance when recycled with a new item', () => {
        const templateProps = new TemplateProps('first', 0);
        const row = mountHarness(templateComponent(target), { props: templateProps.props });
        const label = row.target.firstElement();
        templateProps.update('second', 7);
        assert.strictEqual(row.target.firstElement(), label, 'the native view should be reused, not re-created');
        assert.equal(labelText(row.target), 'test text second #7');
        row.unmount();
    });

    it('supports a children snippet instead of let: directives', () => {
        const host = mountHarness(SnippetTemplateHarness);
        const templateProps = new TemplateProps('x', 1);
        const row = mountHarness(templateComponent(host.target), { props: templateProps.props });
        assert.equal(labelText(row.target), 'snippet x #1');
        templateProps.update('y', 2);
        assert.equal(labelText(row.target), 'snippet y #2');
        row.unmount();
        host.unmount();
    });
});
