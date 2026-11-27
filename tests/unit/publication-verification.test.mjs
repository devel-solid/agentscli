import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  canVerifyPublication,
  registryQueryFailure,
  verifyPublished,
} from '../../.agents/skills/agentscli-publish-package/scripts/verify-published.mjs';

const pkg = {
  name: '@devel-solid/agentscli',
  version: '0.9.1',
  license: 'MIT',
  bin: { agentscli: 'dist/cli.js' },
};
const archive = Buffer.from('reviewed archive fixture');
const integrity =
  'sha512-' + createHash('sha512').update(archive).digest('base64');
const published = {
  ...pkg,
  dist: { integrity, tarball: 'https://registry.npmjs.org/fixture.tgz' },
};
const unavailable = () =>
  Object.assign(new Error('not available yet'), { retryable: true });

test('the observed pnpm package-not-found response retries verification while authentication fails immediately', async () => {
  const response = (code) =>
    registryQueryFailure({ stdout: JSON.stringify({ error: { code } }) });
  let calls = 0;
  let waits = 0;
  await verifyPublished(pkg, integrity, {
    view: async () => {
      if (++calls === 1) throw response('ERR_PNPM_PACKAGE_NOT_FOUND');
      return published;
    },
    download: async () => archive,
    wait: async () => {
      waits++;
    },
  });
  assert.equal(calls, 2);
  assert.equal(waits, 1);
  for (const error of [
    response('E403'),
    response('ERR_PNPM_FETCH_401'),
    registryQueryFailure({ code: 'ENOENT' }),
  ]) {
    await assert.rejects(
      verifyPublished(pkg, integrity, {
        view: async () => {
          throw error;
        },
        download: async () => assert.fail('No valid metadata'),
        wait: async () => assert.fail('Permanent errors must not retry'),
      }),
      /Registry query failed/,
    );
  }
});

test('only success or the specific accepted-upload timeout can proceed to registry verification', () => {
  assert.equal(canVerifyPublication(0, ''), true);
  assert.equal(
    canVerifyPublication(1, 'Error: ERR_PNPM_PUBLISH_AVAILABILITY_TIMEOUT'),
    true,
  );
  for (const [status, output] of [
    [1, 'ERR_PNPM_PUBLISH_AVAILABILITY_CHECK_FAILED'],
    [1, 'E403: authentication failed'],
    [1, 'ERR_PNPM_PUBLISH_AVAILABILITY_TIMEOUT_OTHER'],
    [1, ''],
    [null, 'ERR_PNPM_PUBLISH_AVAILABILITY_TIMEOUT'],
  ])
    assert.equal(canVerifyPublication(status, output), false);
});

test('an accepted publication is confirmed by registry metadata and actual archive bytes', async () => {
  const requested = [];
  const result = await verifyPublished(pkg, integrity, {
    view: async () => published,
    download: async (url) => {
      requested.push(url);
      return archive;
    },
    wait: async () => assert.fail('Already available'),
  });
  assert.equal(result, published);
  assert.deepEqual(requested, [published.dist.tarball]);
});

test('transient metadata and tarball unavailability retry only reads within the limit', async () => {
  let views = 0,
    downloads = 0,
    waits = 0;
  await verifyPublished(
    pkg,
    integrity,
    {
      view: async () => {
        if (++views === 1) throw unavailable();
        return published;
      },
      download: async () => {
        if (++downloads === 1) throw unavailable();
        return archive;
      },
      wait: async () => {
        waits++;
      },
    },
    3,
  );
  assert.equal(views, 3);
  assert.equal(downloads, 2);
  assert.equal(waits, 2);
  views = waits = 0;
  await assert.rejects(
    verifyPublished(
      pkg,
      integrity,
      {
        view: async () => {
          views++;
          throw unavailable();
        },
        download: async () => assert.fail('Metadata unavailable'),
        wait: async () => {
          waits++;
        },
      },
      2,
    ),
    /not available yet/,
  );
  assert.equal(views, 2);
  assert.equal(waits, 1);
});

test('identity, integrity, authentication and corrupt archive failures cannot become successful delivery', async () => {
  for (const metadata of [
    { ...published, name: '@example/other' },
    { ...published, version: '0.9.0' },
    { ...published, license: 'other' },
    { ...published, bin: { agentscli: 'other.js' } },
    { ...published, dist: { ...published.dist, integrity: 'sha512-other' } },
  ])
    await assert.rejects(
      verifyPublished(pkg, integrity, {
        view: async () => metadata,
        download: async () => assert.fail('Metadata mismatch'),
        wait: async () => assert.fail('Mismatch must not retry'),
      }),
    );
  for (const io of [
    {
      view: async () => {
        throw new Error('unauthorized');
      },
      download: async () => archive,
    },
    {
      view: async () => published,
      download: async () => Buffer.from('corrupt'),
    },
  ])
    await assert.rejects(
      verifyPublished(pkg, integrity, {
        ...io,
        wait: async () => assert.fail('Permanent failures must not retry'),
      }),
    );
});
