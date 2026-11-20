/** The CustomEvent subset used by Svelte's component dispatcher. */
export default class SvelteNativeCustomEvent<T = any> {
    eventName: string;
    type: string;
    detail: T;
    bubbles: boolean;
    cancelable: boolean;
    composed: boolean;
    defaultPrevented = false;

    constructor(type: string, options: CustomEventInit<T> = {}) {
        this.eventName = this.type = type;
        this.detail = options?.detail ?? null;
        this.bubbles = !!options?.bubbles;
        this.cancelable = !!options?.cancelable;
        this.composed = !!options?.composed;
    }

    preventDefault() {
        if (this.cancelable) this.defaultPrevented = true;
    }

    initCustomEvent(type: string, bubbles = false, cancelable = false, detail: T = null) {
        this.eventName = this.type = type;
        this.detail = detail;
        this.bubbles = !!bubbles;
        this.cancelable = !!cancelable;
        this.defaultPrevented = false;
    }
}
