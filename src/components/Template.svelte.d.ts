import type { SvelteComponent } from "svelte";
import type { Snippet } from "svelte";

// Template.svelte type definition (svelte 5 compatible)
export interface TemplateProps<T = any> {
    key?: string;
    children?: Snippet<[T]>;
}

export default class Template<T = any> extends SvelteComponent<TemplateProps<T>> {}
