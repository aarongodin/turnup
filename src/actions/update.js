const Immutable = require('immutable')
const inquirer = require('inquirer')
const formatPackage = require('format-package')
const c = require('colors/safe')
const async = require('async')
const packages = require('../packages')
const { errorTypes, fatal } = require('../errors')
const { notify } = require('../logging')
const { promisify } = require('util')

const ACTION = 'turnup.update'

const parseRepos = repos => {
  return repos.split(',')
}

const promptUserForRepos = repos => inquirer.prompt([{
  type: 'checkbox',
  name: 'repos',
  message: 'Which repositories would you like to update?',
  choices: repos,
  pageSize: 20
}])

const updateRepository = async (adapter, repository, packageName, packageVersion) => {
  notify(ACTION, `Updating ${c.italic(repository.fullName)}`)
  const branchName = `turnup/${packageName}@${packageVersion}`
  const packageDef = repository.packageDefinition.decoded

  if (repository.dependencyRelationship.type === 'dev') {
    packageDef.devDependencies[packageName] = packageVersion
  } else {
    packageDef.dependencies[packageName] = packageVersion
  }

  const formattedPackageDef = await formatPackage(packageDef)

  notify(ACTION, 'Generating lockfile.')
  const lockFile = await packages.lockfile.create(formattedPackageDef)

  notify(ACTION, 'Creating branch.')
  await adapter.createBranch(repository, branchName)

  notify(ACTION, 'Creating commit.')
  await adapter.commitPackageDefinition(repository, branchName, formattedPackageDef, lockFile)

  notify(ACTION, 'Creating pull request.')
  await adapter.createPullRequest(repository, branchName)
}

module.exports = async (packageString, repos, adapter) => {
  notify(ACTION, `Using adapter ${adapter.getName()}.`)
  try {
    const parsedPackage = packages.parse.parsePackage(packageString)
    const parsedRepos = parseRepos(repos)

    let repositories = await adapter.fetchRepositories(parsedRepos)

    if (repositories.size === 0) {
      fatal(ACTION, new errorTypes.NoRepositoriesFoundError())
    } else {
      notify(ACTION, `Found ${c.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'}.`)
    }

    repositories = await adapter.fetchPackageDefinitions(repositories)
    repositories = packages.filter.repositoriesByDependencyUpgrade(repositories, parsedPackage.name, parsedPackage.version)

    if (repositories.size === 0) {
      notify(ACTION, 'No repositories require updating.')
    } else {
      notify(ACTION, `Found ${c.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'} out of date.`)
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
      notify(ACTION, `Updating ${c.bold(repositories.size)} repositor${repositories.size === 1 ? 'y' : 'ies'} with ${c.bold(packageString)}`)
    }

    await promisify(async.series).call(this, repositories.map(repository => updateRepository.bind(this, adapter, repository, parsedPackage.name, parsedPackage.version)).toJS())
  } catch (err) {
    console.error(err)
    fatal(ACTION, err)
  }
}
