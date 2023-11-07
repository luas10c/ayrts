import path from 'node:path'

const relativePath = process.cwd()

const entry = process.argv.filter((item) => {
  if (item.match(/node_modules/)) {
    return false
  }

  if (!item.match(/(?:j|t)s$/)) {
    return false
  }

  return true
})

const entrypoint = {
  path: path.resolve(...entry.join().split('/').slice(0, -1)),
  filename: entry.join()
}

export const constants = {
  relativePath,
  entrypoint
}

export default constants
