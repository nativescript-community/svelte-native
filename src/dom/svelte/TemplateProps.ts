import { flushSync } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export interface TemplateItemProps<T = any> {
    readonly item: T;
    readonly index: number;
}

// Like Svelte 4's `safe_not_equal`: an object may have been mutated since it was last passed, so it always counts as changed.
function mayHaveChanged(previous: unknown, next: unknown) {
    return previous !== next || (next !== null && (typeof next === 'object' || typeof next === 'function'));
}

/**
 * Reactive `{ item, index }` props for a template instance that native code recycles
 * (ListView cells, pagers, ...). Mount the template once with `props`, then call `update`
 * when the native view is rebound to another item.
 *
 * `item` and `index` are tracked separately, so rebinding to an item at the same index (or a
 * new index with the same item) only re-runs the bindings that read what changed, and rebinding
 * to what the row already shows does no work at all.
 */
export class TemplateProps<T = any> {
    private state: SvelteMap<'item' | 'index' | 'itemVersion', any>;
    private item: T;
    private index: number;
    readonly props: TemplateItemProps<T>;

    constructor(item: T, index: number) {
        this.item = item;
        this.index = index;
        const state = (this.state = new SvelteMap<'item' | 'index' | 'itemVersion', any>([
            ['item', item],
            ['index', index],
            ['itemVersion', 0],
        ]));
        this.props = {
            get item() {
                // the version repaints a same (possibly mutated) object, which `item` alone would not
                state.get('itemVersion');
                return state.get('item');
            },
            get index() {
                return state.get('index');
            },
        };
    }

    update(item: T, index: number) {
        const itemChanged = this.item !== item;
        const repaintItem = !itemChanged && mayHaveChanged(this.item, item);
        if (!itemChanged && !repaintItem && this.index === index) return;

        this.item = item;
        this.index = index;
        if (itemChanged) this.state.set('item', item);
        else if (repaintItem) this.state.set('itemVersion', this.state.get('itemVersion') + 1);
        this.state.set('index', index);
        // Native views measure the cell as soon as the item-loading callback returns.
        flushSync();
    }
}
