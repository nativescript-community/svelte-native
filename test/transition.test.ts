import { describe, it, expect, vi, beforeEach } from 'vitest';

let mounting = false;
vi.mock('../src/dom/renderer', () => ({ isMounting: () => mounting }));

// a frame loop the tests step by hand: `frames.run(ms)` delivers one frame ms later than the previous
const frames = vi.hoisted(() => {
    const state = { time: 0, queue: new Map<number, (now: number) => void>(), id: 0 };
    return {
        state,
        run(ms: number) {
            state.time += ms;
            const queued = [...state.queue.values()];
            state.queue.clear();
            for (const callback of queued) callback(state.time);
        }
    };
});
const measured = vi.hoisted(() => ({ height: 50, onMeasure: undefined as undefined | (() => void) }));
vi.mock('../src/transitions/measure', () => ({
    measureNaturalHeight: () => {
        measured.onMeasure?.();
        return measured.height;
    }
}));
vi.mock('../src/transitions/frame', () => ({
    requestAnimationFrame: (callback: (now: number) => void) => (frames.state.queue.set(++frames.state.id, callback), frames.state.id),
    cancelAnimationFrame: (id: number) => frames.state.queue.delete(id)
}));

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
        height: 'auto',
        marginTop: 4,
        marginBottom: 6,
        effectiveMarginTop: 4,
        effectiveMarginBottom: 6,
        listeners: {} as Record<string, (() => void)[]>,
        getActualSize: () => ({ width: 100, height: 50 }),
        on(event: string, handler: () => void) {
            (view.listeners[event] ??= []).push(handler);
        },
        off(event: string, handler: () => void) {
            view.listeners[event] = (view.listeners[event] ?? []).filter((h: () => void) => h !== handler);
        },
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

    it('lets the outro run when the effect is torn down after the element was removed', async () => {
        // Svelte calls the renderer's remove (starting the outro) and only then the attachment's cleanup
        const { animations, node } = fakeView();
        mounting = true;
        const cleanup = fade()(node);
        const finished = node[outro]();
        cleanup();
        expect(animations[0].cancelled).toBe(false);
        animations[0].finish();
        await expect(finished).resolves.toBeUndefined();
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

describe('transition with collapse', () => {
    const spec = { delay: 0, duration: 100, props: (t: number) => ({ opacity: t }) };
    const collapsing = (options = {}) => transition(() => spec, { collapse: true, ...options });
    const extent = (view: any) => [view.height, view.marginTop, view.marginBottom];

    beforeEach(() => {
        frames.state.queue.clear();
        frames.state.time = 0;
    });

    it('outro shrinks the height and vertical margins to 0 in step with the animation', async () => {
        const { view, node, animations } = fakeView();
        mounting = true;
        collapsing()(node);

        const finished = node[outro]();
        animations[0].finish();
        expect(extent(view)).toEqual([50, 4, 6]);

        frames.run(1000); // first frame starts the clock
        frames.run(50);
        expect(view.height).toBeCloseTo(25, 5);
        expect(view.marginTop).toBeCloseTo(2, 5);

        frames.run(60);
        expect(extent(view)).toEqual([0, 0, 0]);
        await finished.then(() => undefined);
    });

    it('the outro waits for the layout animation, not just the native one', async () => {
        const { animations, node } = fakeView();
        mounting = true;
        collapsing()(node);
        let done = false;
        node[outro]().then(() => (done = true));

        animations[0].finish();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(done).toBe(false);

        frames.run(0);
        frames.run(150);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(done).toBe(true);
    });

    it('intro starts collapsed and invisible, never taking its full height, then grows once measured', async () => {
        const { view, node, animations } = fakeView({ getActualSize: () => ({ width: 0, height: 0 }) });
        collapsing()(node);
        // before any layout pass: the element takes no space and cannot be seen
        expect(view.opacity).toBe(0);
        expect(extent(view)).toEqual([0, 0, 0]);
        expect(animations).toHaveLength(0);

        // laid out at height 0: its width is known now
        view.getActualSize = () => ({ width: 100, height: 0 });
        view.listeners.layoutChanged.forEach((handler: () => void) => handler());
        expect(animations).toHaveLength(0); // the layout pass is left alone, work waits for the next frame

        frames.run(0);
        expect(extent(view)).toEqual([0, 0, 0]);
        expect(animations).toHaveLength(1);
        expect(animations[0].definition).toMatchObject({ opacity: 1 });

        frames.run(0);
        frames.run(50);
        expect(view.height).toBeCloseTo(25, 5);
        frames.run(60);
        expect(extent(view)).toEqual([50, 4, 6]);

        animations[0].finish();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(extent(view)).toEqual(['auto', 4, 6]);
    });

    it("intro measures with the element's own size restored, then collapses it again", () => {
        const { view, node } = fakeView();
        let seen: unknown[] | undefined;
        measured.onMeasure = () => (seen = extent(view));
        collapsing()(node);
        frames.run(0);
        measured.onMeasure = undefined;
        expect(seen).toEqual(['auto', 4, 6]);
        expect(extent(view)).toEqual([0, 0, 0]);
    });

    it('intro starts straight away when the view is already laid out', () => {
        const { view, node, animations } = fakeView();
        collapsing()(node);
        expect(extent(view)).toEqual([0, 0, 0]);
        frames.run(0);
        expect(animations).toHaveLength(1);
    });

    it('intro without a measurable height restores the element and plays the plain transition', () => {
        const { view, node, animations } = fakeView();
        measured.height = 0;
        collapsing()(node);
        frames.run(0);
        expect(extent(view)).toEqual(['auto', 4, 6]);
        expect(animations).toHaveLength(1);
        measured.height = 50;
    });

    it('does not collapse an element without a height', async () => {
        const { view, animations, node } = fakeView({ getActualSize: () => ({ width: 0, height: 0 }) });
        mounting = true;
        collapsing()(node);
        const finished = node[outro]();
        expect(view.height).toBe('auto');
        expect(animations).toHaveLength(1);
        animations[0].finish();
        await finished;
    });

    it('cancelling an intro that is waiting for layout, or for its first frame, starts nothing', () => {
        const waiting = fakeView({ getActualSize: () => ({ width: 0, height: 0 }) });
        collapsing()(waiting.node)();
        expect(waiting.view.listeners.layoutChanged).toEqual([]);
        expect(waiting.animations).toHaveLength(0);

        const framed = fakeView();
        collapsing()(framed.node)();
        frames.run(0);
        expect(framed.animations).toHaveLength(0);
    });
});
