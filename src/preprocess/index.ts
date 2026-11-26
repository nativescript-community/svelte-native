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
 * - `transition:fade={params}` → `{@attach fade(params)}`, so Svelte 4 markup keeps working (`in:` and `out:` pass
 *   `outro: false` / `intro: false`; the function must be an attachment factory, like those of `svelte-native/transitions`)
 * - `{...spread}` on an element       → `{@attach}` re-applying its function-valued attributes, which
 *   Svelte drops from a spread with a custom renderer (e.g. `itemTemplateSelector` next to `{...$$restProps}`)
 * - `on:tap` (no handler) on an element or component → re-dispatches the native event to the handlers the parent
 *   passed in `$$events`, through a `createEventDispatcher` the preprocessor adds to the component's script
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
            const ctx: Context = { forwards: false, functionAttributes: false };
            walk(ast.fragment, null, (node, parent) => {
                if (isPropertyElement(node, parent)) {
                    renameDottedTag(node, content, out);
                    transformElement(node, content, out, ctx);
                } else if (node.type === 'RegularElement' || node.type === 'SvelteElement') {
                    transformElement(node, content, out, ctx);
                } else if (isComponent(node)) {
                    transformComponentEvents(node, content, out, ctx, fail);
                }
            });
            if (ctx.forwards || ctx.functionAttributes) addScriptHelpers(ast, out, ctx);
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

// Collected while walking: what the instance script has to declare.
interface Context {
    /** an `on:event` forwarding needs the dispatcher */
    forwards: boolean;
    /** a spread element needs the `functionAttributes` attachment */
    functionAttributes: boolean;
}

interface Handler {
    attr: Node;
    code: string;
}

function transformElement(node: Node, content: string, out: MagicString, ctx: Context) {
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
        } else if (attr.type === 'TransitionDirective') {
            replacements.set(attr, rewriteTransition(attr, content));
        } else if (attr.type === 'OnDirective') {
            const code = attr.expression ? source(content, attr.expression) : forwardEvent(attr.name, ctx);
            if (isOnce(attr)) {
                replacements.set(attr, rewriteOnceEvent(attr.name, code));
            } else {
                replacements.set(attr, '');
                addHandler(attr.name, { attr, code });
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

    addFunctionAttributes(node, content, out, ctx);
}

// Svelte merges every attribute of an element with a spread into one object and, with a custom
// renderer, skips the function values in it. The attachment re-applies them with `setAttribute`.
function addFunctionAttributes(node: Node, content: string, out: MagicString, ctx: Context) {
    const attributes = node.attributes as Node[];
    if (!attributes.some((a) => a.type === 'SpreadAttribute')) return;

    const entries: string[] = [];
    for (const attr of attributes) {
        if (attr.type === 'SpreadAttribute') {
            entries.push(`...(${source(content, attr.expression)})`);
        } else if (attr.type === 'Attribute' && !attr.name.startsWith('on')) {
            const tag = Array.isArray(attr.value) && attr.value.length === 1 && attr.value[0].type === 'ExpressionTag' ? attr.value[0] : !Array.isArray(attr.value) && attr.value?.type === 'ExpressionTag' ? attr.value : null;
            if (tag) entries.push(`${JSON.stringify(attr.name)}: ${source(content, tag.expression)}`);
        }
    }
    if (!entries.length) return;

    ctx.functionAttributes = true;
    out.appendLeft(attributes[attributes.length - 1].end, ` {@attach ${FUNCTION_ATTRIBUTES}(() => ({ ${entries.join(', ')} }))}`);
}

function transformComponentEvents(node: Node, content: string, out: MagicString, ctx: Context, fail: (message: string) => never) {
    const directives = (node.attributes as Node[]).filter((a) => a.type === 'OnDirective');
    if (!directives.length) return;

    const byEvent = new Map<string, string[]>();
    for (const d of directives) {
        // `$$events` is re-evaluated on every dispatch, so a wrapper could not remember having fired.
        if (isOnce(d)) {
            fail(`\`on:${d.name}|once\` is not supported on components with a custom renderer; guard the handler instead`);
        }
        byEvent.set(d.name, [...(byEvent.get(d.name) ?? []), d.expression ? source(content, d.expression) : forwardEvent(d.name, ctx)]);
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

// Svelte's own forwarding is DOM-only (`bubble_event` reads `Event.type`) and `$$props` can't reach
// `$$events` (the compiler strips it), so forwarding goes through `createEventDispatcher`. The
// dispatcher is handed the native event under a well-known key and svelte-native's CustomEvent
// returns that event as-is, so handlers receive the original `EventData` just like in Svelte 4.
const FORWARDED = `Symbol.for('svelte-native.forwarded-event')`;
const DISPATCHER = '__svelteNativeDispatch';

function forwardEvent(event: string, ctx: Context) {
    ctx.forwards = true;
    return `(e) => ${DISPATCHER}(${JSON.stringify(event)}, { [${FORWARDED}]: e })`;
}

const FUNCTION_ATTRIBUTES = '__svelteNativeFunctionAttributes';
// Inline, so the compiled component needs no import (the preprocessor also runs on svelte-native's own components).
// `on*` functions are event listeners, which Svelte attaches itself.
const FUNCTION_ATTRIBUTES_HELPER = `const ${FUNCTION_ATTRIBUTES} = (get) => (node) => { const attrs = get(); for (const name in attrs) if (typeof attrs[name] === 'function' && !name.startsWith('on')) node.setAttribute(name, attrs[name]); };`;

function addScriptHelpers(ast: { instance: Node | null }, out: MagicString, ctx: Context) {
    const code = [
        ctx.forwards && `import { createEventDispatcher as __svelteNativeCreateDispatcher } from 'svelte'; const ${DISPATCHER} = __svelteNativeCreateDispatcher();`,
        ctx.functionAttributes && FUNCTION_ATTRIBUTES_HELPER,
    ]
        .filter(Boolean)
        .join(' ');
    if (ast.instance) {
        out.appendLeft((ast.instance.content as Node).start, `\n${code}\n`);
    } else {
        out.append(`\n<script>${code}</script>\n`);
    }
}

// `|global` and `|local` have no meaning here: attachments are always local to their own block.
function rewriteTransition(attr: Node, content: string) {
    const params = attr.expression ? source(content, attr.expression as Node) : '';
    // an `in:` has no outro and an `out:` no intro
    const flag = attr.intro && !attr.outro ? 'outro: false' : attr.outro && !attr.intro ? 'intro: false' : '';
    const args = flag ? `{ ${params ? `...(${params}), ` : ''}${flag} }` : params;
    return `{@attach ${attr.name}(${args})}`;
}

function rewriteOnceEvent(event: string, handler: string) {
    const name = JSON.stringify(event);
    return `{@attach (node) => { const listener = function (e) { node.removeEventListener(${name}, listener); (${handler})?.call(this, e); }; node.addEventListener(${name}, listener); return () => node.removeEventListener(${name}, listener); }}`;
}
