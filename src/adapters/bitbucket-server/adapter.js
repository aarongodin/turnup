const Immutable = require('immutable')
const RepositoryEntity = require('../../domain/repository-entity')
const LockfileEntity = require('../../domain/lockfile-entity')
const Api = require('./api')
const { series: asyncSeries } = require('async')
const { promisify } = require('util')
const get = require('lodash.get')

const createRepositoryEntity = (raw) => {
  return new RepositoryEntity({
    name: raw.name,
    projectName: raw.project.key,
    fullName: `${raw.name}/${raw.project.key}`,
    defaultBranch: raw.defaultBranch.displayId,
    latestCommit: raw.defaultBranch.latestCommit
  })
}

class BitbucketAdapter {
  constructor(config) {
    this.api = new Api(config)
  }

  getName() {
    return 'Bitbucket Server'
  }

  getKey() {
    return 'bitbucket-server'
  }

  async fetchRepositories(repoList) {
    const repositories = await Promise.all(repoList.map(async (repo) => {

      const [projectName, name] = repo.split('/')

      const [repository, defaultBranch = {}] = await Promise.all([
        this.api.getRepo(projectName, name),
        this.api.getDefaultBranch(projectName, name)
      ])

      return createRepositoryEntity({
        ...repository,
        defaultBranch
      })
    }))
    return Immutable.List(repositories)
  }

  async fetchRepositoriesByOwner(owner) {
    const ownerRepos = await this.api.getRepos(owner)
    const repositories = await Promise.all(get(ownerRepos, ['values'], []).map(async repo => {
      const defaultBranch = await this.api.getDefaultBranch(repo.project.key, repo.name)

      return createRepositoryEntity({
        ...repo,
        defaultBranch
      })
    }))

    return Immutable.List(repositories)
  }

  async fetchPackageDefinitions(repositories) {
    const list = await Promise.all(repositories.map(async repository => {
      try {
        const packageDefinition = await this.getPackageJson(repository)
        return repository.set('packageDefinition', packageDefinition)
      } catch (err) {
        if (err.statusCode === 404) {
          return repository
        } else {
          throw err
        }
      }
    }))

    return Immutable.List(list)
  }

  async fetchLockfileDefinition(repository) {
    const pkg = await this.fetchLock(repository, 'package-lock.json', 'npm')
    const yarn = await this.fetchLock(repository, 'yarn.lock', 'yarn')

    return pkg || yarn
  }

  async fetchLock(repository, fileName, packageManager) {
    try {
      const packageLockContents = await this.api.getContents(repository.projectName, repository.name, repository.defaultBranch, fileName)

      return new LockfileEntity({
        fileContents: packageLockContents,
        fileName,
        packageManager,
        sha: repository.latestCommit
      })
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err
      }
    }
  }

  async getPackageJson(repository) {
    const raw = await this.api.getContents(repository.projectName, repository.name, repository.defaultBranch, 'package.json')

    return {
      decoded: JSON.parse(raw),
      sha: repository.latestCommit
    }
  }

  async createBranch(repository, branchName) {
    return await this.api.createBranch(
      repository.projectName,
      repository.name,
      branchName,
      repository.latestCommit
    )
  }

  async commitPackageDefinition(repository, branchName, packageDefinition, lockFile, message) {
    const queued = [this.api.createContents.bind(
      this.api,
      repository.projectName,
      repository.name,
      branchName,
      'package.json',
      repository.packageDefinition.sha,
      packageDefinition,
      `${message} - package.json`
    )]

    if (lockFile && repository.lockfileEntity) {
      let entity = repository.lockfileEntity
      queued.push(this.api.createContents.bind(
        this.api,
        repository.projectName,
        repository.name,
        branchName,
        entity.fileName,
        entity.sha || repository.latestCommit,
        lockFile.fileContents,
        `${message} - ${entity.fileName}`
      ))
    }

    return await promisify(asyncSeries).call(this, queued)
  }

  async createPullRequest(repository, branchName, pr) {
    return await this.api.createPull(repository.projectName, repository.name, repository.defaultBranch, branchName, pr.title, pr.body)
  }
}

module.exports = BitbucketAdapter
