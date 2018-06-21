import * as git from '../utils/git';
import * as semver from '../utils/semver';

export default async function checkBranch(version: string, validBranches: string[]): Promise<string | void> {
    // We don't do validation of branches for prerelease versions at the moment.
    if (!semver.isStandard(version)) {
        return undefined;
    }

    const branch = await git.currentBranch();
    if (!validBranches.includes(branch)) {
        throw new Error(`Invalid branch found for standard release. Currently on ${branch} but expected one of the following: ${validBranches.join(', ')}`);
    }

    return branch;
}
