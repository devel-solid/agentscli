import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  parseArgs,
  planApply,
  executeApply,
  runCli,
  guardRole,
  skillNames,
} from '../../src/runtime.js';
import * as contract from '../../assets/templates/skills/agentscli-hub-publish/scripts/support.mjs';
import { memoryFs } from './memory-fs.mjs';

const root = path.resolve('unit-hub-target');
function fixtureAssets() {
  const files = new Map([
    ['agentscli-hub.yml', Buffer.from('schemaVersion: 1\nversion: 1.0.0\n')],
    ['README.md', Buffer.from('Managed README\n')],
    ['AGENTS.md', Buffer.from('# AGENTS.md\n\nAuthor-owned instructions.\n')],
    ['docs/conventions/rules.md', Buffer.from('# Rules\n\nSelf-contained.\n')],
    ['shared/conventions/.gitkeep', Buffer.from('')],
    ['shared/skills/.gitkeep', Buffer.from('')],
    ['.gitignore', Buffer.from('node_modules/\n')],
  ]);
  for (const name of skillNames) {
    files.set(
      `.agents/skills/${name}/SKILL.md`,
      Buffer.from(
        `---\nname: ${name}\ndescription: Own independent work.\n---\n# Work\n\nUse own scripts.\n`,
      ),
    );
    files.set(
      `.agents/skills/${name}/scripts/check.mjs`,
      Buffer.from('export const independent = true;\n'),
    );
  }
  return files;
}
function existingFs(assets = fixtureAssets()) {
  const fs = memoryFs(
    Object.fromEntries(
      [...assets].map(([file, bytes]) => [path.join(root, file), bytes]),
    ),
  );
  fs.addDirectory(path.join(root, '.git'));
  fs.addFile(path.join(root, '.git/index'), 'Preserve native staging');
  fs.mutations.length = 0;
  return fs;
}
test('public parser exposes only apply plus help/version and preview', () => {
  assert.deepEqual(parseArgs(['apply', 'hub', '--dry-run']), {
    command: 'apply',
    directory: 'hub',
    dryRun: true,
  });
  assert.equal(parseArgs(['--help']).command, 'help');
  assert.equal(parseArgs(['--version']).command, 'version');
  for (const args of [
    [],
    ['init', 'hub'],
    ['publish'],
    ['validate'],
    ['apply'],
    ['apply', 'a', 'b'],
    ['apply', 'hub', '--dry-run', '--dry-run'],
    ['apply', 'hub', '--json'],
  ])
    assert.throws(() => parseArgs(args), { code: 'arguments' });
});
test('first apply previews new or empty standalone target without mutation', () => {
  const fs = memoryFs();
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return 'git version';
  };
  const plan = planApply(root, { assets: fixtureAssets(), contract, fs, git });
  assert.equal(plan.existing, false);
  assert.equal(plan.effects[0].kind, 'git-init');
  assert.deepEqual(
    plan.effects
      .filter((effect) => effect.kind === 'mkdir')
      .map(({ path }) => path),
    ['shared/conventions', 'shared/skills'],
  );
  assert.equal(
    plan.effects.some(({ path }) =>
      /^(?:conventions|skills)(?:\/|$)/.test(path),
    ),
    false,
  );
  const result = executeApply(plan, { fs, git, dryRun: true });
  assert.equal(result.ok, true);
  assert.deepEqual(fs.mutations, []);
  assert.deepEqual(calls, [['--version']]);
  fs.addDirectory(root);
  assert.equal(
    planApply(root, { assets: fixtureAssets(), contract, fs, git }).existing,
    false,
  );
});
test('first apply requires native Git before any writes and rejects nonempty unowned targets', () => {
  const fs = memoryFs();
  assert.throws(() =>
    planApply(root, {
      assets: fixtureAssets(),
      contract,
      fs,
      git: () => {
        throw new Error('missing Git');
      },
    }),
  );
  assert.deepEqual(fs.mutations, []);
  fs.addFile(path.join(root, 'unrelated.txt'), 'keep');
  assert.throws(
    () =>
      planApply(root, { assets: fixtureAssets(), contract, fs, git: () => '' }),
    { code: 'role' },
  );
  assert.deepEqual(fs.mutations, []);
});
test('every interrupted first-apply effect resumes from native empty Git plus exact canonical files', () => {
  const assets = fixtureAssets();
  const initial = planApply(root, {
    assets,
    contract,
    fs: memoryFs(),
    git: () => '',
  });
  for (const interrupted of initial.effects) {
    const fs = memoryFs();
    let failed = false;
    const originalMkdir = fs.mkdirSync;
    fs.mkdirSync = (file, options) => {
      if (
        !failed &&
        interrupted.kind === 'mkdir' &&
        path.resolve(file) === path.join(root, interrupted.path)
      ) {
        failed = true;
        throw new Error('Injected directory failure');
      }
      return originalMkdir(file, options);
    };
    fs.failWrite = (file) => {
      if (
        !failed &&
        ['create', 'update'].includes(interrupted.kind) &&
        path.dirname(file) ===
          path.dirname(path.join(root, interrupted.path)) &&
        path
          .basename(file)
          .startsWith(`.${path.basename(interrupted.path)}.agentscli-`)
      ) {
        failed = true;
        return true;
      }
      return false;
    };
    const git = (args) => {
      if (args[0] === 'init') {
        if (!failed && interrupted.kind === 'git-init') {
          failed = true;
          throw new Error('Injected Git initialization failure');
        }
        fs.addDirectory(path.join(root, '.git'));
      }
      return args[0] === 'rev-parse' ? null : '';
    };
    const first = executeApply(planApply(root, { assets, contract, fs, git }), {
      fs,
      git,
    });
    assert.equal(first.ok, false, interrupted.path);
    assert.ok(first.pending.length, interrupted.path);
    const second = executeApply(
      planApply(root, { assets, contract, fs, git }),
      { fs, git },
    );
    assert.equal(second.ok, true, interrupted.path);
    assert.equal(
      fs.lstatSync(path.join(root, 'shared/conventions')).isDirectory(),
      true,
    );
    assert.equal(
      fs.lstatSync(path.join(root, 'shared/skills')).isDirectory(),
      true,
    );
    assert.equal(
      planApply(root, { assets, contract, fs, git }).effects.length,
      0,
    );
  }
});
test('ambiguous interrupted bootstraps require reconciliation instead of adopting content', () => {
  const fs = memoryFs();
  fs.addDirectory(path.join(root, '.git'));
  fs.addFile(path.join(root, 'README.md'), 'Authored unrelated text');
  assert.throws(
    () =>
      planApply(root, { assets: fixtureAssets(), contract, fs, git: () => '' }),
    { code: 'reconcile' },
  );
  fs.addFile(path.join(root, 'README.md'), fixtureAssets().get('README.md'));
  assert.throws(
    () =>
      planApply(root, {
        assets: fixtureAssets(),
        contract,
        fs,
        git: (args) => (args[0] === 'rev-parse' ? 'existing-commit' : ''),
      }),
    { code: 'reconcile' },
  );
  assert.deepEqual(fs.mutations, []);
});
test('partial filesystem writes never truncate initial or existing destinations and same apply resumes', () => {
  for (const existing of [false, true]) {
    const assets = fixtureAssets(),
      fs = existing ? existingFs(assets) : memoryFs();
    if (existing)
      fs.addFile(path.join(root, 'README.md'), 'Earlier managed README');
    const write = fs.writeFileSync;
    let failed = false;
    fs.writeFileSync = (file, bytes, options) => {
      if (!failed && path.basename(file).startsWith('.README.md.agentscli-')) {
        failed = true;
        write(file, bytes.subarray(0, 3), options);
        throw new Error('Injected partial disk write');
      }
      return write(file, bytes, options);
    };
    const git = (args) => {
      if (args[0] === 'init') fs.addDirectory(path.join(root, '.git'));
      return args[0] === 'rev-parse' ? null : '';
    };
    const first = executeApply(planApply(root, { assets, contract, fs, git }), {
      fs,
      git,
    });
    assert.equal(first.ok, false);
    if (existing)
      assert.equal(
        fs.readFileSync(path.join(root, 'README.md'), 'utf8'),
        'Earlier managed README',
      );
    else assert.equal(fs.existsSync(path.join(root, 'README.md')), false);
    assert.equal(
      [...fs.entries.keys()].some((file) => file.endsWith('.tmp')),
      false,
    );
    assert.equal(
      executeApply(planApply(root, { assets, contract, fs, git }), { fs, git })
        .ok,
      true,
    );
    assert.equal(
      fs.readFileSync(path.join(root, 'README.md'), 'utf8'),
      'Managed README\n',
    );
  }
});
test('repeat apply replaces edited managed files/extras and preserves authored deletions/state', () => {
  const assets = fixtureAssets(),
    fs = existingFs(assets);
  const managed = `.agents/skills/${skillNames[0]}`;
  fs.addFile(
    path.join(root, managed, 'SKILL.md'),
    'damaged disposable entrypoint',
  );
  fs.addFile(path.join(root, managed, 'obsolete/deep.mjs'), 'stale');
  fs.addFile(path.join(root, 'README.md'), 'edited managed README');
  fs.entries.delete(path.join(root, 'docs/conventions/rules.md'));
  fs.entries.delete(path.join(root, 'shared/conventions/.gitkeep'));
  fs.addFile(
    path.join(root, 'agentscli-hub.yml'),
    'schemaVersion: 1\nversion: 3.2.1\n',
  );
  fs.addFile(
    path.join(root, 'AGENTS.md'),
    '# AGENTS.md\n\nAuthored custom instructions.\n',
  );
  fs.addFile(path.join(root, '.gitignore'), 'custom policy\n');
  fs.addFile(path.join(root, '.agents/skills/unrelated/SKILL.md'), 'unrelated');
  const git = () => {
    throw new Error('Repeat apply cannot touch Git');
  };
  const plan = planApply(root, { assets, contract, fs, git });
  assert.ok(
    plan.effects.some(
      (effect) =>
        effect.kind === 'remove' && effect.path.endsWith('obsolete/deep.mjs'),
    ),
  );
  assert.equal(
    plan.effects.some((effect) => effect.path === 'docs/conventions/rules.md'),
    false,
  );
  const result = executeApply(plan, { fs, git });
  assert.equal(result.ok, true);
  assert.equal(
    fs.readFileSync(path.join(root, 'agentscli-hub.yml'), 'utf8'),
    'schemaVersion: 1\nversion: 3.2.1\n',
  );
  assert.equal(
    fs.readFileSync(path.join(root, '.git/index'), 'utf8'),
    'Preserve native staging',
  );
  assert.equal(
    fs.readFileSync(path.join(root, '.gitignore'), 'utf8'),
    'custom policy\n',
  );
  assert.match(
    fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'),
    /Authored custom/,
  );
  assert.equal(
    fs.existsSync(path.join(root, 'shared/conventions/.gitkeep')),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(root, '.agents/skills/unrelated/SKILL.md')),
    true,
  );
  assert.equal(
    planApply(root, { assets, contract, fs, git }).effects.length,
    0,
  );
});
test('all affected unsafe paths and invalid authored sources block before mutation', () => {
  const assets = fixtureAssets();
  for (const type of ['link', 'hardlink']) {
    const fs = existingFs(assets);
    const entry = fs.entries.get(
      path.join(root, `.agents/skills/${skillNames[0]}/SKILL.md`),
    );
    if (type === 'link') entry.type = 'link';
    else entry.nlink = 2;
    assert.throws(
      () => planApply(root, { assets, contract, fs, git: () => '' }),
      { code: 'unsafe-path' },
    );
    assert.deepEqual(fs.mutations, []);
  }
  const fs = existingFs(assets);
  fs.addFile(
    path.join(root, 'shared/conventions/bad.tpl.md'),
    '---\ntrigger: Run\nrequires: []\n---\n# Bad\n',
  );
  assert.throws(
    () => planApply(root, { assets, contract, fs, git: () => '' }),
    { code: 'convention-requires' },
  );
  assert.deepEqual(fs.mutations, []);
});
test('repeat apply preserves unrelated root content and removed authored shared directories', () => {
  const assets = fixtureAssets(),
    fs = existingFs(assets);
  for (const file of [...fs.entries.keys()])
    if (
      file === path.join(root, 'shared') ||
      file.startsWith(`${path.join(root, 'shared')}${path.sep}`)
    )
      fs.entries.delete(file);
  for (const file of [
    'conventions/.gitkeep',
    'conventions/unrelated.tpl.md',
    'skills/.gitkeep',
    'skills/unrelated/SKILL.md',
    'other/notes.txt',
  ])
    fs.addFile(path.join(root, file), 'Unrelated authored bytes');
  fs.addFile(path.join(root, 'README.md'), 'Earlier managed README');
  const before = new Map(
    [...fs.entries].filter(([file]) => !file.endsWith('README.md')),
  );
  const plan = planApply(root, { assets, contract, fs, git: () => '' });
  assert.deepEqual(
    plan.effects.map(({ path }) => path),
    ['README.md'],
  );
  assert.deepEqual(fs.mutations, []);
  assert.equal(executeApply(plan, { fs }).ok, true);
  assert.equal(fs.existsSync(path.join(root, 'shared')), false);
  for (const [file, entry] of before)
    assert.deepEqual(fs.entries.get(file), entry);
});
test('shared parents and descendants reject unsafe paths and portable aliases before writes', () => {
  const assets = fixtureAssets();
  const cases = [
    { file: 'shared', type: 'file' },
    { file: 'shared', type: 'link' },
    { file: 'shared/conventions', type: 'file' },
    { file: 'shared/skills', type: 'link' },
    { file: 'shared/skills/review/payload.dat', type: 'hardlink' },
    { file: 'shared/skills/review/escape', type: 'link' },
    { file: 'shared/skills/review/bad:name.dat', type: 'file' },
    {
      file: 'shared/skills/review/SUPPORT.dat',
      alias: 'shared/skills/review/support.dat',
    },
    { file: 'Shared', type: 'directory', alias: 'shared', parentAlias: true },
    {
      file: 'shared/Conventions',
      type: 'directory',
      alias: 'shared/conventions',
      parentAlias: true,
    },
  ];
  for (const item of cases) {
    const fs = existingFs(assets);
    if (item.parentAlias) {
      for (const file of [...fs.entries.keys()])
        if (
          file === path.join(root, item.alias) ||
          file.startsWith(`${path.join(root, item.alias)}${path.sep}`)
        )
          fs.entries.delete(file);
    }
    const absolute = path.join(root, item.file);
    if (item.type === 'directory') fs.addDirectory(absolute);
    else {
      fs.addFile(absolute, 'Unsafe input');
      const entry = fs.entries.get(absolute);
      if (item.type === 'link') entry.type = 'link';
      if (item.type === 'hardlink') entry.nlink = 2;
    }
    if (item.alias && !item.parentAlias)
      fs.addFile(path.join(root, item.alias), 'Alias');
    assert.throws(
      () => planApply(root, { assets, contract, fs, git: () => '' }),
      (error) => ['unsafe-path', 'collision'].includes(error.code),
      item.file,
    );
    assert.deepEqual(fs.mutations, [], item.file);
  }
});
test('portable directory aliases cannot turn replacement and removal into one physical target', () => {
  const assets = fixtureAssets(),
    fs = existingFs(assets);
  fs.addFile(
    path.join(root, `.agents/skills/${skillNames[0]}/Scripts/unrelated.mjs`),
    'alias',
  );
  assert.throws(
    () => planApply(root, { assets, contract, fs, git: () => '' }),
    { code: 'collision' },
  );
  assert.deepEqual(fs.mutations, []);
});
test('managed support files can become directories and directories become files with bounded deletion', () => {
  for (const direction of ['file-to-directory', 'directory-to-file']) {
    const initial = fixtureAssets(),
      changed = fixtureAssets();
    const prefix = `.agents/skills/${skillNames[0]}`;
    if (direction === 'file-to-directory') {
      initial.set(`${prefix}/support`, Buffer.from('old file'));
      changed.set(`${prefix}/support/item.mjs`, Buffer.from('new child'));
    } else {
      initial.set(`${prefix}/support/item.mjs`, Buffer.from('old child'));
      changed.set(`${prefix}/support`, Buffer.from('new file'));
    }
    const fs = existingFs(initial);
    fs.addFile(
      path.join(root, '.agents/skills/unrelated/keep.txt'),
      'preserved',
    );
    const plan = planApply(root, {
      assets: changed,
      contract,
      fs,
      git: () => '',
    });
    assert.ok(plan.effects.some((effect) => effect.kind === 'remove'));
    if (direction === 'directory-to-file')
      assert.ok(plan.effects.some((effect) => effect.kind === 'rmdir'));
    const preview = executeApply(plan, { fs, dryRun: true });
    assert.equal(preview.ok, true);
    assert.deepEqual(fs.mutations, []);
    assert.equal(executeApply(plan, { fs }).ok, true);
    const target =
      direction === 'file-to-directory'
        ? `${prefix}/support/item.mjs`
        : `${prefix}/support`;
    assert.match(fs.readFileSync(path.join(root, target), 'utf8'), /^new/);
    assert.equal(
      fs.readFileSync(
        path.join(root, '.agents/skills/unrelated/keep.txt'),
        'utf8',
      ),
      'preserved',
    );
    assert.equal(
      planApply(root, { assets: changed, contract, fs, git: () => '' }).effects
        .length,
      0,
    );
  }
});
test('partial writes report completed/pending and repeat converges without journal', () => {
  const assets = fixtureAssets(),
    fs = existingFs(assets);
  fs.addFile(path.join(root, 'README.md'), 'old');
  fs.addFile(
    path.join(root, `.agents/skills/${skillNames[0]}/scripts/check.mjs`),
    'old',
  );
  const plan = planApply(root, { assets, contract, fs, git: () => '' });
  let writes = 0;
  fs.failWrite = () => ++writes === 2;
  const result = executeApply(plan, { fs, git: () => '' });
  assert.equal(result.ok, false);
  assert.equal(result.completed.length, 1);
  assert.equal(result.pending.length, 1);
  fs.failWrite = undefined;
  assert.equal(
    executeApply(planApply(root, { assets, contract, fs, git: () => '' }), {
      fs,
    }).ok,
    true,
  );
  assert.equal(
    planApply(root, { assets, contract, fs, git: () => '' }).effects.length,
    0,
  );
});
test('source role guard verifies identities rather than arbitrary private workspaces', () => {
  const fs = memoryFs({
    [path.join(root, 'package.json')]: JSON.stringify({
      private: true,
      workspaces: ['one', 'two'],
    }),
  });
  assert.doesNotThrow(() => guardRole(path.join(root, 'child'), fs));
  fs.addFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: '@devel-solid/agentscli-hub',
      bin: { 'agentscli-hub': 'dist/cli.js' },
    }),
  );
  assert.throws(() => guardRole(path.join(root, 'child'), fs), {
    code: 'role',
  });
  fs.addFile(path.join(root, 'package.json'), '{}');
  fs.addFile(path.join(root, '.agentscli/config.yml'), 'language: en');
  assert.throws(() => guardRole(path.join(root, 'child'), fs), {
    code: 'role',
  });
});
test('CLI reports invalid input as 2 and partial operational failure as 3', async () => {
  const lines = [];
  const output = {
    log: (value) => lines.push(value),
    error: (value) => lines.push(value),
  };
  assert.equal(
    await runCli(['init', root], { ...output, version: '0.1.0' }),
    2,
  );
  const assets = fixtureAssets(),
    fs = existingFs(assets);
  fs.addFile(path.join(root, 'README.md'), 'old');
  fs.failWrite = () => true;
  assert.equal(
    await runCli(['apply', root], {
      ...output,
      assets,
      contract,
      fs,
      git: () => '',
    }),
    3,
  );
  assert.match(lines.at(-1), /pending/);
});
