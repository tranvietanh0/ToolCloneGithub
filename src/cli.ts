import { Command } from 'commander';
import chalk from 'chalk';
import type { CliOptions } from './types.js';

export function parseCliArgs(args: string[]): CliOptions {
  const program = new Command();

  program
    .name('github-cloner')
    .description('Clone all repos from a GitHub organization to your account with full git history')
    .version('1.0.0')
    .requiredOption('-o, --org <organization>', 'GitHub organization name')
    .requiredOption('-t, --token <token>', 'GitHub Personal Access Token (needs repo scope)')
    .requiredOption('-u, --target <username>', 'Target GitHub username to push repos to')
    .option('-p, --parallel <number>', 'Number of parallel clones (default: 2)', '2')
    .option('--include-private', 'Include private repos (default: true)', true)
    .option('--exclude-private', 'Exclude private repos', false)
    .option('--include-public', 'Include public repos (default: true)', true)
    .option('--exclude-public', 'Exclude public repos', false)
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      
      if (opts.excludePrivate) {
        opts.includePrivate = false;
      }
      if (opts.excludePublic) {
        opts.includePublic = false;
      }
    });

  program.parse(args);

  const options = program.opts();
  
  return {
    org: options.org,
    token: options.token,
    targetUsername: options.target,
    parallel: parseInt(options.parallel, 10),
    includePrivate: options.includePrivate,
    includePublic: options.includePublic,
  };
}

export function printBanner() {
  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════╗
║     GitHub Organization Repo Cloner                  ║
║     Clone all repos with full git history            ║
╚═══════════════════════════════════════════════════════╝
  `));
}

export function printUsage() {
  console.log(`
${chalk.bold('Usage:')}
  github-cloner --org <org> --token <token> --target <username>

${chalk.bold('Options:')}
  -o, --org <organization>    GitHub organization name (required)
  -t, --token <token>         GitHub Personal Access Token with repo scope (required)
  -u, --target <username>     Target GitHub username to push repos to (required)
  -p, --parallel <number>     Number of parallel clones (default: 2)
  --include-private            Include private repos (default: true)
  --exclude-private            Exclude private repos
  --include-public             Include public repos (default: true)
  --exclude-public             Exclude public repos

${chalk.bold('Example:')}
  github-cloner -o microsoft -t ghp_xxx -u myusername

${chalk.bold('Note:')}
  Token needs 'repo' scope to access private repos and push to user account.
`);
}
