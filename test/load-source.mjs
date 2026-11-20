import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the real entrypoint with only the native host boundary replaced.
// No simulator is needed to reproduce the launch/create ordering regression.
export function loadSource(path, imports = {}, globals = {}) {
    const url = new URL(path, import.meta.url);
    const source = readFileSync(url, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const module = { exports: {} };
    const require = createRequire(url);
    runInNewContext(outputText, {
        module,
        exports: module.exports,
        require: (id) => Object.hasOwn(imports, id) ? imports[id] : require(id),
        ...globals,
    }, { filename: url.pathname });
    return module.exports;
}
