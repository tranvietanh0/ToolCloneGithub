# Phase 02: CLI Interface

## Context
User-facing interface - parse arguments, validate inputs, display progress.

## Overview
Implement CLI using Commander.js with proper argument validation, help text, and styled output using chalk.

## Key Insights
- Commander.js is lighter than yargs (~3KB vs ~30KB gzipped)
- Use `Option` class for typed options with validation
- chalk v5+ is ESM-only, compatible with our setup
- Global error handler to catch unhandled promise rejections

## Requirements
- CLI args: `--org`, `--token`, `--target`, `--parallel`
- Input validation with clear error messages
- Progress output with chalk styling
- `--help` and `--version` support

## Architecture
```typescript
// src/cli/index.ts
import { Command } from 'commander';
import chalk from 'chalk';

export interface CliOptions {
  org: string;
  token: string;
  target: string;
  parallel: number;
}

export function parseCli(args: string[]): CliOptions {
  const program = new Command();
  program
    .name('github-cloner')
    .description('Clone all repos from a GitHub organization')
    .version('1.0.0')
    .requiredOption('-o, --org <name>', 'GitHub organization name')
    .requiredOption('-t, --token <token>', 'GitHub Personal Access Token')
    .requiredOption('-u, --target <username>', 'Target GitHub username')
    .option('-p, --parallel <n>', 'Parallel clones', '3');

  program.parse(args);
  return program.opts();
}
```

## Implementation Steps

### 2.1 Create CLI parser
- Create `src/cli/index.ts` with Commander setup
- Define typed `CliOptions` interface
- Implement `parseCli()` function

### 2.2 Add input validation
```typescript
function validateOptions(opts: CliOptions): void {
  if (!opts.token.startsWith('ghp_') && !opts.token.startsWith('github_pat_')) {
    console.error(chalk.red('Error: Token must be a GitHub PAT (ghp_... or github_pat_...)'));
    process.exit(1);
  }
  if (opts.parallel < 1 || opts.parallel > 10) {
    console.error(chalk.red('Error: Parallel must be between 1 and 10'));
    process.exit(1);
  }
}
```

### 2.3 Create progress logger
```typescript
// src/utils/logger.ts
export class Logger {
  constructor(private verbose: boolean) {}
  
  info(msg: string) { console.log(chalk.blue('[INFO]'), msg); }
  success(msg: string) { console.log(chalk.green('[SUCCESS]'), msg); }
  error(msg: string) { console.error(chalk.red('[ERROR]'), msg); }
  progress(current: number, total: number, repo: string) {
    console.log(chalk.yellow(`[${current}/${total}]`), `Cloning ${repo}...`);
  }
}
```

### 2.4 Update main entry point
```typescript
// src/index.ts
import { parseCli } from './cli/index.js';
import { Logger } from './utils/logger.js';

const opts = parseCli(process.argv);
const logger = new Logger(true);
logger.info(`Cloning repos from ${opts.org} to ${opts.target}`);
```

## Todo List
- [ ] Create `src/cli/index.ts` with Commander setup
- [ ] Define `CliOptions` interface
- [ ] Implement input validation
- [ ] Create `src/utils/logger.ts` with chalk styling
- [ ] Update `src/index.ts` entry point
- [ ] Test `--help` output

## Success Criteria
- `npm run dev -- --help` displays formatted help
- Invalid inputs show clear error messages
- Logger produces styled console output

## Risk Assessment
- **Low**: Commander.js is well-documented and stable
- chalk v5 breaking changes from v4 - use ESM import syntax
