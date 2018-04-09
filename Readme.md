# turnup

[![Build Status](https://travis-ci.org/aarongodin/turnup.svg?branch=master)](https://travis-ci.org/aarongodin/turnup)

Manage NPM dependencies across repositories, users, projects, teams, and orgs.

## Installation

It's recommended to install turnup globally as it stores runtime configuration in your home directory.

```sh
> yarn global add turnup
...or
> npm install -g turnup
```

## Introduction

For teams and individuals that rely heavily on NPM modules, it gets cumbersome to move changes upstream. When you update one package, a lot of menial work is done to update packages that depend on it, branch and commit, and finally review those changes. Although a monorepo structure avoids this difficulty entirely, not all scenarios allow for it (especially in orgs where teams have poorly-defined functional dependencies on each other -- see [Conway's Law](https://en.wikipedia.org/wiki/Conway%27s_law))

### Example Use Case

It might be beneficial to think of turnup as the inverse of [lerna](https://npmjs.com/lerna).

Let's say you host your team's source code in a GitHub org, and you have 25 repositories that all rely on various versions of Jest. You can ask turnup to update Jest across every repo using:

```sh
> turnup update jest@latest --owner <teamname>
```

The `update` command asks which repositories to update and generates new lock files, creates branches, commits the changes, and initiates pull requests. After this process, a common practice would be for your CI to take over and ensure that tests and builds succeed (and potentially deploy!)

## Adapters

Adapters are the method by which turnup interacts with SCM hosts. Turnup supports **GitHub**, **GitLab**, and **Bitbucket**. If there is a host you would like to use turnup with, consider contributing!

## Guide

### Configure an Adapter

After installing turnup, you will first need to add authentication for the adapter you would like to use. You may also specify a default adapter for all commands.

For example, you can add a personal access token for GitHub by runnning:

```sh
> turnup adapter configure github
```

To see a list of available adapters, see the help for the `configure` command. Now you may add GitHub as your default adapter.

```sh
> turnup adapter default github
```

### Upating a Module

As shown in the introduction, turnup's main command is `update`, which will automate updating an NPM dependency across many repositories.

The `update` command accepts a single argument with many options. The first argument can be:

1. A name and version number, as in what you would type into `npm install`. Ex: `turnup update webpack@4.5.0`
2. A path to a local directory containing a `package.json`. Ex: `turnup update .` (useful if you have just published a new version of the package in the current directory)

A required option is any option that specifies target repositories.

| option    | short | description                                 |
|-----------|-------|---------------------------------------------|
| `--repos` | `-r`  | Array of full repository names (owner/name) |
| `--owner` | `-o`  | Single owner to find repositories           |

### Lockfiles

Generating lockfiles (`package-lock.json`, `yarn.lock`) is the default functionality of the `update` command but can be turned off through the `--no-lockfile` option. Lockfiles are also only generated if it already exists in the repository.

### Yarn

Turnup is aware of `yarn.lock` and will use yarn rather than npm to create the lockfile if it exists in the repository.

## Contributing

We welcome all contributors. Before making changes, be sure to review the [Issues](https://github.com/aarongodin/turnup/issues). If you found a bug or are interested in a new feature, please create an issue to get some discussion going.

## Maintainers

Aaron Godin - [aarongodin](https://github.com/aarongodin)

## Todo

This is just for my own sake right now while I build out turnup's first minor version.

- 100% test coverage
- `update` command
  - Allow a path to be passed instead of a package name and version
  - ~~Accept an owner arg to search against users and orgs~~
  - ~~Change the repos positional arg to be optional~~
  - Accept tags in the way that `npm install` does
  - Handle yarn
  - ~~Accept `--no-lockfile` option~~
  - ~~Accept `--no-pr` option~~
- GitLab adapter
- Bitbucket adapter
- Allow configuring the remote URL base for an adapter
- Handle API rate limits
