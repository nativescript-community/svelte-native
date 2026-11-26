import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script, not part of the typed sources
import { nextRelease } from '../scripts/release-version.mjs';

const master = { branch: 'master', defaultBranch: 'master' };
const releaseTags = ['v1.0.31', 'v1.0.32', 'v5.0.0-alpha.0', 'v5.0.0-rc.0'];

describe('release version on the default branch', () => {
    it('bumps from the highest reachable tag', () => {
        expect(nextRelease({ ...master, tags: releaseTags, bump: 'patch' })).toMatchObject({ version: '5.0.0', npmTag: 'latest', prerelease: false, base: '5.0.0-rc.0' });
        expect(nextRelease({ ...master, tags: ['v5.0.0', 'v5.0.0-rc.0'], bump: 'patch' }).version).toBe('5.0.1');
        expect(nextRelease({ ...master, tags: ['v5.0.1'], bump: 'minor' }).version).toBe('5.1.0');
        expect(nextRelease({ ...master, tags: ['v5.0.1'], bump: 'major' }).version).toBe('6.0.0');
    });

    it('continues and starts prereleases under their identifier', () => {
        expect(nextRelease({ ...master, tags: releaseTags, bump: 'prerelease' })).toMatchObject({ version: '5.0.0-rc.1', npmTag: 'rc', prerelease: true });
        expect(nextRelease({ ...master, tags: ['v5.0.1'], bump: 'minor', preid: 'beta' })).toMatchObject({ version: '5.1.0-beta.0', npmTag: 'beta' });
        expect(nextRelease({ ...master, tags: ['v5.0.1'], bump: 'prerelease' }).version).toBe('5.0.2-rc.0');
    });

    it('takes an explicit version over the bump', () => {
        expect(nextRelease({ ...master, tags: ['v1.0.32'], version: '5.0.0-rc.0' })).toMatchObject({ version: '5.0.0-rc.0', npmTag: 'rc' });
        expect(nextRelease({ ...master, tags: ['v1.0.32'], version: 'v5.0.0', bump: 'patch' }).version).toBe('5.0.0');
    });

    it('refuses a version that is not higher or already tagged', () => {
        expect(() => nextRelease({ ...master, tags: ['v5.0.0'], version: '4.9.0' })).toThrow('must be higher');
        expect(() => nextRelease({ ...master, tags: ['v5.0.0'], version: '5.0.0' })).toThrow('must be higher');
        expect(() => nextRelease({ ...master, tags: ['v5.0.0'], version: 'nope' })).toThrow('not a valid');
    });

    it('needs a tag', () => {
        expect(() => nextRelease({ ...master, tags: [] })).toThrow('tag the last released version');
        expect(() => nextRelease({ ...master, tags: ['nightly', 'foo'] })).toThrow('tag the last released version');
    });

    it('honours an explicit npm tag and rejects range-like ones', () => {
        expect(nextRelease({ ...master, tags: ['v5.0.0'], npmTag: 'next' }).npmTag).toBe('next');
        expect(() => nextRelease({ ...master, tags: ['v5.0.0'], npmTag: '4.x' })).toThrow('semver range');
        expect(() => nextRelease({ ...master, tags: ['v5.0.0'], bump: 'nope' })).toThrow('bump must be');
    });
});

describe('release version on a maintenance branch', () => {
    const svelte4 = { branch: '4.x', defaultBranch: 'master' };
    // the Svelte 4 line was released as 1.x; 4.x is not on npm yet
    const oldTags = ['v1.0.30', 'v1.0.31', 'v1.0.32'];

    it('makes the first release of the line N.0.0, never latest', () => {
        expect(nextRelease({ ...svelte4, tags: oldTags })).toMatchObject({ version: '4.0.0', npmTag: 'svelte4', prerelease: false });
        expect(nextRelease({ ...svelte4, tags: oldTags, preid: 'rc' })).toMatchObject({ version: '4.0.0-rc.0', npmTag: 'svelte4-rc' });
        expect(nextRelease({ ...svelte4, tags: oldTags, version: '4.0.0' }).version).toBe('4.0.0');
    });

    it('then bumps patch on the line only', () => {
        expect(nextRelease({ ...svelte4, tags: [...oldTags, 'v4.0.0'] })).toMatchObject({ version: '4.0.1', npmTag: 'svelte4' });
        expect(nextRelease({ ...svelte4, tags: [...oldTags, 'v4.0.0-rc.0'], bump: 'prerelease' }).version).toBe('4.0.0-rc.1');
        expect(() => nextRelease({ ...svelte4, tags: [...oldTags, 'v4.0.0'], bump: 'minor' })).toThrow('only patch and prerelease');
        expect(() => nextRelease({ ...svelte4, tags: [...oldTags, 'v4.0.0'], bump: 'major' })).toThrow('only patch and prerelease');
    });

    it('does not see the default branch tags it does not contain', () => {
        // git tag --merged HEAD on 4.x does not list v5.*, so the base stays on the old line
        expect(nextRelease({ ...svelte4, tags: [...oldTags, 'v4.0.2'] }).version).toBe('4.0.3');
    });

    it('keeps an explicit version on its major', () => {
        expect(() => nextRelease({ ...svelte4, tags: oldTags, version: '5.0.0' })).toThrow('not on major 4');
    });

    it('publishes other branches under their name', () => {
        expect(nextRelease({ branch: 'Release/Fix_1', defaultBranch: 'master', tags: ['v5.0.0'] })).toMatchObject({ version: '5.0.1', npmTag: 'release-fix-1' });
    });
});
