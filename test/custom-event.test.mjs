import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEventDispatcher } from 'svelte';
import { set_current_component } from 'svelte/internal';
import { loadSource } from './load-source.mjs';

const { default: NativeCustomEvent } = loadSource('../src/dom/svelte/CustomEvent.ts');

test('CustomEventInit preserves payload identity, defaults and native eventName', () => {
    for (const detail of ['Grace', { name: 'Grace' }, false, 0, '', null]) {
        const event = new NativeCustomEvent('change', { detail });
        assert.equal(event.detail, detail);
        assert.equal(event.type, 'change');
        assert.equal(event.eventName, 'change');
        assert.equal(event.bubbles, false);
        assert.equal(event.cancelable, false);
        assert.equal(event.composed, false);
        event.preventDefault();
        assert.equal(event.defaultPrevented, false);
    }
    assert.equal(new NativeCustomEvent('change').detail, null);
    assert.equal(new NativeCustomEvent('change', null).detail, null);
    const event = new NativeCustomEvent('change', { bubbles: true, cancelable: true, composed: true });
    event.preventDefault();
    assert.equal(event.defaultPrevented, true);
    assert.equal(event.bubbles, true);
    assert.equal(event.composed, true);
});

test('Svelte 4 dispatcher delivers the original value and reports cancellation', () => {
    const original = globalThis.CustomEvent;
    globalThis.CustomEvent = NativeCustomEvent;
    let received;
    const owner = { $$: { callbacks: { change: [(event) => {
        received = event;
        event.preventDefault();
    }] } } };
    try {
        set_current_component(owner);
        const dispatch = createEventDispatcher();
        set_current_component(null);
        assert.equal(dispatch('change', 'Grace'), true);
        assert.equal(received.detail, 'Grace');
        assert.equal(received.defaultPrevented, false);
        const value = { name: 'Lin' };
        assert.equal(dispatch('change', value, { cancelable: true }), false);
        assert.equal(received.detail, value);
        assert.equal(received.defaultPrevented, true);
    } finally {
        set_current_component(null);
        globalThis.CustomEvent = original;
    }
});

test('legacy initCustomEvent preserves details and resets cancellation', () => {
    const event = new NativeCustomEvent('CustomEvent');
    const payload = { value: 'Grace' };
    event.initCustomEvent('change', true, true, payload);
    assert.equal(event.type, 'change');
    assert.equal(event.eventName, 'change');
    assert.equal(event.detail, payload);
    assert.equal(event.bubbles, true);
    event.preventDefault();
    assert.equal(event.defaultPrevented, true);
    event.initCustomEvent('next', false, false, 0);
    assert.equal(event.defaultPrevented, false);
    assert.equal(event.detail, 0);
});
