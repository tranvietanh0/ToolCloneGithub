export interface CliOptions {
  org: string;
  token: string;
  targetUsername: string;
  parallel?: number;
  includePrivate?: boolean;
  includePublic?: boolean;
}

export interface RepoInfo {
  name: string;
  cloneUrl: string;
  private: boolean;
  defaultBranch: string;
  size: number;
}

export interface CloneResult {
  repo: string;
  success: boolean;
  error?: string;
  duration?: number;
}

export interface CloneSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: CloneResult[];
  totalDuration: number;
}
