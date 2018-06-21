import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

import * as MarkdownIt from 'markdown-it';

import * as semver from '../utils/semver';

export default async function checkChangelog(version: string, packageDir: string, changelogLocation: string): Promise<void> {
    // If this is not a standard (x.y.z) release, don't enforce changelog
    if (!semver.isStandard(version)) {
        return;
    }

    const changelog = await load(path.join(packageDir, changelogLocation));
    const md = new MarkdownIt();
    const parsed = md.parse(changelog, {});

    for (let i = 0; i < parsed.length; i++) {
        const token = parsed[i];

        // Look for headings where the first text node starts with the version
        if (token.type === 'heading_open') {
            const contents = parsed[++i].children;
            const textNode = contents.find(token => token.type === 'text');

            if (textNode && textNode.content.startsWith(version)) {
                return;
            }

            // Throw away the heading close
            i++;
        }
    }

    // If we didn't find the appropriate header, fail
    throw new Error(`No entry found in changelog for version ${version}`);
}

async function load(changelogPath: string): Promise<string> {
    try {
        return await util.promisify(fs.readFile)(changelogPath, 'utf8');
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new Error(`No changelog found at ${changelogPath}`);
        }

        throw e;
    }
}
