import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { helpText, parseArguments, runCli } from '../../dist/cli.js';

function engineResult(command, exitCode = 0, changes = []) {
  return {
    exitCode,
    result: {
      schemaVersion: 1,
      command,
      ok: exitCode === 0,
      changes,
      diagnostics: [],
    },
  };
}

test('dispatch forwards root and read-only apply preview', async () => {
  const calls = [];
  const response = await runCli(
    ['--repo-root', 'client', 'apply', '--dry-run', '--json'],
    {
      cwd: resolve('workspace'),
      execute: async (...args) => {
        calls.push(args);
        return engineResult('apply', 0, [
          {
            action: 'update',
            path: 'AGENTS.md',
            status: 'pending',
          },
        ]);
      },
    },
  );
  assert.deepEqual(calls, [
    [
      'apply',
      {
        repoRoot: resolve('workspace/client'),
        dryRun: true,
      },
    ],
  ]);
  assert.equal(response.exitCode, 0);
  assert.equal(response.stderr, '');
  const document = JSON.parse(response.stdout);
  assert.equal(document.changes[0].status, 'pending');
  assert.deepEqual(Object.keys(document), [
    'schemaVersion',
    'command',
    'ok',
    'changes',
    'diagnostics',
  ]);
});

test('unknown, private, misplaced, duplicate, and incompatible options never dispatch', async () => {
  const invalid = [
    [],
    ['unknown'],
    ['validate'],
    ['sync'],
    ['apply', '--unknown'],
    ['apply', '--check'],
    ['apply', '--dry-run=true'],
    ['apply', '--repo-root='],
    ['apply', '--json', '--json'],
    ['apply', 'extra'],
    ['--help', '--check'],
    ['--version', '--help'],
    ['--version', '--json'],
  ];
  for (const args of invalid) {
    let dispatched = false;
    const response = await runCli(args, {
      execute: async () => {
        dispatched = true;
        throw new Error('Unexpected dispatch');
      },
    });
    assert.equal(response.exitCode, 2, args.join(' '));
    assert.equal(dispatched, false, args.join(' '));
    assert.match(response.stderr || response.stdout, /USAGE/);
  }
});

test('help and standalone version use no runtime or project writes', async () => {
  const dependencies = {
    version: '0.1.0',
    execute: async () => {
      throw new Error('Help must not dispatch');
    },
  };
  assert.deepEqual(await runCli(['--version'], dependencies), {
    exitCode: 0,
    stdout: '0.1.0\n',
    stderr: '',
  });
  for (const args of [['--help'], ['apply', '--help']]) {
    const response = await runCli(args, dependencies);
    assert.equal(response.exitCode, 0);
    assert.match(response.stdout, /agentscli 0\.1\.0/);
    assert.match(response.stdout, /agentscli apply/);
    assert.match(response.stdout, /two operational skill trees/);
    assert.match(response.stdout, /repeat the same/);
    assert.equal(response.stderr, '');
  }
  const help = await runCli(['--help', '--json'], dependencies);
  assert.equal(JSON.parse(help.stdout).command, 'help');
  assert.match(JSON.parse(help.stdout).text, /Git state/);
  assert.match(
    helpText('0.1.0'),
    /Author conventions directly in \.agentscli\/conventions\/\*\*\/\*\.md/,
  );
  assert.match(helpText('0.1.0'), /original bytes are\npreserved/);
});

test('JSON preserves drift, validation, and operational exit codes in one document', async () => {
  for (const exitCode of [0, 1, 2, 3]) {
    const expected = engineResult('apply', exitCode, [
      {
        action: 'update',
        path: '.agents/skills/agentscli-build-agents/SKILL.md',
        status: 'pending',
      },
    ]);
    if (exitCode > 1)
      expected.result.diagnostics.push({
        code: 'FAILURE',
        message: 'Blocked.',
      });
    const response = await runCli(['apply', '--json'], {
      execute: async () => expected,
    });
    assert.equal(response.exitCode, exitCode);
    assert.equal(response.stderr, '');
    assert.deepEqual(JSON.parse(response.stdout), expected.result);
    assert.equal(response.stdout.trimEnd().split('\n').length, 1);
  }
});

test('partial failures retain completed and pending effects without claiming success', async () => {
  const failed = engineResult('apply', 3, [
    { action: 'update', path: 'AGENTS.md', status: 'completed' },
    {
      action: 'update',
      path: '.agents/skills/agentscli-build-agents/SKILL.md',
      status: 'pending',
    },
  ]);
  failed.result.diagnostics.push({
    code: 'OPERATION_FAILED',
    message: 'Repeat apply to finish.',
  });
  const response = await runCli(['apply'], { execute: async () => failed });
  assert.equal(response.exitCode, 3);
  assert.match(response.stdout, /completed update: AGENTS\.md/);
  assert.match(response.stdout, /pending update: \.agents\/skills/);
  assert.match(response.stderr, /Repeat apply/);
  assert.doesNotMatch(response.stdout, /Everything is up to date/);
});

test('unexpected boundary exceptions become operational results and usage remains JSON', async () => {
  const response = await runCli(['apply', '--json'], {
    execute: async () => {
      throw new Error('Read failed.');
    },
  });
  assert.equal(response.exitCode, 3);
  assert.equal(response.stderr, '');
  assert.deepEqual(JSON.parse(response.stdout).diagnostics, [
    { code: 'OPERATION_FAILED', message: 'Read failed.' },
  ]);
  const usage = await runCli(['apply', '--unknown', '--json']);
  assert.equal(usage.exitCode, 2);
  assert.equal(JSON.parse(usage.stdout).diagnostics[0].code, 'USAGE');
  assert.equal(usage.stderr, '');
});

test('apply uses the current root and accepts only common flags', () => {
  const root = resolve('client');
  assert.deepEqual(parseArguments(['apply', '--json'], root), {
    action: 'execute',
    command: 'apply',
    json: true,
    options: { repoRoot: root },
  });
});
