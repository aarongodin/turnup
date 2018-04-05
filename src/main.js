const globalConfig = require('./config/global')
const actions = require('./actions')
const adapters = require('./adapters')
const { fatal, errorTypes } = require('./errors')

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

require('yargs')
  .command(
    'update <package> <repos>',
    'update a package dependency in many repos',
    yargs => {
      yargs.positional('package', {
        describe: 'package name that will be updated across repos',
        type: 'string'
      })

      yargs.positional('repos', {
        describe: 'users|orgs|repos to search against (comma-list)',
        type: 'string'
      })

      yargs.positional('users', {
        describe: 'users to search against (comma-list)',
        type: 'string'
      })

      yargs.option('a', {
        alias: 'adapter',
        describe: ''
      })
    },
    async argv => {
      const adapter = await processAdapter(argv.adapter)
      actions.update(argv.package, argv.repos, adapter)
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
