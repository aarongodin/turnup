const Semver = require('semver')
const { errorTypes } = require('../errors')

const parsePackage = packageString => {
  const name = packageString.substring(0, packageString.lastIndexOf('@'))
  const version = packageString.slice(packageString.lastIndexOf('@') + 1)

  if (!Semver.valid(version)) {
    throw new errorTypes.InvalidPackageVersionError()
  }

  return { name, version }
}

module.exports = {
  parsePackage
}
