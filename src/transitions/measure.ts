import { Utils, View } from '@nativescript/core';

/**
 * The height `view` would take at the given width (dip), measured on its own, without a layout pass
 * of its parent. The view's own `height` must be unset (auto) for this to be its natural height.
 */
export function measureNaturalHeight(view: View, width: number): number {
    const { layout } = Utils;
    view.measure(layout.makeMeasureSpec(Math.round(layout.toDevicePixels(width)), layout.EXACTLY), layout.makeMeasureSpec(0, layout.UNSPECIFIED));
    return layout.toDeviceIndependentPixels(view.getMeasuredHeight());
}
