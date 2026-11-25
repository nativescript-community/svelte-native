import type { AnimationDefinition } from '@nativescript/core';

type Curve = AnimationDefinition['curve'];

const named: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    // no JS equivalent of the native spring: settle like easeOut
    spring: [0, 0, 0.58, 1]
};

/** A progress function (0..1 to 0..1) for a NativeScript animation curve, to drive layout from JS in step with native animations. */
export function curveFunction(curve: Curve | undefined): (t: number) => number {
    let points = named.linear;
    if (typeof curve === 'string') points = named[curve] ?? named.linear;
    else if (curve && typeof curve === 'object' && 'x1' in curve) points = [curve.x1, curve.y1, curve.x2, curve.y2];
    const [x1, y1, x2, y2] = points;
    if (x1 === y1 && x2 === y2) return (t) => t;

    const coordinate = (p1: number, p2: number, s: number) => 3 * p1 * s * (1 - s) * (1 - s) + 3 * p2 * s * s * (1 - s) + s * s * s;
    return (x) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        // find the curve parameter whose x is `x`
        let low = 0;
        let high = 1;
        let s = x;
        for (let i = 0; i < 20; i++) {
            s = (low + high) / 2;
            const current = coordinate(x1, x2, s);
            if (Math.abs(current - x) < 1e-4) break;
            if (current < x) low = s;
            else high = s;
        }
        return coordinate(y1, y2, s);
    };
}
