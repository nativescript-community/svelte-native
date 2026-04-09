const svelteNativePreprocessor = require('svelte-native-preprocessor')
const sveltePreprocess = require("svelte-preprocess");

// Transform <parent.prop> to <parent--prop> since Svelte 5 interprets dots as member access
function dotNotationPreprocessor() {
  return {
    markup({ content }) {
      return {
        code: content.replace(/<(\/?)([\w]+)\.([\w]+)/g, '<$1$2--$3')
      };
    }
  };
}

module.exports = {
  compilerOptions: {
    css: 'external',
    experimental: {
      customRenderer: "@nativescript-community/svelte-native/dom/renderer"
    }
  },
  preprocess: [dotNotationPreprocessor(), sveltePreprocess(), svelteNativePreprocessor()]
};