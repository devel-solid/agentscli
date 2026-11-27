import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout } from 'node:timers/promises';

export function canVerifyPublication(status, output) {
  return (
    status === 0 ||
    (Number.isInteger(status) &&
      status > 0 &&
      /\bERR_PNPM_PUBLISH_AVAILABILITY_TIMEOUT\b/u.test(output))
  );
}

export async function verifyPublished(pkg, integrity, io, attempts = 6) {
  assert.match(integrity, /^sha512-[A-Za-z0-9+/]{86}==$/u);
  assert.ok(Number.isInteger(attempts) && attempts > 0);
  for (let attempt = 1; ; attempt++) {
    try {
      const published = await io.view();
      for (const field of ['name', 'version', 'license'])
        assert.equal(
          published[field],
          pkg[field],
          `Registry differs: ${field}`,
        );
      assert.deepEqual(published.bin, pkg.bin, 'Registry executable differs');
      assert.equal(
        published.dist?.integrity,
        integrity,
        'Registry integrity differs',
      );
      const archive = await io.download(published.dist.tarball);
      assert.equal(
        'sha512-' + createHash('sha512').update(archive).digest('base64'),
        integrity,
        'Downloaded archive integrity differs',
      );
      return published;
    } catch (error) {
      if (!error.retryable || attempt >= attempts) throw error;
      await io.wait();
    }
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const registry = process.env.PNPM_CONFIG_REGISTRY;
  assert.equal(pkg.name, '@devel-solid/agentscli');
  assert.match(pkg.version, /^[0-9]+[.][0-9]+[.][0-9]+$/u);
  assert.match(registry, new RegExp('^https://[A-Za-z0-9./:-]+$', 'u'));
  assert.equal(pkg.version, process.env.RELEASE_VERSION);
  assert.equal(new URL(registry).protocol, 'https:');
  await verifyPublished(pkg, process.env.RELEASE_INTEGRITY, {
    view() {
      try {
        return JSON.parse(
          execFileSync(
            process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
            [
              ...(process.platform === 'win32'
                ? ['/d', '/s', '/c', 'pnpm.cmd']
                : []),
              'view',
              `${pkg.name}@${pkg.version}`,
              '--json',
              '--registry',
              registry,
            ],
            {
              encoding: 'utf8',
              timeout: 20000,
              stdio: ['ignore', 'pipe', 'pipe'],
              env: {
                ...process.env,
                PNPM_CONFIG_FETCH_RETRIES: '0',
                PNPM_CONFIG_FETCH_TIMEOUT: '15000',
              },
            },
          ),
        );
      } catch (error) {
        let code;
        try {
          code = JSON.parse(String(error.stdout)).error?.code;
        } catch {}
        throw Object.assign(
          new Error(
            `Registry query failed (${code ?? 'transport error'}); verify the same version without publishing again.`,
          ),
          {
            retryable: [
              'E404',
              'ERR_PNPM_NO_MATCHING_VERSION',
              'ERR_PNPM_FETCH_404',
            ].includes(code),
          },
        );
      }
    },
    async download(url) {
      assert.equal(
        new URL(url).origin,
        new URL(registry).origin,
        'Unexpected tarball registry',
      );
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) {
        await response.body?.cancel();
        throw Object.assign(
          new Error(
            `Tarball request failed (${response.status}); verify the same version without publishing again.`,
          ),
          {
            retryable:
              [404, 429].includes(response.status) || response.status >= 500,
          },
        );
      }
      return Buffer.from(await response.arrayBuffer());
    },
    wait: () => setTimeout(10000),
  });
  const message = `Registry identity and downloaded archive integrity verified for ${pkg.name}@${pkg.version}.`;
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${message}\n`);
}
