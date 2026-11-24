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
