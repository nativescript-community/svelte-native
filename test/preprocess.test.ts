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

    it('rejects event forwarding and |once on components', () => {
        expect(() => run(`<script>import C from './C.svelte';</script><C on:done />`)).toThrow(/callback prop/);
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

    it('rejects event forwarding on native elements', () => {
        expect(() => run(`<button on:tap />`)).toThrow(/event forwarding/);
    });

    it('ignores syntax inside script and style blocks', () => {
        const src = `<script lang="ts">const x: Array<string> = []; // <page.foo></script><label bind:this={x} /><style lang="scss">$c: red; label { color: $c; }</style>`;
        const out = run(src);
        expect(out).toContain('// <page.foo></script>');
        expect(out).toContain('$c: red;');
    });
});
