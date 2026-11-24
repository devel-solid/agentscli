import * as nodeFs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  inspectHub,
  parseManifest,
  semver,
  portablePath,
  fail,
} from './support.mjs';

export function bumpVersion(version, impact) {
  if (!semver(version) || !['patch', 'minor', 'major'].includes(impact))
    fail('version', 'Choose agent-assessed patch, minor, or major impact.');
  const [major, minor, patch] = version.split(/[+-]/)[0].split('.').map(Number);
  const candidate =
    impact === 'major'
      ? `${major + 1}.0.0`
      : impact === 'minor'
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;
  if (!semver(candidate))
    fail(
      'version',
      'Derived content version exceeds the supported safe integer range.',
    );
  return candidate;
}
export function compareVersions(a, b) {
  const parts = (value) => {
    const [core, pre] = value.split('+')[0].split(/-(.*)/s);
    return { core: core.split('.').map(Number), pre: pre?.split('.') };
  };
  const left = parts(a),
    right = parts(b);
  for (let index = 0; index < 3; index++)
    if (left.core[index] !== right.core[index])
      return left.core[index] - right.core[index];
  if (!left.pre || !right.pre) return left.pre ? -1 : right.pre ? 1 : 0;
  for (
    let index = 0;
    index < Math.max(left.pre.length, right.pre.length);
    index++
  ) {
    const x = left.pre[index],
      y = right.pre[index];
    if (x === y) continue;
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    const xn = /^\d+$/.test(x),
      yn = /^\d+$/.test(y);
    if (xn && yn)
      return x.length === y.length ? (x < y ? -1 : 1) : x.length - y.length;
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}
export function selectVersion(baseline, impact, override) {
  if (
    override !== undefined &&
    (!semver(override) ||
      (baseline && compareVersions(override, baseline) <= 0))
  )
    fail(
      'version',
      'An explicit version must be semantic versioning and newer than the published baseline.',
    );
  return override ?? (baseline ? bumpVersion(baseline, impact) : '1.0.0');
}
export function parseRefs(text) {
  const refs = new Map();
  for (const line of text.trim().split(/\r?\n/)) {
    if (!line) continue;
    const match =
      /^([0-9a-f]{40}|[0-9a-f]{64})\s+(refs\/(?:heads|tags)\/[^\s]+)$/.exec(
        line,
      );
    if (!match)
      fail('refs', 'Native Git returned malformed remote references.');
    refs.set(match[2], match[1]);
  }
  for (const [name, commit] of [...refs])
    if (name.endsWith('^{}')) {
      refs.set(name.slice(0, -3), commit);
      refs.delete(name);
    }
  return refs;
}
export function parseStatus(text) {
  const parts = text.split('\0');
  const files = [];
  for (let index = 0; index < parts.length; index++) {
    const entry = parts[index];
    if (!entry) continue;
    if (entry.length < 4 || entry[2] !== ' ')
      fail('status', 'Native Git returned malformed status.');
    const status = entry.slice(0, 2),
      file = entry.slice(3);
    if (!portablePath(file))
      fail('unsafe-path', 'Changed path is not portable.', file);
    files.push({ path: file, status });
    if (/[RC]/.test(status)) {
      const original = parts[++index];
      if (!portablePath(original))
        fail('unsafe-path', 'Rename source is not portable.', original);
      files.push({ path: original, status: ' D' });
    }
  }
  return files;
}
export function nativeGit(args, { cwd, allowFailure = false } = {}) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  if (result.error || result.status !== 0) {
    if (allowFailure) return null;
    fail(
      'git',
      'Native Git operation failed. Check the configured destination, access, and repository state; no credentials are printed.',
    );
  }
  return result.stdout.replace(/[\r\n]+$/, '');
}
function eligible(file) {
  return (
    [
      'agentscli-hub.yml',
      'AGENTS.md',
      'README.md',
      '.gitattributes',
      '.gitignore',
    ].includes(file) ||
    [
      'docs/conventions/',
      'shared/conventions/',
      'shared/skills/',
      '.agents/skills/',
    ].some((prefix) => file.startsWith(prefix))
  );
}
function safeDestination(value, label) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.startsWith('-') ||
    /[\x00-\x20\x7f]/.test(value)
  )
    fail('destination', `Invalid ${label}.`);
  return value;
}
function optional(git, args, root) {
  try {
    return git(args, { cwd: root, allowFailure: true });
  } catch (error) {
    if (error.code === 'git') return null;
    throw error;
  }
}
function ancestor(git, older, newer, root) {
  if (older === newer) return true;
  return (
    optional(git, ['merge-base', '--is-ancestor', older, newer], root) !== null
  );
}
function destination(options, git, root) {
  const branch =
    options.branch ??
    optional(git, ['symbolic-ref', '--quiet', '--short', 'HEAD'], root);
  if (!branch)
    fail(
      'destination',
      'A concrete branch is missing; supply --branch after resolving the intended publication branch.',
    );
  safeDestination(branch, 'branch');
  if (/\.\.|[~^:?*\[\\]|\/$|^\//.test(branch))
    fail('destination', 'Invalid branch.');
  let remote =
    options.remote ??
    optional(git, ['config', '--get', `branch.${branch}.remote`], root);
  if (!remote) {
    const candidates = (git(['remote'], { cwd: root }) ?? '')
      .split(/\r?\n/)
      .filter(Boolean);
    if (candidates.length === 1) remote = candidates[0];
  }
  if (!remote || remote === '.')
    fail(
      'destination',
      'A concrete remote is missing or ambiguous; configure or supply --remote.',
    );
  safeDestination(remote, 'remote');
  const endpoint = git(['remote', 'get-url', '--push', remote], { cwd: root });
  safeDestination(endpoint, 'configured remote endpoint');
  const merge = options.branch
    ? undefined
    : optional(git, ['config', '--get', `branch.${branch}.merge`], root);
  const targetBranch = merge?.startsWith('refs/heads/')
    ? merge.slice(11)
    : branch;
  safeDestination(targetBranch, 'destination branch');
  return { remote, branch: targetBranch, localBranch: branch };
}
export function prepareRelease(
  options,
  { fs = nodeFs, git = nativeGit, inspect = inspectHub } = {},
) {
  const root = path.resolve(options.root);
  const inspection = inspect(root, { fs });
  const manifest = inspection.manifest;
  const target = destination(options, git, root);
  const remoteRefs = parseRefs(
    git(['ls-remote', target.remote, 'refs/heads/*', 'refs/tags/*'], {
      cwd: root,
    }),
  );
  const head = optional(git, ['rev-parse', '--verify', 'HEAD'], root);
  if (head && !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(head))
    fail('git', 'Unexpected HEAD identity.');
  const changes = parseStatus(
    git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], {
      cwd: root,
    }),
  );
  const requested = options.paths ?? [];
  for (const file of requested)
    if (!portablePath(file) || !eligible(file))
      fail(
        'scope',
        'Publication scope must contain only explicit hub resource paths.',
        file,
      );
  const selected = changes.filter(
    (item) =>
      eligible(item.path) &&
      (!requested.length ||
        requested.some(
          (file) => item.path === file || item.path.startsWith(`${file}/`),
        )),
  );
  for (const item of selected)
    if (
      item.status[0] !== ' ' &&
      item.status[0] !== '?' &&
      item.status[1] !== ' '
    )
      fail(
        'staging',
        'A selected path has both staged and unstaged edits. Reconcile its intended content before publication.',
        item.path,
      );
  const published = [];
  for (const [ref, commit] of remoteRefs) {
    const version = ref.startsWith('refs/tags/v') ? ref.slice(11) : undefined;
    if (!semver(version)) continue;
    const content = optional(
      git,
      ['show', `${commit}:agentscli-hub.yml`],
      root,
    );
    if (content === null)
      fail(
        'history',
        'Published tag objects are not available locally. Reconcile/fetch the native Git history before retrying; preview does not fetch.',
      );
    if (parseManifest(content).version !== version)
      fail(
        'manifest-tag',
        'A published tag disagrees with its committed hub manifest.',
      );
    if (head && ancestor(git, commit, head, root))
      published.push({ version, commit });
  }
  published.sort((a, b) => compareVersions(b.version, a.version));
  const baseline = published[0];
  const localCurrentTag = optional(
    git,
    ['rev-parse', '--verify', `refs/tags/v${manifest.version}^{commit}`],
    root,
  );
  const currentRemoteTag = remoteRefs.get(`refs/tags/v${manifest.version}`);
  if (
    localCurrentTag &&
    currentRemoteTag &&
    localCurrentTag !== currentRemoteTag
  )
    fail('tag-conflict', 'Local and remote immutable content tags disagree.');
  const contentChanges = selected.filter(
    (item) => item.path !== 'agentscli-hub.yml',
  );
  const committedChanges =
    baseline && head
      ? git(['diff', '--name-only', '-z', baseline.commit, head], { cwd: root })
          .split('\0')
          .filter(
            (file) => file && eligible(file) && file !== 'agentscli-hub.yml',
          )
      : [];
  const unchangedPublished =
    baseline &&
    manifest.version === baseline.version &&
    selected.length === 0 &&
    committedChanges.length === 0;
  const existingCandidate =
    head &&
    (localCurrentTag === head || currentRemoteTag === head) &&
    contentChanges.length === 0;
  const version = unchangedPublished
    ? baseline.version
    : existingCandidate
      ? manifest.version
      : selectVersion(baseline?.version, options.bump, options.version);
  if (options.version && existingCandidate && options.version !== version)
    fail(
      'version',
      'An unfinished candidate already exists; retry that exact candidate before creating another version.',
    );
  const tag = `v${version}`;
  const localTag = optional(
    git,
    ['rev-parse', '--verify', `refs/tags/${tag}^{commit}`],
    root,
  );
  const remoteTag = remoteRefs.get(`refs/tags/${tag}`);
  let commit = unchangedPublished
    ? baseline.commit
    : existingCandidate
      ? head
      : undefined;
  const manifestAtHead = head
    ? optional(git, ['show', `${head}:agentscli-hub.yml`], root)
    : null;
  if (
    !commit &&
    contentChanges.length === 0 &&
    manifestAtHead &&
    parseManifest(manifestAtHead).version === version &&
    manifest.version === version
  )
    commit = head;
  if (localTag && (!commit || localTag !== commit))
    fail(
      'tag-conflict',
      'The candidate version already has a different immutable local tag.',
    );
  if (remoteTag && (!commit || remoteTag !== commit))
    fail(
      'tag-conflict',
      'The candidate version already has a different immutable remote tag.',
    );
  if (manifest.version !== version && manifest.version !== baseline?.version)
    fail(
      'manifest-version',
      'The working manifest is neither the published baseline nor this exact candidate.',
    );
  const branchRef = `refs/heads/${target.branch}`;
  const remoteBranch = remoteRefs.get(branchRef);
  if (
    remoteBranch &&
    head &&
    !ancestor(git, remoteBranch, head, root) &&
    !(commit && ancestor(git, commit, remoteBranch, root))
  )
    fail(
      'diverged',
      'The publication branch diverged or required objects are unavailable. Reconcile native Git history before retrying.',
    );
  const branchVerified =
    !!commit && !!remoteBranch && ancestor(git, commit, remoteBranch, root);
  const tagVerified = !!commit && remoteTag === commit;
  const noChanges =
    (existingCandidate || unchangedPublished) &&
    branchVerified &&
    tagVerified &&
    selected.length === 0;
  return {
    root,
    ...target,
    baseline: baseline?.version,
    version,
    tag,
    commit,
    head,
    branchRef,
    remoteBranch,
    remoteTag,
    localTag,
    branchVerified,
    tagVerified,
    noChanges,
    paths: [
      ...new Set([...selected.map((item) => item.path), 'agentscli-hub.yml']),
    ].sort(),
    manifestText: `schemaVersion: 1\nversion: ${version}\n`,
    effects: noChanges
      ? []
      : [
          !commit && 'manifest/commit',
          !localTag && 'tag',
          !branchVerified && 'push-branch',
          !tagVerified && 'push-tag',
        ].filter(Boolean),
  };
}
export function verifyRelease(candidate, { git = nativeGit } = {}) {
  if (!candidate.commit) return { ok: false, branch: false, tag: false };
  const refs = parseRefs(
    git(
      [
        'ls-remote',
        candidate.remote,
        candidate.branchRef,
        `refs/tags/${candidate.tag}`,
        `refs/tags/${candidate.tag}^{}`,
      ],
      { cwd: candidate.root },
    ),
  );
  const remoteBranch = refs.get(candidate.branchRef);
  const remoteTag = refs.get(`refs/tags/${candidate.tag}`);
  if (remoteTag && remoteTag !== candidate.commit)
    fail('tag-conflict', 'The remote tag identifies a conflicting commit.');
  const branch =
    !!remoteBranch &&
    ancestor(git, candidate.commit, remoteBranch, candidate.root);
  const tag = remoteTag === candidate.commit;
  return { ok: branch && tag, branch, tag };
}
export function publishRelease(options, adapters = {}) {
  const { fs = nodeFs, git = nativeGit, inspect = inspectHub } = adapters;
  let candidate;
  const completed = [];
  try {
    candidate = prepareRelease(options, { fs, git, inspect });
    if (options.preview)
      return {
        ok: true,
        preview: true,
        candidate,
        completed,
        pending: candidate.effects,
      };
    if (candidate.noChanges)
      return { ok: true, noChanges: true, candidate, completed, pending: [] };
    if (!candidate.commit) {
      const manifestFile = path.join(candidate.root, 'agentscli-hub.yml');
      if (fs.readFileSync(manifestFile, 'utf8') !== candidate.manifestText) {
        const temporary = path.join(
          candidate.root,
          `.agentscli-hub-${randomUUID()}.tmp`,
        );
        try {
          fs.writeFileSync(temporary, candidate.manifestText, { flag: 'wx' });
          fs.renameSync(temporary, manifestFile);
        } finally {
          if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
        }
      }
      completed.push('manifest');
      inspect(candidate.root, { fs });
      git(['add', '--', ...candidate.paths], { cwd: candidate.root });
      git(
        [
          'commit',
          '--only',
          '-m',
          `Release hub ${candidate.tag}`,
          '--',
          ...candidate.paths,
        ],
        { cwd: candidate.root },
      );
      candidate.commit = git(['rev-parse', '--verify', 'HEAD'], {
        cwd: candidate.root,
      });
      completed.push('commit');
    }
    const committed = git(['show', `${candidate.commit}:agentscli-hub.yml`], {
      cwd: candidate.root,
    });
    if (parseManifest(committed).version !== candidate.version)
      fail('manifest-tag', 'Candidate commit and manifest disagree.');
    const localTag = optional(
      git,
      ['rev-parse', '--verify', `refs/tags/${candidate.tag}^{commit}`],
      candidate.root,
    );
    if (localTag && localTag !== candidate.commit)
      fail('tag-conflict', 'Immutable local candidate tag conflicts.');
    if (!localTag) {
      git(['tag', candidate.tag, candidate.commit], { cwd: candidate.root });
      completed.push('tag');
    }
    let status = verifyRelease(candidate, { git });
    if (!status.branch) {
      git(
        [
          'push',
          candidate.remote,
          `${candidate.commit}:${candidate.branchRef}`,
        ],
        { cwd: candidate.root },
      );
      completed.push('push-branch');
    }
    if (!status.tag) {
      git(
        [
          'push',
          candidate.remote,
          `refs/tags/${candidate.tag}:refs/tags/${candidate.tag}`,
        ],
        { cwd: candidate.root },
      );
      completed.push('push-tag');
    }
    status = verifyRelease(candidate, { git });
    if (!status.ok)
      return {
        ok: false,
        candidate,
        completed,
        pending: [
          !status.branch && 'verify-branch',
          !status.tag && 'verify-tag',
        ].filter(Boolean),
        message:
          'Delivery is partial. Retry this exact candidate after inspecting native refs.',
      };
    completed.push('verify');
    return { ok: true, candidate, completed, pending: [] };
  } catch (error) {
    // A lost push response may already have delivered both refs. Inspect before
    // reporting failure, without bumping, rewriting, or forcing any identity.
    if (candidate?.commit) {
      try {
        const status = verifyRelease(candidate, { git });
        if (status.ok)
          return {
            ok: true,
            candidate,
            completed: [...completed, 'verify'],
            pending: [],
          };
        return {
          ok: false,
          candidate,
          completed,
          pending: [
            !status.branch && 'push/verify-branch',
            !status.tag && 'push/verify-tag',
          ].filter(Boolean),
          code: error.code ?? 'operation',
          message:
            'Delivery is partial or uncertain. Retry the exact content version and commit after inspecting native refs.',
        };
      } catch {
        /* Preserve the original candidate; verification is still pending. */
      }
    }
    return {
      ok: false,
      candidate,
      completed,
      pending: candidate ? ['reconcile-same-candidate'] : ['preflight'],
      ...(error.file ? { file: error.file } : {}),
      code: error.code ?? 'operation',
      message: error.code
        ? error.message
        : 'Hub release stopped. Reconcile native Git state and retry the same candidate.',
    };
  }
}
export function parseArgs(args) {
  const mode = args[0];
  if (!['plan', 'publish', 'verify'].includes(mode))
    fail(
      'arguments',
      'Use plan, publish, or verify with --repo-root and agent-assessed --bump.',
    );
  const result = { mode, paths: [] };
  for (let index = 1; index < args.length; index += 2) {
    const flag = args[index],
      value = args[index + 1];
    const fields = {
      '--repo-root': 'root',
      '--bump': 'bump',
      '--version': 'version',
      '--remote': 'remote',
      '--branch': 'branch',
    };
    if (
      !value ||
      value.startsWith('--') ||
      (!fields[flag] && flag !== '--path')
    )
      fail('arguments', 'Invalid release helper argument.');
    if (flag === '--path') result.paths.push(value);
    else {
      if (result[fields[flag]])
        fail('arguments', 'Repeated release helper argument.');
      result[fields[flag]] = value;
    }
  }
  if (
    !result.root ||
    (!result.version && !['patch', 'minor', 'major'].includes(result.bump))
  )
    fail(
      'arguments',
      'Supply --repo-root and an assessed --bump (or explicit user --version).',
    );
  return result;
}
export function main(
  args,
  { log = console.log, error = console.error, ...adapters } = {},
) {
  try {
    const options = parseArgs(args);
    if (options.mode === 'verify') {
      const candidate = prepareRelease(options, adapters);
      const status = verifyRelease(candidate, adapters);
      log(JSON.stringify({ ...status, candidate }));
      return status.ok ? 0 : 3;
    }
    const result = publishRelease(
      { ...options, preview: options.mode === 'plan' },
      adapters,
    );
    log(JSON.stringify(result));
    return result.ok ? 0 : result.candidate ? 3 : 2;
  } catch (cause) {
    error(
      JSON.stringify({
        ok: false,
        code: cause.code ?? 'operation',
        message: cause.code ? cause.message : 'Release helper failed.',
      }),
    );
    return cause.code ? 2 : 3;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  process.exitCode = main(process.argv.slice(2));
