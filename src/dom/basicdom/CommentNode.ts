import ElementNode from './ElementNode'

export default class CommentNode extends ElementNode {
    text: string;
    constructor(text: string) {
        super('comment')

        this.nodeType = 8
        this.text = text
    }

    // data is the standard DOM property for comment/text content
    get data(): string {
        return this.text;
    }

    set data(value: string) {
        this.text = value;
    }

    cloneNode(_deep?: boolean): CommentNode {
        const clone = new CommentNode(this.text);
        clone._ownerDocument = this._ownerDocument;
        return clone;
    }
}
