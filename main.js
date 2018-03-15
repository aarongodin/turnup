const actions = require('./actions')

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
        describe: 'repository names to search for updates against',
        type: 'string'
      })
    },
    actions.update
  )
  .argv

