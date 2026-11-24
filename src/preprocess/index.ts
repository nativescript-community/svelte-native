import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';

type Node = { type: string; start: number; end: number; [key: string]: any };

interface MarkupInput {
    content: string;
    filename?: string;
}

/**
 * Svelte's `customRenderer` mode rejects `bind:` on elements and every `on:` directive, and parses
 * dotted lowercase tags (`<page.actionBar>`) as component member expressions. This preprocessor
 * rewrites those forms into equivalents the compiler accepts:
 *
 * - `<parent.prop>` inside `<parent>`  → `<parent--prop>` (decoded back by the renderer)
 * - `bind:this={ref}` on an element    → `{@attach}` that assigns and clears `ref`
 * - `bind:text={value}` on an element  → `text={value} ontextChange={(e) => value = e.value}`
 * - `on:tap={handler}` on an element   → `ontap={handler}` (`|once` is honoured, DOM-only modifiers are dropped)
 * - `on:done={handler}` on a component → `$$events={{ done: handler }}`, which `createEventDispatcher` reads
 *
 * Add it after any script/style preprocessors, e.g. `preprocess: [sveltePreprocess(), svelteNativePreprocess()]`.
 */
export function svelteNativePreprocess() {
    return {
        name: 'svelte-native',
        markup({ content, filename }: MarkupInput) {
            const ast = parseMarkup(content, filename);
            const out = new MagicString(content);
            const fail = (message: string) => {
                throw new Error(`${filename ? `${filename}: ` : ''}${message}`);
            };
            walk(ast.fragment, null, (node, parent) => {
                if (isPropertyElement(node, parent)) {
                    renameDottedTag(node, content, out);
                    transformElement(node, content, out, fail);
                } else if (node.type === 'RegularElement' || node.type === 'SvelteElement') {
                    transformElement(node, content, out, fail);
                } else if (isComponent(node)) {
                    transformComponentEvents(node, content, out, fail);
                }
            });
            if (!out.hasChanged()) return { code: content };
            return {
                code: out.toString(),
                map: out.generateMap({ source: filename, file: filename ? `${filename}.map` : undefined, includeContent: true, hires: true }),
            };
        },
    };
}

export default svelteNativePreprocess;

// Script and style bodies are blanked (keeping offsets) so the markup parser never sees
// syntax a later preprocessor is responsible for, e.g. SCSS.
function parseMarkup(content: string, filename?: string) {
    const blanked = content.replace(
        /(<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>)([\s\S]*?)(<\/\2\s*>)/g,
        (_m, open: string, _tag: string, body: string, close: string) => open + body.replace(/[^\n]/g, ' ') + close
    );
    try {
        return parse(blanked, { modern: true, filename });
    } catch (e: any) {
        const error = new Error(`${filename ? `${filename}: ` : ''}${e?.message ?? e}`);
        error.name = 'SvelteNativePreprocessError';
        throw error;
    }
}

const ELEMENT_LIKE = new Set(['RegularElement', 'SvelteElement', 'Component', 'SvelteComponent', 'SvelteSelf']);

/** Visits template nodes with their nearest enclosing element or component (blocks are transparent). */
function walk(value: any, parent: Node | null, visit: (node: Node, parent: Node | null) => void, seen = new WeakSet<object>()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
        for (const item of value) walk(item, parent, visit, seen);
        return;
    }
    let childParent = parent;
    if (typeof value.type === 'string') {
        visit(value as Node, parent);
        if (ELEMENT_LIKE.has(value.type)) childParent = value as Node;
    }
    for (const key of Object.keys(value)) {
        if (key === 'metadata' || key === 'expression' || key === 'attributes') continue;
        walk(value[key], childParent, visit, seen);
    }
}

function normalizeTag(name: string) {
    return name.replace(/-/g, '').toLowerCase();
}

// Property elements only apply to a parent of the same name (see PropertyNode), which also keeps
// dynamic components such as `<item.component />` from being mistaken for one.
function isPropertyElement(node: Node, parent: Node | null) {
    if (node.type !== 'Component' || !/^[a-z]/.test(node.name)) return false;
    const dot = node.name.indexOf('.');
    if (dot < 0 || !parent) return false;
    return normalizeTag(node.name.slice(0, dot)) === normalizeTag(parent.name);
}

function isComponent(node: Node) {
    return node.type === 'Component' || node.type === 'SvelteComponent' || node.type === 'SvelteSelf';
}

function source(content: string, node: Node) {
    return content.slice(node.start, node.end);
}

function isOnce(directive: Node) {
    return (directive.modifiers as string[]).includes('once');
}

interface Handler {
    attr: Node;
    code: string;
}

function transformElement(node: Node, content: string, out: MagicString, fail: (message: string) => never) {
    // Replacement text per directive; handlers for the same event are merged into one attribute.
    const replacements = new Map<Node, string>();
    const handlers = new Map<string, Handler[]>();
    const addHandler = (event: string, handler: Handler) => {
        handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    };

    for (const attr of node.attributes as Node[]) {
        if (attr.type === 'BindDirective') {
            if (attr.name === 'this') {
                replacements.set(attr, rewriteBindThis(attr, content));
                continue;
            }
            const { getter, setter } = bindingAccessors(attr, content);
            replacements.set(attr, `${attr.name}={${getter}}`);
            addHandler(`${attr.name}Change`, { attr, code: `(e) => { ${setter}; }` });
        } else if (attr.type === 'OnDirective') {
            if (!attr.expression) {
                fail(`event forwarding (\`on:${attr.name}\` without a handler) is not supported on <${node.name}>; pass a callback prop instead`);
            }
            if (isOnce(attr)) {
                replacements.set(attr, rewriteOnceEvent(attr.name, source(content, attr.expression)));
            } else {
                replacements.set(attr, '');
                addHandler(attr.name, { attr, code: source(content, attr.expression) });
            }
        }
    }

    for (const [event, list] of handlers) {
        const code = list.length === 1 ? list[0].code : `function (e) { ${list.map((h) => `(${h.code})?.call(this, e);`).join(' ')} }`;
        const host = list[0].attr;
        const existing = replacements.get(host);
        replacements.set(host, `${existing ? `${existing} ` : ''}on${event}={${code}}`);
    }

    for (const [attr, text] of replacements) {
        if (text) out.overwrite(attr.start, attr.end, text);
        else out.remove(attr.start, attr.end);
    }
}

function transformComponentEvents(node: Node, content: string, out: MagicString, fail: (message: string) => never) {
    const directives = (node.attributes as Node[]).filter((a) => a.type === 'OnDirective');
    if (!directives.length) return;

    const byEvent = new Map<string, string[]>();
    for (const d of directives) {
        if (!d.expression) {
            fail(`event forwarding (\`on:${d.name}\` without a handler) is not supported with a custom renderer; pass a callback prop to <${node.name}> instead`);
        }
        // `$$events` is re-evaluated on every dispatch, so a wrapper could not remember having fired.
        if (isOnce(d)) {
            fail(`\`on:${d.name}|once\` is not supported on components with a custom renderer; guard the handler instead`);
        }
        byEvent.set(d.name, [...(byEvent.get(d.name) ?? []), source(content, d.expression)]);
    }

    const entries = [...byEvent].map(([event, codes]) => `${JSON.stringify(event)}: ${codes.length === 1 ? codes[0] : `[${codes.join(', ')}]`}`);
    const [first, ...rest] = directives;
    out.overwrite(first.start, first.end, `$$events={{ ${entries.join(', ')} }}`);
    for (const d of rest) out.remove(d.start, d.end);
}

function renameDottedTag(node: Node, content: string, out: MagicString) {
    const encoded = node.name.replace('.', '--');
    const openAt = content.indexOf(node.name, node.start);
    out.overwrite(openAt, openAt + node.name.length, encoded);

    const closing = `</${node.name}`;
    const closeAt = content.lastIndexOf(closing, node.end);
    if (closeAt > node.start) {
        out.overwrite(closeAt + 2, closeAt + closing.length, encoded);
    }
}

function bindingAccessors(attr: Node, content: string) {
    const expr = attr.expression as Node;
    if (expr.type === 'SequenceExpression') {
        // function bindings: bind:prop={get, set}
        const [get, set] = expr.expressions as Node[];
        return { getter: `(${source(content, get)})()`, setter: `(${source(content, set)})(e.value)` };
    }
    const target = source(content, expr);
    return { getter: target, setter: `${target} = e.value` };
}

function rewriteBindThis(attr: Node, content: string) {
    const expr = attr.expression as Node;
    if (expr.type === 'SequenceExpression') {
        const [get, set] = (expr.expressions as Node[]).map((n) => `(${source(content, n)})`);
        return `{@attach (node) => { ${set}(node); return () => { if (${get}() === node) ${set}(null); }; }}`;
    }
    const target = source(content, expr);
    return `{@attach (node) => { ${target} = node; return () => { if (${target} === node) ${target} = null; }; }}`;
}

function rewriteOnceEvent(event: string, handler: string) {
    const name = JSON.stringify(event);
    return `{@attach (node) => { const listener = function (e) { node.removeEventListener(${name}, listener); (${handler})?.call(this, e); }; node.addEventListener(${name}, listener); return () => node.removeEventListener(${name}, listener); }}`;
}
