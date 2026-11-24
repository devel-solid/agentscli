import * as nodeFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export const skillNames = Object.freeze([
  'agentscli-hub-write-conventions',
  'agentscli-hub-edit-agents',
  'agentscli-hub-write-shared-conventions',
  'agentscli-hub-write-shared-skills',
  'agentscli-hub-publish',
]);
export class ApplyError extends Error {
  constructor(code, message, file = '') {
    super(message);
    this.code = code;
    this.file = file;
  }
}
function reject(code, message, file) {
  throw new ApplyError(code, message, file);
}
function maybeStat(file, fs) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}
export function parseArgs(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0]))
    return { command: 'help' };
  if (args.length === 1 && ['--version', '-v'].includes(args[0]))
    return { command: 'version' };
  if (args[0] !== 'apply')
    reject('arguments', 'Use agentscli-hub apply <directory> [--dry-run].');
  let directory;
  let dryRun = false;
  for (const value of args.slice(1)) {
    if (value === '--dry-run' && !dryRun) dryRun = true;
    else if (value.startsWith('-') || directory)
      reject('arguments', 'Unsupported or repeated argument.');
    else directory = value;
  }
  if (!directory) reject('arguments', 'apply requires one target directory.');
  return { command: 'apply', directory, dryRun };
}
export function nativeGit(args, { cwd, allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
  });
  if (result.error || result.status !== 0) {
    if (allowFailure) return null;
    throw new ApplyError(
      'git',
      'Native Git is unavailable or the Git operation failed.',
    );
  }
  return result.stdout.trim();
}
function interruptedBootstrap(root, assets, fs, git) {
  const metadata = maybeStat(path.join(root, '.git'), fs);
  if (!metadata || !metadata.isDirectory() || metadata.isSymbolicLink())
    return false;
  const allowedDirectories = new Set([
    'shared',
    'shared/conventions',
    'shared/skills',
  ]);
  for (const file of assets.keys()) {
    const parts = file.split('/');
    for (let index = 1; index < parts.length; index++)
      allowedDirectories.add(parts.slice(0, index).join('/'));
  }
  const scan = (absolute, relative) => {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1))
      reject(
        'unsafe-path',
        'An interrupted bootstrap contains an unsafe path.',
        relative,
      );
    if (stat.isDirectory()) {
      if (!allowedDirectories.has(relative))
        reject(
          'reconcile',
          'Unidentified nonempty target contains unrelated directories. Reconcile before applying.',
          relative,
        );
      for (const name of fs.readdirSync(absolute))
        scan(path.join(absolute, name), `${relative}/${name}`);
    } else if (
      !stat.isFile() ||
      !assets.has(relative) ||
      !Buffer.from(fs.readFileSync(absolute)).equals(assets.get(relative))
    )
      reject(
        'reconcile',
        'Unidentified target contains authored, changed, or unrelated content. Reconcile before applying.',
        relative,
      );
  };
  for (const name of fs.readdirSync(root))
    if (name !== '.git') scan(path.join(root, name), name);
  if (
    git(['rev-parse', '--verify', 'HEAD'], { cwd: root, allowFailure: true }) ||
    git(['for-each-ref', '--format=%(refname)'], { cwd: root }) ||
    git(['diff', '--cached', '--name-only', '-z'], { cwd: root }) ||
    git(['remote'], { cwd: root })
  )
    reject(
      'reconcile',
      'The unidentified Git repository has history, refs, staging, or remotes. Reconcile it explicitly before applying.',
      root,
    );
  return true;
}
function readPackage(root, fs) {
  const file = path.join(root, 'package.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
function isTool(metadata) {
  return (
    (metadata?.name === '@devel-solid/agentscli' &&
      typeof metadata.bin?.agentscli === 'string') ||
    (metadata?.name === '@devel-solid/agentscli-hub' &&
      typeof metadata.bin?.['agentscli-hub'] === 'string')
  );
}
export function guardRole(root, fs = nodeFs) {
  let current = root;
  while (true) {
    const stat = maybeStat(current, fs);
    if (stat) {
      if (!stat.isDirectory() || stat.isSymbolicLink())
        reject(
          'unsafe-path',
          'Target ancestors must be real directories.',
          current,
        );
      if (isTool(readPackage(current, fs)))
        reject(
          'role',
          'Tool package sources and installations cannot be hub targets.',
          current,
        );
      const metadata = readPackage(current, fs);
      if (
        metadata?.private === true &&
        Array.isArray(metadata.workspaces) &&
        ['packages/agentscli', 'packages/agentscli-hub'].every((item) =>
          metadata.workspaces.includes(item),
        ) &&
        ['agentscli', 'agentscli-hub'].every((item) =>
          isTool(readPackage(path.join(current, 'packages', item), fs)),
        )
      )
        reject(
          'role',
          'The verified tool monorepo cannot be a hub target.',
          current,
        );
      if (
        fs.existsSync(path.join(current, '.agentscli/config.yml')) ||
        fs.existsSync(path.join(current, 'agentscli-compose.yml'))
      )
        reject(
          'role',
          'Consumer projects cannot contain a hub target.',
          current,
        );
      if (
        current !== root &&
        fs.existsSync(path.join(current, 'agentscli-hub.yml'))
      )
        reject(
          'role',
          'An existing hub cannot contain another hub target.',
          current,
        );
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}
function assertRegular(file, fs) {
  const stat = maybeStat(file, fs);
  if (!stat) return;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1)
    reject(
      'unsafe-path',
      'Affected files must be independent regular files.',
      file,
    );
}
function assertParents(file, root, fs) {
  let current = path.dirname(file);
  while (true) {
    const stat = maybeStat(current, fs);
    if (stat) {
      if (!stat.isDirectory() || stat.isSymbolicLink())
        reject(
          'unsafe-path',
          'Affected parent is not an independent directory.',
          current,
        );
    }
    if (current === root) break;
    const parent = path.dirname(current);
    if (parent === current || !current.startsWith(`${root}${path.sep}`))
      reject('unsafe-path', 'Effect escaped its target.', current);
    const parentStat = maybeStat(parent, fs);
    if (parentStat?.isDirectory() && !parentStat.isSymbolicLink()) {
      const name = path.basename(current);
      const key = name.normalize('NFC').toLowerCase();
      if (
        fs
          .readdirSync(parent)
          .some(
            (entry) =>
              entry !== name && entry.normalize('NFC').toLowerCase() === key,
          )
      )
        reject(
          'collision',
          'An affected directory has a portable alias.',
          current,
        );
    }
    current = parent;
  }
}
export async function loadAssets(
  root = path.resolve(fileURLToPath(new URL('..', import.meta.url))),
  fs = nodeFs,
) {
  const directory = path.join(root, 'dist/assets');
  const helper = path.join(
    directory,
    '.agents/skills/agentscli-hub-publish/scripts/support.mjs',
  );
  if (!fs.existsSync(helper))
    reject(
      'assets',
      'Prepared hub assets are missing. Reinstall or build this package.',
    );
  const contract = await import(pathToFileURL(helper).href);
  const files = contract.safeWalk(directory, fs, { allowMissing: false });
  if (files.has('gitignore.tpl')) {
    files.set('.gitignore', files.get('gitignore.tpl'));
    files.delete('gitignore.tpl');
  }
  const metadata = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  for (const name of skillNames) {
    const file = `.agents/skills/${name}/SKILL.md`;
    if (!files.has(file))
      reject('assets', 'An operational skill is missing.', file);
    const data = contract.parseSkill(
      contract.textFile(files.get(file), file),
      file,
      name,
    ).data;
    if (
      data.license !== 'MIT' ||
      data.compatibility !== 'Requires Node.js >= 22.' ||
      data.metadata?.generatedBy !== metadata.name ||
      data.metadata?.generatorVersion !== metadata.version
    )
      reject(
        'assets',
        'A prepared skill has invalid or stale generator metadata.',
        file,
      );
  }
  contract.validateHubFiles(files);
  return { files, contract };
}
export function planApply(
  directory,
  { assets, contract, fs = nodeFs, git = nativeGit, cwd = process.cwd() } = {},
) {
  if (!assets || !contract)
    reject('assets', 'Authoritative prepared package assets are required.');
  for (const name of skillNames)
    if (!assets.has(`.agents/skills/${name}/SKILL.md`))
      reject(
        'assets',
        'The prepared hub must contain all five independent operational skills.',
      );
  contract.validateHubFiles(assets);
  const root = path.resolve(cwd, directory);
  guardRole(root, fs);
  const exists = !!maybeStat(root, fs);
  const names = exists ? fs.readdirSync(root) : [];
  const manifestPath = path.join(root, 'agentscli-hub.yml');
  const existing = !!maybeStat(manifestPath, fs);
  const resumed =
    !existing && names.length
      ? interruptedBootstrap(root, assets, fs, git)
      : false;
  if (!existing && names.length && !resumed)
    reject(
      'role',
      'First apply requires a new or empty target directory, or a provable interrupted bootstrap.',
      root,
    );
  if (existing) {
    assertRegular(manifestPath, fs);
    contract.parseManifest(fs.readFileSync(manifestPath, 'utf8'));
    if (!fs.existsSync(path.join(root, '.git')))
      reject(
        'git',
        'An existing hub must retain its native Git metadata.',
        root,
      );
  } else git(['--version'], { cwd });
  const current = new Map();
  for (const prefix of [
    'docs/conventions',
    'shared/conventions',
    'shared/skills',
    ...skillNames.map((name) => `.agents/skills/${name}`),
  ]) {
    assertParents(path.join(root, prefix, '__preflight__'), root, fs);
    for (const [relative, bytes] of contract.safeWalk(
      path.join(root, prefix),
      fs,
    ))
      current.set(`${prefix}/${relative}`, bytes);
  }
  for (const file of [
    'agentscli-hub.yml',
    'AGENTS.md',
    'README.md',
    '.gitattributes',
    '.gitignore',
  ]) {
    const absolute = path.join(root, file);
    assertRegular(absolute, fs);
    if (fs.existsSync(absolute)) current.set(file, fs.readFileSync(absolute));
  }
  const portable = new Map();
  for (const file of [...current.keys(), ...assets.keys()]) {
    const parts = file.split('/');
    for (let index = 1; index <= parts.length; index++) {
      const prefix = parts.slice(0, index).join('/'),
        key = prefix.toLowerCase();
      if (portable.has(key) && portable.get(key) !== prefix)
        reject(
          'collision',
          'Existing and desired managed paths have a portable alias.',
          file,
        );
      portable.set(key, prefix);
    }
  }
  const desired = new Map(current);
  const managed = (file) =>
    file === 'README.md' ||
    skillNames.some((name) => file.startsWith(`.agents/skills/${name}/`));
  for (const file of desired.keys()) if (managed(file)) desired.delete(file);
  for (const [file, bytes] of assets)
    if (!existing || managed(file)) desired.set(file, Buffer.from(bytes));
  // Only desired canonical operational declarations are authoritative. Edited
  // managed installations are disposable, including their requirement copies.
  contract.validateHubFiles(desired, { projected: true });
  const effects = [];
  if (!existing && !resumed) effects.push({ kind: 'git-init', path: '.git' });
  if (!existing)
    for (const directory of ['shared/conventions', 'shared/skills'])
      if (!maybeStat(path.join(root, directory), fs))
        effects.push({ kind: 'mkdir', path: directory });
  const removed = new Set();
  for (const file of current.keys())
    if (managed(file) && !desired.has(file)) {
      removed.add(file);
      effects.push({ kind: 'remove', path: file, previous: current.get(file) });
    }
  const requiredDirectories = new Set();
  for (const file of desired.keys())
    if (managed(file)) {
      const parts = file.split('/');
      for (let index = 1; index < parts.length; index++)
        requiredDirectories.add(parts.slice(0, index).join('/'));
    }
  const managedDirectories = [];
  const directories = (absolute, relative) => {
    const stat = maybeStat(absolute, fs);
    if (!stat || !stat.isDirectory()) return;
    for (const name of fs.readdirSync(absolute))
      if (maybeStat(path.join(absolute, name), fs)?.isDirectory())
        directories(path.join(absolute, name), `${relative}/${name}`);
    managedDirectories.push(relative);
  };
  for (const name of skillNames)
    directories(
      path.join(root, '.agents/skills', name),
      `.agents/skills/${name}`,
    );
  for (const directory of managedDirectories)
    if (!requiredDirectories.has(directory)) {
      removed.add(directory);
      effects.push({ kind: 'rmdir', path: directory });
    }
  for (const [file, bytes] of desired) {
    if (existing && !managed(file)) continue;
    const before = current.get(file);
    if (!before || !Buffer.from(before).equals(bytes))
      effects.push({
        kind: before ? 'update' : 'create',
        path: file,
        bytes,
        previous: before,
      });
  }
  if (!existing)
    effects.sort(
      (left, right) =>
        Number(left.path === 'agentscli-hub.yml') -
        Number(right.path === 'agentscli-hub.yml'),
    );
  const projected = {
    ...fs,
    lstatSync(absolute) {
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (removed.has(relative)) {
        const error = new Error('Planned removal');
        error.code = 'ENOENT';
        throw error;
      }
      return fs.lstatSync(absolute);
    },
  };
  for (const effect of effects) {
    if (effect.kind === 'git-init') continue;
    if (!contract.portablePath(effect.path))
      reject('unsafe-path', 'Effect is not portable.', effect.path);
    const absolute = path.resolve(root, effect.path);
    if (!absolute.startsWith(`${root}${path.sep}`))
      reject('unsafe-path', 'Effect escaped the target.', effect.path);
    const view = ['remove', 'rmdir'].includes(effect.kind) ? fs : projected;
    assertParents(absolute, root, view);
    if (!['mkdir', 'rmdir'].includes(effect.kind))
      assertRegular(absolute, view);
  }
  return { command: 'apply', root, existing, resumed, effects };
}
function replaceWholeFile(fs, root, effect) {
  const absolute = path.resolve(root, effect.path);
  assertParents(absolute, root, fs);
  assertRegular(absolute, fs);
  const before = maybeStat(absolute, fs)
    ? fs.readFileSync(absolute)
    : undefined;
  if (
    !!before !== !!effect.previous ||
    (before && !Buffer.from(before).equals(effect.previous))
  )
    reject(
      'destination-changed',
      'Destination changed after preflight. Repeat apply to recompute its plan.',
      effect.path,
    );
  if (effect.kind === 'remove') {
    fs.unlinkSync(absolute);
    return;
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = path.join(
    path.dirname(absolute),
    `.${path.basename(absolute)}.agentscli-${randomUUID()}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, effect.bytes, { flag: 'wx' });
    assertParents(absolute, root, fs);
    assertRegular(absolute, fs);
    const current = maybeStat(absolute, fs)
      ? fs.readFileSync(absolute)
      : undefined;
    if (
      !!current !== !!before ||
      (current && !Buffer.from(current).equals(before))
    )
      reject(
        'destination-changed',
        'Destination changed during whole-file preparation. Repeat apply.',
        effect.path,
      );
    fs.renameSync(temporary, absolute);
  } finally {
    if (maybeStat(temporary, fs)) fs.unlinkSync(temporary);
  }
}
export function executeApply(
  plan,
  { fs = nodeFs, git = nativeGit, dryRun = false } = {},
) {
  const completed = [];
  const publicEffect = ({ kind, path: file }) => ({ kind, path: file });
  if (dryRun)
    return {
      ok: true,
      dryRun: true,
      root: plan.root,
      changes: plan.effects.map(publicEffect),
      completed: [],
      pending: [],
    };
  try {
    for (const effect of plan.effects) {
      fs.mkdirSync(plan.root, { recursive: true });
      if (effect.kind === 'git-init')
        git(['init', '--', plan.root], { cwd: path.dirname(plan.root) });
      else if (effect.kind === 'mkdir') {
        const absolute = path.join(plan.root, effect.path);
        const stat = maybeStat(absolute, fs);
        assertParents(absolute, plan.root, fs);
        if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
          reject(
            'unsafe-path',
            'Directory destination changed after preflight.',
            effect.path,
          );
        fs.mkdirSync(absolute, { recursive: true });
      } else if (effect.kind === 'rmdir') {
        const absolute = path.resolve(plan.root, effect.path);
        assertParents(absolute, plan.root, fs);
        const stat = maybeStat(absolute, fs);
        if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
          reject(
            'unsafe-path',
            'Managed directory changed after preflight.',
            effect.path,
          );
        if (stat) fs.rmdirSync(absolute);
      } else replaceWholeFile(fs, plan.root, effect);
      completed.push(publicEffect(effect));
    }
    return {
      ok: true,
      dryRun: false,
      root: plan.root,
      changes: completed,
      completed,
      pending: [],
    };
  } catch {
    return {
      ok: false,
      dryRun: false,
      root: plan.root,
      changes: plan.effects.map(publicEffect),
      completed,
      pending: plan.effects.slice(completed.length).map(publicEffect),
      diagnostics: [
        {
          code: 'operation',
          message:
            'Apply stopped after partial effects. Retry the same apply command to recompute remaining work.',
        },
      ],
    };
  }
}
export async function runCli(
  args,
  {
    version,
    log = console.log,
    error = console.error,
    fs = nodeFs,
    git = nativeGit,
    assets,
    contract,
    cwd = process.cwd(),
  } = {},
) {
  try {
    const parsed = parseArgs(args);
    if (parsed.command === 'help') {
      log(
        'Usage: agentscli-hub apply <directory> [--dry-run]\n\nCreate or refresh a standalone resource hub.\nOptions: --help, --version',
      );
      return 0;
    }
    if (parsed.command === 'version') {
      log(version);
      return 0;
    }
    if (!assets)
      ({ files: assets, contract } = await loadAssets(undefined, fs));
    const plan = planApply(parsed.directory, {
      assets,
      contract,
      fs,
      git,
      cwd,
    });
    const result = executeApply(plan, { fs, git, dryRun: parsed.dryRun });
    log(JSON.stringify(result));
    return result.ok ? 0 : 3;
  } catch (cause) {
    error(
      JSON.stringify({
        ok: false,
        diagnostics: [
          {
            code: cause.code ?? 'operation',
            file: cause.file ?? '',
            message: cause.code
              ? cause.message
              : 'Hub application failed before completion.',
          },
        ],
      }),
    );
    return cause.code ? 2 : 3;
  }
}
