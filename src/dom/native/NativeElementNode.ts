import { logger as log, ViewNode, registerElement } from '../basicdom'
import { isAndroid, isIOS, ObservableArray } from '@nativescript/core';
import ElementNode from '../basicdom/ElementNode';

export enum NativeElementPropType {
    Value,
    Array,
    ObservableArray
}

export interface NativeElementPropConfig {
    [key: string]: NativeElementPropType
}

function setOnArrayProp(parent: any, value: any, propName: string, index: number, build: (value: any) => any = null) {
    log.debug(()=> `setOnArrayProp ${propName} index: ${index}`)
    let current = parent[propName];
    if (!current || !current.push) {
        parent[propName] = build ? build(value) : [value];
    } else {
        if (current instanceof ObservableArray) {
            if (index > -1) {
                current.splice(index, 0, value)
            } else {
                current.push(value);
            }
        } else {
            if (index > -1) {
                const newArr = current.slice();
                newArr.splice(index, 0, value);
                parent[propName] = newArr
            } else {
                parent[propName] = [...current, value];
            }
        }
    }
}

function removeFromArrayProp(parent: any, value: any, propName: string) {
    let current = parent[propName];
    if (!current || !current.splice) {
        return;
    }
    
    let idx = current.indexOf(value);
    if (idx < 0) return;
        

    if (current instanceof ObservableArray) {
        current.splice(idx, 1);
    } else {
        const newArr = current.slice()
        newArr.splice(idx, 1);
        parent[propName] = newArr
    }
}

// Implements an ElementNode that wraps a NativeScript object. It uses the object as the source of truth for its attributes
export default class NativeElementNode<T> extends ElementNode {
    _nativeElement: T;
    propAttribute: string = null;
    propConfig: NativeElementPropConfig;

    constructor(tagName: string, elementClass: new () => T, setsParentProp: string = null, propConfig: NativeElementPropConfig = {}) {
        super(tagName);
        this.propConfig = propConfig
        this.propAttribute = setsParentProp
        this._nativeElement = new elementClass();

        (this._nativeElement as any).__SvelteNativeElement__ = this;
        log.debug(() => `created ${this} ${this._nativeElement}`)
    }

    get nativeElement() {
        return this._nativeElement
    }

    set nativeElement(el) {
        if (this._nativeElement) {
            throw new Error(`Can't overwrite native element.`)
        }

        this._nativeElement = el
    }

    getAttribute(fullkey: string) {
        let getTarget = this.nativeElement as any;

        let keypath = fullkey.split(".");
        let resolvedKeys: string[] = [];

        while (keypath.length > 0) {
            if (!getTarget) return null;

            let key = keypath.shift();

            resolvedKeys.push(key)

            if (keypath.length > 0) {
                getTarget = getTarget[key];
            } else {
                return getTarget[key];
            }
        }

        return null;
    }

    onInsertedChild(childNode: ViewNode, index: number) {
        super.onInsertedChild(childNode, index);
        // support for the prop: shorthand for setting parent property to native element
        if (!(childNode instanceof NativeElementNode)) return;
        let propName = childNode.propAttribute;
        if (!propName) return;

        //Special case Array and Observable Array keys
        if (this.propConfig[propName] === undefined || this.propConfig[propName] === NativeElementPropType.Value) {
            this.setAttribute(propName, childNode);
            return;
        }
        
        //our array index is based on how many items with the same prop attribute come before us
        const allPropSetters = this.childNodes.filter(n => n instanceof NativeElementNode && n.propAttribute && n.propAttribute.toLowerCase() == propName.toLowerCase());
        const myIndex = allPropSetters.indexOf(childNode)

        switch (this.propConfig[propName]) {
            case NativeElementPropType.Array:
                setOnArrayProp(this.nativeElement, childNode.nativeElement, propName, myIndex)
                return;
            case NativeElementPropType.ObservableArray:
                setOnArrayProp(this.nativeElement, childNode.nativeElement, propName, myIndex, (v) => new ObservableArray(v))
                return;
        }
    }

    onRemovedChild(childNode: ViewNode) {
        if (!(childNode instanceof NativeElementNode)) return;
        let propName = childNode.propAttribute;
        if (!propName) return;
        //Special case Array and Observable Array keys

        switch (this.propConfig[propName]) {
            case NativeElementPropType.Array:
            case NativeElementPropType.ObservableArray:
                removeFromArrayProp(this.nativeElement, childNode.nativeElement, propName)
                return;
            default:
                this.setAttribute(propName, null);
        }

        super.onRemovedChild(childNode)
    }

    removeAttribute(fullkey: string) {
        // if an attribute is set to null svelte will call removeAttribute
        // but we still need to call setAttribute to apply the change on N view
        this.setAttribute(fullkey, null);
    }

    setAttribute(fullkey: string, value: any) {
        const nv = this.nativeElement as any
        let setTarget = nv;

        // normalize key
        if (__ANDROID__) {
            if (fullkey.startsWith('android:')) {
                fullkey = fullkey.substring(8);
            }
            if (fullkey.startsWith('ios:')) {
                return;
            }
        }
        if (__IOS__) {
            if (fullkey.startsWith('ios:')) {
                fullkey = fullkey.substring(4);
            }
            if (fullkey.startsWith('android:')) {
                return;
            }
        }

        if (fullkey.startsWith("prop:")) {
            this.propAttribute = fullkey.substring(5);
            return;
        }

        //we might be getting an element from a propertyNode eg page.actionBar, unwrap
        if (value instanceof NativeElementNode) {
            value = value.nativeElement
        }

        let keypath = fullkey.split(".");
        let resolvedKeys: string[] = [];

        while (keypath.length > 0) {
            if (!setTarget) return;
            let key = keypath.shift();
            resolvedKeys.push(key)

            if (keypath.length > 0) {
                setTarget = setTarget[key];
            } else {
                log.debug(() => `setAttr value ${this} ${resolvedKeys.join(".")} ${value}`)
                setTarget[key] = value
            }
        }
    }
}


export function registerNativeConfigElement<T>(elementName: string, resolver: () => new () => T, parentProp: string = null, propConfig: NativeElementPropConfig = {}) {
    registerElement(elementName, () => new NativeElementNode(elementName, resolver(), parentProp, propConfig));
}
