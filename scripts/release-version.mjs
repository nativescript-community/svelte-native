// Computes the version and the npm dist-tag of the next release from the git tags reachable from HEAD,
// used by .github/workflows/release.yml (and testable on its own: `node scripts/release-version.mjs`).
//
// - The base is the highest `vX.Y.Z[-pre]` tag merged into HEAD, so every branch bumps its own line.
// - On the default branch a stable release is published as `latest`, a prerelease under its identifier (`rc`, `beta`...).
// - On a maintenance branch named `N.x` (e.g. `4.x`, the Svelte 4 line) releases stay on major N and are
//   published under `svelteN`, never `latest`. Only `patch` and `prerelease` bumps are allowed there; the first release of
//   the line, when no tag of major N exists yet, is `N.0.0`.
// - Any other branch is published under its sanitized name.
// - An explicit `version` always wins (it must still be higher than the base and, on `N.x`, of major N).
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import semver from 'semver';

const BUMPS = ['patch', 'minor', 'major', 'prerelease'];

/**
 * @param {object} options
 * @param {string[]} options.tags git tags merged into HEAD
 * @param {string} options.branch branch being released
 * @param {string} options.defaultBranch
 * @param {string} [options.bump] patch | minor | major | prerelease
 * @param {string} [options.preid] makes the release a prerelease with this identifier (`rc`, `beta`...)
 * @param {string} [options.version] explicit version, overrides `bump`
 * @param {string} [options.npmTag] explicit npm dist-tag
 */
export function nextRelease({ tags, branch, defaultBranch, bump = 'patch', preid = '', version = '', npmTag = '' }) {
    if (!BUMPS.includes(bump)) throw new Error(`bump must be one of ${BUMPS.join(', ')}, got "${bump}"`);

    const versions = tags
        .map((tag) => semver.valid(tag.replace(/^v/, '')))
        .filter(Boolean)
        .sort(semver.rcompare);
    const base = versions[0];
    if (!base) throw new Error('no vX.Y.Z tag is reachable from this branch: tag the last released version first');

    const maintenance = branch !== defaultBranch;
    const line = maintenance ? Number(/^(\d+)\.x$/.exec(branch)?.[1]) || null : null;
    const maintenanceTag = line ? `svelte${line}` : branch.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    let next;
    if (version) {
        next = semver.valid(version.replace(/^v/, ''));
        if (!next) throw new Error(`"${version}" is not a valid semver version`);
        if (!semver.gt(next, base)) throw new Error(`${next} must be higher than the last release ${base}`);
    } else if (line && semver.major(base) < line) {
        // first release of a maintenance line, e.g. 4.0.0 from `4.x` while the last tag is 1.0.32
        next = preid || bump === 'prerelease' ? `${line}.0.0-${preid || 'rc'}.0` : `${line}.0.0`;
    } else {
        if (maintenance && bump !== 'patch' && bump !== 'prerelease') {
            throw new Error(`only patch and prerelease releases can be made from ${branch}; pass an explicit version otherwise`);
        }
        if (preid || bump === 'prerelease') {
            const id = preid || semver.prerelease(base)?.[0] || 'rc';
            next = semver.inc(base, bump === 'prerelease' ? 'prerelease' : `pre${bump}`, String(id));
        } else {
            next = semver.inc(base, bump);
        }
    }
    if (line && semver.major(next) !== line) throw new Error(`${next} is not on major ${line}, which ${branch} is for`);
    if (versions.includes(next)) throw new Error(`v${next} is already tagged`);

    const pre = semver.prerelease(next);
    let tag = npmTag;
    if (!tag) {
        if (pre) tag = maintenance ? `${maintenanceTag}-${pre[0]}` : String(pre[0]);
        else tag = maintenance ? maintenanceTag : 'latest';
    }
    if (semver.validRange(tag) && tag !== '*') throw new Error(`"${tag}" cannot be an npm dist-tag: it is a valid semver range`);

    return { version: next, tag: `v${next}`, npmTag: tag, prerelease: Boolean(pre), base, line };
}

function git(...args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

// CLI, configured through the environment by the workflow.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const env = process.env;
    const result = nextRelease({
        tags: git('tag', '--merged', 'HEAD').split('\n').filter(Boolean),
        branch: env.BRANCH || git('rev-parse', '--abbrev-ref', 'HEAD'),
        defaultBranch: env.DEFAULT_BRANCH || 'master',
        bump: env.BUMP || 'patch',
        preid: env.PREID || '',
        version: env.VERSION || '',
        npmTag: env.NPM_TAG || '',
    });
    console.log(JSON.stringify(result, null, 2));
    if (env.GITHUB_OUTPUT) {
        appendFileSync(env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value ?? ''}\n`).join(''));
    }
}
