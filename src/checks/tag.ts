import * as semver from '../utils/semver';

export default async function checkTag(version: string, tag: string, standardTags: string[]): Promise<string> {
    const parsed = semver.parse(version);

    // If it is a standard tag, it must not contain any prerelease or metadata
    // segments
    if (standardTags.includes(tag)) {
        if (parsed.prerelease.length > 0) {
            throw new Error('Standard release versions must not have a prerelease section');
        }

        if (parsed.metadata.length > 0) {
            throw new Error('Standard release versions must not have a metadata section');
        }
    } else {
        if (parsed.prerelease.length === 0) {
            throw new Error('Tagged release versions must have a prerelease section');
        }

        const versionTag = parsed.prerelease[0];
        if (versionTag !== tag) {
            throw new Error('Tagged release versions must contain the tag name in the prerelease section');
        }
    }

    return tag;
}
