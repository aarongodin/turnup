const Semver = require('semver')
const request = require('request-promise-native')
const local = require('./local')
const { fatal, errorTypes } = require('../errors')

const parsePackage = async packageString => {
  if (packageString.startsWith('.') || packageString.startsWith('/')) {
    try {
      const localPackage = await local.getPackage(packageString)
      return {
        name: localPackage.name,
        version: localPackage.version
      }
    } catch (err) {
      fatal('turnup.packages', errorTypes.LocalPackageParseError())
    }
  }

  const name = packageString.substring(0, packageString.lastIndexOf('@'))
  const version = packageString.slice(packageString.lastIndexOf('@') + 1)

  if (!Semver.valid(version)) {
    const tagVersion = await findVersionByTag(name, version)

    if (tagVersion === undefined) {
      fatal('turnup.packages', new errorTypes.InvalidPackageVersionError())
    }

    return { name, version: tagVersion }
  }

  return { name, version }
}

const findVersionByTag = async (packageName, tag) => {
  const raw = await request.get(`https://registry.npmjs.com/${packageName}`)
  const meta = JSON.parse(raw)
  const distTags = meta['dist-tags']

  if (typeof distTags === 'object' && distTags[tag]) {
    return distTags[tag]
  }

  return undefined
}

module.exports = {
  parsePackage
}
