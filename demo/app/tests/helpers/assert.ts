import { expect } from 'vitest';

// The on-device Vitest runtime provides `expect` but not chai's `assert`.
export const assert = {
    // chai's `equal` is loose (==), e.g. a FormattedString equals its text
    equal: (actual: unknown, expected: unknown, message?: string) => expect(actual == expected, message ?? `expected ${actual} == ${expected}`).toBe(true),
    strictEqual: (actual: unknown, expected: unknown, message?: string) => expect(actual, message).toBe(expected),
    isTrue: (value: unknown, message?: string) => expect(value, message).toBe(true),
    isFalse: (value: unknown, message?: string) => expect(value, message).toBe(false),
    isNull: (value: unknown, message?: string) => expect(value, message).toBeNull(),
    isNotNull: (value: unknown, message?: string) => expect(value, message).not.toBeNull(),
    isDefined: (value: unknown, message?: string) => expect(value, message).toBeDefined(),
    isFunction: (value: unknown, message?: string) => expect(typeof value, message).toBe('function'),
    instanceOf: (value: unknown, type: any, message?: string) => expect(value, message).toBeInstanceOf(type),
};
