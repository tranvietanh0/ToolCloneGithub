# GitHub Organization Repo Cloner

CLI tool để clone tất cả repos từ một GitHub organization và push lên account của bạn với đầy đủ git history.

## Quick Start

```bash
npm install
npm run build
github-cloner -o <org> -t <token> -u <username>
```

## Documentation

Xem [docs/README.md](docs/README.md) để biết thêm chi tiết.

## Features

- Clone tất cả repos từ GitHub organization
- Preserve 100% git history (branches, tags, commits)
- Auto-cleanup temp files
- Progress logging real-time
- Error recovery - tiếp tục khi repo fail
- Parallel cloning

## License

ISC
