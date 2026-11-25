import path from "node:path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
import pkg from "./package.json" with { type: "json" };

let externalModules = pkg.peerDependencies
    ? Object.keys(pkg.peerDependencies)
    : [];

let localModules = ["dom", "components", "transitions"];

// The renderer is built as its own entry and every other bundle imports that file, so the
// app, our components and user components all share one renderer module. Imports of it are
// mapped to this id and rewritten per bundle with `output.paths`.
const RENDERER_ID = "\0svelte-native-renderer";
const rendererSource = path.resolve("src/dom/renderer");

function externalRenderer() {
    return {
        name: "external-renderer",
        resolveId(source, importer) {
            if (source === RENDERER_ID) return { id: RENDERER_ID, external: true };
            if (!importer || !source.startsWith(".")) return null;
            const resolved = path.resolve(path.dirname(importer), source).replace(/\.(ts|js)$/, "");
            return resolved === rendererSource ? { id: RENDERER_ID, external: true } : null;
        },
    };
}

function rendererPath(fromDir) {
    let rel = path.posix.relative(fromDir, "dom/renderer");
    return rel.startsWith(".") ? rel : `./${rel}`;
}

let plugins = [
    externalRenderer(),
    resolve({
        extensions: [".mjs", ".js"],
    }),
    typescript(),
    svelte({
        include: "src/components/**/*.svelte",
        compilerOptions: {
            css: 'external',
            experimental: {
                customRenderer: RENDERER_ID
            }
        }
    }),
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
                    paths: { [RENDERER_ID]: rendererPath(mod) },
                },
            ],
            external: (id) =>
                // the shared renderer is resolved by the externalRenderer plugin, which maps it to the right relative path
                !id.endsWith("dom/renderer") &&
                [
                    ...externalModules,
                    ...localModules
                        .filter((m) => m != mod)
                        .map((m) => `../${m}`),
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
                paths: { [RENDERER_ID]: rendererPath(".") },
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
        // loaded by svelte.config.js at build time, so plain CommonJS
        input: "src/preprocess/index.ts",
        output: [
            {
                dir: "./dist",
                entryFileNames: "preprocess/index.js",
                format: "cjs",
                exports: "named",
            },
        ],
        external: (id) => ["svelte", "magic-string"].some((m) => id === m || id.startsWith(`${m}/`)),
        plugins: [typescript()],
    },
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
