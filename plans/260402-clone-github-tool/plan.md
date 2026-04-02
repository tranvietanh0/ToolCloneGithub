# GitHub Organization Repo Cloner - Implementation Plan

## Executive Summary
CLI tool to clone ALL repos from a GitHub organization to a user's account, preserving full git history (branches, tags, commits) via `git clone --mirror` + `git push --mirror`. Uses temp storage with auto-cleanup, progress logging, and robust error handling.

## Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **CLI**: Commander.js (lighter weight vs yargs)
- **GitHub API**: Octokit (official GitHub SDK)
- **Git Ops**: simple-git (lightweight git wrapper)
- **Temp Mgmt**: Node.js `fs` + `os.tmpdir()`

## Architecture Flow
```
CLI Args → Octokit (list org repos) → simple-git (clone --mirror) 
         → simple-git (push --mirror) → auto-cleanup temp files
```

## Key Features
1. **Full History Preservation**: `--mirror` flag clones all refs (branches, tags, commits)
2. **Auto-Cleanup**: Temp dirs deleted on successful push or via cleanup handlers
3. **Progress Logging**: Real-time repo cloning progress with chalk/styled output
4. **Error Recovery**: Continue on repo failure, summary report at end
5. **Rate Limiting**: Respect GitHub API limits with exponential backoff

## Output Structure
```
plan.md (this file)
phase-01-project-setup.md
phase-02-cli-interface.md
phase-03-github-api.md
phase-04-git-operations.md
phase-05-temp-cleanup.md
phase-06-error-handling.md
phase-07-testing.md
```

## Dependencies
```json
{
  "dependencies": {
    "@octokit/rest": "^21.0.0",
    "simple-git": "^3.22.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.4.0"
  }
}
```

## CLI Usage
```bash
github-cloner --org my-org --token ghp_xxx --target my-username
github-cloner -o my-org -t ghp_xxx -u my-username [--parallel 3]
```

## Success Criteria
- Clones 100% of org repos with intact history
- Zero temp file leakage after completion
- Graceful handling of repo failures without stopping entire process
- Clear progress indication for long-running operations
