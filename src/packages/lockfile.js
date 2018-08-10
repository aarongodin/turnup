const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const tmp = require('tmp')
const LockfileEntity = require('../domain/lockfile-entity')

const INSTALL = 'install'
const UPDATE = 'update'
const YARN_MAP = {
  [INSTALL]: INSTALL,
  [UPDATE]: 'upgrade'
}

const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

const generate = async (cwd, command, filename) => {
  await new Promise((resolve, reject) => {
    const execution = exec(command, {
      cwd,
      stdio: 'ignore'
    })

    execution.addListener('error', reject)
    execution.addListener('exit', resolve)
  })

  const lockFile = await readFileAsync(`${cwd}/${filename}`)
  return lockFile.toString()
}

const runWithNpm = (cwd, cmd, registry) => {
  const ordered = ['npm', cmd, '--package-lock-only']

  if (registry) {
    ordered.push(`--registry ${registry}`)
  }

  return generate(cwd, ordered.join(' '), 'package-lock.json')
}
const runWithYarn = (cwd, cmd) => generate(cwd, `yarn ${YARN_MAP[cmd]}`, 'yarn.lock')

const create = async (packageDefinition, packageManager, registry) => {
  return createWithCmd(packageDefinition, packageManager, INSTALL, registry)
}

const update = async (packageDefinition, packageManager, registry) => {
  return createWithCmd(packageDefinition, packageManager, UPDATE, registry)
}

const createWithCmd = async (packageDefinition, packageManager, command, registry) => {
  const tempdir = tmp.dirSync({ unsafeCleanup: true })
  await writeFileAsync(`${tempdir.name}/package.json`, packageDefinition)

  let lockFile
  let fileName

  if (packageManager === 'yarn') {
    lockFile = await runWithYarn(tempdir.name, command)
    fileName = 'yarn.lock'
  } else if (packageManager === 'npm') {
    lockFile = await runWithNpm(tempdir.name, command, registry)
    fileName = 'package-lock.json'
  }

  tempdir.removeCallback()


  return new LockfileEntity({
    fileContents: lockFile,
    fileName,
    packageManager,
  })
}

module.exports = {
  create,
  update
}
