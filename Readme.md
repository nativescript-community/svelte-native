# Svelte Native

Create Mobile applications using native widgets via [Svelte](https://github.com/sveltejs/svelte) and [NativeScript](https://github.com/nativescript/nativescript).

See https://svelte-native.technology for docs and tutorials

![todo in svelte-native](https://raw.githubusercontent.com/halfnelson/svelte-native/master/nativescript-svelte-todo.gif)

## Features

Svelte Native includes Svelte specific integrations such as

 * Svelte 5 components (runes or legacy syntax) rendering real NativeScript views through Svelte's official custom renderer API
 * Svelte specific navigation and modals eg `navigate({ page: MySvelteComponent })`
 * Natively recycled `ListView` rows via `<Template>` (with `let:item` or a `{#snippet}`)
 * Integration with Svelte's scoped styles
 * Complete coverage of the NativeScript core UI modules

## Requirements

| svelte-native | Svelte | NativeScript |
| --- | --- | --- |
| 5.x | `^5.59.0` | 8.x / 9.x |
| 1.x | 3.x / 4.x | 8.x |

## Installation

```bash
npm install @nativescript-community/svelte-native svelte@^5.59.0
npm install -D svelte-loader svelte-preprocess
```

`svelte.config.js`:

```js
const sveltePreprocess = require("svelte-preprocess");
const { svelteNativePreprocess } = require("@nativescript-community/svelte-native/preprocess");

module.exports = {
  compilerOptions: {
    css: "external",
    experimental: {
      customRenderer: "@nativescript-community/svelte-native/dom/renderer"
    }
  },
  // svelteNativePreprocess must come after script/style preprocessors;
  // verbatimModuleSyntax keeps imports that are only referenced from markup in lang="ts" components
  preprocess: [sveltePreprocess({ typescript: { compilerOptions: { verbatimModuleSyntax: true } } }), svelteNativePreprocess()]
};
```

`@nativescript/webpack` releases that detect Svelte 5 need no further configuration. With an older release, resolve Svelte's client runtime through the `svelte-custom-renderer` condition in `webpack.config.js`:

```js
const webpack = require("@nativescript/webpack");

module.exports = (env) => {
  webpack.init(env);
  webpack.chainWebpack((config) => {
    config.resolve.alias.delete("svelte$");
    // Svelte's requestAnimationFrame loop (svelte/motion) needs esm-env's BROWSER flag.
    config.module.rule("svelte-esm-env").test(/[\\/]node_modules[\\/]esm-env[\\/]/).resolve.set("conditionNames", ["browser", "..."]);
  });
  webpack.mergeWebpack({ resolve: { conditionNames: ["svelte-custom-renderer", "svelte", "..."] } });
  return webpack.resolveConfig();
};
```

See [`demo/`](demo) for a complete project.

## Usage

App.svelte
```svelte
<page>
    <actionBar title="Svelte Native" />
    <stackLayout>
        <label text={msg} />
        <textField bind:text={msg} />
        <button text="Change" ontap={toggle} />
    </stackLayout>
</page>

<script>
  let { msg = 'Hello World!' } = $props();
  const toggle = () => (msg = 'Hi from svelte');
</script>
```

app.ts
```js
import App from './App.svelte';
import { svelteNativeNoFrame } from '@nativescript-community/svelte-native';

svelteNativeNoFrame(App, { msg: 'Hi from launcher' });
```

Use `svelteNative(StartPage, props)` instead to start inside a root `Frame` so `navigate()` and `goBack()` work.

### Events, bindings and property elements

Svelte's custom renderer mode does not accept `on:` or element `bind:` directives, and parses `<parent.prop>` as a component. `svelteNativePreprocess()` rewrites these on NativeScript elements, so existing markup keeps working:

| You write | Compiled as |
| --- | --- |
| `<button ontap={fn}>` | used as-is (preferred) |
| `<button on:tap={fn}>` | `ontap={fn}` (`\|once` supported, DOM-only modifiers ignored) |
| `<textField bind:text={value}>` | `text={value}` + `ontextChange` that writes `value` |
| `<listView bind:this={list}>` | an `{@attach}` that sets and clears `list` |
| `<page.actionBar>` / `<gridLayout.columns>` | property element on the parent (inside a matching parent element) |
| `<MyComponent on:done={fn}>` | `$$events`, so `createEventDispatcher` in the child keeps working |
| `<button on:tap>` / `<MyComponent on:tap>` (forwarding) | re-dispatches the native event to the parent's handlers, which receive the original event |

Two-way bindings work for any property with a matching `<prop>Change` event (`text`, `checked`, `value`, `selectedIndex`, `date`, ...), including Svelte 5 function bindings: `bind:value={() => n, (v) => (n = Math.round(v))}`.

### ListView and Template

```svelte
<listView {items} onitemTap={(e) => open(items[e.index])}>
  <Template let:item let:index>
    <label text="{index}: {item.name}" />
  </Template>
</listView>

<!-- or with a snippet, and keyed templates -->
<listView {items} itemTemplateSelector={(item) => (item.done ? 'done' : 'todo')}>
  <Template key="todo">
    {#snippet children({ item })}<label text={item.name} />{/snippet}
  </Template>
  <Template key="done" let:item><label text={item.name} class="line-through" /></Template>
</listView>

<script>
  import { Template } from '@nativescript-community/svelte-native/components';
</script>
```

Rows are recycled natively: a row's template is mounted once and its `item`/`index` are updated in place when the row is reused. Plugin authors can use the exported `TemplateProps` helper from `@nativescript-community/svelte-native/dom` for other recycling views.

### Not available with the custom renderer

These Svelte features are rejected by the compiler in custom renderer mode: `transition:`/`in:`/`out:`, `animate:`, `{@html}`, `<svelte:head>`, `<svelte:window>`, `<svelte:body>`, `<svelte:document>`, and `|once` on component events. For animations use the native transitions below.

### Transitions

Svelte's `transition:` directives are rejected under a custom renderer, so transitions are attachments that run one native animation (`view.animate()`):

```svelte
<script>
  import { fade, fly, slide, scale } from '@nativescript-community/svelte-native/transitions';
</script>

{#if open}
  <label text="Hello" {@attach fade({ duration: 300 })} />
{/if}

{#each rows as row (row.id)}
  <gridLayout {@attach fly({ x: 120, duration: 250, intro: false })}>...</gridLayout>
{/each}
```

* The intro plays when the element is added after its component was mounted, never during the initial mount.
* The outro plays when the element's own block removes it (`{#if}` turning false, a keyed `{#each}` item leaving). The element stays on screen until the outro is done. Elements that leave together with an ancestor are removed straight away, so transitions are local like Svelte's default.
* Options: `delay`, `duration`, `easing` (a `CoreTypes.AnimationCurve` or one of `easings`), `intro`, `outro`. `transition(create, options)` builds your own from a function returning `{ delay, duration, curve, props(t) }`, where `props(t)` gives the native animation values for progress `t` (0 hidden, 1 shown).
* They animate native properties (`opacity`, `translate`, `scale`), not layout: siblings move when the element is finally removed.

### Migrating from svelte-native 1.x (Svelte 4)

 * Configure `svelte.config.js` as above, and replace `svelte-native-preprocessor` with `svelteNativePreprocess()`.
 * `navigate()`/`showModal()` accept Svelte 5 components; the returned instance exposes the component's exports and `unmount()` (`$destroy()` is kept as an alias). `$set`/`$on` no longer exist; pass reactive props or callback props instead.
 * `transition:fade={{ duration: 200 }}` becomes `{@attach fade({ duration: 200 })}` (see Transitions below); `in:` and `out:` become `{ outro: false }` and `{ intro: false }`. `animate:` has no replacement.

## Examples

### Svelte Native HackerNews

Simple HackerNews client in Svelte Native.

See https://github.com/halfnelson/svelte-native-hackernews for the repo.

![HackerNews Example Image](https://raw.githubusercontent.com/halfnelson/svelte-native-hackernews/master/nativescript-svelte-hn.gif)

### Svelte Native Grocery

Grocery app example in Svelte Native.

See https://github.com/halfnelson/svelte-native-grocery for the repo.

![Grocery Example Image](https://raw.githubusercontent.com/halfnelson/svelte-native-grocery/master/nativescript-svelte-grocery.gif)

### Svelte Native Realworld

Realworld implementation app in Svelte Native.

See https://github.com/halfnelson/svelte-native-realworld for the repo.

![Realworld Example Image](https://raw.githubusercontent.com/halfnelson/svelte-native-realworld/master/nativescript-svelte-realworld.gif)


## Credits

The DOM implementation is based on the one from Nativescript-Vue. Thanks!
The API Docs were ported from the Nativescript-Vue Too
The Site Design is from SvelteJS

