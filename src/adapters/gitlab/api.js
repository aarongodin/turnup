const request = require('request-promise-native')

class Api {
  constructor(accessToken) {
    this.accessToken = accessToken
  }

  buildUrl(uri) {
    return `https://gitlab.com/api/v4${uri}`
  }

  getHeaders() {
    return {
      'Private-Token': this.accessToken
    }
  }

  async getProject(pathWithName) {
    const enc = encodeURIComponent(pathWithName)
    const raw = await request.get(this.buildUrl(`/projects/${enc}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getUserProjects(user) {
    const raw = await request.get(this.buildUrl(`/users/${user}/projects?simple=true`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getGroupProjects(group) {
    const raw = await request.get(this.buildUrl(`/groups/${group}/projects?simple=true`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getProjectFile(pathWithName, path, ref) {
    const enc = encodeURIComponent(pathWithName)
    const raw = await request.get(this.buildUrl(`/projects/${enc}/repository/files/${path}?ref=${ref}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async getRef(repoFullName, base) {
    const raw = await request.get(this.buildUrl(`/repos/${repoFullName}/git/refs/heads/${base}`), {
      headers: this.getHeaders()
    })

    return JSON.parse(raw)
  }

  async createBranch(id, branch, baseRef) {
    const enc = encodeURIComponent(id)
    return await request.post(this.buildUrl(`/projects/${enc}/repository/branches`), {
      headers: this.getHeaders(),
      body: {
        branch,
        ref: baseRef
      },
      json: true
    })
  }

  async createCommit(repoFullName, branchName, commitMessage, actions) {
    const enc = encodeURIComponent(repoFullName)
    const url = this.buildUrl(`/projects/${enc}/repository/commits`)

    return await request.post(url, {
      headers: this.getHeaders(),
      body: {
        branch: branchName,
        commit_message: commitMessage,
        actions
      },
      json: true
    })
  }

  async createMergeRequest(id, sourceBranch, targetBranch, title, description) {
    const enc = encodeURIComponent(id)
    return await request.post(this.buildUrl(`/projects/${enc}/merge_requests`), {
      headers: this.getHeaders(),
      body: {
        source_branch: sourceBranch,
        target_branch: targetBranch,
        title,
        description
      },
      json: true
    })
  }
}

module.exports = Api
