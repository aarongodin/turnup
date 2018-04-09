const Immutable = require('immutable')
const inquirer = require('inquirer')
const chalk = require('chalk')
const formatPackage = require('format-package')
const async = require('async')
const packages = require('../packages')
const { errorTypes, fatal } = require('../errors')
const { notify } = require('../logging')
const { promisify } = require('util')

const ACTION = 'turnup.update'

const promptUserForRepos = repos => inquirer.prompt([{
  type: 'checkbox',
  name: 'repos',
  message: 'Which repositories would you like to update?',
  choices: repos,
  pageSize: 20
}])

const updateRepository = async (adapter, repository, packageName, packageVersion, options = {}) => {
  notify(ACTION, `Updating ${chalk.italic(repository.fullName)}`)

  const branchName = `turnup/${packageName}@${packageVersion}`
  const packageDef = repository.packageDefinition.decoded

  if (repository.dependencyRelationship.type === 'dev') {
    packageDef.devDependencies[packageName] = packageVersion
  } else {
    packageDef.dependencies[packageName] = packageVersion
  }

  const formattedPackageDef = await formatPackage(packageDef)

  let lockFile

  if (!options.noLockfile) {
    notify(ACTION, 'Generating lockfile.')
    lockFile = await packages.lockfile.create(formattedPackageDef)
  }

  notify(ACTION, 'Creating branch.')
  await adapter.createBranch(repository, branchName)

  notify(ACTION, 'Creating commit.')
  await adapter.commitPackageDefinition(repository, branchName, formattedPackageDef, lockFile)

  if (!options.noPullRequest) {
    notify(ACTION, 'Creating pull request.')
    await adapter.createPullRequest(repository, branchName)
  }
}

module.exports = async (packageString, adapter, options = {}) => {
  notify(ACTION, `Using adapter ${adapter.getName()}.`)

  try {
    const { repos = [], owner } = options
    const parsedPackage = packages.parse.parsePackage(packageString)

    let repositories = Immutable.List()

    if (repos.length > 0) {
      repositories = repositories.concat(await adapter.fetchRepositories(repos))
    }

    if (typeof owner === 'string' && owner.length > 0) {
      repositories = repositories.concat(await adapter.fetchRepositoriesByOwner(owner))
    }

    repositories = repositories.reduce((reduction, value) => {
      if (!reduction.find(repo => repo.fullName === value.fullName)) {
        return reduction.push(value)
      }
      return reduction
    }, Immutable.List())

    if (repositories.size === 0) {
      fatal(ACTION, new errorTypes.NoRepositoriesFoundError())
    } else {
      notify(ACTION, `Found ${chalk.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'}.`)
    }

    repositories = await adapter.fetchPackageDefinitions(repositories)
    repositories = packages.filter.repositoriesByDependencyUpgrade(repositories, parsedPackage.name, parsedPackage.version)

    if (repositories.size === 0) {
      notify(ACTION, 'No repositories require updating.')
    } else {
      notify(ACTION, `Found ${chalk.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'} out of date.`)
    }

    const repoChoices = repositories.map(repo => {
      return {
        name: `${repo.packageDefinition.decoded.name} (${repo.dependencyRelationship.type} dependency of ${repo.dependencyRelationship.currentVersion})`,
        value: repo
      }
    }).toJS()

    const answers = await promptUserForRepos(repoChoices)
    repositories = Immutable.List(answers.repos)

    if (repositories.size === 0) {
      notify(ACTION, 'No selected repos.')
      return
    } else {
      notify(ACTION, `Updating ${chalk.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'} with ${chalk.bold(packageString)}`)
    }

    await promisify(async.series).call(this, repositories.map(repository => updateRepository.bind(this, adapter, repository, parsedPackage.name, parsedPackage.version, options)).toJS())
  } catch (err) {
    console.error(err)
    fatal(ACTION, err)
  }
}
