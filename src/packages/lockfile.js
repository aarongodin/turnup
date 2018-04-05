const fs = require('fs')
const { exec } = require('child_process')
const { promisify } = require('util')
const tmp = require('tmp')

const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

const create = async packageDefinition => {
  const tempdir = tmp.dirSync({ unsafeCleanup: true })
  await writeFileAsync(`${tempdir.name}/package.json`, packageDefinition)

  await new Promise((resolve, reject) => {
    const npmi = exec('npm install --package-lock-only', {
      cwd: tempdir.name,
      stdio: 'ignore'
    })

    npmi.addListener('error', reject)
    npmi.addListener('exit', resolve)
  })

  const lockFile = await readFileAsync(`${tempdir.name}/package-lock.json`)
  tempdir.removeCallback()
  return lockFile.toString()
}

module.exports = {
  create
}
