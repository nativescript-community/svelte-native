import type { View, ViewBase } from '@nativescript/core';

/**
 * Runs `update` with native updates suspended on `view` and its descendants, so a recycled cell
 * applies all its changed properties and requests its layout once when the update ends, instead
 * of once per property.
 *
 * Only the views that exist before the update are suspended and resumed: views the update creates
 * (e.g. a changed `{#if}`) must not be resumed, which would unbalance their load flags.
 */
export function batchNativeUpdates<T>(view: View, update: () => T): T {
    const suspended: ViewBase[] = [];
    const suspend = (current: ViewBase) => {
        current._suspendNativeUpdates(0);
        suspended.push(current);
        current.eachChild((child) => {
            suspend(child);
            return true;
        });
    };
    suspend(view);
    try {
        return update();
    } finally {
        for (let i = suspended.length - 1; i >= 0; i--) suspended[i]._resumeNativeUpdates(0);
    }
}
