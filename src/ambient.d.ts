// Svelte 5 compatible type declarations for svelte-native
// Svelte 5 components are functions, not classes. But for backward compatibility
// with legacy usage (new Component({target, props})) via `compatibility: { componentApi: 4 }`,
// we still expose the class-like interface.

export class SvelteComponent<T = any> {
    $destroy(): void;
    constructor(options: ComponentConstructorOptions<T>);
    $set(props: Partial<T>): void;
    $on(event: string, handler: (e: Event) => any): () => void;
}
const _SvelteComponent = SvelteComponent;
declare global {
    var SvelteComponent: typeof _SvelteComponent
    interface SvelteComponent<T = any> extends InstanceType<typeof SvelteComponent<T>> { }
}
declare module "*.svelte" {
    var SvelteComponent: typeof _SvelteComponent
    interface SvelteComponent<T = any> extends InstanceType<typeof SvelteComponent<T>> { }
    export interface ComponentConstructorOptions<T> {
        target?: ViewNode | Element;
        props?: T;
        anchor?: ViewNode | Element;
        intro?: boolean;
    }
}

declare const __SVELTE_USE_REQUESTANIMATIONFRAME_OVERRIDE__: boolean;

// Global type stubs for browser APIs shimmed by svelte-native for svelte 5's init_operations()
// These are set in installGlobalShims() using our ViewNode-based classes.
declare global {
    interface Window {
        Node: typeof import('./dom/basicdom/ViewNode').default;
        Element: typeof import('./dom/basicdom/ElementNode').default;
        Text: typeof import('./dom/basicdom/TextNode').default;
        Comment: typeof import('./dom/basicdom/CommentNode').default;
        HTMLMediaElement: new() => {};
    }
}
