import { describe, it, beforeAll, beforeEach, afterEach } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import type { LayoutBase, Label, StackLayout } from '@nativescript/core';
import NativeElementHarness from './NativeElementHarness.svelte';
import MountParent from './MountParent.svelte';
import MountChild from './MountChild.svelte';
import { mountHarness } from '../helpers/mount';

describe('NativeElementNode', () => {
    let test_subject: NativeViewElementNode<Label>;

    beforeAll(() => {
        test_subject = mountHarness<{ test_subject: NativeViewElementNode<Label> }>(NativeElementHarness).instance.test_subject;
        assert.isDefined(test_subject);
    });

    it('sets known properties onto its nativeView', () => {
        assert.equal(test_subject.nativeElement.textWrap, true);
        assert.equal(test_subject.nativeElement.horizontalAlignment, 'center');
    });

    it('sets text node children as text property of nativeView', () => {
        assert.equal(test_subject.nativeElement.text, 'Text Content');
    });

    it('sets class property on nativeView', () => {
        assert.isTrue(test_subject.nativeElement.cssClasses.has('testlabel'));
    });

    it('supports class directive', () => {
        assert.isTrue(test_subject.nativeElement.cssClasses.has('boolclass'));
        assert.isFalse(test_subject.nativeElement.cssClasses.has('boolclassf'));
    });

    it('sets style properties on native view', () => {
        assert.equal(test_subject.nativeElement.style.color.name, 'red');
        assert.equal(test_subject.nativeElement.color.name, 'red');
    });
});

type Parent = { stack: NativeViewElementNode<StackLayout>; first: NativeViewElementNode<Label>; last: NativeViewElementNode<Label> };
type Child = { childA: NativeViewElementNode<Label>; childB: NativeViewElementNode<Label> };

describe('NativeElementNode mounting', () => {
    let parent: Parent;
    let unmountParent: () => void;

    beforeEach(() => {
        const mounted = mountHarness<Parent>(MountParent);
        parent = mounted.instance;
        unmountParent = mounted.unmount;
    });

    afterEach(() => unmountParent());

    function assertChildrenMatch(layout: LayoutBase, expected: Label[]) {
        assert.equal(layout.getChildrenCount(), expected.length, 'Counts were different');
        for (let i = 0; i < layout.getChildrenCount(); i++) {
            assert.equal(layout.getChildAt(i), expected[i], `Expected ${expected[i].text} at ${i} but got ${(layout.getChildAt(i) as Label).text}`);
        }
    }

    it('can mount child element at the end', () => {
        const child = mountHarness<Child>(MountChild, { target: parent.stack });
        try {
            assertChildrenMatch(parent.stack.nativeView, [parent.first.nativeView, parent.last.nativeView, child.instance.childA.nativeView, child.instance.childB.nativeView]);
        } finally {
            child.unmount();
        }
    });

    it('can mount child element before an anchor', () => {
        const child = mountHarness<Child>(MountChild, { target: parent.stack, anchor: parent.last });
        try {
            assertChildrenMatch(parent.stack.nativeView, [parent.first.nativeView, child.instance.childA.nativeView, child.instance.childB.nativeView, parent.last.nativeView]);
        } finally {
            child.unmount();
        }
    });

    it('can mount child element at the start', () => {
        const child = mountHarness<Child>(MountChild, { target: parent.stack, anchor: parent.first });
        try {
            assertChildrenMatch(parent.stack.nativeView, [child.instance.childA.nativeView, child.instance.childB.nativeView, parent.first.nativeView, parent.last.nativeView]);
        } finally {
            child.unmount();
        }
    });

    it('removes child native views on unmount', () => {
        const child = mountHarness<Child>(MountChild, { target: parent.stack });
        child.unmount();
        assertChildrenMatch(parent.stack.nativeView, [parent.first.nativeView, parent.last.nativeView]);
    });
});
