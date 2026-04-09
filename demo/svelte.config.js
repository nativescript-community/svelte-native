const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  compilerOptions: {
    namespace: "foreign",
    // Svelte 5: enable compatibility mode for legacy components that use on:event syntax
    compatibility: {
      componentApi: 4
    }
  },
  preprocess: [sveltePreprocess()]
};
