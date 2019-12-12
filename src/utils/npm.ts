interface Argv {
  remain: string[];
  cooked: string[];
  original: string[];
}

export function parseArgs(): {
  version: string;
  command: string;
  args: string[];
} {
  const version = process.env.npm_package_version;
  if (!version) {
    throw new Error(
      "Unable to fetch command context from npm. Make sure you're running pubcop in the prepublishOnly/prepublish npm script"
    );
  }

  let argv: Argv;
  try {
    argv = JSON.parse(process.env.npm_config_argv!);
  } catch (e) {
    throw new Error(
      "Unable to fetch command context from npm. Make sure you're running pubcop in the prepublishOnly/prepublish npm script"
    );
  }

  // People can call `npm run publish` instead of `npm publish` and so on, so
  // we just remove the `run` if we see it
  if (argv.cooked[0] === 'run') {
    argv.cooked.shift();
  }

  const command = argv.cooked.shift()!;

  return { version, command, args: argv.cooked };
}

export function getPublishTag(args: string[]): string {
  const index = args.indexOf('--tag');

  // If no tag is provided, the tag is latest
  if (index === -1) {
    return 'latest';
  }

  // If there is no value for the tag, the arguments are invalid.
  if (!args[index + 1]) {
    throw new Error('Received --tag option without a value');
  }

  return args[index + 1];
}
