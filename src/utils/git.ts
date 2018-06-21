import * as child_process from 'child_process';
import * as util from 'util';

const BRANCH_COMMAND = 'git rev-parse --abbrev-ref HEAD';
export async function currentBranch(): Promise<string> {
    try {
        return (await util.promisify(child_process.exec)(BRANCH_COMMAND)).stdout.trim();
    } catch (e) {
        throw new Error('Unable to fetch current git branch. Make sure you have git installed and are in a git repository.');
    }
}
