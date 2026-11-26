import { describe, it, expect } from 'vitest';
import { compile } from 'svelte/compiler';
import { svelteNativePreprocess } from '../src/preprocess';

const run = (content: string) => svelteNativePreprocess().markup({ content, filename: 'Test.svelte' }).code;

function compiles(code: string) {
    compile(code.replace(/<style[\s\S]*?<\/style>/g, ''), { filename: 'Test.svelte', experimental: { customRenderer: 'renderer' } });
}

describe('svelteNativePreprocess', () => {
    it('leaves markup without native-only syntax untouched', () => {
        const src = `<script>let a = $state(1)</script><label text={a} ontap={() => a++} />`;
        expect(run(src)).toBe(src);
    });

    it('encodes dotted property elements on native tags only', () => {
        const out = run(`<script>import Foo from './Foo.svelte'</script><page><page.actionBar><actionBar /></page.actionBar><Foo.Bar /></page>`);
        expect(out).toContain('<page--actionBar><actionBar /></page--actionBar>');
        expect(out).toContain('<Foo.Bar />');
    });

    it('rewrites bind:this to an attachment that clears on teardown', () => {
        const out = run(`<script>let ref;</script><label bind:this={ref} />`);
        expect(out).toContain('{@attach (node) => { ref = node; return () => { if (ref === node) ref = null; }; }}');
        compiles(out);
    });

    it('rewrites property bindings to a value plus change listener', () => {
        const out = run(`<script>let text = $state('');</script><textField bind:text />`);
        expect(out).toContain('text={text} ontextChange={(e) => { text = e.value; }}');
        compiles(out);
    });

    it('supports function bindings', () => {
        const out = run(`<script>let n = $state(0);</script><slider bind:value={() => n, (v) => (n = Math.round(v))} />`);
        expect(out).toContain('value={(() => n)()}');
        expect(out).toContain('onvalueChange={(e) => { ((v) => (n = Math.round(v)))(e.value); }}');
        compiles(out);
    });

    it('rewrites on: directives, merging duplicates and honouring |once', () => {
        const out = run(`<script>let a = 0; function f() {}</script><button on:tap={f} on:tap={() => a++} /><button on:tap|once={f} /><button on:tap|preventDefault={f} />`);
        expect(out).toContain('ontap={function (e) { (f)?.call(this, e); (() => a++)?.call(this, e); }}');
        expect(out).toContain('node.removeEventListener("tap", listener)');
        expect(out).toContain('<button ontap={f} />');
        compiles(out);
    });

    it('keeps |once handlers separate from regular handlers on the same element', () => {
        const out = run(`<script>let a = 0; function f() {}</script><button on:tap={() => a++} on:tap|once={f} />`);
        expect(out).toContain('ontap={() => a++}');
        expect(out).toMatch(/\{@attach \(node\) => \{ const listener = function \(e\) \{ node.removeEventListener\("tap", listener\); \(f\)/);
        compiles(out);
    });

    it('does not touch component bindings', () => {
        const src = `<script>import C from './C.svelte'; let v = $state(1);</script><C bind:value={v} />`;
        expect(run(src)).toBe(src);
    });

    it('passes component on: handlers as $$events for createEventDispatcher', () => {
        const out = run(`<script>import C from './C.svelte'; function a() {} function b() {}</script><C on:done={a} on:done={b} on:open={a} /><svelte:component this={C} on:done={a} />`);
        expect(out).toMatch(/<C \$\$events={{ "done": \[a, b\], "open": a }}\s*\/>/);
        expect(out).toContain('<svelte:component this={C} $$events={{ "done": a }} />');
        compiles(out);
    });

    it('forwards on: without a handler on components through $$events', () => {
        const out = run(`<script>import C from './C.svelte'; function f() {}</script><C on:tap on:tap={f} />`);
        expect(out).toMatch(/\$\$events={{ "tap": \[\(e\) => __svelteNativeDispatch\("tap", .*\), f\] }}/);
        expect(out).toContain("const __svelteNativeDispatch = __svelteNativeCreateDispatcher();");
        compiles(out);
    });

    it('rejects |once on components', () => {
        expect(() => run(`<script>import C from './C.svelte'; function f() {}</script><C on:done|once={f} />`)).toThrow(/once/);
    });

    it('only treats a dotted tag as a property element inside a parent of that name', () => {
        const out = run(`<script>let tabs = []</script><stackLayout>{#each tabs as tab}<tab.component />{/each}<actionBar><actionBar.actionItems /></actionBar></stackLayout>`);
        expect(out).toContain('<tab.component />');
        expect(out).toContain('<actionBar--actionItems />');
    });

    it('merges a binding with an explicit handler for its change event', () => {
        const out = run(`<script>let v = $state(''); function f() {}</script><textField bind:text={v} on:textChange={f} />`);
        expect(out).toContain('text={v} ontextChange={function (e) { ((e) => { v = e.value; })?.call(this, e); (f)?.call(this, e); }}');
        compiles(out);
    });

    it('supports bind:this function bindings', () => {
        const out = run(`<script>let r = $state();</script><label bind:this={() => r, (v) => (r = v)} />`);
        expect(out).toContain('{@attach (node) => { ((v) => (r = v))(node); return () => { if ((() => r)() === node) ((v) => (r = v))(null); }; }}');
        compiles(out);
    });

    it('handles script tags with quoted attributes containing ">"', () => {
        const out = run(`<script lang="ts" generics="T extends Record<string, any>">let r: T;</script><label bind:this={r} />`);
        expect(out).toContain('{@attach');
    });

    it('rewrites directives on <svelte:element>', () => {
        const out = run(`<script>let tag = 'label'; let r; function f() {}</script><svelte:element this={tag} bind:this={r} on:tap={f} />`);
        expect(out).toContain('<svelte:element this={tag} {@attach');
        expect(out).toContain('ontap={f}');
        compiles(out);
    });

    it('forwards on: without a handler on native elements', () => {
        const out = run(`<button on:tap on:longPress />`);
        expect(out).toContain('ontap={(e) => __svelteNativeDispatch("tap", ');
        expect(out).toContain('onlongPress={(e) => __svelteNativeDispatch("longPress", ');
        // no instance script to extend, so one is added
        expect(out).toMatch(/<script>import \{ createEventDispatcher as __svelteNativeCreateDispatcher \}/);
        compiles(out);
    });

    it('adds the dispatcher to an existing instance script, once', () => {
        const out = run(`<script>let a = 0;</script><button on:tap /><button on:longPress />`);
        expect(out.match(/__svelteNativeCreateDispatcher\(\)/g)).toHaveLength(1);
        expect(out).toMatch(/<script>\nimport \{ createEventDispatcher/);
        compiles(out);
    });

    it('merges forwarding with explicit handlers and |once on the same element', () => {
        const out = run(`<script>function f() {}</script><button on:tap on:tap={f} /><button on:tap|once />`);
        expect(out).toContain('ontap={function (e) {');
        expect(out).toContain('node.removeEventListener("tap", listener)');
        compiles(out);
    });

    it('rewrites transition directives to attachments', () => {
        const out = run(`<script>import { fade, fly } from 'x'; let p = {};</script><label transition:fade /><label transition:fade={{ duration: 300 }} /><label in:fly={p} /><label out:fade|local /><label in:fade />`);
        expect(out).toContain('<label {@attach fade()} />');
        expect(out).toContain('<label {@attach fade({ duration: 300 })} />');
        expect(out).toContain('<label {@attach fly({ ...(p), outro: false })} />');
        expect(out).toContain('<label {@attach fade({ intro: false })} />');
        expect(out).toContain('<label {@attach fade({ outro: false })} />');
        compiles(out);
    });

    it('rewrites transition directives on <svelte:element> and inside blocks', () => {
        const out = run(`<script>import { fade } from 'x'; let on = true, tag = 'label';</script>{#if on}<svelte:element this={tag} transition:fade={{ delay: 1 }} />{/if}`);
        expect(out).toContain('{@attach fade({ delay: 1 })}');
        compiles(out);
    });

    it('re-applies the function attributes of an element with a spread', () => {
        const out = run(`<script>let { selector, ...rest } = $props();</script><collectionview {...rest} itemTemplateSelector={selector} items={[]} row="2" ontap={() => {}} />`);
        expect(out).toContain(`{@attach __svelteNativeFunctionAttributes(() => ({ ...(rest), "itemTemplateSelector": selector, "items": [] }))}`);
        expect(out).toContain('const __svelteNativeFunctionAttributes = (get) => (node) =>');
        compiles(out);
    });

    it('re-applies shorthand attributes and works without an instance script', () => {
        const out = run(`<collectionview {...$$restProps} {items} />`);
        expect(out).toContain('"items": items');
        expect(out).toContain('<script>const __svelteNativeFunctionAttributes');
    });

    it('covers <svelte:element> and property elements with a spread', () => {
        const out = run(`<script>let rest = {};</script><svelte:element this="collectionview" {...rest} /><page><page.actionBar {...rest} /></page>`);
        expect(out.match(/\{@attach __svelteNativeFunctionAttributes/g)).toHaveLength(2);
        compiles(out);
    });

    it('leaves elements without a spread alone', () => {
        const src = `<script>let f = () => {};</script><collectionview itemTemplateSelector={f} />`;
        expect(run(src)).toBe(src);
    });

    it('combines the function attributes with forwarding in one script', () => {
        const out = run(`<script>let rest = {};</script><collectionview {...rest} on:tap />`);
        expect(out.match(/<script>/g)).toHaveLength(1);
        expect(out).toContain('__svelteNativeDispatch');
        expect(out).toContain('__svelteNativeFunctionAttributes');
        compiles(out);
    });

    it('ignores syntax inside script and style blocks', () => {
        const src = `<script lang="ts">const x: Array<string> = []; // <page.foo></script><label bind:this={x} /><style lang="scss">$c: red; label { color: $c; }</style>`;
        const out = run(src);
        expect(out).toContain('// <page.foo></script>');
        expect(out).toContain('$c: red;');
    });
});
