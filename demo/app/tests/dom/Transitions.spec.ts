import { describe, it } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import type { Label, StackLayout } from '@nativescript/core';
import TransitionHarness from './TransitionHarness.svelte';
import { mountHarness } from '../helpers/mount';

type Harness = { show: boolean; outer: boolean };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function mount() {
    const mounted = mountHarness<Harness>(TransitionHarness);
    const stack = (mounted.target.firstElement() as NativeViewElementNode<StackLayout>).nativeView;
    return { ...mounted, stack, labelText: () => [...Array(stack.getChildrenCount()).keys()].map((i) => (stack.getChildAt(i) as Label).text ?? 'container') };
}

describe('transitions (attachments backed by native animations)', () => {
    it('does not play the intro during the initial mount', () => {
        const { stack, unmount } = mount();
        assert.equal((stack.getChildAt(0) as Label).opacity, 1);
        unmount();
    });

    it('keeps an element on screen until its outro has played', async () => {
        const { instance, stack, flush, unmount } = mount();
        const before = stack.getChildrenCount();

        instance.show = false;
        flush();
        assert.equal(stack.getChildrenCount(), before, 'the element must stay while it animates out');

        await wait(500);
        assert.equal(stack.getChildrenCount(), before - 1, 'the element goes once the outro is done');
        unmount();
    });

    it('plays the intro when an element is added after the mount', async () => {
        const { instance, stack, flush, unmount } = mount();
        instance.show = false;
        flush();
        await wait(500);

        instance.show = true;
        flush();
        const label = stack.getChildAt(0) as Label;
        assert.equal(label.text, 'direct');
        assert.isTrue(label.opacity < 1, 'the element starts hidden');

        await wait(500);
        assert.equal(label.opacity, 1);
        unmount();
    });

    it('removes elements that leave with an ancestor straight away', () => {
        const { instance, stack, flush, unmount } = mount();
        const before = stack.getChildrenCount();
        instance.outer = false;
        flush();
        assert.equal(stack.getChildrenCount(), before - 1, 'only the block that owns the transition plays it');
        unmount();
    });

    it('survives its parent being unmounted mid-outro', async () => {
        const { instance, flush, unmount } = mount();
        instance.show = false;
        flush();
        unmount();
        await wait(300);
    });
});
