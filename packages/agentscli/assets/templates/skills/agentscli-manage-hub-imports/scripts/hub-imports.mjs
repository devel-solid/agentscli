import * as fs from 'node:fs';
import { join, parse, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CONFIG_PATH,
  HUB_ROOT,
  LOCK_PATH,
  HubImportError,
  bytesEqual,
  canonical,
  commitId,
  portablePath,
  repository,
  request,
  sha256,
  snapshotFromCapture,
  snapshotHash,
  stable,
  summarizeEffects,
} from './contracts.mjs';
import { createGitCapture } from './git.mjs';

const toBytes = (text) => new Uint8Array(Buffer.from(text));
const decode = (content) =>
  new TextDecoder('utf-8', { fatal: true }).decode(content);

function nativeRegular(path, expected) {
  const absolute = resolve(path);
  let current = parse(absolute).root;
  const parts = relative(current, absolute).split(/[\\/]/u).filter(Boolean);
  for (const part of parts) {
    current = join(current, part);
    const info = fs.lstatSync(current);
    if (
      info.isSymbolicLink() ||
      (!info.isDirectory() && !info.isFile()) ||
      (info.isFile() && info.nlink > 1)
    )
      throw new HubImportError(
        'PATH_UNSAFE',
        'A dependency location is aliased or unsafe.',
      );
  }
  const info = fs.lstatSync(path);
  if (
    (expected === 'file' && !info.isFile()) ||
    (expected === 'directory' && !info.isDirectory())
  )
    throw new HubImportError(
      'DEPENDENCY',
      'The discovered dependency has the wrong filesystem type.',
    );
}

/** Discover the co-distributed local dependency by identity, not a caller-relative path. */
export async function discoverEngine(repoRoot) {
  const base = join(resolve(repoRoot), '.agents', 'skills');
  nativeRegular(base, 'directory');
  let found;
  for (const name of fs.readdirSync(base).sort()) {
    const directory = join(base, name);
    const info = fs.lstatSync(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) continue;
    const entry = join(directory, 'SKILL.md');
    if (!fs.existsSync(entry)) continue;
    nativeRegular(entry, 'file');
    const header = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(
      fs.readFileSync(entry, 'utf8'),
    );
    if (
      !header ||
      !/^name:\s*["']?agentscli-build-agents["']?\s*$/mu.test(header[1])
    )
      continue;
    if (name !== 'agentscli-build-agents' || found)
      throw new HubImportError(
        'DEPENDENCY',
        'The local build-skill identity is ambiguous.',
      );
    found = directory;
  }
  if (!found)
    throw new HubImportError(
      'DEPENDENCY',
      'Local agentscli-build-agents is required. Use agentscli apply to restore product skills.',
    );
  const module = join(found, 'scripts', 'lib', 'index.mjs');
  nativeRegular(module, 'file');
  return import(pathToFileURL(module).href);
}

async function context(options = {}) {
  const root = resolve(options.repoRoot ?? process.cwd());
  const engine = options.engine ?? (await discoverEngine(root));
  const io = options.io ?? engine.disk;
  if (
    !io ||
    !engine.parseYaml ||
    !engine.stringifyYaml ||
    !engine.plan ||
    !engine.applyEffects
  )
    throw new HubImportError(
      'DEPENDENCY',
      'The discovered build skill lacks the required engine API. Restore it with agentscli apply.',
    );
  engine.checkRoot?.(io, root);
  engine.assertClientContext?.(io, root);
  return { root, engine, io, git: options.git };
}

function readFile(ctx, path, required = false) {
  const info = ctx.engine.inspect(ctx.io, ctx.root, path, 'file');
  if (!info) {
    if (required)
      throw new HubImportError(
        'SOURCE_MISSING',
        `Missing project input: ${path}.`,
        2,
        path,
      );
    return undefined;
  }
  return ctx.io.read(join(ctx.root, ...path.split('/')));
}

function readTree(ctx, directory) {
  return Object.fromEntries(
    ctx.engine
      .walk(ctx.io, ctx.root, directory)
      .map((path) => [path, readFile(ctx, path, true)]),
  );
}

function stateFingerprint(ctx) {
  const files = {
    ...readTree(ctx, '.agentscli'),
    ...readTree(ctx, '.agents/skills'),
  };
  const rootAgents = readFile(ctx, 'AGENTS.md');
  if (rootAgents !== undefined) files['AGENTS.md'] = rootAgents;
  const entries = Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([path, content]) => [
      path,
      sha256(content),
      ctx.io.info(join(ctx.root, ...path.split('/')))?.mode ?? null,
    ]);
  return sha256(stable(entries));
}

function loadState(ctx) {
  const rawConfig = readFile(ctx, CONFIG_PATH, true);
  const manifest = ctx.engine.parseManifest(decode(rawConfig));
  const rawLock = readFile(ctx, LOCK_PATH);
  let accepted;
  let acceptedManifest = { language: manifest.language };
  if (rawLock !== undefined) {
    const lock = ctx.engine.parseYaml(decode(rawLock), LOCK_PATH);
    repository(lock.repository);
    commitId(lock.commit);
    acceptedManifest = {
      language: manifest.language,
      hub: {
        repository: lock.repository,
        commit: lock.commit,
        conventions: lock.conventions,
        skills: lock.skills,
      },
    };
    // Explicit management uses the accepted lock for old ownership even when desired config was edited.
    accepted = ctx.engine.loadHub(ctx.io, ctx.root, acceptedManifest);
    ctx.engine.validateHubSnapshot(acceptedManifest, accepted);
  } else if (Object.keys(readTree(ctx, HUB_ROOT)).length) {
    throw new HubImportError(
      'STATE_AMBIGUOUS',
      'Snapshot files exist without accepted integrity. Reconcile the project Git state before retrying.',
      2,
      HUB_ROOT,
    );
  }
  return {
    manifest,
    acceptedManifest,
    accepted,
    rawConfig,
    rawLock,
    fingerprint: stateFingerprint(ctx),
  };
}

function sourceEffects(ctx, previous, candidate) {
  const before = previous?.files ?? {};
  const after = candidate?.files ?? {};
  const effects = [];
  for (const path of Object.keys(after).sort()) {
    portablePath(path);
    const target = `${HUB_ROOT}/${path}`;
    const current = readFile(ctx, target);
    const gitMode = candidate.lock.files[path].gitMode;
    const modeDrift =
      ctx.io.supportsMode &&
      ((ctx.io.info(join(ctx.root, ...target.split('/')))?.mode ?? 0) &
        0o777) !==
        (gitMode === '100755' ? 0o755 : 0o644);
    if (!bytesEqual(current, after[path]) || modeDrift)
      effects.push({
        path: target,
        action: current === undefined ? 'create' : 'update',
        content: after[path],
        previous: current,
        gitMode,
      });
  }
  for (const path of Object.keys(before)
    .filter((path) => !Object.hasOwn(after, path))
    .sort()) {
    const target = `${HUB_ROOT}/${path}`;
    const current = readFile(ctx, target);
    if (current !== undefined)
      effects.push({ path: target, action: 'delete', previous: current });
  }
  const directories = (files) => {
    const result = new Set();
    for (const path of Object.keys(files)) {
      const parts = path.split('/');
      for (let n = 1; n < parts.length; n++)
        result.add(`${HUB_ROOT}/${parts.slice(0, n).join('/')}`);
    }
    return result;
  };
  const expectedDirs = directories(after);
  for (const path of [...directories(before)]
    .filter((path) => !expectedDirs.has(path))
    .sort((a, b) => b.length - a.length || a.localeCompare(b, 'en')))
    effects.push({ path, action: 'delete', directory: true });
  return effects;
}

function stateEffects(ctx, state, manifest, snapshot) {
  const effects = [];
  if (snapshot) {
    const content = toBytes(ctx.engine.stringifyYaml(snapshot.lock));
    if (!bytesEqual(state.rawLock, content))
      effects.push({
        path: LOCK_PATH,
        action: state.rawLock === undefined ? 'create' : 'update',
        content,
        previous: state.rawLock,
      });
  } else if (state.rawLock !== undefined) {
    effects.push({
      path: LOCK_PATH,
      action: 'delete',
      previous: state.rawLock,
    });
    effects.push({ path: HUB_ROOT, action: 'delete', directory: true });
  }
  const config = toBytes(ctx.engine.serializeManifest(manifest));
  if (!bytesEqual(state.rawConfig, config))
    effects.push({
      path: CONFIG_PATH,
      action: 'update',
      content: config,
      previous: state.rawConfig,
    });
  return effects;
}

function prospectivePlan(ctx, state, snapshot) {
  const manifest = {
    language: state.manifest.language,
    ...(snapshot
      ? {
          hub: {
            repository: snapshot.lock.repository,
            commit: snapshot.lock.commit,
            conventions: snapshot.lock.conventions,
            skills: snapshot.lock.skills,
          },
        }
      : {}),
  };
  if (snapshot) ctx.engine.validateHubSnapshot(manifest, snapshot);
  const managed = ctx.engine.plan(
    ctx.io,
    ctx.root,
    'sync',
    undefined,
    undefined,
    {
      manifest,
      hub: snapshot ?? null,
      previousHub: state.accepted ?? null,
    },
  );
  const sources = sourceEffects(ctx, state.accepted, snapshot);
  const publication = stateEffects(ctx, state, manifest, snapshot);
  const effects = [...sources, ...managed, ...publication];
  const seen = new Set();
  for (const effect of effects) {
    portablePath(effect.path);
    if (seen.has(effect.path))
      throw new HubImportError(
        'PLAN',
        'A proposed path has conflicting effects.',
      );
    seen.add(effect.path);
    ctx.engine.inspect(
      ctx.io,
      ctx.root,
      effect.path,
      effect.directory ? 'directory' : 'file',
    );
  }
  return { manifest, snapshot, sources, managed, publication, effects };
}

function reviewedPlan(state, intent, candidate, planned) {
  const changes = summarizeEffects(planned.effects);
  return {
    schemaVersion: 1,
    operation: candidate ? 'import' : 'detach',
    ...(candidate
      ? {
          repository: intent.repository,
          commit: candidate.lock.commit,
          conventions: candidate.lock.conventions,
          skills: candidate.lock.skills,
          hubVersion: candidate.lock.hubVersion,
        }
      : { commit: state.accepted?.lock.commit ?? null }),
    currentStateHash: state.fingerprint,
    candidateHash: snapshotHash(candidate),
    effectsHash: sha256(stable(changes)),
    changes,
  };
}

function validateReviewed(value) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    !['import', 'detach'].includes(value.operation) ||
    !/^[a-f0-9]{64}$/u.test(value.currentStateHash ?? '') ||
    !/^[a-f0-9]{64}$/u.test(value.candidateHash ?? '') ||
    !/^[a-f0-9]{64}$/u.test(value.effectsHash ?? '')
  )
    throw new HubImportError(
      'PLAN',
      'Use a complete reviewed plan produced by this skill.',
    );
  if (value.operation === 'import')
    request({
      repository: value.repository,
      commit: value.commit,
      conventions: value.conventions,
      skills: value.skills,
    });
  return value;
}

async function acquire(ctx, input) {
  const intent = request(input);
  const git = ctx.git ?? createGitCapture();
  const capture = await git.capture(intent);
  const candidate = snapshotFromCapture(intent, capture, ctx.engine.parseYaml);
  const manifest = {
    language: 'en',
    hub: {
      repository: candidate.lock.repository,
      commit: candidate.lock.commit,
      conventions: candidate.lock.conventions,
      skills: candidate.lock.skills,
    },
  };
  ctx.engine.validateHubSnapshot(manifest, candidate);
  return { intent, candidate };
}

/** Remote planning uses disposable Git storage but never mutates the project. */
export async function planRemote(input, options = {}) {
  const ctx = await context(options);
  const state = loadState(ctx);
  const { intent, candidate } = await acquire(ctx, input);
  if (stateFingerprint(ctx) !== state.fingerprint)
    throw new HubImportError(
      'PRECONDITION',
      'Project inputs changed during remote planning. Create a new plan.',
    );
  return reviewedPlan(
    state,
    intent,
    candidate,
    prospectivePlan(ctx, state, candidate),
  );
}

/** Fully local validation/check: no scratch files, Git, or network. */
export async function checkLocal(options = {}) {
  const ctx = await context(options);
  const state = loadState(ctx);
  if (
    stable(state.manifest.hub ?? null) !==
    stable(state.acceptedManifest.hub ?? null)
  )
    throw new HubImportError(
      'STATE_MISMATCH',
      'Desired hub configuration differs from accepted state. Use an explicit import or detach plan.',
    );
  const effects = ctx.engine.plan(
    ctx.io,
    ctx.root,
    'sync',
    undefined,
    undefined,
    {
      manifest: state.manifest,
      hub: state.accepted ?? null,
      previousHub: state.accepted,
    },
  );
  return {
    schemaVersion: 1,
    operation: 'check',
    ok: effects.length === 0,
    commit: state.accepted?.lock.commit ?? null,
    changes: summarizeEffects(effects),
  };
}

export async function planDetach(options = {}) {
  const ctx = await context(options);
  const state = loadState(ctx);
  return reviewedPlan(state, null, null, prospectivePlan(ctx, state, null));
}

function verifySources(ctx, snapshot) {
  const actual = readTree(ctx, HUB_ROOT);
  const names = Object.keys(actual)
    .filter((path) => path !== LOCK_PATH)
    .sort();
  const expected = Object.keys(snapshot?.files ?? {})
    .map((path) => `${HUB_ROOT}/${path}`)
    .sort();
  if (stable(names) !== stable(expected))
    throw new HubImportError(
      'VERIFY',
      'Candidate snapshot inventory could not be verified.',
      3,
      HUB_ROOT,
    );
  for (const path of Object.keys(snapshot?.files ?? {})) {
    const content = readFile(ctx, `${HUB_ROOT}/${path}`, true);
    const record = snapshot.lock.files[path];
    if (sha256(canonical(content, record.representation)) !== record.sha256)
      throw new HubImportError(
        'VERIFY',
        'Candidate snapshot bytes could not be verified.',
        3,
        `${HUB_ROOT}/${path}`,
      );
    if (
      ctx.io.supportsMode &&
      ((ctx.io.info(join(ctx.root, HUB_ROOT, ...path.split('/')))?.mode ?? 0) &
        0o777) !==
        (record.gitMode === '100755' ? 0o755 : 0o644)
    )
      throw new HubImportError(
        'VERIFY',
        'Candidate snapshot executable mode could not be verified.',
        3,
        `${HUB_ROOT}/${path}`,
      );
  }
}

function normalizeResult(value) {
  if (value?.result) return { exitCode: value.exitCode, ...value.result };
  return value;
}

/** Apply a reviewed exact commit; never resolve its original tag a second time. */
export async function applyReviewed(review, options = {}) {
  review = validateReviewed(review);
  const ctx = await context(options);
  const state = loadState(ctx);
  if (state.fingerprint !== review.currentStateHash)
    throw new HubImportError(
      'PRECONDITION',
      'Project inputs changed since review. Create a new explicit plan.',
    );
  let candidate = null;
  let intent = null;
  if (review.operation === 'import') {
    const acquired = await acquire(ctx, {
      repository: review.repository,
      commit: review.commit,
      conventions: review.conventions,
      skills: review.skills,
    });
    candidate = acquired.candidate;
    intent = acquired.intent;
  }
  if (
    snapshotHash(candidate) !== review.candidateHash ||
    stateFingerprint(ctx) !== state.fingerprint
  )
    throw new HubImportError(
      'PRECONDITION',
      'Reviewed candidate or local preconditions changed before application.',
    );
  const planned = prospectivePlan(ctx, state, candidate);
  const currentReview = reviewedPlan(state, intent, candidate, planned);
  if (stable(currentReview) !== stable(review))
    throw new HubImportError(
      'PRECONDITION',
      'The proposed effects differ from the reviewed plan.',
    );
  const changes = planned.effects.map(({ path, action }) => ({
    path,
    action,
    status: 'pending',
  }));
  const result = {
    schemaVersion: 1,
    operation: review.operation,
    ok: false,
    commit: review.commit,
    changes,
    diagnostics: [],
  };
  let completed = 0;
  try {
    for (const phase of [planned.sources, planned.managed]) {
      if (!phase.length) continue;
      const applied = normalizeResult(
        await ctx.engine.applyEffects(ctx.io, ctx.root, phase),
      );
      const count =
        applied?.changes?.filter((change) => change.status === 'completed')
          .length ?? (applied?.ok ? phase.length : 0);
      for (let n = 0; n < count; n++)
        changes[completed + n].status = 'completed';
      completed += count;
      if (!applied?.ok) {
        result.diagnostics.push(...(applied?.diagnostics ?? []));
        throw new HubImportError(
          'IO_FAILURE',
          'A candidate effect could not complete.',
          3,
        );
      }
    }
    verifySources(ctx, candidate);
    // Recheck desired document/content/mode materialization before publishing accepted state.
    const remaining = ctx.engine.plan(
      ctx.io,
      ctx.root,
      'sync',
      undefined,
      undefined,
      {
        manifest: planned.manifest,
        hub: candidate ?? null,
        previousHub: candidate ?? undefined,
      },
    );
    if (remaining.length)
      throw new HubImportError(
        'VERIFY',
        'Candidate generated content or executable modes did not converge.',
        3,
      );
    if (planned.publication.length) {
      const published = normalizeResult(
        await ctx.engine.applyEffects(ctx.io, ctx.root, planned.publication),
      );
      const count =
        published?.changes?.filter((change) => change.status === 'completed')
          .length ?? (published?.ok ? planned.publication.length : 0);
      for (let n = 0; n < count; n++)
        changes[completed + n].status = 'completed';
      completed += count;
      if (!published?.ok) {
        result.diagnostics.push(...(published?.diagnostics ?? []));
        throw new HubImportError(
          'IO_FAILURE',
          'Accepted state publication could not complete.',
          3,
        );
      }
    }
    const accepted = loadState(ctx);
    if (
      stable(accepted.manifest.hub ?? null) !==
        stable(planned.manifest.hub ?? null) ||
      snapshotHash(accepted.accepted ?? null) !== review.candidateHash
    )
      throw new HubImportError(
        'VERIFY',
        'Published accepted state does not match the reviewed candidate.',
        3,
      );
    result.ok = true;
    return { exitCode: 0, result };
  } catch (error) {
    result.diagnostics.push({
      code: error.code ?? 'IO_FAILURE',
      message:
        error instanceof HubImportError
          ? error.message
          : 'An operational effect failed.',
      ...(error.path ? { path: error.path } : {}),
    });
    result.diagnostics.push({
      code: 'RETRY_EXACT_INTENT',
      message: `${completed} of ${changes.length} effects completed; no rollback was performed. Keep commit ${review.commit ?? 'none'} and the same selection/operation. Inspect the current project Git state before retry; reconcile ambiguous snapshot/ownership state instead of adopting newly occupied paths or allocating a new revision.`,
    });
    return { exitCode: 3, result };
  }
}

export function parseArguments(argv) {
  const [operation, ...args] = argv;
  if (!['check', 'plan', 'apply', 'detach'].includes(operation))
    throw new HubImportError(
      'USAGE',
      'Use the private check, plan, apply, or detach skill operation.',
    );
  const options = {};
  const known = new Set([
    '--repo-root',
    '--repository',
    '--commit',
    '--tag',
    '--conventions',
    '--skills',
    '--plan-file',
    '--json',
    '--dry-run',
  ]);
  const seen = new Set();
  for (let n = 0; n < args.length; n++) {
    const flag = args[n];
    if (!known.has(flag) || seen.has(flag))
      throw new HubImportError(
        'USAGE',
        'Unknown or repeated private skill option.',
      );
    seen.add(flag);
    if (flag === '--json' || flag === '--dry-run')
      options[flag.slice(2)] = true;
    else {
      const value = args[++n];
      if (value === undefined || value.startsWith('--'))
        throw new HubImportError('USAGE', 'An option value is missing.');
      options[flag.slice(2)] = value;
    }
  }
  const sourceFlags = ['repository', 'commit', 'tag', 'conventions', 'skills'];
  if (
    ['check', 'detach'].includes(operation) &&
    sourceFlags.some((name) => options[name] !== undefined)
  )
    throw new HubImportError(
      'USAGE',
      'Local operations do not accept remote acquisition options.',
    );
  if (operation === 'check' && (options['plan-file'] || options['dry-run']))
    throw new HubImportError('USAGE', 'Check is already local and write-free.');
  if (operation === 'plan' && (options['plan-file'] || options['dry-run']))
    throw new HubImportError(
      'USAGE',
      'Plan is already project-read-only and produces its reviewed intent on stdout.',
    );
  if (operation === 'detach' && options['plan-file'])
    throw new HubImportError(
      'USAGE',
      'Apply a reviewed detach plan using the apply operation.',
    );
  if (
    options['plan-file'] &&
    sourceFlags.some((name) => options[name] !== undefined)
  )
    throw new HubImportError(
      'USAGE',
      'A reviewed plan cannot be combined with a different remote intent.',
    );
  return { operation, options };
}

export async function runCli(argv, dependencies = {}) {
  try {
    const { operation, options } = parseArguments(argv);
    const ctx = {
      ...dependencies,
      repoRoot: options['repo-root'] ?? dependencies.repoRoot,
    };
    let value;
    if (operation === 'check') value = await checkLocal(ctx);
    else if (operation === 'detach') {
      const plan = await planDetach(ctx);
      value = options['dry-run'] ? plan : await applyReviewed(plan, ctx);
    } else if (operation === 'apply' && options['plan-file']) {
      const planText = (
        dependencies.readPlan ?? ((path) => fs.readFileSync(path, 'utf8'))
      )(options['plan-file']);
      let reviewed;
      try {
        reviewed = JSON.parse(planText);
      } catch {
        throw new HubImportError(
          'PLAN',
          'The reviewed plan must contain valid JSON.',
          2,
        );
      }
      if (options['dry-run']) {
        validateReviewed(reviewed);
        const current =
          reviewed.operation === 'detach'
            ? await planDetach(ctx)
            : await planRemote(
                {
                  repository: reviewed.repository,
                  commit: reviewed.commit,
                  conventions: reviewed.conventions,
                  skills: reviewed.skills,
                },
                ctx,
              );
        if (stable(current) !== stable(reviewed))
          throw new HubImportError(
            'PRECONDITION',
            'Reviewed plan differs from the current project or exact candidate.',
          );
        value = current;
      } else value = await applyReviewed(reviewed, ctx);
    } else {
      const intent = request({
        repository: options.repository,
        commit: options.commit,
        tag: options.tag,
        conventions:
          options.conventions === undefined
            ? undefined
            : options.conventions
              ? options.conventions.split(',')
              : [],
        skills:
          options.skills === undefined
            ? undefined
            : options.skills
              ? options.skills.split(',')
              : [],
      });
      const plan = await planRemote(intent, ctx);
      value =
        operation === 'plan' || options['dry-run']
          ? plan
          : await applyReviewed(plan, ctx);
    }
    return value?.result
      ? value
      : { exitCode: operation === 'check' && !value.ok ? 1 : 0, result: value };
  } catch (error) {
    return {
      exitCode: error.exitCode ?? 3,
      result: {
        schemaVersion: 1,
        operation: 'hub-imports',
        ok: false,
        changes: [],
        diagnostics: [
          {
            code: error.code ?? 'OPERATION_FAILED',
            message:
              error instanceof HubImportError ||
              (error.exitCode === 2 && typeof error.code === 'string')
                ? error.message
                : 'Hub operation failed. Inspect local state and the requested intent before retrying.',
          },
        ],
      },
    };
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const output = await runCli(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(output.result, null, 2)}\n`);
  process.exitCode = output.exitCode;
}
