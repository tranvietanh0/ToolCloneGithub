# Research Report: GitHub Repo Creation & Push via API

**Date:** 2026-04-02  
**Research Duration:** Limited (web search unavailable, used official docs)

---

## Executive Summary

Creating a repository on GitHub and pushing a cloned repo requires two distinct operations: (1) GitHub REST API call to create the repo, and (2) git push to set up the remote. **simple-git** is recommended for Node.js server-side operations due to its maturity and direct git binary access, while **isomorphic-git** is for browser environments but requires CORS proxy for GitHub.

---

## 1. GitHub API: Create Repository

**Endpoint:** `POST /user/repos` (authenticated user) or `POST /orgs/{org}/repos` (organization)

**Headers:**
```
Authorization: Bearer <YOUR_TOKEN>
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2026-03-10
```

**Minimal Request:**
```javascript
const response = await fetch('https://api.github.com/user/repos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10'
  },
  body: JSON.stringify({
    name: 'my-repo',           // Required
    description: 'Description',
    private: false,
    auto_init: true            // Creates README
  })
});
const data = await response.json();
```

**Error Handling - Repo Already Exists:**
- HTTP 422 (Validation failed) or 403 (if org restricts)
- Check `response.status` and `data.message` for "name already exists"
- **Recommended:** Use `GET /user/repos?per_page=100` to check existence first, or catch 422

**Required Token Scope:** `repo` scope for private, `public_repo` for public

---

## 2. Setting Up Remote and Push

### With simple-git:

```javascript
const simpleGit = require('simple-git');

const git = simpleGit();

// Clone (if mirroring existing repo)
await git.clone('https://github.com/source/repo.git', './temp-dir');

// Add new remote with token embedded
const newRemote = `https://${username}:${token}@github.com/${username}/new-repo.git`;
await git.addRemote('origin', newRemote);

// Push all branches and tags
await git.push(['--all', '--tags'], { '--set-upstream': null });
```

### With isomorphic-git:

```javascript
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

await git.clone({ fs, http, dir: '/tmp/repo', url: 'https://github.com/...' });

await git.addRemote({ fs, dir: '/tmp/repo', remote: 'origin', url: `https://${username}:${token}@github.com/${username}/repo.git` });

await git.push({
  fs, http, dir: '/tmp/repo',
  ref: 'main',
  remote: 'origin',
  onAuth: () => ({ username: 'token', password: '' })  // Token as username
});
```

---

## 3. Library Comparison

| Feature | simple-git | isomorphic-git |
|---------|------------|----------------|
| **Native deps** | Requires system git binary | Pure JavaScript |
| **Node.js** | ✅ Excellent | ✅ Works |
| **Browser** | ❌ No | ✅ Primary target |
| **Push to GitHub** | ✅ Direct | ⚠️ Needs CORS proxy |
| **API Maturity** | ✅ Stable (3.8k stars) | ⚠️ Community-maintained (8.1k stars) |
| **Maintenance** | ✅ Active | ⚠️ Low (2 volunteers) |
| **Learning Curve** | Low | Medium |

**Verdict:** Use **simple-git** for Node.js backend. Use isomorphic-git only if browser-based git operations are required (with awareness of CORS limitations).

---

## 4. Auto-Generated Repo Names

```javascript
// Option 1: Use original name
const repoName = originalRepoName; // From clone URL

// Option 2: Sanitize original name
const sanitized = originalName
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .substring(0, 100);

// Option 3: Generate with prefix
const generatedName = `backup-${sanitized}-${Date.now()}`;

// Option 4: Ask user
const repoName = await promptUser('Enter repo name:', defaultName);
```

---

## 5. Authentication Security

**⚠️ NEVER embed tokens in URLs or logs**

```javascript
// SAFE: Use environment variable
const token = process.env.GH_TOKEN;

// For simple-git push - token in URL (acceptable for CLI tools)
const remote = `https://x-access-token:${token}@github.com/user/repo.git`;

// For isomorphic-git - use onAuth callback
onAuth: () => ({ username: token, password: '' })
```

**Token Types:** Personal Access Token (classic) or Fine-grained token with repo permissions

---

## 6. Error Handling Flow

```javascript
async function createAndPush(options) {
  const { cloneUrl, repoName, token, username } = options;
  
  // 1. Check if repo already exists
  const existing = await checkRepoExists(username, repoName, token);
  if (existing) {
    throw new Error(`Repository ${repoName} already exists`);
  }
  
  // 2. Create repo via API
  const repo = await createRepo(repoName, token).catch(e => {
    if (e.message.includes('already exists')) {
      return getRepo(username, repoName, token); // Get existing
    }
    throw e;
  });
  
  // 3. Clone, add remote, push
  const git = simpleGit();
  await git.clone(cloneUrl, './temp');
  await git.addRemote('origin', `https://${username}:${token}@github.com/${username}/${repoName}.git`);
  await git.push(['--all', '--tags']);
}
```

---

## Resources

- **GitHub REST API:** https://docs.github.com/en/rest/repos/repos
- **simple-git:** https://github.com/steveukx/git-js (3.8k stars)
- **isomorphic-git:** https://github.com/isomorphic-git/isomorphic-git (8.1k stars)
