# GitHub Organization Repo Cloner

CLI tool để clone tất cả repos từ một GitHub organization và push lên account của bạn với đầy đủ git history (branches, tags, commits).

## Features

- Clone tất cả repos từ GitHub organization
- Preserve 100% git history (branches, tags, commits)
- Auto-cleanup temp files sau khi push thành công
- Progress logging real-time với chalk-styled output
- Error recovery - tiếp tục khi repo fail mà không dừng cả quá trình
- Rate limit handling cho GitHub API
- Parallel cloning để tăng tốc độ

## Installation

```bash
npm install
npm run build
```

Hoặc install globally:

```bash
npm install -g
```

## Usage

```bash
# Basic usage
github-cloner --org <organization> --token <token> --target <username>

# Short flags
github-cloner -o my-org -t ghp_xxx -u myusername

# With parallel clones
github-cloner -o my-org -t ghp_xxx -u myusername --parallel 4

# Exclude private repos
github-cloner -o my-org -t ghp_xxx -u myusername --exclude-private
```

## Options

| Flag | Description | Required |
|------|-------------|----------|
| `-o, --org <organization>` | Tên GitHub organization | Yes |
| `-t, --token <token>` | GitHub Personal Access Token (cần repo scope) | Yes |
| `-u, --target <username>` | GitHub username để push repos lên | Yes |
| `-p, --parallel <number>` | Số lượng parallel clones (default: 2) | No |
| `--include-private` | Include private repos (default: true) | No |
| `--exclude-private` | Exclude private repos | No |
| `--include-public` | Include public repos (default: true) | No |
| `--exclude-public` | Exclude public repos | No |

## GitHub Token Setup

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` - Full control of private repositories (required for private repos)
   - `read:org` - Read organization permissions (required for org repos)
4. Copy the token

## How It Works

```
CLI Args → List org repos (Octokit) → Clone --mirror (simple-git) 
        → Push --mirror → Auto-cleanup temp
```

1. **Fetch Repos**: Sử dụng GitHub API để lấy danh sách tất cả repos từ organization
2. **Clone**: Sử dụng `git clone --mirror` để clone repo với đầy đủ history
3. **Push**: Push lên GitHub của bạn bằng `git push --mirror`
4. **Cleanup**: Xóa temp files ngay sau khi push thành công

## Examples

### Clone all repos from Microsoft organization

```bash
github-cloner -o Microsoft -t ghp_xxxx -u myusername
```

### Clone only public repos from an org

```bash
github-cloner -o my-org -t ghp_xxxx -u myusername --exclude-private
```

### Clone with 4 parallel processes

```bash
github-cloner -o my-org -t ghp_xxxx -u myusername --parallel 4
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Run with arguments
npm start -- -o my-org -t ghp_xxx -u myusername

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **CLI**: Commander.js
- **GitHub API**: Octokit
- **Git Operations**: simple-git
- **Output**: chalk

## License

ISC
