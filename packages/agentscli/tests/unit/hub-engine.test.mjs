import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { memory } from './memory.mjs';
import {
  PRODUCT_SKILLS,
  parseManifest,
  stringifyYaml,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/manifest.mjs';
import {
  canonicalContent,
  sha256,
  validateHubSnapshot,
  validContentVersion,
} from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/hub.mjs';
import { execute } from '../../assets/templates/skills/agentscli-build-agents/scripts/lib/runtime.mjs';
const bytes = (text) => new TextEncoder().encode(text);
const main = '# Project\n\n<!-- agentscli:conventions -->\n';
const conv = (title, rule = 'Keep literal rules.') =>
  `---\ntrigger: Read before testing.\n---\n\n# ${title}\n\n${rule}\n`;
function fixture({
  posix = false,
  crlf = false,
  opaque = bytes('raw\r\r\nbytes'),
} = {}) {
  const config = {
    language: 'pt-br',
    hub: {
      repository: 'ssh://git@example.test/team/hub',
      commit: 'a'.repeat(40),
      conventions: ['testing'],
      skills: ['review'],
    },
  };
  const files = {
    'agentscli-hub.yml': bytes('schemaVersion: 1\nversion: 1.4.0\n'),
    'conventions/testing.tpl.md': bytes(conv('Testing')),
    'skills/review/SKILL.md': bytes(
      '---\nname: review\ndescription: Review test changes.\nmetadata:\n  agentscli: agentscli-skill.yml\n---\n\n# Review\n\nCheck changed behavior and report concrete failures.\n',
    ),
    'skills/review/agentscli-skill.yml': bytes('requires: []\n'),
    'skills/review/scripts/run.sh': bytes('#!/bin/sh\necho ok\n'),
    'skills/review/assets/raw.dat': opaque,
  };
  const descriptors = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path,
      {
        representation: path.endsWith('.dat') ? 'bytes' : 'utf8-lf',
        sha256: sha256(content),
        gitMode: path.endsWith('.sh') ? '100755' : '100644',
      },
    ]),
  );
  const lock = {
    schemaVersion: 1,
    ...config.hub,
    hubVersion: '1.4.0',
    files: descriptors,
  };
  const fs = memory({
    '.agentscli/config.yml': stringifyYaml(config),
    '.agentscli/templates/AGENTS.tpl.md': main,
    '.agentscli/templates/conventions/local-rules.tpl.md': conv('Local rules'),
    '.agentscli/hub/lock.yml': stringifyYaml(lock),
    ...Object.fromEntries(
      Object.entries(files).map(([path, content]) => [
        `.agentscli/hub/${path}`,
        crlf && descriptors[path].representation === 'utf8-lf'
          ? bytes(Buffer.from(content).toString().replaceAll('\n', '\r\n'))
          : content,
      ]),
    ),
  });
  fs.io.supportsMode = posix;
  fs.io.chmod = (path, mode) => {
    fs.nodes.get(path).mode = mode;
    fs.writes.push(['chmod', path]);
  };
  return { ...fs, config, lock, files };
}
const invoke = (fs, command = 'sync', options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io });
const success = (response) =>
  assert.equal(response.exitCode, 0, JSON.stringify(response.result));

test('accepted imported skill destinations reject regular files before replacement', async () => {
  const fs = fixture();
  const path = '.agents/skills/review';
  fs.put(path, 'Unrelated file.\n');
  for (const [command, options] of [
    ['validate', {}],
    ['sync', { dryRun: true }],
    ['sync', { check: true }],
    ['sync', {}],
  ]) {
    const response = await invoke(fs, command, options);
    assert.equal(response.exitCode, 2);
    assert.equal(response.result.diagnostics[0].code, 'PATH_TYPE');
    assert.equal(fs.writes.length, 0);
    assert.equal(fs.text(path), 'Unrelated file.\n');
  }
});

test('offline rendering combines local and selected hub rules and preserves accepted source language', async () => {
  const fs = fixture({ crlf: true });
  success(await invoke(fs, 'validate'));
  assert.equal(fs.writes.length, 0);
  success(await invoke(fs));
  const root = fs.text('AGENTS.md');
  assert.match(root, /Local rules/);
  assert.match(root, /Testing/);
  const output = fs.text('.agentscli/conventions/testing.md');
  assert.match(output, /Arquivo gerado/);
  assert.match(output, /Keep literal rules/);
  assert.doesNotMatch(output, /trigger:|^---/mu);
  assert.match(output, /Imported|importado/);
  assert.equal(
    fs.text('.agentscli/hub/conventions/testing.tpl.md').includes('\r\n'),
    true,
  );
  assert.equal(
    fs.text('.agents/skills/review/scripts/run.sh').includes('\r'),
    false,
  );
  assert.deepEqual(
    fs.io.read(join(fs.root, '.agents/skills/review/assets/raw.dat')),
    fs.files['skills/review/assets/raw.dat'],
  );
  success(await invoke(fs, 'sync', { check: true }));
});
test('POSIX mode-only drift repairs privately, preview is write-free, Windows retains executable metadata', async () => {
  const fs = fixture({ posix: true });
  success(await invoke(fs));
  const script = join(fs.root, '.agents/skills/review/scripts/run.sh');
  assert.equal(fs.nodes.get(script).mode & 0o111, 0o111);
  fs.nodes.get(script).mode = 0o644;
  const before = fs.writes.length,
    check = await invoke(fs, 'sync', { check: true });
  assert.equal(check.exitCode, 1);
  assert.equal(fs.writes.length, before);
  assert.ok(
    check.result.changes.some(
      (c) => c.path.endsWith('run.sh') && c.action === 'update',
    ),
  );
  success(await invoke(fs));
  assert.equal(fs.nodes.get(script).mode & 0o111, 0o111);
  fs.io.supportsMode = false;
  fs.nodes.get(script).mode = 0o644;
  success(await invoke(fs, 'sync', { check: true }));
  fs.io.supportsMode = true;
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
});
test('installed edits, extras, missing files and CRLF are drift, while accepted corruption blocks before writes', async () => {
  const fs = fixture();
  success(await invoke(fs));
  fs.put('.agents/skills/review/SKILL.md', 'edited output');
  fs.put('.agents/skills/review/extra.bin', 'extra');
  fs.put('.agents/skills/review/scripts/run.sh', '#!/bin/sh\r\necho ok\r\n');
  fs.put('.agents/skills/review/agentscli-skill.yml', 'damaged managed output');
  fs.put('.agents/skills/review/requires.yml', 'obsolete managed output');
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
  success(await invoke(fs));
  assert.match(fs.text('.agents/skills/review/SKILL.md'), /name: review/);
  assert.equal(
    fs.text('.agents/skills/review/agentscli-skill.yml'),
    'requires: []\n',
  );
  assert.equal(
    fs.io.info(join(fs.root, '.agents/skills/review/requires.yml')),
    undefined,
  );
  assert.equal(
    fs.nodes.has(join(fs.root, '.agents/skills/review/extra.bin')),
    false,
  );
  for (const path of [
    '.agentscli/hub/skills/review/assets/raw.dat',
    '.agentscli/hub/conventions/testing.tpl.md',
    '.agentscli/hub/skills/review/agentscli-skill.yml',
  ]) {
    const original = fs.io.read(join(fs.root, path));
    fs.put(path, bytes('tampered'));
    const before = fs.writes.length;
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, before);
    fs.put(path, original);
  }
  fs.put('.agentscli/hub/unexpected.txt', 'extra');
  assert.equal((await invoke(fs)).exitCode, 2);
});

test('accepted old-format sources fail current checks without conversion or source writes', async () => {
  const fs = fixture();
  const old = {
    'skills/review/SKILL.md': bytes(
      '---\nname: review\ndescription: Review.\nmetadata:\n  requires: requires.yml\n---\n# Review\n',
    ),
    'skills/review/requires.yml': bytes('conventions: []\nskills: []\n'),
  };
  delete fs.lock.files['skills/review/agentscli-skill.yml'];
  delete fs.files['skills/review/agentscli-skill.yml'];
  fs.nodes.delete(
    join(fs.root, '.agentscli/hub/skills/review/agentscli-skill.yml'),
  );
  for (const [path, content] of Object.entries(old)) {
    fs.files[path] = content;
    fs.lock.files[path] = {
      representation: 'utf8-lf',
      sha256: sha256(content),
      gitMode: '100644',
    };
    fs.put(`.agentscli/hub/${path}`, content);
  }
  fs.put('.agentscli/hub/lock.yml', stringifyYaml(fs.lock));
  for (const command of ['validate', 'sync']) {
    const before = fs.writes.length;
    const response = await invoke(fs, command);
    assert.equal(response.exitCode, 2, JSON.stringify(response.result));
    assert.equal(response.result.diagnostics[0].code, 'SKILL_REQUIRES');
    assert.equal(fs.writes.length, before);
    assert.equal(
      fs.text('.agentscli/hub/skills/review/requires.yml'),
      'conventions: []\nskills: []\n',
    );
  }
});
test('recorded representation never reclassifies opaque or invalid text and keeps BOM/final newline', () => {
  const original = bytes('\uFEFFalpha  \r\nbeta');
  const normalized = canonicalContent(original, 'utf8-lf', 'text');
  assert.deepEqual(normalized, bytes('\uFEFFalpha  \nbeta'));
  assert.deepEqual(canonicalContent(normalized, 'utf8-lf', 'text'), normalized);
  for (const data of [bytes('a\r\r\nb'), bytes('a\0b'), new Uint8Array([0xff])])
    assert.throws(() => canonicalContent(data, 'utf8-lf', 'text'));
  const opaque = bytes('looks like text\r\n');
  assert.deepEqual(canonicalContent(opaque, 'bytes', 'opaque'), opaque);
  const fs = fixture();
  assert.throws(
    () =>
      validateHubSnapshot(fs.config, {
        lock: { ...fs.lock, hubVersion: '1.3.0' },
        files: fs.files,
      }),
    /versions disagree/,
  );
  for (const version of ['1.0.0-01', '1.0.0-..', '01.0.0', 'v1.0.0', '1.0'])
    assert.equal(validContentVersion(version), false);
  assert.equal(validContentVersion('1.0.0-alpha.1+build.7'), true);
});
test('candidate output collisions, malformed declarations and wrong-origin deps fail without implicit selection', async () => {
  const fs = fixture();
  fs.put('.agentscli/templates/conventions/testing.tpl.md', conv('Testing'));
  assert.equal((await invoke(fs)).exitCode, 2);
  assert.equal(fs.writes.length, 0);
  const fresh = fixture();
  fresh.put(
    '.agents/skills/local-review/SKILL.md',
    '---\nname: local-review\ndescription: Review locally.\nmetadata:\n  agentscli: agentscli-skill.yml\n---\n# Review\n',
  );
  fresh.put(
    '.agents/skills/local-review/agentscli-skill.yml',
    'requires:\n  - id: review\n    source: local\n',
  );
  assert.equal((await invoke(fresh)).exitCode, 2);
  assert.equal(fresh.writes.length, 0);
});

test('offline imported installation repairs managed directory-file transitions from accepted authority', async () => {
  for (const direction of ['directory-to-file', 'file-to-directory']) {
    const fs = fixture();
    success(await invoke(fs));
    const relative =
        direction === 'directory-to-file'
          ? 'skills/review/support'
          : 'skills/review/support/item.mjs',
      content = bytes('accepted support\n');
    fs.lock.files[relative] = {
      representation: 'utf8-lf',
      sha256: sha256(content),
      gitMode: '100644',
    };
    fs.put(`.agentscli/hub/${relative}`, content);
    fs.put('.agentscli/hub/lock.yml', stringifyYaml(fs.lock));
    const old =
      direction === 'directory-to-file'
        ? '.agents/skills/review/support/item.mjs'
        : '.agents/skills/review/support';
    fs.put(old, 'edited managed support');
    const before = fs.writes.length;
    assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 1);
    assert.equal(fs.writes.length, before);
    success(await invoke(fs));
    assert.equal(fs.text(`.agents/${relative}`), 'accepted support\n');
    success(await invoke(fs, 'sync', { check: true }));
  }
});
test('fixed-layout card conversion preserves accepted hub config, pin and complete snapshot', async () => {
  const fs = fixture();
  fs.put(
    '.agentscli/templates/conventions/local-rules.tpl.md',
    '# Local rules\n<!-- AGENT-CARD START -->\nRead local rules.\n<!-- AGENT-CARD END -->\nKeep local content.\n',
  );
  const protectedFiles = new Map(
    [...fs.nodes]
      .filter(
        ([path, node]) =>
          node.kind === 'file' &&
          (path.includes('/.agentscli/hub/') ||
            path.includes('\\.agentscli\\hub\\') ||
            path.endsWith('config.yml')),
      )
      .map(([path, node]) => [path, node.data.slice()]),
  );
  assert.equal(protectedFiles.size, Object.keys(fs.files).length + 2);
  const resources = {
    templates: {
      en: { 'AGENTS.tpl.md': bytes(main) },
      'pt-br': { 'AGENTS.tpl.md': bytes(main) },
    },
    skills: Object.fromEntries(
      PRODUCT_SKILLS.map((id) => [
        id,
        {
          'SKILL.md': bytes(
            `---\nname: ${id}\ndescription: Own operation.\n---\n# Operation\n`,
          ),
        },
      ]),
    ),
  };
  const result = await execute(
    'apply',
    { repoRoot: fs.root, migrate: true },
    { io: fs.io, resources },
  );
  success(result);
  for (const [path, content] of protectedFiles)
    assert.deepEqual(fs.io.read(path), content);
  assert.match(
    fs.text('.agentscli/templates/conventions/local-rules.tpl.md'),
    /trigger: Read local rules/,
  );
  assert.match(fs.text('AGENTS.md'), /Testing/);
});
