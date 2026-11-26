// Key under which `on:event` forwarding (see the preprocessor) hands over the original native event.
export const forwardedEvent = Symbol.for('svelte-native.forwarded-event');

/**
 * `CustomEvent` for Svelte's `createEventDispatcher`, which constructs `new CustomEvent(type, { detail, bubbles, cancelable })`.
 * Also carries `eventName`, which is what NativeScript calls the event type.
 */
export class NativeCustomEvent {
    detail: any;
    eventName: string;
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented = false;

    constructor(name: string, init: { detail?: any; bubbles?: boolean; cancelable?: boolean } | null = null) {
        // A forwarded event is delivered as itself rather than wrapped, so handlers see the NativeScript EventData.
        const forwarded = init?.detail?.[forwardedEvent];
        if (forwarded) return forwarded;

        this.eventName = name;
        this.type = name;
        this.detail = init?.detail ?? null;
        this.bubbles = !!init?.bubbles;
        this.cancelable = !!init?.cancelable;
    }

    preventDefault() {
        if (this.cancelable) this.defaultPrevented = true;
    }
}
