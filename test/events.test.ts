import { describe, it, expect } from 'vitest';
import { flushSync, mount } from 'svelte';
import renderer, { FakeNode } from './fake-renderer';
import DispatchParent from './fixtures/DispatchParent.svelte';

describe('component on: through svelteNativePreprocess', () => {
    it('delivers createEventDispatcher events to every handler', () => {
        const parent = mount(DispatchParent as any, { target: new FakeNode('fragment'), renderer }) as any;
        flushSync();
        parent.child.fire('a');
        parent.child.fire('b');
        flushSync();
        expect(parent.received).toEqual(['a', 'also:a', 'b', 'also:b']);
    });
});
