import test from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import {
  createGitCapture,
  parseTree,
} from '../../assets/templates/skills/agentscli-manage-hub-imports/scripts/git.mjs';
const commit = 'b'.repeat(40);
const input = {
  repository: 'git@example.org:team/hub.git',
  tag: 'v1.0.0',
  conventions: [],
  skills: [],
};
function harness(fail = false) {
  const parent = resolve('unit-scratch');
  const scratch = join(parent, 'agentscli-hub-unique');
  const calls = [];
  const cleanup = [];
  const filesystem = {
    realpathSync: (p) => p,
    mkdtempSync: () => scratch,
    mkdirSync: () => {},
    writeFileSync: () => {},
    lstatSync: () => ({ isDirectory: () => true, isSymbolicLink: () => false }),
    rmSync: (...args) => cleanup.push(args),
  };
  const run = (executable, args, options) => {
    calls.push({ executable, args, options });
    const command = args.find((value) =>
      [
        'init',
        'fetch',
        'rev-parse',
        'ls-tree',
        'read-tree',
        'check-attr',
        'cat-file',
      ].includes(value),
    );
    if (fail && command === 'fetch')
      return {
        status: 1,
        stderr: Buffer.from('secret token and remote error'),
      };
    let stdout = '';
    if (command === 'rev-parse') stdout = commit + '\n';
    if (command === 'ls-tree')
      stdout = `100644 blob ${'c'.repeat(40)}\tagentscli-hub.yml\0`;
    if (command === 'check-attr') stdout = 'agentscli-hub.yml\0text\0unset\0';
    if (command === 'cat-file') stdout = 'schemaVersion: 1\nversion: 1.0.0\n';
    return { status: 0, stdout: Buffer.from(stdout) };
  };
  return {
    capture: createGitCapture({
      run,
      filesystem,
      temporaryRoot: parent,
      environment: {
        GIT_DIR: 'danger',
        GIT_CONFIG_PARAMETERS: 'danger',
        GIT_SSH_COMMAND: 'native-auth',
      },
    }),
    calls,
    cleanup,
    scratch,
  };
}
test('native Git acquisition uses argument arrays, committed attributes and no checkout or imported execution', () => {
  const h = harness();
  const captured = h.capture.capture(input);
  assert.equal(captured.commit, commit);
  assert.equal(captured.entries[0].textAttribute, 'unset');
  assert.equal(h.calls.filter((c) => c.args.includes('fetch')).length, 1);
  const fetch = h.calls.find((c) => c.args.includes('fetch'));
  assert.deepEqual(fetch.args.slice(-3), [
    '--',
    input.repository,
    'refs/tags/v1.0.0',
  ]);
  for (const call of h.calls) {
    assert.equal(call.executable, 'git');
    assert.equal(call.options.windowsHide, true);
    assert.equal(call.options.env.GIT_ATTR_NOSYSTEM, '1');
    assert.equal(call.options.env.GIT_DIR, undefined);
    assert.equal(call.options.env.GIT_CONFIG_PARAMETERS, undefined);
    assert.equal(call.options.env.GIT_SSH_COMMAND, 'native-auth');
    assert.ok(call.args.includes('protocol.ext.allow=never'));
    assert.ok(!call.args.includes('checkout'));
  }
  assert.equal(h.cleanup.length, 1);
  assert.equal(h.cleanup[0][0], h.scratch);
});
test('Git failures hide stderr and clean only verified scratch storage', () => {
  const h = harness(true);
  assert.throws(
    () => h.capture.capture(input),
    (error) => !error.message.includes('secret') && error.exitCode === 3,
  );
  assert.equal(h.cleanup.length, 1);
});
test('tree decoding distinguishes invalid UTF-8 from valid replacement characters', () => {
  const header = Buffer.from(`100644 blob ${'c'.repeat(40)}\t`);
  assert.equal(
    parseTree(Buffer.concat([header, Buffer.from([0xff, 0])]))[0].invalidPath,
    true,
  );
  assert.equal(
    parseTree(Buffer.concat([header, Buffer.from('\ufffd\0')]))[0].invalidPath,
    false,
  );
  assert.throws(() => parseTree(Buffer.from('unterminated')));
});
