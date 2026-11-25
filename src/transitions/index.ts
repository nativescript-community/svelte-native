import { AnimationDefinition, CoreTypes, View } from "@nativescript/core";
import * as easings from './easing'
import { transition, TransitionOptions, TransitionSpec } from "./transition";

export { transition, TransitionOptions, TransitionSpec, NativeAnimationDefinition } from "./transition";

export interface TransitionParams extends TransitionOptions {
    delay?: number;
    duration?: number;
    /** A NativeScript animation curve: a `CoreTypes.AnimationCurve` or one of `easings`. */
    easing?: AnimationDefinition['curve'];
}

export interface FlyParams extends TransitionParams {
    x?: number;
    y?: number;
}

/* ported from svelte transitions, as attachments: `<label {@attach fade({ duration: 200 })} />` */

export function fade({ delay = 0, duration = 400, easing = CoreTypes.AnimationCurve.linear, ...options }: TransitionParams = {}) {
    return transition((view: View): TransitionSpec => {
        const opacity = view.opacity;
        return { delay, duration, curve: easing, props: (t) => ({ opacity: t * opacity }) };
    }, options);
}

export function fly({ delay = 0, duration = 400, easing = CoreTypes.AnimationCurve.easeOut, x = 0, y = 0, ...options }: FlyParams = {}) {
    return transition((view: View): TransitionSpec => {
        const { opacity, translateX, translateY } = view;
        return {
            delay,
            duration,
            curve: easing,
            props: (t) => ({
                opacity: t * opacity,
                translate: { x: translateX + (1 - t) * x, y: translateY + (1 - t) * y }
            })
        };
    }, options);
}

export function slide({ delay = 0, duration = 400, easing = CoreTypes.AnimationCurve.easeOut, ...options }: TransitionParams = {}) {
    return transition((view: View): TransitionSpec => {
        const { effectiveHeight: height, scaleX, scaleY, translateX, translateY } = view;
        return {
            delay,
            duration,
            curve: easing,
            props: (t) => ({
                scale: { x: scaleX, y: t * scaleY },
                translate: { x: translateX, y: translateY - (1 - t) * 0.5 * height }
            })
        };
    }, options);
}

export function scale({ delay = 0, duration = 400, easing = CoreTypes.AnimationCurve.easeOut, start = 0, ...options }: TransitionParams & { start?: number } = {}) {
    return transition((view: View): TransitionSpec => {
        const { opacity, scaleX, scaleY } = view;
        return {
            delay,
            duration,
            curve: easing,
            props: (t) => ({
                opacity: t * opacity,
                scale: { x: scaleX * (start + (1 - start) * t), y: scaleY * (start + (1 - start) * t) }
            })
        };
    }, options);
}

export { easings }
