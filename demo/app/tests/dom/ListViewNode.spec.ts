import { describe, it, beforeAll } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import type { ItemEventData, Label, ListView, View } from '@nativescript/core';
import ListViewMultiTemplate from './ListViewMultiTemplate.svelte';
import { mountHarness } from '../helpers/mount';

function textOf(view: View): string {
    let text: string;
    view.eachChildView((child) => {
        text = (child as Label).text;
        return false;
    });
    return text;
}

describe('ListViewNode', () => {
    let test_subject: NativeViewElementNode<ListView>;
    let unmount: () => void;

    beforeAll(() => {
        const mounted = mountHarness<{ test_subject: NativeViewElementNode<ListView> }>(ListViewMultiTemplate);
        test_subject = mounted.instance.test_subject;
        unmount = mounted.unmount;
        assert.isNotNull(test_subject);
    });

    it('detects keyed templates', () => {
        assert.equal(test_subject.nativeView.itemTemplates.length, 2, 'expected 2 keyed item templates');
    });

    it('sets the item template selector', () => {
        assert.isDefined(test_subject.nativeView.itemTemplateSelector);
        assert.isNotNull(test_subject.nativeView.itemTemplateSelector);
    });

    it('mounts a keyed template on first load and rebinds it when recycled', () => {
        const listView = test_subject.nativeView;
        const even = (listView.itemTemplates as any[]).find((t) => t.key === 'even');
        const view = even.createView() as View;

        listView.notify({ eventName: 'itemLoading', object: listView, index: 0, view } as ItemEventData);
        assert.equal(textOf(view), 'Even item 0');

        listView.notify({ eventName: 'itemLoading', object: listView, index: 2, view } as ItemEventData);
        assert.equal(textOf(view), 'Even item 2');
    });

    describe('rebinding a recycled row', () => {
        function recycledRow() {
            const listView = test_subject.nativeView;
            const even = (listView.itemTemplates as any[]).find((t) => t.key === 'even');
            const view = even.createView() as View;
            const load = (index: number) => listView.notify({ eventName: 'itemLoading', object: listView, index, view } as ItemEventData);
            load(0);
            const label = (view as any).getChildAt(0) as Label;
            // views that are not loaded hold their native updates until they load, which would hide the batching
            (view as any).callLoaded();

            // how many times each view applies its batched native updates
            const resumed = { wrapper: 0, label: 0 };
            for (const [name, target] of [['wrapper', view], ['label', label]] as const) {
                const original = (target as any).onResumeNativeUpdates;
                (target as any).onResumeNativeUpdates = function (...args: any[]) {
                    resumed[name]++;
                    return original.apply(this, args);
                };
            }
            return { view, label, load, resumed, done: () => (view as any).callUnloaded() };
        }

        it('applies the update as one batch of native updates', () => {
            const { label, load, resumed, done } = recycledRow();
            load(2);
            assert.equal(label.text, 'Even item 2');
            assert.equal(resumed.wrapper, 1, 'the wrapper resumes once, after the whole update');
            assert.equal(resumed.label, 1, 'the label resumes once, after the whole update');
            done();
        });

        it('leaves the row not suspended afterwards', () => {
            const { view, label, load, done } = recycledRow();
            const before = [view, label].map((v) => (v as any)._suspendNativeUpdatesCount);
            load(2);
            assert.equal([view, label].map((v) => (v as any)._suspendNativeUpdatesCount).join(), before.join());
            done();
        });

        it('does no native work when rebound to the item it already shows', () => {
            const { label, load, resumed, done } = recycledRow();
            load(0);
            assert.equal(label.text, 'Even item 0');
            assert.equal(resumed.wrapper, 0);
            assert.equal(resumed.label, 0);
            done();
        });
    });

    it('unmounts rows along with the list', () => {
        const listView = test_subject.nativeView;
        const odd = (listView.itemTemplates as any[]).find((t) => t.key === 'odd');
        const view = odd.createView() as View & { getChildrenCount(): number };
        listView.notify({ eventName: 'itemLoading', object: listView, index: 1, view } as ItemEventData);
        assert.equal(view.getChildrenCount(), 1);

        unmount();
        assert.equal(view.getChildrenCount(), 0);
    });
});
