import { describe, it } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import type { Button, StackLayout } from '@nativescript/core';
import ForwardingHarness from './ForwardingHarness.svelte';
import { mountHarness } from '../helpers/mount';

type Harness = { taps: any[]; wrappedTaps: any[]; longPresses: any[]; done: any[]; child: { fire(detail?: any): void } };

function mount() {
    const mounted = mountHarness<Harness>(ForwardingHarness);
    const stack = (mounted.target.firstElement() as NativeViewElementNode<StackLayout>).nativeView;
    return { ...mounted, direct: stack.getChildAt(0) as Button, wrapped: stack.getChildAt(1) as Button };
}

describe('event forwarding (on:event without a handler)', () => {
    it('delivers the original native event from an element to the parent', () => {
        const { instance, direct, unmount } = mount();
        const event = { eventName: 'tap', object: direct };
        direct.notify(event);
        assert.equal(instance.taps.length, 1);
        assert.strictEqual(instance.taps[0], event, 'the handler receives the NativeScript EventData itself, not a wrapper');
        unmount();
    });

    it('forwards every event listed, with its own name', () => {
        const { instance, direct, unmount } = mount();
        direct.notify({ eventName: 'longPress', object: direct });
        assert.equal(instance.longPresses.length, 1);
        assert.equal(instance.longPresses[0].eventName, 'longPress');
        assert.equal(instance.taps.length, 0, 'tap handlers are not called for longPress');
        unmount();
    });

    it('keeps forwarding through a wrapping component', () => {
        const { instance, direct, wrapped, unmount } = mount();
        wrapped.notify({ eventName: 'tap', object: wrapped });
        assert.equal(instance.wrappedTaps.length, 1);
        assert.strictEqual(instance.wrappedTaps[0].object, wrapped);
        assert.equal(instance.taps.length, 0, 'the sibling button is unaffected');
        unmount();
    });

    it('stops forwarding after unmount', () => {
        const { instance, direct, unmount } = mount();
        unmount();
        direct.notify({ eventName: 'tap', object: direct });
        assert.equal(instance.taps.length, 0);
    });
});

describe('createEventDispatcher', () => {
    it('passes detail through to on: handlers (CustomEvent shim)', () => {
        const { instance, unmount } = mount();
        instance.child.fire({ n: 1 });
        assert.equal(instance.done.length, 1);
        assert.equal(instance.done[0].detail.n, 1, 'detail is the dispatched value, not the CustomEvent init object');
        assert.equal(instance.done[0].type, 'done');
        assert.equal(instance.done[0].eventName, 'done');
        unmount();
    });

    it('defaults detail to null', () => {
        const { instance, unmount } = mount();
        instance.child.fire();
        assert.isNull(instance.done[0].detail);
        unmount();
    });
});
