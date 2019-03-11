# pubcop

[![Build Status](https://dev.azure.com/princjef/github-ci/_apis/build/status/princjef.pubcop?branchName=master)](https://dev.azure.com/princjef/github-ci/_build/latest?definitionId=5&branchName=master)
[![Code Coverage](https://img.shields.io/azure-devops/coverage/princjef/github-ci/5.svg)](https://dev.azure.com/princjef/github-ci/_build/latest?definitionId=5&branchName=master&view=codecoverage-tab)
[![npm version](https://img.shields.io/npm/v/pubcop.svg)](https://npmjs.org/package/pubcop)

Verifies common oversights and mistakes during publishing automatically so you can publish with confidence. Includes the following built-in checks. Each check can be configured and turned on or off:

 * **Tag** - Make sure that prerelease versions (e.g. 1.2.3-beta.0) are 
   published with the appropriate tag and that standard versions (e.g. 1.2.3) 
   are published with one of the configured standard release tags.

 * **Branch** - Require standard releases to be made from one or more 
   predefined release branches. Prevents people from accidentally publishing a 
   standard release from a feature branch that may not have all of the latest 
   changes.

 * **Changelog** - Ensure that an entry is present in the package changelog 
   when publishing standard releases. This makes sure that the changelog is 
   kept in sync with the published versions of the package in situations where 
   automated changelog generation is not used.

## Usage

Install pubcop in your package by running:

```
npm install --save-dev pubcop
```

Then, add pubcop to the `scripts` section of your package.json file under the
`prepublishOnly` command. If using npm 3 or below, you can use the `prepublish`
command instead ([additional context][prepublish-prepare]).

```json
{
  "scripts": {
    "prepublishOnly": "pubcop"
  }
}
```

Now when you run `npm publish`, pubcop will automatically perform the requested
checks and prevent you from publishing if any of them fail.

## API

Pubcop can perform several checks on publish for you. All are on by default, but
you can configure it to turn off or modify the behavior of any of the commmands.
All of the options below can be mixed and matched to suit your needs.

### Select Specific Validations

By default, pubcop will run all available checks on publish. You can specify 
one or more specific checks to run using the `--checks` option to the pubcop 
command. Valid values are `tag` `branch` and `changelog` (or `all` to enable 
all checks).

The example below enables only the tag and branch validations, 
skipping the changelog check.

```json
{
  "scripts": {
    "prepublishOnly": "pubcop --checks tag branch"
  }
}
```

### Configuring Validations

#### Tag

The tag validation will force standard versions to use the `latest` tag by
default and force prerelease versions to use the tag corresponding to the first
prerelease identifier in the version. Here are some examples of valid tag and
version combinations with the default configuration.

| Version              | Tag              |
| -------------------- | ---------------- |
| 1.0.0                | latest (or none) |
| 1.0.0-beta.0         | beta             |
| 1.0.0-first.second.1 | first            |
| 1.0.0-dev+sha123     | dev              |

The behavior of prerelease versions (e.g. 1.0.0-beta.0) is not currently
configurable, but you may specify other tags that should be associated with
standard versions using the `--standard-tags` option. The most common use case
is to allow standard releases to be published under the `next` tag in addition
to the latest tag.

To allow publishing of standard versions to both the `latest` and `next` tags,
you can set the following:

```json
{
  "scripts": {
    "prepublishOnly": "pubcop --standard-tags latest next"
  }
}
```

#### Branch

The branch validation prevents standard releases from being published from
git branches other than the main release branch(es). By default, it requires
that all standard releases be published from the `master` git branch. You can
customize the list of standard release branches with the `--branch-name` option.

The following will allow standard releases to be published from either the
master or dev branches:

```json
{
  "scripts": {
    "prepublishOnly": "pubcop --branch-name master dev"
  }
}
```

#### Changelog

The changelog validation prevents standard releases from being published without
an entry present in the package's changelog. This helps keep the documentation
in sync with the project and eases upgrade pains for consumers of the package.
The changelog validation looks for a CHANGELOG.md file in the root of the
package by default, but this can be changed with the `--changelog-path` option.

If you wanted to change the changelog validation to look for a changelog in your
docs folder, you would set the following:

```json
{
  "scripts": {
    "prepublishOnly": "pubcop --changelog-path docs/CHANGELOG.md"
  }
}
```

## Motivation

Tools like [semantic-release][] provide a great way to automate aspects of
package publishing, but make requirements on development workflow and package
structure that are not for everyone. This tool allows people to have confidence
in their publishing process without having to change their process or remember
to use a different command to publish. Just call `npm publish` and pubcop takes
care of the rest.

[semantic-release]: https://github.com/semantic-release/semantic-release
[prepublish-prepare]: https://docs.npmjs.com/misc/scripts#prepublish-and-prepare
