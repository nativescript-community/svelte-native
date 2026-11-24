import { SvelteComponent, type Snippet } from "svelte";

export interface TemplateItem<T = any> {
    item: T;
    index: number;
}

export interface TemplateProps<T = any> {
    key?: string;
    children?: Snippet<[TemplateItem<T>]>;
    [attribute: string]: any;
}

export default class Template<T = any> extends SvelteComponent<TemplateProps<T>, {}, { default: TemplateItem<T> }> {}
