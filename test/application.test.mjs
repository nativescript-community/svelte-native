import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSource } from './load-source.mjs';

function host({ failRun = false, failComponent = false } = {}) {
    const listeners = new Map();
    const instances = [];
    let create;
    const Application = {
        launchEvent: 'launch', exitEvent: 'exit',
        on(name, listener) {
            if (!listeners.has(name)) listeners.set(name, new Set());
            listeners.get(name).add(listener);
        },
        off(name, listener) { listeners.get(name)?.delete(listener); },
        run(options) {
            if (failRun) throw new Error('native run failed');
            create = options.create;
        },
    };
    function createElement(tag) {
        return { tag, nativeView: { tag }, setAttribute() {} };
    }
    class Component {
        destroyed = 0;
        constructor(options) {
            if (failComponent) throw new Error('component failed');
            this.props = options.props;
            options.target.firstChild = { nativeElement: { tag: 'root' } };
            instances.push(this);
        }
        $destroy() { this.destroyed++; }
    }
    const api = loadSource('../src/index.ts', {
        '@nativescript/core': { Application },
        './dom': {
            initializeDom() {},
            createElement,
            navigate: ({ page, props }) => new page({ target: createElement('fragment'), props }),
        },
    }, { global: {}, window: { document: {} } });
    return {
        api, Component, instances,
        create: () => create(),
        emit: (name) => { for (const listener of [...listeners.get(name) ?? []]) listener(); },
        count: (name) => listeners.get(name)?.size ?? 0,
    };
}

for (const method of ['svelteNative', 'svelteNativeNoFrame']) {
    for (const first of ['launch', 'create']) {
        test(`${method} waits for both launch and creation (${first} first)`, async () => {
            const h = host();
            const props = { name: 'Grace' };
            let resolved = false;
            const pending = h.api[method](h.Component, props);
            pending.then(() => { resolved = true; });
            if (first === 'launch') h.emit('launch'); else h.create();
            await Promise.resolve();
            assert.equal(resolved, false);
            if (first === 'launch') h.create(); else h.emit('launch');
            const component = await pending;
            assert.equal(component, h.instances[0]);
            assert.equal(component.props, props);
            assert.equal(h.count('launch'), 0);
            assert.equal(h.count('exit'), 1);
            h.emit('launch');
            h.emit('exit');
            h.emit('exit');
            assert.equal(component.destroyed, 1);
            assert.equal(h.count('exit'), 0);
        });
    }

    test(`${method} rejects native run errors and removes listeners`, async () => {
        const h = host({ failRun: true });
        await assert.rejects(h.api[method](h.Component, {}), /native run failed/);
        assert.equal(h.count('launch'), 0);
        assert.equal(h.count('exit'), 0);
    });

    test(`${method} rejects deferred component creation errors`, async () => {
        const h = host({ failComponent: true });
        const pending = h.api[method](h.Component, {});
        h.emit('launch');
        assert.throws(h.create, /component failed/);
        await assert.rejects(pending, /component failed/);
        assert.equal(h.count('launch'), 0);
        assert.equal(h.count('exit'), 0);
    });

    test(`${method} rejects exit before creation without dereferencing an absent component`, async () => {
        const h = host();
        const pending = h.api[method](h.Component, {});
        h.emit('launch');
        h.emit('exit');
        await assert.rejects(pending, /exited before/);
        assert.throws(h.create, /already exited/);
        assert.equal(h.instances.length, 0);
        assert.equal(h.count('launch'), 0);
        assert.equal(h.count('exit'), 0);
    });

    test(`${method} destroys a created component if the host exits before launch`, async () => {
        const h = host();
        const pending = h.api[method](h.Component, {});
        h.create();
        h.emit('exit');
        await assert.rejects(pending, /exited before/);
        assert.equal(h.instances[0].destroyed, 1);
        assert.equal(h.count('launch'), 0);
        assert.equal(h.count('exit'), 0);
    });
}
