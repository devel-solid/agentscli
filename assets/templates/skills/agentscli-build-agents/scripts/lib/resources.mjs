import {
  EngineError,
  PRODUCT_SKILLS,
  validPackageVersion,
} from './contracts.mjs';
import { validateResources } from './content.mjs';
import { decode, frontmatter } from './markdown.mjs';

export const PRODUCT_SUPPORT = {
  'agentscli-write-conventions': [
    'scripts/check.mjs',
    'references/writing-examples.md',
  ],
  'agentscli-build-agents': [
    'scripts/build-agents.mjs',
    'scripts/lib/index.mjs',
  ],
  'agentscli-refactor-conventions': [
    'scripts/review-conventions.mjs',
    'references/refactoring-examples.md',
  ],
};

export function validateProductResources(resources, { generated = true } = {}) {
  const fail = (message, path) => {
    throw new EngineError('PACKAGE_RESOURCE', message, 3, path);
  };
  if (
    !resources?.skills ||
    typeof resources.skills !== 'object' ||
    Array.isArray(resources.skills) ||
    Object.keys(resources.skills).sort().join('\n') !==
      [...PRODUCT_SKILLS].sort().join('\n')
  )
    fail('Expected the complete product skill inventory.');
  try {
    const skills = PRODUCT_SKILLS.map((id) => {
      const files = resources.skills[id],
        path = `.agents/skills/${id}`;
      if (!files || typeof files !== 'object' || Array.isArray(files))
        fail('Expected an operational skill resource tree.', path);
      for (const relative of PRODUCT_SUPPORT[id]) {
        const content = files[relative];
        if (!(content instanceof Uint8Array) || !content.byteLength)
          fail(`Missing or empty support: ${relative}.`, `${path}/${relative}`);
        if (!decode(content, `${path}/${relative}`).trim())
          fail(`Empty support: ${relative}.`, `${path}/${relative}`);
      }
      return { id, source: 'local', path, files };
    });
    validateResources({ skills });
    const versions = new Set();
    if (generated) {
      for (const { path, files } of skills) {
        const { fields } = frontmatter(decode(files['SKILL.md'], path), path);
        if (
          fields.license !== 'MIT' ||
          fields.metadata?.generatedBy !== '@devel-solid/agentscli' ||
          !validPackageVersion(fields.metadata?.generatorVersion)
        )
          fail(
            'Invalid generated operational skill provenance or license.',
            path,
          );
        versions.add(fields.metadata.generatorVersion);
      }
      if (versions.size !== 1)
        fail('Operational skill assets must share one generator version.');
    }
  } catch (error) {
    if (error instanceof EngineError) fail(error.message, error.path);
    throw error;
  }
}
