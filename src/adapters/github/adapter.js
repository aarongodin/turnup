const Immutable = require('immutable')
const RepositoryEntity = require('../../domain/repository-entity')
const LockfileEntity = require('../../domain/lockfile-entity')
const Api = require('./api')
const { series: asyncSeries } = require('async')
const { promisify } = require('util')

const createRepositoryEntity = raw => {
  return new RepositoryEntity({
    name: raw.name,
    fullName: raw.full_name,
    defaultBranch: raw.default_branch
  })
}

class GitHubAdapter {
  constructor(accessToken) {
    this.api = new Api(accessToken)
  }

  getName() {
    return 'GitHub'
  }

  getKey() {
    return 'github'
  }

  async fetchRepositories(names) {
    const repositories = await Promise.all(names.map(this.fetchRepository.bind(this)))
    return Immutable.List(repositories.map(createRepositoryEntity))
  }

  async fetchRepository(name) {
    return this.api.getRepo(name)
  }

  async fetchRepositoriesByOwner(owner) {
    let ownerRepos = await this.api.getUserRepos(owner)

    if (!Array.isArray(ownerRepos) || ownerRepos.length === 0) {
      ownerRepos = await this.api.getOrgRepos(owner)
    }

    return Immutable.List(ownerRepos.map(createRepositoryEntity))
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
    try {
      const yarnLock = await this.api.getContents(repository.fullName, 'yarn.lock')
      const decoded = Buffer.from(yarnLock.content, 'base64').toString()

      return new LockfileEntity({
        sha: yarnLock.sha,
        fileContents: decoded,
        fileName: 'yarn.lock',
        packageManager: 'yarn'
      })
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err
      }
    }

    try {
      const packageLock = await this.api.getContents(repository.fullName, 'package-lock.json')
      const decoded = Buffer.from(packageLock.content, 'base64').toString()

      return new LockfileEntity({
        sha: packageLock.sha,
        fileContents: decoded,
        fileName: 'package-lock.json',
        packageManager: 'npm'
      })
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err
      }
    }
  }

  async getPackageJson(repository) {
    const contents = await this.api.getContents(repository.fullName, 'package.json')
    const decoded = Buffer.from(contents.content, 'base64').toString()

    return {
      decoded: JSON.parse(decoded),
      sha: contents.sha
    }
  }

  async createBranch(repository, branchName) {
    const defaultBranchRef = await this.api.getRef(repository.fullName, repository.defaultBranch)
    const defaultBranchSha = defaultBranchRef.object.sha
    return await this.api.createRef(repository.fullName, branchName, defaultBranchSha)
  }

  async commitPackageDefinition(repository, branchName, packageDefinition, lockFile, message) {
    const queued = [this.api.createContents.bind(
      this.api,
      repository.fullName,
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
        repository.fullName,
        branchName,
        entity.fileName,
        entity.sha,
        lockFile.fileContents,
        `${message} - ${entity.fileName}`
      ))
    }

    return await promisify(asyncSeries).call(this, queued)
  }

  async createPullRequest(repository, branchName, pr) {
    return await this.api.createPull(repository.fullName, repository.defaultBranch, branchName, pr.title, pr.body)
  }
}

module.exports = GitHubAdapter
