const Semver = require('semver')

const remoteGitUrl = value => {
  return value.startsWith && (
    value.startsWith('git:') ||
    value.startsWith('git+ssh:') ||
    value.startsWith('git+http:') ||
    value.startsWith('git+https') ||
    value.startsWith('git+file')
  )
}

const parseCommitOrSemver = value => value.slice(value.lastIndexOf('#') + 1)

const needsUpgrade = (currentVersion, desiredVersion) => {
  let parsedCurrentVersion = currentVersion

  if (remoteGitUrl(currentVersion)) {
    parsedCurrentVersion = parseCommitOrSemver(currentVersion)
  }

  if (!Semver.valid(parsedCurrentVersion)) {
    return false
  }

  return Semver.gtr(desiredVersion, parsedCurrentVersion)
}

const repositoriesByDependencyUpgrade = (repositories, packageName, packageVersion) => {
  return repositories.map(repo => {
    if (!repo.packageDefinition || !repo.packageDefinition.decoded) {
      return undefined
    }

    const dependencyRelationship = { packageName, packageVersion }

    const {
      dependencies = {},
      devDependencies = {},
    } = repo.packageDefinition.decoded

    const depKeys = Object.keys(dependencies)
    const devDepKeys = Object.keys(devDependencies)

    if (
      depKeys.includes(packageName)
      && needsUpgrade(dependencies[packageName], packageVersion)
    ) {
      dependencyRelationship.type = 'runtime'
      dependencyRelationship.currentVersion = dependencies[packageName]
    }

    if (
      devDepKeys.includes(packageName)
      && needsUpgrade(devDependencies[packageName], packageVersion)
    ) {
      dependencyRelationship.type = 'dev'
      dependencyRelationship.currentVersion = devDependencies[packageName]
    }

    return repo.set('dependencyRelationship', dependencyRelationship)
  }).filter(repo => {
    return repo !== undefined && repo.dependencyRelationship.currentVersion !== undefined
  })
}

module.exports = {
  repositoriesByDependencyUpgrade
}
