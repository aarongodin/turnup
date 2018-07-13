const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const tmp = require('tmp')
const LockfileEntity = require('../domain/lockfile-entity')

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

const createWithNpm = (cwd, registry) => {
  const registryArg = registry ? ` --registry ${registry}` : ''
  return generate(cwd, `npm install${registryArg} --package-lock-only`, 'package-lock.json')
}
const createWithYarn = cwd => generate(cwd, 'yarn install', 'yarn.lock')

const create = async (packageDefinition, packageManager, registry) => {
  const tempdir = tmp.dirSync({ unsafeCleanup: true })
  await writeFileAsync(`${tempdir.name}/package.json`, packageDefinition)

  let lockFile
  let fileName

  if (packageManager === 'yarn') {
    lockFile = await createWithYarn(tempdir.name)
    fileName = 'yarn.lock'
  } else if (packageManager === 'npm') {
    lockFile = await createWithNpm(tempdir.name, registry)
    fileName = 'package-lock.json'
  }

  tempdir.removeCallback()


  return new LockfileEntity({
    fileContents: lockFile,
    fileName,
    packageManager
  })
}

module.exports = {
  create
}
