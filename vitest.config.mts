import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { defaultServerConditions } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteNativePreprocess } from './src/preprocess/index.ts';

const fakeRenderer = fileURLToPath(new URL('./test/fake-renderer.ts', import.meta.url));

// Host-side tests: Svelte plumbing (templates, recycling) against an in-memory renderer, and the
// markup preprocessor. NativeScript behaviour is covered by the on-device specs in demo/app/tests.
export default defineConfig({
    plugins: [
        svelte({
            configFile: false,
            include: ['src/components/**/*.svelte', 'test/**/*.svelte'],
            preprocess: [svelteNativePreprocess()],
            compilerOptions: { css: 'external', experimental: { customRenderer: fakeRenderer } },
            // vitest runs modules through Vite's SSR pipeline, which would otherwise compile for the server
            dynamicCompileOptions: () => ({ generate: 'client' }),
        }),
    ],
    ssr: { resolve: { conditions: ['svelte-custom-renderer', ...defaultServerConditions] } },
    test: { include: ['test/**/*.test.ts'] },
});
