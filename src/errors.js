const chalk = require('chalk')

class InvalidPackageVersionError extends Error {
  constructor(...args) {
    super(...args)
    this.message = 'Invalid or unspecified package version. Package names must use the `npm install` syntax for defining versions (ex: jest@20.0.0).'
  }
}

class NoRepositoriesFoundError extends Error {
  constructor(...args) {
    super(...args)
    this.message = 'No repositories found. Did you specify a correct repository, org or user name?'
  }
}

class AdapterNotConfiguredError extends Error {
  constructor(...args) {
    super(...args)
    this.message = 'Adapter not configured. Before running a command, ensure that the adapter you are using has been configured.'
  }
}

class AdapterNotProvidedError extends Error {
  constructor(...args) {
    super(...args)
    this.message = `Adapter not specified. Use the -a flag, or specify a default adapter using ${chalk.yellow.italic("turnup adapter default")}.`
  }
}

class ValidTokenNotProvidedError extends Error {
  constructor(...args) {
    super(...args)
    this.message = 'A valid token was not provided.'
  }
}

class RepositoriesNotProvidedError extends Error {
  constructor(...args) {
    super(...args)
    this.message = `An option for target repos must be passed (${chalk.yellow.italic("--owner")} or ${chalk.yellow.italic("--repos")})`
  }
}

class InvalidTargetRepositoriesOptionError extends Error {
  constructor(...args) {
    super(...args)
    this.message = `The ${chalk.yellow.italic("repos")} option requires repository full names in the format ${chalk.yellow.italic("<owner>/<repo>")}`
  }
}

class InvalidTargetOwnerOptionError extends Error {
  constructor(...args) {
    super(...args)
    this.message = `The ${chalk.yellow.italic("owner")} option requires owner names in the format ${chalk.yellow.italic("<owner>")} (no repository name)`
  }
}

const errorTypes = {
  InvalidPackageVersionError,
  NoRepositoriesFoundError,
  AdapterNotConfiguredError,
  AdapterNotProvidedError,
  ValidTokenNotProvidedError,
  RepositoriesNotProvidedError,
  InvalidTargetRepositoriesOptionError,
  InvalidTargetOwnerOptionError
}

const fatal = (action, err) => {
  if (Object.values(errorTypes).some(t => err instanceof t)) {
    console.log(`[${chalk.bold(action)}] Error! ${chalk.red(err.message)}`)
  } else {
    console.log(`[${chalk.bold(action)}] Unexpected Error! This may be an issue with turnup. ${chalk.red(err.message)}`)
  }
  process.exit(1)
}

module.exports =  {
  errorTypes,
  fatal
}
