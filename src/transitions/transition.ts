import type { AnimationDefinition, Color, Pair, View } from '@nativescript/core';
import type { NativeViewElementNode } from '../dom';
import { isMounting } from '../dom/renderer';

export interface NativeAnimationDefinition {
    opacity?: number;
    backgroundColor?: Color;
    translate?: Pair;
    scale?: Pair;
    rotate?: number;
}

export interface TransitionSpec {
    delay: number;
    duration: number;
    curve?: AnimationDefinition['curve'];
    /** The view's animated values at progress `t`: 0 is hidden, 1 is shown. */
    props: (t: number) => NativeAnimationDefinition;
}

export interface TransitionOptions {
    /** Play when the element is added after its component was mounted. Default true. */
    intro?: boolean;
    /** Keep the element on screen and play when it is removed. Default true. */
    outro?: boolean;
}

// Read by the renderer when it removes the element, see `outro` in dom/renderer.ts.
const outroKey = Symbol.for('svelte-native.outro');

function apply(view: View, values: NativeAnimationDefinition) {
    view._batchUpdate(() => {
        for (const [key, value] of Object.entries(values)) {
            switch (key) {
                case 'scale':
                    view.scaleX = (value as Pair).x;
                    view.scaleY = (value as Pair).y;
                    break;
                case 'translate':
                    view.translateX = (value as Pair).x;
                    view.translateY = (value as Pair).y;
                    break;
                default:
                    ((view.style as any) ?? view)[key] = value;
            }
        }
    });
}

/** Animates `view` from hidden to shown (`in`) or shown to hidden (`out`) with one native animation. */
interface Playing {
    finished: Promise<void>;
    cancel(): void;
}

function play(view: View, spec: TransitionSpec, direction: 'in' | 'out'): Playing {
    const from = direction === 'in' ? 0 : 1;
    const to = 1 - from;
    apply(view, spec.props(from));
    if (!view.nativeViewProtected) {
        apply(view, spec.props(to));
        return { finished: Promise.resolve(), cancel() {} };
    }
    const animation = view.createAnimation({ ...spec.props(to), delay: spec.delay, duration: spec.duration, curve: spec.curve });
    // cancelling rejects the animation's promise, which is expected
    const finished = animation.play().then(
        (): void => {},
        (): void => {}
    );
    return { finished, cancel: () => animation.isPlaying && animation.cancel() };
}

/**
 * Creates an attachment that animates its element natively: `{@attach fade({ duration: 200 })}`.
 *
 * The intro plays when the element is added after its component was mounted, never during the
 * initial mount. The outro plays when the element's own block removes it, e.g. `{#if}` turning
 * false, and the element stays until it is done. Elements removed together with an ancestor do not
 * play it, so transitions are local like Svelte's default.
 */
export function transition(create: (view: View) => TransitionSpec, { intro = true, outro = true }: TransitionOptions = {}) {
    return (node: NativeViewElementNode<View>) => {
        const view = node.nativeView;
        const spec = create(view);
        let introPlaying: Playing | null = null;

        if (outro) {
            (node as any)[outroKey] = () => {
                introPlaying?.cancel();
                return play(view, spec, 'out').finished;
            };
        }
        if (intro && !isMounting()) {
            introPlaying = play(view, spec, 'in');
        }
        // Svelte tears the effect down after the renderer removed the element, i.e. after the outro
        // started, so only the intro may be cancelled here.
        return () => introPlaying?.cancel();
    };
}
