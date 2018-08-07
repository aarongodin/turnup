const request = require('request-promise-native')

class Api {
  constructor({ authType, baseUrl, token }) {
    this.baseUrl = baseUrl
    this.accessToken = token
    this.authType = authType
  }

  buildUrl(uri) {
    return `${this.baseUrl}${uri}`
  }

  getHeaders() {
    return {
      Authorization: `${this.authType} ${this.accessToken}`,
      'User-Agent': 'turnup NPM module'
    }
  }

  getQueryParams() {
    return {
      limit: 1000
    }
  }

  getOptions({ headers = {}, qs = {}, ...remainder } = {}) {
    const defaultHeaders = this.getHeaders()

    return {
      headers: {
        ...defaultHeaders,
        ...headers
      },
      qs: {
        ...this.getQueryParams(),
        ...qs
      },
      ...remainder
    }
  }

  async getRepo(projectName, repoName) {
    const opts = this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/projects/${projectName}/repos/${repoName}`),
      opts
    )

    return JSON.parse(raw)
  }

  async getRepos(projectName) {
    const opts = this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/projects/${projectName}/repos`),
      opts
    )

    return JSON.parse(raw)
  }

  async getContents(projectName, repoName, ref, path) {
    const opts = this.getOptions({
      qs: {
        at: ref
      }
    })

    return request.get(
      this.buildUrl(`/projects/${projectName}/repos/${repoName}/raw/${path}`),
      opts
    )
  }

  async getBranches(projectName, repoName) {
    const opts = this.getOptions()

    const raw = await request.get(
      this.buildUrl(`/projects/${projectName}/repos/${repoName}/branches`),
      opts
    )

    return JSON.parse(raw)
  }

  async getBranch(projectName, repoName, branchName) {
    const decoded = await this.getBranches(projectName, repoName)

    return decoded.values.find(branch => {
      return branch.displayId === branchName
    })
  }

  async getDefaultBranch(projectName, repoName) {
    const decoded = await this.getBranches(projectName, repoName)

    return decoded.values.find(branch => {
      return branch.isDefault === true
    })
  }

  async createBranch(projectName, repoName, ref, baseSha) {
    const opts = this.getOptions({
      body: {
        name: ref,
        startPoint: baseSha
      },
      json: true
    })

    return await request.post(
      this.buildUrl(`/projects/${projectName}/repos/${repoName}/branches`),
      opts
    )
  }

  async createContents(projectName, repoName, branch, path, sourceCommitId, content, message) {
    const url = this.buildUrl(`/projects/${projectName}/repos/${repoName}/browse/${path}`)
    const opts = await this.getOptions({
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        branch,
        content,
        message,
        sourceCommitId,
      }
    })

    return await request.put(url, opts)
  }

  async createPull(projectName, repoName, dest, src, title, description) {
    const opts = this.getOptions({
      body: {
        title,
        description,
        fromRef: {
          id: src
        },
        toRef: {
          id: dest
        },
        close_source_branch: true
      },
      json: true
    })

    return await request.post(
      this.buildUrl(`/projects/${projectName}/repos/${repoName}/pull-requests`),
      opts
    )
  }
}

module.exports = Api
