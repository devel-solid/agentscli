declare module '#engine' {
  export type PublicCommand = 'init' | 'update';
  export type Command = PublicCommand | 'validate' | 'sync';
  export interface ExecuteOptions {
    repoRoot: string;
    dryRun?: boolean;
    check?: boolean;
  }
  export interface RuntimeResult {
    schemaVersion: 1;
    command: Command;
    ok: boolean;
    changes: {
      path: string;
      action: 'create' | 'update' | 'delete';
      status: 'pending' | 'completed';
    }[];
    diagnostics: { code: string; message: string; path?: string }[];
  }
  export interface EngineIO {
    info(
      path: string,
    ):
      | { kind: 'file' | 'directory' | 'link' | 'other'; nlink: number }
      | undefined;
    names(path: string): string[];
    read(path: string): Uint8Array;
    mkdir(path: string): void;
    writeExclusive(path: string, content: Uint8Array): void;
    rename(from: string, to: string): void;
    unlink(path: string): void;
    rmdir(path: string): void;
  }
  export interface EngineDependencies {
    io?: EngineIO;
    resources?: {
      skills: Record<
        | 'agentscli-write-conventions'
        | 'agentscli-build-agents'
        | 'agentscli-refactor-conventions',
        Record<string, Uint8Array>
      >;
    };
  }
  export function execute(
    command: Command,
    options: ExecuteOptions,
    dependencies?: EngineDependencies,
  ): Promise<{ exitCode: 0 | 1 | 2 | 3; result: RuntimeResult }>;
}
