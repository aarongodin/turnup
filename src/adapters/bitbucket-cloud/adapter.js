const Immutable = require('immutable')
const RepositoryEntity = require('../../domain/repository-entity')
const LockfileEntity = require('../../domain/lockfile-entity')
const Api = require('./api')
const { series: asyncSeries } = require('async')
const { promisify } = require('util')
const get = require('lodash.get')

const createRepositoryEntity = raw => {
  return new RepositoryEntity({
    name: raw.name,
    fullName: raw.full_name,
    defaultBranch: raw.mainbranch.name
  })
}

class BitbucketAdapter {
  constructor(config) {
    this.api = new Api(config)
  }

  getName() {
    return 'Bitbucket Cloud'
  }

  getKey() {
    return 'bitbucket-cloud'
  }

  async fetchRepositories(nameList) {
    const repositories = await Promise.all(nameList.map((name) => this.fetchRepository(name)))
    return Immutable.List(repositories.map(createRepositoryEntity))
  }

  async fetchRepository(name) {
    return this.api.getRepo(name)
  }

  async fetchRepositoriesByOwner(owner) {
    const ownerRepos = await this.api.getRepos(owner)

    return Immutable.List(ownerRepos.values.map(createRepositoryEntity))
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
      const packageLockContents = await this.api.getContents(repository.fullName, repository.defaultBranch, fileName)

      return new LockfileEntity({
        fileContents: packageLockContents,
        fileName,
        packageManager
      })
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err
      }
    }
  }

  async getPackageJson(repository) {
    const [raw, meta] = await Promise.all([
      this.api.getContents(repository.fullName, repository.defaultBranch, 'package.json'),
      this.api.getFileMeta(repository.fullName, repository.defaultBranch, 'package.json')
    ])

    return {
      decoded: JSON.parse(raw),
      sha: get(meta, ['commit', 'hash'], null)
    }
  }

  async createBranch(repository, branchName) {
    const defaultBranchRef = await this.api.getBranch(repository.fullName, repository.defaultBranch)
    const defaultBranchSha = defaultBranchRef.target.hash
    return await this.api.createBranch(repository.fullName, branchName, defaultBranchSha)
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

module.exports = BitbucketAdapter
