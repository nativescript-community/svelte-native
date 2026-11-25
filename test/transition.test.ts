import { describe, it, expect, vi, beforeEach } from 'vitest';

let mounting = false;
vi.mock('../src/dom/renderer', () => ({ isMounting: () => mounting }));

import { transition } from '../src/transitions/transition';

const outro = Symbol.for('svelte-native.outro');

function fakeView(overrides: Record<string, any> = {}) {
    const animations: any[] = [];
    const view: any = {
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0,
        style: {},
        nativeViewProtected: {},
        _batchUpdate: (fn: () => void) => fn(),
        createAnimation(definition: any) {
            const animation: any = { definition, isPlaying: false, cancelled: false };
            animation.play = () => {
                animation.isPlaying = true;
                return new Promise<void>((resolve, reject) => {
                    animation.finish = () => ((animation.isPlaying = false), resolve());
                    animation.fail = () => reject(new Error('Animation cancelled'));
                });
            };
            animation.cancel = () => {
                animation.cancelled = true;
                animation.fail();
            };
            animations.push(animation);
            return animation;
        },
        ...overrides,
    };
    return { view, animations, node: { nativeView: view } as any };
}

const fade = () =>
    transition((view) => {
        const opacity = view.opacity;
        return { delay: 10, duration: 200, curve: 'easeOut', props: (t) => ({ opacity: t * opacity }) };
    });

beforeEach(() => {
    mounting = false;
});

describe('transition', () => {
    it('plays the intro from hidden to shown when added after mount', () => {
        const { view, animations, node } = fakeView();
        fade()(node);
        expect(view.style.opacity).toBe(0);
        expect(animations).toHaveLength(1);
        expect(animations[0].definition).toMatchObject({ opacity: 1, delay: 10, duration: 200, curve: 'easeOut' });
    });

    it('skips the intro during the initial mount', () => {
        mounting = true;
        const { view, animations, node } = fakeView();
        fade()(node);
        expect(animations).toHaveLength(0);
        expect(view.style.opacity).toBeUndefined();
    });

    it('can skip the intro or the outro', () => {
        const noIntro = fakeView();
        transition(() => ({ delay: 0, duration: 1, props: (t) => ({ opacity: t }) }), { intro: false })(noIntro.node);
        expect(noIntro.animations).toHaveLength(0);
        expect(typeof noIntro.node[outro]).toBe('function');

        const noOutro = fakeView();
        transition(() => ({ delay: 0, duration: 1, props: (t) => ({ opacity: t }) }), { outro: false })(noOutro.node);
        expect(noOutro.node[outro]).toBeUndefined();
    });

    it('registers an outro that animates from shown to hidden and resolves when done', async () => {
        const { view, animations, node } = fakeView({ opacity: 0.8 });
        mounting = true;
        fade()(node);

        const finished = node[outro]();
        expect(view.style.opacity).toBe(0.8);
        expect(animations[0].definition).toMatchObject({ opacity: 0 });

        let done = false;
        finished.then(() => (done = true));
        await Promise.resolve();
        expect(done).toBe(false);
        animations[0].finish();
        await finished;
        expect(done).toBe(true);
    });

    it('cancels a running intro when the outro starts, without failing', async () => {
        const { animations, node } = fakeView();
        fade()(node);
        const finished = node[outro]();
        expect(animations[0].cancelled).toBe(true);
        expect(animations).toHaveLength(2);
        animations[1].finish();
        await expect(finished).resolves.toBeUndefined();
    });

    it('resolves an outro that is cancelled', async () => {
        const { animations, node } = fakeView();
        mounting = true;
        fade()(node);
        const finished = node[outro]();
        animations[0].fail();
        await expect(finished).resolves.toBeUndefined();
    });

    it('cancels the intro when the element goes away', () => {
        const { animations, node } = fakeView();
        const cleanup = fade()(node);
        animations[0].isPlaying = true;
        cleanup();
        expect(animations[0].cancelled).toBe(true);
    });

    it('applies the end state straight away for a view without a native view yet', async () => {
        const { view, animations, node } = fakeView({ nativeViewProtected: undefined });
        fade()(node);
        expect(animations).toHaveLength(0);
        expect(view.style.opacity).toBe(1);
        await expect(node[outro]()).resolves.toBeUndefined();
        expect(view.style.opacity).toBe(0);
    });

    it('applies scale and translate to the view properties', () => {
        const { view, node } = fakeView();
        transition(() => ({ delay: 0, duration: 1, props: (t) => ({ scale: { x: t, y: t * 2 }, translate: { x: 5 * t, y: 7 * t } }) }))(node);
        expect(view.scaleX).toBe(0);
        expect(view.scaleY).toBe(0);
        expect(view.translateX).toBe(0);
        expect(view.translateY).toBe(0);
    });
});
