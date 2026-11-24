import type { Component } from 'svelte';
import { ElementNode } from '../basicdom';

interface MountedInstance {
    unmount(): void;
}

export default class TemplateElement extends ElementNode {
    private instances = new Set<MountedInstance>();

    constructor() {
        super('template');
    }

    set component(value: Component<any>) {
        this.setAttribute('component', value)
    }

    get component(): Component<any> {
        return this.getAttribute('component')
    }

    /** Tracks an instance mounted from this template so it is unmounted along with the template. */
    addInstance(instance: MountedInstance) {
        this.instances.add(instance);
    }

    unmountInstances() {
        const instances = [...this.instances];
        this.instances.clear();
        for (const instance of instances) instance.unmount();
    }
}
