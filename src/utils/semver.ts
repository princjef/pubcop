const SEMVER_REGEX = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([a-zA-Z0-9-.]+))?(?:\+([a-zA-Z0-9-.]+))?$/;

export interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  metadata: string[];
}

// Parse the contents of a semantic version using the semver spec:
//   https://semver.org/
export function parse(version: string): Semver {
  const match = version.match(SEMVER_REGEX);
  if (match === null) {
    throw new Error(`Not a valid semver version ${version}`);
  }

  const [, major, minor, patch, prerelease, metadata] = match;

  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: parseVersionIdentifiers(prerelease),
    metadata: parseVersionIdentifiers(metadata)
  };
}

export function isStandard(version: string): boolean {
  const parsed = parse(version);
  return parsed.prerelease.length === 0 && parsed.metadata.length === 0;
}

function parseVersionIdentifiers(identifiers?: string): string[] {
  if (identifiers === undefined) {
    return [];
  }

  const parts = identifiers.split('.');
  for (const part of parts) {
    if (part.length === 0) {
      throw new Error('Identifiers in a semver version must not be empty');
    }
  }

  return parts;
}
