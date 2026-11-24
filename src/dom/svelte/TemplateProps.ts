import { flushSync } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export interface TemplateItemProps<T = any> {
    readonly item: T;
    readonly index: number;
}

/**
 * Reactive `{ item, index }` props for a template instance that native code recycles
 * (ListView cells, pagers, ...). Mount the template once with `props`, then call `update`
 * when the native view is rebound to another item.
 */
export class TemplateProps<T = any> {
    private state: SvelteMap<'item' | 'index' | 'version', any>;
    readonly props: TemplateItemProps<T>;

    constructor(item: T, index: number) {
        const state = (this.state = new SvelteMap<'item' | 'index' | 'version', any>([
            ['item', item],
            ['index', index],
            ['version', 0],
        ]));
        // Reading `version` makes every update repaint, including when the same (mutated)
        // item object is passed again.
        this.props = {
            get item() {
                state.get('version');
                return state.get('item');
            },
            get index() {
                state.get('version');
                return state.get('index');
            },
        };
    }

    update(item: T, index: number) {
        this.state.set('item', item);
        this.state.set('index', index);
        this.state.set('version', this.state.get('version') + 1);
        // Native views measure the cell as soon as the item-loading callback returns.
        flushSync();
    }
}
