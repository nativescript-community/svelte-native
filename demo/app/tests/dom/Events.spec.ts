import { describe, it } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import type { Button, StackLayout, TextField } from '@nativescript/core';
import EventsHarness from './EventsHarness.svelte';
import { mountHarness } from '../helpers/mount';

type Harness = { button: NativeViewElementNode<Button>; taps: number; onceTaps: number; text: string };

describe('preprocessed directives', () => {
    it('on: handlers fire, |once fires a single time', () => {
        const { instance, unmount } = mountHarness<Harness>(EventsHarness);
        const button = instance.button.nativeView;
        button.notify({ eventName: 'tap', object: button });
        button.notify({ eventName: 'tap', object: button });
        assert.equal(instance.taps, 2);
        assert.equal(instance.onceTaps, 1);
        unmount();
    });

    it('bind:text is two-way', () => {
        const { instance, target, flush, unmount } = mountHarness<Harness>(EventsHarness);
        const stack = target.firstElement() as NativeViewElementNode<StackLayout>;
        const field = stack.nativeView.getChildAt(1) as TextField;
        assert.equal(field.text, 'start');

        field.text = 'typed';
        flush();
        assert.equal(instance.text, 'typed');

        instance.text = 'from svelte';
        flush();
        assert.equal(field.text, 'from svelte');
        unmount();
    });

    it('bind:this is cleared on unmount', () => {
        const { instance, unmount } = mountHarness<Harness>(EventsHarness);
        assert.isNotNull(instance.button);
        unmount();
        assert.isNull(instance.button);
    });
});
