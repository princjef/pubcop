import * as child_process from 'child_process';
import * as path from 'path';
import * as util from 'util';

import test, { GenericTestContext, Context } from 'ava';
import stripAnsi = require('strip-ansi');
import * as logSymbols from 'log-symbols';

test('validates everything by default', async t => {
    const { error, output } = await execute('');
    t.falsy(error);
    validateOutput(t, output, {
        tag: true,
        branch: true,
        changelog: true
    });
});

test('validates the tag if requested', async t => {
    const { error, output } = await execute('--checks tag');
    t.falsy(error);
    validateOutput(t, output, {
        tag: true
    });
});

test('validates the changelog if requested', async t => {
    const { error, output } = await execute('--checks changelog');
    t.falsy(error);
    validateOutput(t, output, {
        changelog: true
    });
});

test('validates the branch if requested', async t => {
    const { error, output } = await execute('--checks branch');
    t.falsy(error);
    validateOutput(t, output, {
        branch: true
    });
});

test('performs multiple validations if specified', async t => {
    const { error, output } = await execute('--checks tag branch');
    t.falsy(error);
    validateOutput(t, output, {
        tag: true,
        branch: true
    });
});

test('validates everything if passed --all', async t => {
    const { error, output } = await execute('--checks all');
    t.falsy(error);
    validateOutput(t, output, {
        tag: true,
        changelog: true,
        branch: true
    });
});

test('fails if no version is provided', async t => {
    const { error, output } = await execute('', {
        npmVersion: null
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('fails if no args are provided', async t => {
    const { error, output } = await execute('', {
        npmArgs: null
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('fails if the args are empty', async t => {
    const { error, output } = await execute('', {
        npmArgs: []
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('fails when run outside of a node project', async t => {
    const { error, output } = await execute('', {
        cwd: path.join(__dirname, '../../')
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('does nothing during install', async t => {
    for (const command of ['install', 'i', 'ci', 'it', 'cit']) {
        const { error, output } = await execute('', {
            npmArgs: [command]
        });
        t.falsy(error);
        validateOutput(t, output, {});
    }
});

test('does nothing during pack', async t => {
    const { error, output } = await execute('', {
        npmArgs: ['pack']
    });
    t.falsy(error);
    validateOutput(t, output, {});
});

test('fails for other commands', async t => {
    const { error, output } = await execute('', {
        npmArgs: ['test']
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('ignores the run variant of pack', async t => {
    const { error, output } = await execute('', {
        npmArgs: ['run', 'pack']
    });
    t.falsy(error);
    validateOutput(t, output, {});
});

test('allows the run variant of publish', async t => {
    const { error, output } = await execute('', {
        npmArgs: ['run', 'publish']
    });
    t.falsy(error);
    validateOutput(t, output, {
        tag: true,
        branch: true,
        changelog: true
    });
});

test('tag: fails if a tag is not used for a prerelease version', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0-beta.0'
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: fails if a tag is not used for a version with metadata', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0+sha.abcd'
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: fails if a tag is used for a standard version', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: fails if the wrong tag is used for the given version', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0-alpha.0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: uses the first prerelease identifier to check the tag', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0-beta.alpha.0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.falsy(error);
    validateOutput(t, output, {
        tag: true
    });
});

test('tag: fails if the first prerelease identifier does not match the tag', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0-alpha.beta.0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: allows metadata on prerelease versions', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.0.0-beta.0+sha.abcd',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.falsy(error);
    validateOutput(t, output, {
        tag: true
    });
});

test('tag: fails if the versions is not valid semver', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: 'not-valid-beta.0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: fails if the versions is not valid semver (empty prerelease identifier)', async t => {
    const { error, output } = await execute('--checks tag', {
        npmVersion: '1.2.3-beta..0',
        npmArgs: ['publish', '--tag', 'beta']
    });
    t.truthy(error);
    validateOutput(t, output, {
        tag: false
    });
});

test('tag: fails if the tag option is provided with no value in the publish command', async t => {
    const { error, output } = await execute('--checks tag', {
        npmArgs: ['publish', '--tag']
    });
    t.truthy(error);
    validateOutput(t, output, {});
});

test('tag: allows a custom list of standard tags', async t => {
    const { error, output } = await execute('--checks tag --standard-tags next latest', {
        npmArgs: ['publish', '--tag', 'next']
    });
    t.falsy(error);
    validateOutput(t, output, {
        tag: true
    });
});

test('changelog: handles annotated changelog entries', async t => {
    const { error, output } = await execute('--checks changelog', {
        npmVersion: '1.1.0'
    });
    t.falsy(error);
    validateOutput(t, output, {
        changelog: true
    });
});

test('changelog: allows a custom changelog path', async t => {
    const { error, output } = await execute('--checks changelog --changelog-path ../changelog/CHANGELOG.md', {
        npmVersion: '1.1.0',
        cwd: path.join(__dirname, '../test/package/empty')
    });
    t.falsy(error);
    validateOutput(t, output, {
        changelog: true
    });
});

test('changelog: ignores prerelease versions', async t => {
    const { error, output } = await execute('--checks changelog', {
        npmVersion: '1.2.0-beta.0'
    });
    t.falsy(error);
    validateOutput(t, output, {
        changelog: true
    });
});

test('changelog: fails if no changelog is present', async t => {
    const { error, output } = await execute('--checks changelog', {
        cwd: path.join(__dirname, '../test/package/empty')
    });
    t.truthy(error);
    validateOutput(t, output, {
        changelog: false
    });
});

test('changelog: fails if the changelog is not readable', async t => {
    const { error, output } = await execute('--checks changelog', {
        cwd: path.join(__dirname, '../test/package/changelog-dir')
    });
    t.truthy(error);
    validateOutput(t, output, {
        changelog: false
    });
});

test('changelog: fails if the version is not present in the changelog', async t => {
    const { error, output } = await execute('--checks changelog', {
        npmVersion: '1.2.0'
    });
    t.truthy(error);
    validateOutput(t, output, {
        changelog: false
    });
});

test('branch: allows a different release branch to be specified', async t => {
    const { error, output } = await execute('--checks branch --branch-name dev', {
        path: path.join(__dirname, '../test/bin/dev')
    });
    t.falsy(error);
    validateOutput(t, output, {
        branch: true
    });
});

test('branch: allows multiple release branches to be specified', async t => {
    const { error, output } = await execute('--checks branch --branch-name dev something-else', {
        path: path.join(__dirname, '../test/bin/dev')
    });
    t.falsy(error);
    validateOutput(t, output, {
        branch: true
    });
});

test('branch: ignores prerelease versions', async t => {
    const { error, output } = await execute('--checks branch --branch-name nonexistant', {
        npmVersion: '1.0.0-beta.0'
    });
    t.falsy(error);
    validateOutput(t, output, {
        branch: true
    });
});

test('branch: fails when publishing a standard version on the branch other than the provided one', async t => {
    const { error, output } = await execute('--checks branch --branch-name other', {
        npmVersion: '1.0.0'
    });
    t.truthy(error);
    validateOutput(t, output, {
        branch: false
    });
});

test('branch: fails if git is not found or fails', async t => {
    const { error, output } = await execute('--checks branch', {
        path: path.join(__dirname, '../test/bin/fail')
    });
    t.truthy(error);
    validateOutput(t, output, {
        branch: false
    });
});

function validateOutput(t: GenericTestContext<Context<any>>, output: string[], checks: { [K in ('tag' | 'changelog' | 'branch')]?: boolean }): void {
    const successText = {
        tag: stripAnsi(`${logSymbols.success} Tag`),
        changelog: stripAnsi(`${logSymbols.success} Changelog`),
        branch: stripAnsi(`${logSymbols.success} Git Branch`)
    };

    const failureText = {
        tag: stripAnsi(`${logSymbols.error} Tag`),
        changelog: stripAnsi(`${logSymbols.error} Changelog`),
        branch: stripAnsi(`${logSymbols.error} Git Branch`)
    };

    for (const check of ['tag', 'changelog', 'branch']) {
        switch (checks[check]) {
            case true:
                t.true(output.some(l => l.startsWith(successText[check])));
                t.false(output.some(l => l.startsWith(failureText[check])));
                break;
            case false:
                t.true(output.some(l => l.startsWith(failureText[check])));
                t.false(output.some(l => l.startsWith(successText[check])));
                break;
            default:
                t.false(output.some(l => l.startsWith(successText[check])));
                t.false(output.some(l => l.startsWith(failureText[check])));
                break;
        }
    }
}

const nonNpmEnv: NodeJS.ProcessEnv = {};
for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('npm')) {
        nonNpmEnv[key] = value;
    }
}

async function execute(args: string, options?: { path?: string; cwd?: string; npmVersion?: string | null; npmArgs?: string[] | null }): Promise<{ error: boolean; output: string[]; }> {
    options = options || {};

    const env: NodeJS.ProcessEnv = {
        PATH: `${options.path || path.join(__dirname, '../test/bin/master')}:${process.env.PATH}`
    };

    if (options.npmVersion !== null) {
        env.npm_package_version = options.npmVersion || '1.0.0';
    }

    if (options.npmArgs !== null) {
        const defaultArgs = ['publish'];
        env.npm_config_argv = JSON.stringify({
            remain: [],
            original: options.npmArgs || defaultArgs,
            cooked: options.npmArgs || defaultArgs
        });
    }

    const cwd = options.cwd || path.join(__dirname, '../test/package/changelog');

    const executable = path.relative(cwd, path.join(__dirname, 'pubcop.js'));

    let output: string;
    let error: any | undefined = undefined;
    try {
        output = (await util.promisify(child_process.exec)(`${executable} ${args}`, {
            encoding: 'utf8',
            cwd,
            env
        })).stdout;
    } catch (e) {
        output = e.stdout;
        error = e;
    }

    return {
        error,
        output: stripAnsi(output).split('\n').map(l => l.trim())
    };
}
