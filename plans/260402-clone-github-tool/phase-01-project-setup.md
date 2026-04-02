# Phase 01: Project Setup

## Context
Foundation phase - initialize Node.js/TypeScript project with proper structure and dependencies.

## Overview
Create a complete project skeleton with TypeScript configuration, package.json, and directory structure for a production-ready CLI tool.

## Key Insights
- Use `tsx` for running TypeScript directly during development
- Organize src/ by feature (cli/, github/, git/, utils/)
- ESM modules for modern Node.js compatibility
- Use `tsx` instead of `ts-node` (faster, better ESM support)

## Requirements
- Node.js 18+
- TypeScript 5.4+
- ESM module format

## Architecture
```
src/
├── cli/           # Commander.js setup
├── github/        # Octokit client & repo listing
├── git/           # simple-git operations
├── utils/         # temp dir, cleanup, logging
└── index.ts       # Entry point
```

## Implementation Steps

### 1.1 Create package.json
```json
{
  "name": "github-org-cloner",
  "version": "1.0.0",
  "type": "module",
  "bin": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  }
}
```

### 1.2 Create tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

### 1.3 Install dependencies
```bash
npm install @octokit/rest simple-git commander chalk
npm install -D typescript @types/node tsx vitest
```

### 1.4 Create directory structure
```bash
mkdir -p src/{cli,github,git,utils} tests
```

## Todo List
- [ ] Initialize package.json with proper metadata
- [ ] Configure TypeScript with ESM support
- [ ] Install all dependencies
- [ ] Create src/ directory structure
- [ ] Create test/ directory structure
- [ ] Verify `npm run dev` works

## Success Criteria
- `npm run dev -- --help` shows CLI help
- TypeScript compiles without errors
- All imports resolve correctly

## Risk Assessment
- **Low**: Standard Node.js project setup
- ESM vs CJS can cause confusion - ensure `type: "module"` in package.json
