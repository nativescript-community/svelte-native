import { describe, it, expect } from 'vitest';
import { curveFunction } from '../src/transitions/curve';

describe('curveFunction', () => {
    it('is the identity for linear and unknown curves', () => {
        for (const curve of ['linear', 'nope', undefined] as any[]) {
            const f = curveFunction(curve);
            expect([f(0), f(0.25), f(1)]).toEqual([0, 0.25, 1]);
        }
    });

    it('starts at 0, ends at 1 and is monotonic for every named curve', () => {
        for (const curve of ['ease', 'easeIn', 'easeOut', 'easeInOut', 'spring'] as any[]) {
            const f = curveFunction(curve);
            expect(f(0)).toBe(0);
            expect(f(1)).toBe(1);
            let previous = 0;
            for (let t = 0.05; t <= 1; t += 0.05) {
                expect(f(t)).toBeGreaterThanOrEqual(previous - 1e-9);
                previous = f(t);
            }
        }
    });

    it('is slow at the start for easeIn and fast for easeOut', () => {
        expect(curveFunction('easeIn' as any)(0.2)).toBeLessThan(0.2);
        expect(curveFunction('easeOut' as any)(0.2)).toBeGreaterThan(0.2);
    });

    it('accepts a cubic bezier curve', () => {
        const f = curveFunction({ x1: 0.42, y1: 0, x2: 0.58, y2: 1 } as any);
        expect(f(0.5)).toBeCloseTo(0.5, 2);
        expect(f(0.25)).toBeLessThan(0.25);
    });
});
