const globalConfig = require('./config/global')
const actions = require('./actions')
const adapters = require('./adapters')
const { fatal, errorTypes } = require('./errors')

const checkUpdateArgs = argv => {
  const ownerRegex = /^[a-zA-Z\d-_]{2,}$/
  const repoRegex = /^[a-zA-Z\d-_]{2,}\/[a-zA-Z\d-_]{2,}$/
  const notPresent = argv.repos === undefined && argv.owner === undefined

  if (notPresent) {
    fatal('turnup.preCommand', new errorTypes.RepositoriesNotProvidedError())
  }

  if (argv.repos && !argv.repos.every(r => repoRegex.test(r))) {
    fatal('turn.preCommand', new errorTypes.InvalidTargetRepositoriesOptionError())
  }

  if (argv.owner && !ownerRegex.test(argv.owner)) {
    fatal('turn.preCommand', new errorTypes.InvalidTargetOwnerOptionError())
  }
}

const processAdapter = async (providedAdapterString) => {
  let adapterString = providedAdapterString

  if (adapterString === undefined) {
    const config = await globalConfig.load()
    adapterString = config.adapters.default
  }

  if (typeof adapterString === 'string') {
    adapterString = adapterString.toLowerCase()
  }

  const AdapterClass = adapters.getAdapter(adapterString)

  if (AdapterClass === undefined) {
    fatal('turnup.preCommand', new errorTypes.AdapterNotProvidedError())
  }

  const FactoryClass = adapters.getFactory(adapterString)
  const factory = new FactoryClass()

  const ensured = await factory.ensure()

  if (!ensured) {
    fatal('turnup.preCommand', new errorTypes.AdapterNotConfiguredError())
  }

  return await factory.createFromCli()
}

require('yargonaut')
  .style('blue.underline')
  .errorsStyle('red.bold')

require('yargs')
  .command(
    'update <package>',
    'update a package dependency in many repos',
    yargs => {
      yargs.positional('package', {
        describe: 'package name that will be updated across repos',
        type: 'string'
      })

      yargs.option('r', {
        alias: 'repos',
        describe: 'repos to search against',
        type: 'string'
      }).array('repos')

      yargs.option('o', {
        alias: 'owner',
        describe: 'owner to search against',
        type: 'string'
      })

      yargs.option('a', {
        alias: 'adapter',
        describe: 'specify an adapter',
        choices: adapters.types
      })

      yargs.option('no-pr', {
        describe: 'do not create a pull request',
        type: 'boolean'
      })

      yargs.option('no-lockfile', {
        describe: 'do not update the lockfile',
        type: 'boolean'
      })
    },
    async argv => {
      checkUpdateArgs(argv)
      const adapter = await processAdapter(argv.adapter)
      const options = {}

      if (argv.repos) {
        options.repos = argv.repos
      }

      if (argv.owner) {
        options.owner = argv.owner
      }

      if (argv['no-pr']) {
        options.noPullRequest = true
      }

      if (argv['no-lockfile']) {
        options.noLockfile = true
      }

      actions.update(argv.package, adapter, options)
    }
  )
  .command(
    'adapter',
    'manage adapters for turnup',
    yargs => {
      yargs.command(
        'default <adapter>',
        'set the default global adapter',
        yargs => {
          yargs.positional('adapter', {
            choices: adapters.types
          })
        },
        async argv => {
          const adapter = await processAdapter(argv.adapter)
          actions.adapterDefault(adapter)
        }
      ).command(
        'configure <adapter>',
        'configure an adapater',
        yargs => {
          yargs.positional('adapter', {
            choices: adapters.types
          })
        },
        async argv => {
          await adapters.getConfigure(argv.adapter)()
        }
      ).demandCommand()
    }
  )
  .demandCommand()
  .argv
