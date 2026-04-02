# Research Report: GitHub REST API - List Organization Repositories

**Date:** 2026-04-02  
**Topic:** GitHub REST API for Organization Repository Listing  
**Lines:** ~45

---

## 1. Core API Endpoint

```
GET /orgs/{org}/repos
```

**Parameters:**
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `type` | string | `all` | - | `all`, `public`, `private`, `forks`, `sources` |
| `sort` | string | `created` | - | `created`, `updated`, `pushed`, `full_name` |
| `direction` | string | `desc` | - | `asc` or `desc` |
| `per_page` | integer | 30 | 100 | Results per page |
| `page` | integer | 1 | - | Page number |

**Visibility Filtering:**
```bash
# Public repos only
GET /orgs/{org}/repos?type=public

# Private repos only  
GET /orgs/{org}/repos?type=private
```

---

## 2. Authentication

**Personal Access Token (PAT):**
```bash
# Bearer token (recommended)
curl -H "Authorization: Bearer YOUR_PAT" \
  https://api.github.com/orgs/{org}/repos

# Or with token prefix
curl -H "Authorization: token YOUR_PAT" \
  https://api.github.com/orgs/{org}/repos
```

**Scopes Required:**
- `repo` scope for private repos
- `public_repo` scope for public-only access

---

## 3. Pagination

**Method A: Page-based (simple)**
```bash
# Fetch pages 1-5
for page in {1..5}; do
  curl -H "Authorization: Bearer $PAT" \
    "https://api.github.com/orgs/{org}/repos?per_page=100&page=$page"
done
```

**Method B: Link Header (comprehensive)**
```bash
curl -H "Authorization: Bearer $PAT" \
  -i "https://api.github.com/orgs/{org}/repos?per_page=100"
```

**Link Header Response Example:**
```
Link: <https://api.github.com/orgs/{org}/repos?page=2>; rel="next",
      <https://api.github.com/orgs/{org}/repos?page=50>; rel="last"
```

**JavaScript/Node.js Pagination Helper:**
```javascript
async function* paginate(org, token) {
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const repos = await res.json();
    if (!repos.length) break;
    yield repos;
    const next = res.headers.get('Link')?.includes('rel="next"');
    if (!next) break;
    page++;
  }
}
```

---

## 4. Rate Limiting

| Auth Type | Requests/Hour | Notes |
|-----------|---------------|-------|
| Unauthenticated | 60 | IP-based |
| PAT (authenticated) | 5,000 | Per token |
| GitHub App | 5,000+ | Per app installation |

**Check Remaining Requests:**
```bash
curl -I -H "Authorization: Bearer $PAT" https://api.github.com/orgs/{org}/repos
# X-RateLimit-Remaining: 4999
```

---

## 5. Response Fields for Visibility Check

Each repo object contains:
```json
{
  "id": 123456,
  "name": "my-repo",
  "private": true,        // <-- Boolean visibility flag
  "visibility": "private", // <-- String (GitHub Enterprise)
  "html_url": "https://github.com/org/my-repo"
}
```

**Check visibility programmatically:**
```javascript
const isPrivate = repo.private === true;
// or for GitHub Enterprise:
const visibility = repo.visibility; // "private" | "public" | "internal"
```

---

## 6. Complete Example Script

```bash
#!/bin/bash
ORG="my-org"
TOKEN="ghp_xxxx"

# Fetch all repos (public + private), handle pagination
page=1
while true; do
  response=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/orgs/$ORG/repos?type=all&per_page=100&page=$page")
  
  # Check if empty
  if [ "$(echo "$response" | jq length)" -eq 0 ]; then
    break
  fi
  
  # Extract name + private status
  echo "$response" | jq -r '.[] | "\(.name) | private=\(.private)"'
  
  # Check for next page
  link_header=$(curl -s -i -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/orgs/$ORG/repos?type=all&per_page=100&page=$page" \
    | grep -i link)
  
  if ! echo "$link_header" | grep -q 'rel="next"'; then
    break
  fi
  ((page++))
done
```

---

## Key Takeaways

1. **Use `type` parameter** to filter public/private directly at API level
2. **Use `per_page=100`** for maximum efficiency (minimizes page count)
3. **Prefer Link header parsing** over fixed page counts for robustness
4. **Monitor rate limits** via `X-RateLimit-Remaining` header
5. **Check `repo.private` boolean** (or `repo.visibility` string) for visibility
6. **Use PAT with `repo` scope** for full organization access
