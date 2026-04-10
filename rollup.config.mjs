import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import pkg from "./package.json" with { type: "json" };

let externalModules = pkg.peerDependencies
    ? Object.keys(pkg.peerDependencies)
    : [];

let localModules = ["dom", "components", "transitions"];

// Normalize renderer import paths in the dom module output
function fixRendererImport() {
    return {
        name: 'fix-renderer-import',
        generateBundle(options, bundle) {
            for (const file of Object.values(bundle)) {
                if (file.type === 'chunk' && file.code) {
                    file.code = file.code.replace(/from ['"]\.\.\/renderer['"]/g, "from './renderer'");
                }
            }
        }
    };
}

let plugins = [
    resolve({
        extensions: [".mjs", ".js"],
    }),
    typescript(),
    svelte({
        include: "src/components/**/*.svelte",
        compilerOptions: {
            css: 'external',
            experimental: {
                customRenderer: "@nativescript-community/svelte-native/dom/renderer"
            }
        }
    }),
    fixRendererImport(),
];

function module_defs() {
    return localModules.map((mod) => {
        return {
            input: `src/${mod}/index.ts`,
            output: [
                {
                    dir: `./dist/`,
                    entryFileNames: `${mod}/index.js`,
                    format: "esm",
                },
            ],
            external: (id) =>
                [
                    ...externalModules,
                    ...localModules
                        .filter((m) => m != mod)
                        .map((m) => `../${m}`),
                    // Keep renderer as external to avoid bundling it into the dom module
                    "./renderer", "../renderer",
                    // Custom renderer import injected by the Svelte compiler
                    "@nativescript-community/svelte-native/dom/renderer",
                ].some((prefix) => id.startsWith(prefix)),
            plugins: plugins,
        };
    });
}

export default [
    {
        input: "src/index.ts",
        output: [
            {
                dir: "./dist",
                entryFileNames: "index.js",
                format: "esm",
            },
        ],
        external: (id) =>
            [...externalModules, ...localModules.map((m) => `./${m}`)].some(
                (prefix) => id.startsWith(prefix)
            ),
        plugins: plugins,
    },
    ...module_defs(),
    {
        input: "src/dom/renderer.ts",
        output: [
            {
                dir: "./dist",
                entryFileNames: "dom/renderer.js",
                format: "esm",
            },
        ],
        external: (id) =>
            externalModules.some((prefix) => id.startsWith(prefix)),
        plugins: plugins,
    },
];
