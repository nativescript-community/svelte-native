import { describe, it, expect } from 'vitest';
import { ElementNode } from '../src/dom/basicdom';
import renderer, { isMounting } from '../src/dom/renderer';

const outro = Symbol.for('svelte-native.outro');

function setup() {
    const parent = new ElementNode('stackLayout');
    const node = new ElementNode('label');
    parent.appendChild(node);
    return { parent, node: node as ElementNode & { [outro]?: () => Promise<unknown> | void } };
}

const names = (parent: ElementNode) => parent.childNodes.map((n) => n.tagName);

describe('renderer.remove', () => {
    it('detaches an element straight away', () => {
        const { parent, node } = setup();
        renderer.remove(node as any);
        expect(names(parent)).toEqual([]);
    });

    it('keeps an element with an outro attached until it has played', async () => {
        const { parent, node } = setup();
        let finish!: () => void;
        node[outro] = () => new Promise<void>((resolve) => (finish = resolve));

        renderer.remove(node as any);
        expect(names(parent)).toEqual(['label']);

        finish();
        await Promise.resolve();
        await Promise.resolve();
        expect(names(parent)).toEqual([]);
        expect(node[outro]).toBeUndefined();
    });

    it('detaches even when the outro fails', async () => {
        const { parent, node } = setup();
        node[outro] = () => Promise.reject(new Error('animation failed'));
        renderer.remove(node as any);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(names(parent)).toEqual([]);
    });

    it('detaches when the outro throws', () => {
        const { parent, node } = setup();
        node[outro] = () => {
            throw new Error('boom');
        };
        renderer.remove(node as any);
        expect(names(parent)).toEqual([]);
    });

    it('does not touch an element that was moved while its outro played', async () => {
        const { parent, node } = setup();
        const elsewhere = new ElementNode('other');
        let finish!: () => void;
        node[outro] = () => new Promise<void>((resolve) => (finish = resolve));

        renderer.remove(node as any);
        parent.removeChild(node);
        elsewhere.appendChild(node);
        finish();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(names(elsewhere)).toEqual(['label']);
    });
});

describe('isMounting', () => {
    it('is false outside of a mount', () => {
        expect(isMounting()).toBe(false);
    });
});
