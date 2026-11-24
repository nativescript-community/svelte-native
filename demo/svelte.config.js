const sveltePreprocess = require("svelte-preprocess");
const { svelteNativePreprocess } = require("@nativescript-community/svelte-native/preprocess");

module.exports = {
  compilerOptions: {
    css: 'external',
    experimental: {
      customRenderer: "@nativescript-community/svelte-native/dom/renderer"
    }
  },
  // verbatimModuleSyntax keeps imports that are only referenced from markup
  preprocess: [sveltePreprocess({ typescript: { compilerOptions: { verbatimModuleSyntax: true } } }), svelteNativePreprocess()]
};
