import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'progress';

class Logger {
  private prefix = '';

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const timestamp = new Date().toLocaleTimeString();
    const prefixes: Record<LogLevel, string> = {
      info: chalk.gray('[INFO]'),
      success: chalk.green('[SUCCESS]'),
      warn: chalk.yellow('[WARN]'),
      error: chalk.red('[ERROR]'),
      progress: chalk.cyan('[PROGRESS]'),
    };

    const prefix = prefixes[level];
    const timePrefix = chalk.gray(`[${timestamp}]`);
    console.log(`${timePrefix} ${prefix} ${this.prefix}${message}`, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  success(message: string, ...args: unknown[]) {
    this.log('success', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }

  progress(message: string, ...args: unknown[]) {
    this.log('progress', message, ...args);
  }

  header(message: string) {
    console.log();
    console.log(chalk.bold.cyan(`═══ ${message} ═══`));
    console.log();
  }

  subHeader(message: string) {
    console.log();
    console.log(chalk.bold.yellow(`── ${message} ──`));
  }
}

export const logger = new Logger();
