const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const getPackage = async filepath => {
  let realPath = path.isAbsolute(filepath) ? filepath : path.resolve(process.cwd(), filepath)

  if (!realPath.endsWith('package.json')) {
    realPath = `${realPath}/package.json`
  }

  const raw = await promisify(fs.readFile).call(this, realPath)
  return JSON.parse(raw)

}
module.exports = {
  getPackage
}

