import { posix } from 'node:path';
import { EngineError, exactKeys, resourceId } from './manifest.mjs';
import { portableKey, uniquePaths } from './paths.mjs';
import {
  activeNodes,
  decode,
  frontmatter,
  inlineTrigger,
  parseMarkdown,
  validateConvention,
  validateConventionFilename,
} from './markdown.mjs';
const fail = (code, message, path) => {
  throw new EngineError(code, message, 2, path);
};
export function validateSkill(files, path) {
  if (!files['SKILL.md']) fail('SKILL_ENTRY', 'Missing SKILL.md.', path);
  const header = frontmatter(
    decode(files['SKILL.md'], `${path}/SKILL.md`),
    `${path}/SKILL.md`,
  );
  if (!header)
    fail(
      'SKILL_FRONTMATTER',
      'SKILL.md requires standard YAML frontmatter.',
      path,
    );
  const f = header.fields;
  if (
    typeof f.name !== 'string' ||
    typeof f.description !== 'string' ||
    !f.name.trim() ||
    !f.description.trim()
  )
    fail(
      'SKILL_FRONTMATTER',
      'Skill name and description must be nonempty strings.',
      path,
    );
  resourceId(f.name, 'skills', path);
  if (
    f.metadata !== undefined &&
    (!f.metadata ||
      typeof f.metadata !== 'object' ||
      Array.isArray(f.metadata) ||
      Object.values(f.metadata).some((v) => typeof v !== 'string'))
  )
    fail(
      'SKILL_METADATA',
      'Standard skill metadata values must be strings.',
      path,
    );
  exactKeys(
    f,
    ['name', 'description'],
    ['license', 'compatibility', 'metadata', 'allowed-tools'],
    path,
  );
  for (const key of ['license', 'compatibility', 'allowed-tools'])
    if (f[key] !== undefined && typeof f[key] !== 'string')
      fail('SKILL_FRONTMATTER', `${key} must be a string.`, path);
  return { name: f.name, header };
}

function linkTarget(raw, base) {
  if (typeof raw !== 'string' || !raw || raw.startsWith('#')) return undefined;
  let value;
  try {
    value = decodeURIComponent(raw);
  } catch {
    fail('RESOURCE_LINK', 'Malformed link escaping.', base);
  }
  if (/%[\da-f]{2}/iu.test(value))
    fail('RESOURCE_LINK', 'Ambiguous repeated URL encoding.', base);
  value = value.replaceAll('\\', '/');
  if (/^skill:\/\//iu.test(value))
    return portableKey(
      'skills/' + value.slice('skill://'.length).split(/[?#]/u)[0],
    );
  if (/^[a-z][a-z0-9+.-]*:/iu.test(value)) {
    if (/^https?:/iu.test(value)) {
      try {
        return portableKey(new URL(value).pathname.replace(/^\//u, ''));
      } catch {
        return undefined;
      }
    }
    if (!/^(file|skill):/iu.test(value)) return undefined;
    value = value.replace(/^[a-z]+:\/\//iu, '');
  }
  value = value.split(/[?#]/u)[0];
  return portableKey(
    posix.normalize(
      value.startsWith('/')
        ? value.slice(1)
        : posix.join(posix.dirname(base), value),
    ),
  );
}
export function validateResourceLinks(
  text,
  path,
  { kind, ownRoot, conventions = [], skillRoots = [], trigger = false } = {},
) {
  const own = ownRoot && portableKey(ownRoot);
  const conventionTargets = new Set(conventions.map(portableKey));
  const roots = skillRoots.map(portableKey);
  function prohibited(target) {
    if (!target) return false;
    const ownConvention = kind === 'convention' && target === portableKey(path);
    if (
      !ownConvention &&
      (conventionTargets.has(target) ||
        /(?:^|\/)\.agentscli\/(?:templates\/conventions|conventions)\//u.test(
          target,
        ))
    )
      return true;
    if (
      /(?:^|\/)conventions\/[^/]+(?:\/[^/]+)*\.(?:tpl\.)?md$/u.test(target) &&
      target !== portableKey(path)
    )
      return true;
    const explicit = [
      ...target.matchAll(/(?:^|\/)(?:\.agents\/skills|skills)\/([^/]+)/gu),
    ];
    if (
      explicit.some(
        (m) => kind !== 'skill' || !own || m[1] !== own.split('/').at(-1),
      )
    )
      return true;
    return roots.some(
      (root) =>
        (target === root || target.startsWith(root + '/')) &&
        !(kind === 'skill' && own === root),
    );
  }
  const definitions = new Map();
  const nodes = activeNodes(text);
  for (const n of nodes)
    if (n.type === 'definition')
      definitions.set(n.identifier.toLowerCase(), n.url);
  const targets = [];
  for (const n of nodes) {
    if (['link', 'image', 'definition'].includes(n.type)) targets.push(n.url);
    if (['linkReference', 'imageReference'].includes(n.type))
      targets.push(definitions.get(n.identifier.toLowerCase()));
    if (n.type === 'html') {
      const html = n.value.replace(/<!--[\s\S]*?-->/gu, '');
      for (const tag of html.matchAll(
        /<[A-Za-z][\w:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>/gu,
      ))
        for (const m of tag[0].matchAll(
          /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu,
        )) {
          const raw = m[1] ?? m[2] ?? m[3];
          targets.push(
            raw.replace(
              /&(?:#[xX][\da-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);?/gu,
              (entity) => {
                const nodes = parseMarkdown(entity).children;
                return nodes[0]?.children?.[0]?.type === 'text'
                  ? nodes[0].children[0].value
                  : entity;
              },
            ),
          );
        }
    }
  }
  for (const target of targets)
    if (prohibited(linkTarget(target, path)))
      fail(
        'RESOURCE_LINK',
        `Direct cross-resource link is forbidden: ${target}. Use resource identity and project discovery.`,
        path,
      );
  if (kind === 'skill') {
    // Workflow commands are checked even when written as code; prose mentions remain valid.
    const candidates =
      text
        .replace(/<!--[\s\S]*?-->/gu, '')
        .match(
          /(?:\.?\.?\/|\/)?(?:\.agents\/skills\/[^\s`<>"')]+|\.agentscli\/(?:templates\/conventions|conventions)\/[^\s`<>"')]+|\.\.\/[^\s`<>"')]+|(?:https?|skill|file):\/\/[^\s`<>"')]+)/giu,
        ) ?? [];
    for (const target of candidates)
      if (prohibited(linkTarget(target, path)))
        fail(
          'RESOURCE_PATH',
          `Fixed cross-resource workflow path is forbidden: ${target}.`,
          path,
        );
  }
}
export function validateResources({ conventions = [], skills = [] }) {
  const conventionPaths = conventions.flatMap((c) =>
    [c.path, c.output].filter(Boolean),
  );
  const skillRoots = skills.map((s) => s.path);
  const seenConventions = new Set(),
    seenSkills = new Set();
  for (const c of conventions) {
    const parsed = validateConvention(c.text, c.path);
    validateConventionFilename(parsed.title, c.path);
    const opts = {
      kind: 'convention',
      conventions: conventionPaths,
      skillRoots,
    };
    validateResourceLinks(parsed.body, c.output ?? c.path, opts);
    validateResourceLinks(
      'Discovery: ' + inlineTrigger(parsed.trigger),
      'AGENTS.md',
      {
        ...opts,
        trigger: true,
      },
    );
    const key = `${c.source}:${portableKey(c.id)}`;
    if (seenConventions.has(key))
      fail('RESOURCE_COLLISION', `Duplicate convention ${key}.`, c.path);
    seenConventions.add(key);
  }
  for (const s of skills) {
    uniquePaths(Object.keys(s.files));
    const parsed = validateSkill(s.files, s.path);
    if (parsed.name !== s.id)
      fail(
        'SKILL_ID',
        `Skill name ${parsed.name} does not match directory ${s.id}.`,
        s.path,
      );
    for (const [relative, content] of Object.entries(s.files))
      if (/\.(?:md|mdx)$/iu.test(relative)) {
        const text =
          relative === 'SKILL.md'
            ? parsed.header.body
            : decode(content, `${s.path}/${relative}`);
        validateResourceLinks(text, `${s.path}/${relative}`, {
          kind: 'skill',
          ownRoot: s.path,
          conventions: conventionPaths,
          skillRoots,
        });
      }
    const key = `${s.source}:${portableKey(s.id)}`;
    if (seenSkills.has(key))
      fail('RESOURCE_COLLISION', `Duplicate skill ${key}.`, s.path);
    seenSkills.add(key);
  }
}
