const c = require('colors/safe')

c.setTheme({
  command: ['yellow', 'italic']
})

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
    this.message = `Adapter not specified. Use the -a flag, or specify a default adapter using ${c.command("turnup adapter default")}.`
  }
}

class ValidTokenNotProvidedError extends Error {
  constructor(...args) {
    super(...args)
    this.message = 'A valid token was not provided.'
  }
}

const errorTypes = {
  InvalidPackageVersionError,
  NoRepositoriesFoundError,
  AdapterNotConfiguredError,
  AdapterNotProvidedError,
  ValidTokenNotProvidedError
}

const fatal = (action, err) => {
  if (Object.values(errorTypes).some(t => err instanceof t)) {
    console.log(`[${c.bold(action)}] Error! ${c.red(err.message)}`)
  } else {
    console.log(`[${c.bold(action)}] Unexpected Error! This may be an issue with turnup. ${c.red(err.message)}`)
  }
  process.exit(1)
}

module.exports =  {
  errorTypes,
  fatal
}
