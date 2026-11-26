import { ListView, ItemEventData, ItemsSource, View } from '@nativescript/core'
import TemplateElement, { TemplateInstance } from '../svelte/TemplateElement';
import { createElement, logger as log, registerElement, ViewNode } from '../basicdom';
import NativeViewElementNode from './NativeViewElementNode';
import { batchNativeUpdates } from './batchNativeUpdates';

interface SvelteItemView extends View {
    __SvelteComponentBuilder__?: ((item: any, index: number) => void) | null;
    __SvelteTemplateInstance__?: TemplateInstance;
}

function mountItem(view: SvelteItemView, wrapper: ViewNode, template: TemplateElement, item: any, index: number) {
    view.__SvelteTemplateInstance__ = template.mount(wrapper, item, index);
}

export class SvelteKeyedTemplate {
    _key: string;
    _templateEl: TemplateElement;

    constructor(key: string, templateEl: TemplateElement) {
        this._key = key;
        this._templateEl = templateEl;
    }

    get component() {
        return this._templateEl.component;
    }

    get key() {
        return this._key
    }

    createView(): View {
        // The item isn't known yet, so mounting is deferred until the first itemLoading for this view.
        log.debug(() => `creating view for key ${this.key}`)
        let wrapper = createElement('StackLayout', this._templateEl.ownerDocument) as NativeViewElementNode<View>;
        wrapper.setStyle("padding", 0)
        wrapper.setStyle("margin", 0)
        let nativeEl = wrapper.nativeView as SvelteItemView;
        nativeEl.__SvelteComponentBuilder__ = (item: any, index: number) => {
            if (typeof this.component !== 'function') {
                log.error(() => `Template component for key '${this.key}' is not available yet`);
                return;
            }
            mountItem(nativeEl, wrapper, this._templateEl, item, index);
        }
        return nativeEl;
    }
}

export default class ListViewElement extends NativeViewElementNode<ListView> {
    constructor() {
        super("ListView", ListView);
        this.nativeView.on(ListView.itemLoadingEvent, (args) => { this.updateListItem(args as ItemEventData) });
    }

    updateListItem(args: ItemEventData) {
        let item;
        let listView = this.nativeView;
        let items = listView.items;

        if (args.index >= items.length) {
            log.error(() => `Got request for item at index that didn't exist ${args.index}`)
            return;
        }

        if ((items as ItemsSource).getItem) {
            item = (items as ItemsSource).getItem(args.index);
        } else {
            item = (items as any)[args.index]
        }

        let view = args.view as SvelteItemView;

        if (view?.__SvelteTemplateInstance__) {
            log.debug(() => `updating view for ${args.index} which is a ${view}`)
            const instance = view.__SvelteTemplateInstance__;
            batchNativeUpdates(view, () => instance.update(item, args.index));
            return;
        }

        if (view?.__SvelteComponentBuilder__) {
            log.debug(() => `instantiating component in keyed view item at ${args.index}`);
            view.__SvelteComponentBuilder__(item, args.index);
            view.__SvelteComponentBuilder__ = null;
            return;
        }

        log.debug(() => `creating default view for item at ${args.index}`)
        let template: TemplateElement;
        if (typeof listView.itemTemplates == "object") {
            template = listView.itemTemplates.filter(x => x.key == "default").map(x => (x as SvelteKeyedTemplate)._templateEl)[0]
        }

        if (typeof template?.component !== 'function') {
            log.error(() => `Couldn't determine component to use for item at ${args.index}`);
            return;
        }
        let wrapper = createElement('ProxyViewContainer', this.ownerDocument) as NativeViewElementNode<View>;
        let nativeEl = wrapper.nativeView as SvelteItemView;
        mountItem(nativeEl, wrapper, template, item, args.index);
        args.view = nativeEl;
    }

    onInsertedChild(childNode: ViewNode, index: number) {
        super.onInsertedChild(childNode, index);
        if (childNode instanceof TemplateElement) {
            let key = childNode.getAttribute('key') || "default"
            log.debug(() => `Adding template for key ${key}`);
            if (!this.nativeView.itemTemplates || typeof this.nativeView.itemTemplates == "string") {
                this.nativeView.itemTemplates = []
            }
            this.nativeView.itemTemplates.push(new SvelteKeyedTemplate(key, childNode))
        }
    }

    onRemovedChild(childNode: ViewNode) {
        super.onRemovedChild(childNode);
        if (childNode instanceof TemplateElement) {
            childNode.unmountInstances();
            let key = childNode.getAttribute('key') || "default"
            if (this.nativeView.itemTemplates && typeof this.nativeView.itemTemplates != "string") {
                this.nativeView.itemTemplates = this.nativeView.itemTemplates.filter(t => t.key != key);
            }
        }
    }

    static register() {
        registerElement("ListView", () => new ListViewElement())
    }
}
