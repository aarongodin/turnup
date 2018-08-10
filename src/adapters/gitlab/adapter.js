const Immutable = require('immutable')
const RepositoryEntity = require('../../domain/repository-entity')
const LockfileEntity = require('../../domain/lockfile-entity')
const Api = require('./api')

const createRepositoryEntity = raw => {
  return new RepositoryEntity({
    name: raw.path,
    fullName: raw.path_with_namespace,
    defaultBranch: raw.default_branch
  })
}

class GitLabAdapter {
  constructor(accessToken) {
    this.api = new Api(accessToken)
  }

  getName() {
    return 'GitLab'
  }

  getKey() {
    return 'gitlab'
  }

  async fetchRepositories(names) {
    const repositories = await Promise.all(names.map(this.fetchRepository.bind(this)))
    return Immutable.List(repositories.map(createRepositoryEntity))
  }

  async fetchRepository(name) {
    return this.api.getProject(name)
  }

  async fetchRepositoriesByOwner(owner) {
    let ownerRepos = await this.api.getUserProjects(owner)

    if (!Array.isArray(ownerRepos) || ownerRepos.length === 0) {
      ownerRepos = await this.api.getGroupProjects(owner)
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

  async getPackageJson(repository) {
    const projectFile = await this.api.getProjectFile(repository.fullName, 'package.json', repository.defaultBranch)
    const decoded = Buffer.from(projectFile.content, 'base64').toString()

    return {
      decoded: JSON.parse(decoded),
      sha: projectFile.commit_id
    }
  }

  async fetchLockfileDefinition(repository) {
    try {
      const yarnLock = await this.api.getProjectFile(repository.fullName, 'yarn.lock', repository.defaultBranch)
      const decoded = Buffer.from(yarnLock.content, 'base64').toString()

      return new LockfileEntity({
        sha: yarnLock.commit_id,
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
      const packageLock = await this.api.getProjectFile(repository.fullName, 'package-lock.json', repository.defaultBranch)
      const decoded = Buffer.from(packageLock.content, 'base64').toString()

      return new LockfileEntity({
        sha: packageLock.commit_id,
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

  createBranch(repository, branchName) {
    return this.api.createBranch(repository.fullName, branchName, repository.defaultBranch)
  }

  async commitPackageDefinition(repository, branchName, packageDefinition, lockFile, message) {
    const actions = [{
      action: 'update',
      file_path: 'package.json',
      content: Buffer.from(packageDefinition).toString('base64'),
      encoding: 'base64'
    }]

    if (lockFile && repository.lockfileEntity) {
      let entity = repository.lockfileEntity
      actions.push({
        action: 'update',
        file_path: entity.fileName,
        content: Buffer.from(lockFile.fileContents).toString('base64'),
        encoding: 'base64'
      })
    }

    const filePaths = actions.map(action => action.file_path).join(', ')
    const commitMessage = `${message} - ${filePaths}`

    return this.api.createCommit(repository.fullName, branchName, commitMessage, actions)
  }

  async createPullRequest(repository, branchName, pr) {
    return await this.api.createMergeRequest(repository.fullName, repository.defaultBranch, branchName, pr.title, pr.body)
  }
}

module.exports = GitLabAdapter
