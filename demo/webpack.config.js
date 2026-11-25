const webpack = require('@nativescript/webpack');
module.exports = (env) => {
    webpack.init(env);
    webpack.chainWebpack((config) => {
        // @nativescript/webpack < the Svelte 5 aware releases aliases `svelte$` to the Svelte 4 `svelte/internal`
        config.resolve.alias.delete('svelte$');
        // Svelte's requestAnimationFrame loop (svelte/motion) needs esm-env's BROWSER flag.
        config.module.rule('svelte-esm-env').test(/[\\/]node_modules[\\/]esm-env[\\/]/).resolve.set('conditionNames', ['browser', '...']);
    });
    webpack.mergeWebpack({ resolve: { conditionNames: ['svelte-custom-renderer', 'svelte', '...'] } });
    return webpack.resolveConfig();
};
