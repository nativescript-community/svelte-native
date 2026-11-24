import { describe, it, beforeAll } from 'vitest';
import { assert } from '../helpers/assert';
import type { NativeViewElementNode } from '@nativescript-community/svelte-native/dom';
import { Label, type StackLayout } from '@nativescript/core';
import PropDirectiveHarness from './PropDirectiveHarness.svelte';
import { mountHarness } from '../helpers/mount';

type Harness = { test_subject: NativeViewElementNode<StackLayout>; array_test_subject: NativeViewElementNode<Label>; enabled: boolean };

describe('PropDirective', () => {
    let harness: Harness;
    let flush: () => void;

    beforeAll(() => {
        const mounted = mountHarness<Harness>(PropDirectiveHarness);
        harness = mounted.instance;
        flush = mounted.flush;
        assert.isNotNull(harness.test_subject);
    });

    it('sets a property on its parent element', () => {
        assert.isNotNull(harness.test_subject.getAttribute('testproperty'));
    });

    it('the property set is an nativeelement', () => {
        assert.instanceOf(harness.test_subject.getAttribute('testproperty'), Label);
    });

    it('is not added to the native parent view', () => {
        assert.equal(harness.test_subject.nativeView.getChildrenCount(), 1);
    });

    it('handles nested and array props', () => {
        assert.equal(harness.array_test_subject.getAttribute('formattedText'), 'part1part2');
    });

    it('sets a property to null when removed', () => {
        harness.enabled = false;
        flush();
        assert.isNull(harness.test_subject.getAttribute('testproperty'));
    });
});
