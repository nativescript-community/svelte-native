import ViewNode from './ViewNode'

export default class TextNode extends ViewNode {
    text: string;
    constructor(text: string) {
        super()

        this.nodeType = 3
        this.text = text
    }

    setText(text: string) {
        this.text = text
        if (this.parentNode) {
            this.parentNode.updateText()
        }
    }

    set data(text: string) {
        this.setText(text);
    }

    get data() {
        return this.text;
    }

    // nodeValue is used by svelte 5's set_text()
    get nodeValue(): string {
        return this.text;
    }

    set nodeValue(value: string) {
        this.setText(value);
    }

    cloneNode(_deep?: boolean): TextNode {
        const clone = new TextNode(this.text);
        clone._ownerDocument = this._ownerDocument;
        return clone;
    }
}
