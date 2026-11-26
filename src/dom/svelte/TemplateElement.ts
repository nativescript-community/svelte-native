import type { Component } from 'svelte';
import { ElementNode, ViewNode } from '../basicdom';
import { render } from '../renderer';
import { TemplateProps } from './TemplateProps';

/** A template mounted for one recycled native view (see `TemplateElement.mount`). */
export interface TemplateInstance<T = any> {
    /** Rebinds the mounted template in place, e.g. when the native view is reused for another item. */
    update(item: T, index: number): void;
    unmount(): void;
}

export default class TemplateElement extends ElementNode {
    private instances = new Set<TemplateInstance>();

    /** Context of the component that declared the template. Mounted instances inherit it. */
    context?: Map<any, any>;

    constructor() {
        super('template');
    }

    set component(value: Component<any>) {
        this.setAttribute('component', value)
    }

    get component(): Component<any> {
        return this.getAttribute('component')
    }

    /** Number of mounted instances that have not been unmounted. */
    get instanceCount() {
        return this.instances.size;
    }

    /**
     * Mounts the template into `target` for `item`/`index`. The instance is unmounted along with the
     * template, or earlier through `unmount()`, which also stops it being tracked.
     */
    mount<T = any>(target: ViewNode, item: T, index: number): TemplateInstance<T> {
        const props = new TemplateProps(item, index);
        const result = render(this.component, { target, props: props.props, context: this.context });
        const instance: TemplateInstance<T> = {
            update: (nextItem, nextIndex) => props.update(nextItem, nextIndex),
            unmount: () => {
                if (this.instances.delete(instance)) result.unmount();
            },
        };
        this.instances.add(instance);
        return instance;
    }

    unmountInstances() {
        for (const instance of [...this.instances]) instance.unmount();
    }
}
