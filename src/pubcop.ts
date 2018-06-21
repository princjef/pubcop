#!/usr/bin/env node

import chalk from 'chalk';
import * as logSymbols from 'log-symbols';
import * as pkgDir from 'pkg-dir';
import * as yargs from 'yargs';

import checkTag from './checks/tag';
import checkChangelog from './checks/changelog';
import checkBranch from './checks/branch';

import * as npm from './utils/npm';

const argv = yargs
    .options({
        checks: {
            alias: 'c',
            array: true,
            string: true,
            default: ['all'],
            choices: ['tag', 'branch', 'changelog', 'all'],
            coerce: (checks: string[]) => checks.some(check => check === 'all')
                ? ['tag', 'branch', 'changelog']
                : checks,
            description: 'The space-separatd list of validations to perform. You may also specify \'all\' instead to enable all validations. All validations are on by default.'
        },
        'standard-tags': {
            alias: 'st',
            array: true,
            string: true,
            default: ['latest'],
            description: 'Tags that are acceptable to use when publishing a standard release. Useful for projects that maintain a \'next\' tag, for instance. Only used when tag validation is enabled.'
        },
        'branch-name': {
            alias: 'bn',
            array: true,
            string: true,
            default: ['master'],
            description: 'The branch(es) associated with a standard release. Publishes from other branches will be rejected. Only used when branch validation is enabled.'
        },
        'changelog-path': {
            alias: 'cp',
            string: true,
            requiresArg: true,
            default: 'CHANGELOG.md',
            description: 'The location of the changelog file to verify. Only used when changelog validation is enabled.'
        }
    })
    .argv;

// We explicitly ignore the pack command because our validations don't apply
// unless we actually want to do a publish. We also ignore install commands in
// case someone is using prepublish with an old npm or prepare.
const IGNORE_COMMANDS = ['pack', 'i', 'install', 'ci', 'cit', 'it'];

async function main() {
    const { version, command, args } = npm.parseArgs();

    if (IGNORE_COMMANDS.includes(command)) {
        return;
    }

    // If we encounter anything other than publish at this point, the caller is
    // not using the library in the proper way. Throw an error to avoid people
    // misunderrstanding the behavior
    if (command !== 'publish') {
        throw new Error(`Cannot run pubcop for command '${command}'. Make sure you're running pubcop in the prepublishOnly/prepublish npm script`);
    }

    // At this point we know it's a publish. Get the information we need
    const tag = npm.getPublishTag(args);
    const dir = await pkgDir();

    if (!dir) {
        throw new Error('Unable to find a package.json for the current path. Make sure you\'re running pubcop in the prepublishOnly/prepublish npm script');
    }

    const results: boolean[] = [];

    const checks: string[] = argv.checks;

    // Perform validations
    console.log('Verifying package publish');
    if (checks.includes('tag')) {
        results.push(await check('Tag', checkTag(version, tag, argv['standard-tags'])));
    }

    if (checks.includes('branch')) {
        results.push(await check('Git Branch', checkBranch(version, argv['branch-name'])));
    }

    if (checks.includes('changelog')) {
        results.push(await check('Changelog', checkChangelog(version, dir, argv['changelog-path'])));
    }

    // If any of the checks failed, exit with a status code of 1
    if (results.includes(false)) {
        process.exit(1);
    }
}

async function check(name: string, operation: (string | void) | Promise<string | void>): Promise<boolean> {
    try {
        const result = await operation;
        console.log(`${logSymbols.success} ${name}${result ? ` - ${result}` : ''}`);
        return true;
    } catch (e) {
        console.log(`${logSymbols.error} ${name} - ${chalk.red(e.message)}`);
        return false;
    }
}

main().then(() => {
    process.exit(0);
}).catch(e => {
    console.error(e.message);
    process.exit(1);
});
