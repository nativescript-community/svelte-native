import { describe, it, beforeAll, afterAll } from 'vitest';
import { assert } from '../helpers/assert';
import { TemplateElement, type NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte5';
import PagerElement from '@nativescript-community/ui-pager/svelte5';
import type { CollectionView } from '@nativescript-community/ui-collectionview';
import type { Pager } from '@nativescript-community/ui-pager';
import type { ContentView, Label, View } from '@nativescript/core';
import CollectionViewHarness from './CollectionViewHarness.svelte';
import PagerHarness from './PagerHarness.svelte';
import { mountHarness } from '../helpers/mount';

type Subject = { test_subject: NativeViewElementNode<any> };

// the same flow for both lists: they only differ in how the native view hands out a template's view
const lists = [
    {
        name: 'CollectionView',
        harness: CollectionViewHarness,
        register: () => CollectionViewElement.register(),
        createView: (native: CollectionView) => native.getTemplateFromSelector('default').createView() as ContentView,
    },
    {
        name: 'Pager',
        harness: PagerHarness,
        register: () => PagerElement.register(),
        createView: (native: Pager) => (native as any)._itemTemplatesInternal.find((t: any) => t.key === 'default').createView() as ContentView,
    },
];

for (const list of lists) {
    describe(`${list.name} svelte binding`, () => {
        let subject: NativeViewElementNode<any>;
        let template: TemplateElement;
        let unmount: () => void;

        const load = (view: View, index: number, bindingContext: string) =>
            subject.nativeView.notify({ eventName: 'itemLoading', object: subject.nativeView, index, view, bindingContext });
        const dispose = (view: View) => subject.nativeView.notify({ eventName: 'itemDisposing', object: subject.nativeView, view });
        const labelOf = (view: ContentView) => view.content as Label;

        beforeAll(() => {
            list.register();
            const mounted = mountHarness<Subject>(list.harness);
            subject = mounted.instance.test_subject;
            template = subject.childNodes.find((n) => n instanceof TemplateElement) as TemplateElement;
            unmount = mounted.unmount;
            assert.isNotNull(subject);
        });

        afterAll(() => unmount());

        it('registers the template with the native view', () => {
            assert.isNotNull(template, 'expected a template element');
            assert.isDefined(list.createView(subject.nativeView));
        });

        it('mounts the template on first itemLoading and rebinds it when the view is reused', () => {
            const view = list.createView(subject.nativeView);
            load(view, 0, 'a');
            const label = labelOf(view);
            assert.equal(label.text, `${list.name === 'Pager' ? 'page' : 'cv'} a #0`);

            load(view, 2, 'c');
            assert.strictEqual(labelOf(view), label, 'the native view should be reused, not re-created');
            assert.equal(label.text, `${list.name === 'Pager' ? 'page' : 'cv'} c #2`);
            dispose(view);
        });

        it('unmounts the template instance when the view is disposed', () => {
            const before = template.instanceCount;
            const view = list.createView(subject.nativeView);
            load(view, 1, 'b');
            assert.equal(template.instanceCount, before + 1);

            dispose(view);
            assert.equal(template.instanceCount, before, 'a disposed view must not stay tracked by the template');
            assert.isNull(view.__Svelte5Instance__ ?? null);
        });

        it('keeps views independent', () => {
            const a = list.createView(subject.nativeView);
            const b = list.createView(subject.nativeView);
            load(a, 0, 'a');
            load(b, 1, 'b');
            load(a, 2, 'c');
            assert.equal(labelOf(a).text.endsWith('c #2'), true);
            assert.equal(labelOf(b).text.endsWith('b #1'), true);
            dispose(a);
            dispose(b);
        });
    });
}
