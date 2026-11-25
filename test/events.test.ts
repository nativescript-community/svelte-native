import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NativeCustomEvent } from '../src/dom/svelte/NativeCustomEvent';
import { flushSync, mount } from 'svelte';
import renderer, { FakeNode } from './fake-renderer';
import DispatchParent from './fixtures/DispatchParent.svelte';
import ForwardParent from './fixtures/ForwardParent.svelte';

describe('component on: through svelteNativePreprocess', () => {
    // the device has no DOM CustomEvent; svelte-native installs its own (see initializeDom)
    beforeAll(() => {
        vi.stubGlobal('CustomEvent', NativeCustomEvent);
    });
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it('delivers createEventDispatcher events to every handler', () => {
        const parent = mount(DispatchParent as any, { target: new FakeNode('fragment'), renderer }) as any;
        flushSync();
        parent.child.fire('a');
        parent.child.fire('b');
        flushSync();
        expect(parent.received).toEqual(['a', 'also:a', 'b', 'also:b']);
    });

    it('forwards native element events to the handlers the parent passed', () => {
        const root = new FakeNode('fragment');
        const parent = mount(ForwardParent as any, { target: root, renderer }) as any;
        flushSync();
        const button = root.elements.find((n) => n.name === 'button')!;
        const event = { eventName: 'tap', object: button };
        button.fire('tap', event);
        flushSync();
        expect(parent.taps).toEqual([event, 'second']);
    });
});
