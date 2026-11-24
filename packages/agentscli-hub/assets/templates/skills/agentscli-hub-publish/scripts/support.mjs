import * as nodeFs from 'node:fs';
import path from 'node:path';
import { parseDocument, isAlias, isMap, isSeq } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

export const operationalNames = Object.freeze([
  'agentscli-hub-write-conventions',
  'agentscli-hub-edit-agents',
  'agentscli-hub-write-shared-conventions',
  'agentscli-hub-write-shared-skills',
  'agentscli-hub-publish',
]);
export const reservedNames = new Set([
  ...operationalNames,
  'agentscli-adm-write-conventions',
  'agentscli-adm-edit-agents',
  'agentscli-adm-publish-packages',
  'agentscli-write-conventions',
  'agentscli-edit-agents',
  'agentscli-build-agents',
  'agentscli-manage-hub-imports',
  'agentscli-update-agents',
]);
export class ContractError extends Error {
  constructor(code, message, file = '') {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.file = file;
  }
}
export function fail(code, message, file) {
  throw new ContractError(code, message, file);
}
export function parseYaml(text, file = '') {
  const doc = parseDocument(text, {
    uniqueKeys: true,
    version: '1.2',
    prettyErrors: false,
  });
  if (doc.errors.length)
    fail('yaml', `Invalid YAML (${doc.errors[0].code}).`, file);
  const visit = (node) => {
    if (!node) return;
    if (isAlias(node) || node.tag)
      fail('yaml', 'Aliases and explicit tags are not supported.', file);
    if (isMap(node))
      for (const item of node.items) {
        visit(item.key);
        visit(item.value);
      }
    if (isSeq(node)) for (const item of node.items) visit(item);
  };
  visit(doc.contents);
  return doc.toJS({ maxAliasCount: 0 });
}
export function object(value, label, file = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('schema', `${label} must be a mapping.`, file);
  return value;
}
export function exactKeys(value, keys, label, file = '') {
  object(value, label, file);
  if (Object.keys(value).some((key) => !keys.includes(key)))
    fail('schema', `${label} has an unsupported field.`, file);
}
export function portablePath(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    value !== value.normalize('NFC') ||
    value.includes('\\') ||
    value.startsWith('/') ||
    /^[a-z]:/i.test(value)
  )
    return false;
  return value
    .split('/')
    .every(
      (part) =>
        part &&
        part !== '.' &&
        part !== '..' &&
        part.toLowerCase() !== '.git' &&
        !/[\x00-\x1f<>:"|?*]/.test(part) &&
        !/[. ]$/.test(part) &&
        !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
    );
}
export function validId(value, kind = 'convention') {
  return (
    portablePath(value) &&
    (kind === 'convention'
      ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.split('/').at(-1))
      : /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
  );
}
export function semver(value) {
  if (typeof value !== 'string') return false;
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(
      value,
    );
  return (
    !!match &&
    match.slice(1, 4).every((part) => Number.isSafeInteger(Number(part))) &&
    (!match[4] ||
      match[4]
        .split('.')
        .every(
          (part) =>
            !/^\d+$/.test(part) || part === '0' || !part.startsWith('0'),
        ))
  );
}
export function parseManifest(text, file = 'agentscli-hub.yml') {
  const value = parseYaml(text, file);
  exactKeys(value, ['schemaVersion', 'version'], 'Hub manifest', file);
  if (value.schemaVersion !== 1 || !semver(value.version))
    fail(
      'manifest',
      'Expected schemaVersion: 1 and a semantic content version.',
      file,
    );
  return value;
}
export function frontmatter(text, file = '', required = true) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(normalized);
  if (!match) {
    if (required)
      fail('frontmatter', 'Expected leading YAML frontmatter.', file);
    return { data: {}, body: normalized };
  }
  return {
    data: object(parseYaml(match[1], file), 'Frontmatter', file),
    body: normalized.slice(match[0].length),
  };
}
export function slug(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
const markdown = unified().use(remarkParse);
function walk(node, callback) {
  callback(node);
  for (const child of node.children ?? []) walk(child, callback);
}
function plain(node) {
  return node.value ?? (node.children ?? []).map(plain).join('');
}
export function parseConvention(text, file, { shared = true } = {}) {
  const parsed = frontmatter(text, file, shared);
  if (
    'requires' in parsed.data ||
    parsed.data.metadata?.requires !== undefined ||
    parsed.data.metadata?.agentscli !== undefined
  )
    fail(
      'convention-requires',
      'Conventions are self-contained and cannot declare requires.',
      file,
    );
  if (shared) {
    exactKeys(parsed.data, ['trigger'], 'Convention frontmatter', file);
    if (typeof parsed.data.trigger !== 'string' || !parsed.data.trigger.trim())
      fail('trigger', 'Convention trigger must be a nonempty string.', file);
  }
  const tree = markdown.parse(parsed.body);
  walk(tree, (node) => {
    if (node.type === 'html' && /agentscli:requires/.test(node.value))
      fail(
        'convention-requires',
        'Conventions cannot declare legacy dependency comments.',
        file,
      );
  });
  const headings = [];
  walk(tree, (node) => {
    if (node.type === 'heading' && node.depth === 1) headings.push(plain(node));
  });
  if (headings.length !== 1 || !slug(headings[0]))
    fail(
      'heading',
      'Convention needs exactly one nonempty H1 outside examples.',
      file,
    );
  const filename = path.posix.basename(file).replace(/(?:\.tpl)?\.md$/, '');
  if (slug(headings[0]) !== filename)
    fail(
      'filename',
      `Convention filename must match H1 slug ${slug(headings[0])}.`,
      file,
    );
  return { ...parsed, title: headings[0] };
}
export function parseSkill(text, file, expectedName) {
  const parsed = frontmatter(text, file);
  exactKeys(
    parsed.data,
    [
      'name',
      'description',
      'license',
      'compatibility',
      'metadata',
      'allowed-tools',
    ],
    'Skill frontmatter',
    file,
  );
  if (
    !validId(parsed.data.name, 'skill') ||
    (expectedName && parsed.data.name !== expectedName)
  )
    fail(
      'skill-name',
      'Skill name must match its direct-child directory.',
      file,
    );
  if (
    typeof parsed.data.description !== 'string' ||
    !parsed.data.description.trim()
  )
    fail(
      'skill-description',
      'Skill description must be a nonempty string.',
      file,
    );
  for (const field of ['license', 'compatibility', 'allowed-tools'])
    if (
      parsed.data[field] !== undefined &&
      (typeof parsed.data[field] !== 'string' || !parsed.data[field].trim())
    )
      fail(
        'skill-frontmatter',
        'Optional standard skill fields must be nonempty strings.',
        file,
      );
  if (parsed.data.metadata !== undefined) {
    object(parsed.data.metadata, 'Skill metadata', file);
    for (const [key, value] of Object.entries(parsed.data.metadata))
      if (typeof value !== 'string')
        fail('skill-metadata', `metadata.${key} must be a string.`, file);
    if ('requires' in parsed.data.metadata)
      fail(
        'skill-config',
        'metadata.requires is unsupported; use metadata.agentscli: agentscli-skill.yml.',
        file,
      );
    if (
      'agentscli' in parsed.data.metadata &&
      parsed.data.metadata.agentscli !== 'agentscli-skill.yml'
    )
      fail(
        'skill-config',
        'metadata.agentscli must be the sibling filename agentscli-skill.yml.',
        file,
      );
  }
  walk(markdown.parse(parsed.body), (node) => {
    if (node.type === 'html' && /agentscli:requires/.test(node.value))
      fail(
        'requires-pointer',
        'Obsolete dependency comments are unsupported.',
        file,
      );
  });
  return parsed;
}
export function parseSkillConfiguration(text, file, { shared = false } = {}) {
  const data = parseYaml(text, file);
  exactKeys(data, ['requires'], 'Skill configuration', file);
  if (Object.hasOwn(data, 'requires') && !Array.isArray(data.requires))
    fail('skill-config', 'requires must be an explicit YAML sequence.', file);
  const seen = new Set();
  const requires = (data.requires ?? []).map((item) => {
    exactKeys(item, ['id', 'source'], 'Required skill', file);
    if (
      !validId(item.id, 'skill') ||
      !['local', 'hub'].includes(item.source) ||
      (shared && item.source !== 'hub')
    )
      fail(
        'skill-config',
        'Required skills need a safe id and the correct local/hub source.',
        file,
      );
    const key = `${item.source}:${item.id.toLowerCase()}`;
    if (seen.has(key)) fail('skill-config', 'Duplicate required skill.', file);
    seen.add(key);
    return { id: item.id, source: item.source };
  });
  return { requires };
}
export function resolveDependencies(skills, roots = [...skills.keys()]) {
  const visited = new Set();
  const visit = (identity) => {
    if (visited.has(identity)) return;
    const skill = skills.get(identity);
    if (!skill)
      fail('dependency', `Missing explicitly selected skill ${identity}.`);
    visited.add(identity);
    for (const dependency of skill.requires ?? [])
      visit(`${dependency.source}:${dependency.id}`);
  };
  roots.forEach(visit);
  return visited;
}
function decodeTarget(raw, file) {
  const entities = {
    amp: '&',
    AMP: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    sol: '/',
    bsol: '\\',
    period: '.',
    colon: ':',
    quest: '?',
    num: '#',
    percnt: '%',
    commat: '@',
    lowbar: '_',
    hyphen: '-',
    Tab: '\t',
    NewLine: '\n',
  };
  let target = raw
    .trim()
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
      if (entity[0] === '#') {
        const value =
          entity[1].toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);
        return value <= 0x10ffff ? String.fromCodePoint(value) : whole;
      }
      return entities[entity] ?? whole;
    });
  if (!target || target.startsWith('#') || target.startsWith('?'))
    return undefined;
  const skill = /^skill:(?:\/\/)?([^/?#]+)/i.exec(target);
  if (skill) target = `/.agents/skills/${skill[1]}`;
  else if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) {
    try {
      target = new URL(target, 'https://resource.invalid').pathname;
    } catch {
      return undefined;
    }
  } else target = target.split(/[?#]/)[0];
  try {
    target = decodeURIComponent(target);
  } catch {
    fail('link', 'Malformed encoded link target.', file);
  }
  return target.replace(/\\/g, '/').normalize('NFC');
}
function normalized(value) {
  return path.posix.normalize(value).replace(/^\/+/, '').toLowerCase();
}
function pathTargets(raw, bases, file) {
  const target = decodeTarget(raw, file);
  if (!target) return [];
  const values = target.startsWith('/')
    ? [target]
    : bases.map((base) => path.posix.join(path.posix.dirname(base), target));
  return [...new Set(values.map(normalized))];
}
function containsPath(target, resource, { directory = false } = {}) {
  const known = normalized(resource);
  return (
    target === known ||
    target.endsWith(`/${known}`) ||
    (directory && `/${target}/`.includes(`/${known}/`))
  );
}
export function validateLinks(
  text,
  file,
  {
    kind,
    conventions = [],
    skillRoots = [],
    ownRoot,
    outputFile,
    trigger,
  } = {},
) {
  const parsed = frontmatter(text, file, false);
  const tree = markdown.parse(parsed.body);
  const ownName = ownRoot?.split('/').at(-1).toLowerCase();
  const bases = [...new Set([outputFile ?? file, file])];
  const ownConventions = new Set(bases.map(normalized));
  const conventionIdentity = (value) => {
    const match =
      /(?:^|\/)(docs\/conventions|shared\/conventions|\.agentscli\/(?:templates\/conventions|hub\/conventions|conventions)|conventions)\/(.+?)(?:\.tpl)?\.md$/i.exec(
        value,
      );
    return match
      ? `${match[1] === 'docs/conventions' ? 'internal' : 'shared'}:${match[2]}`
      : undefined;
  };
  const ownIds = new Set(
    [...ownConventions].map(conventionIdentity).filter(Boolean),
  );
  const check = (raw, currentBases = bases) => {
    for (const target of pathTargets(raw, currentBases, file)) {
      const convention = conventions.find((resource) =>
        containsPath(target, resource),
      );
      const lexicalConventions =
        /(?:^|\/)(?:docs\/conventions|shared\/conventions|\.agentscli\/(?:templates\/conventions|hub\/conventions|conventions)|conventions)\/[^?#]*\.md$/i.test(
          target,
        );
      const self =
        ownConventions.has(target) ||
        (!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw) &&
          ownIds.has(conventionIdentity(target)));
      if ((convention || lexicalConventions) && !self)
        fail(
          'resource-link',
          `Direct resource target ${target} is forbidden; discover other conventions and skills by identity.`,
          file,
        );
      const known = skillRoots.filter((resource) =>
        containsPath(target, resource, { directory: true }),
      );
      const lexical = [
        ...target.matchAll(
          /(?:^|\/)(?:shared\/skills|\.agents\/skills|\.agentscli\/hub\/skills|skills)\/([^/]+)/gi,
        ),
      ].map((match) => match[1]);
      const names = [
        ...known.map((root) => root.split('/').at(-1)),
        ...lexical,
      ].map((name) => name.toLowerCase());
      if (names.some((name) => kind === 'convention' || name !== ownName))
        fail(
          'resource-link',
          `Direct resource target ${target} is forbidden; discover other conventions and skills by identity.`,
          file,
        );
    }
  };
  const checkTree = (root, currentBases) => {
    const definitions = new Map();
    walk(root, (node) => {
      if (node.type === 'definition')
        definitions.set(node.identifier.toLowerCase(), node.url);
    });
    walk(root, (node) => {
      if (['link', 'image', 'definition'].includes(node.type))
        check(node.url, currentBases);
      if (['linkReference', 'imageReference'].includes(node.type)) {
        const target = definitions.get(node.identifier.toLowerCase());
        if (target) check(target, currentBases);
      }
      if (node.type === 'html') {
        if (kind === 'skill' && /agentscli:requires/.test(node.value))
          fail(
            'requires-pointer',
            'Obsolete dependency comments are unsupported.',
            file,
          );
        const html = node.value.replace(/<!--[\s\S]*?-->/g, '');
        for (const tag of html.matchAll(
          /<[a-z][\w:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi,
        )) {
          const attributes =
            /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gy;
          attributes.lastIndex = /^<[a-z][\w:-]*/i.exec(tag[0])[0].length;
          let attribute;
          while ((attribute = attributes.exec(tag[0])))
            if (/^(?:href|src)$/i.test(attribute[1]))
              check(
                attribute[2] ?? attribute[3] ?? attribute[4] ?? '',
                currentBases,
              );
        }
      }
      // Literal Markdown/YAML teaching examples are data. Runnable examples and
      // inline commands must still discover foreign resources by identity.
      if (
        kind === 'skill' &&
        (node.type === 'inlineCode' ||
          (node.type === 'code' &&
            !/^(?:md|markdown|yaml|yml|json|text|txt)$/i.test(node.lang ?? '')))
      ) {
        for (const match of node.value.matchAll(
          /(?:[a-z][\w+.-]*:\/\/)?(?:\.\.?\/)?(?:[\w.@%&;#:-]+\/)+[\w.@%&;#:-]*/gi,
        ))
          check(match[0], currentBases);
      }
    });
  };
  checkTree(tree, bases);
  if (typeof trigger === 'string')
    checkTree(markdown.parse(trigger), ['AGENTS.md']);
}
function maybeStat(file, fs) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}
export function safeWalk(root, fs = nodeFs, { allowMissing = true } = {}) {
  const files = new Map();
  const portable = new Set();
  const identities = new Set();
  if (!maybeStat(root, fs)) {
    if (allowMissing) return files;
    fail('missing', 'Required directory is missing.', root);
  }
  const visit = (absolute, relative) => {
    const stat = fs.lstatSync(absolute);
    if (
      stat.isSymbolicLink() ||
      (!stat.isFile() && !stat.isDirectory()) ||
      (stat.isFile() && stat.nlink > 1)
    )
      fail(
        'unsafe-path',
        'Links, hard-link aliases, and special files are not supported.',
        relative || root,
      );
    if (relative && !portablePath(relative))
      fail('unsafe-path', 'Path is not portable.', relative);
    const key = relative.normalize('NFC').toLowerCase();
    if (portable.has(key))
      fail('collision', 'Portable path collision.', relative);
    portable.add(key);
    const identity = fs.realpathSync(absolute).toLowerCase();
    if (identities.has(identity))
      fail('unsafe-path', 'Filesystem alias detected.', relative);
    identities.add(identity);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort())
        visit(
          path.join(absolute, name),
          relative ? `${relative}/${name}` : name,
        );
    } else files.set(relative, fs.readFileSync(absolute));
  };
  visit(root, '');
  return files;
}
export function textFile(bytes, file) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (text.includes('\0'))
      fail(
        'encoding',
        'Instruction files must be UTF-8 text without NUL.',
        file,
      );
    return text;
  } catch (error) {
    if (error instanceof ContractError) throw error;
    fail('encoding', 'Instruction files must be UTF-8 text.', file);
  }
}
export function validateHubFiles(
  files,
  { scope = 'publish', requireManifest = true, projected = false } = {},
) {
  const read = (file) => {
    if (!files.has(file)) fail('missing', 'Required file is missing.', file);
    return textFile(files.get(file), file);
  };
  const manifest = requireManifest
    ? parseManifest(read('agentscli-hub.yml'))
    : undefined;
  const conventions = new Set();
  const skills = new Map();
  const conventionPaths = [];
  const skillRoots = [];
  for (const file of files.keys()) {
    if (!portablePath(file))
      fail('unsafe-path', 'Nonportable resource path.', file);
    if (/^docs\/conventions\/.*\.md$/.test(file)) {
      conventions.add(`local:${file.slice(17, -3)}`);
      conventionPaths.push(file);
    }
    if (/^shared\/conventions\/.*\.tpl\.md$/.test(file)) {
      const id = file.slice('shared/conventions/'.length, -'.tpl.md'.length);
      if (!validId(id)) fail('id', 'Invalid convention id.', file);
      conventions.add(`hub:${id}`);
      conventionPaths.push(
        file,
        `conventions/${id}.md`,
        `.agentscli/conventions/${id}.md`,
        `.agentscli/conventions/${id}.tpl.md`,
        `.agentscli/templates/conventions/${id}.tpl.md`,
        `.agentscli/hub/conventions/${id}.tpl.md`,
      );
    }
    if (/^shared\/skills\/[^/]+\/SKILL\.md$/.test(file)) {
      const root = file.slice(0, -9);
      const id = file.split('/').at(-2);
      skillRoots.push(
        root,
        `.agents/skills/${id}`,
        `.agentscli/hub/skills/${id}`,
      );
    }
    if (/^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(file))
      skillRoots.push(file.slice(0, -9));
  }
  const collision = new Set();
  for (const file of files.keys()) {
    const key = file.toLowerCase();
    if (collision.has(key))
      fail('collision', 'Portable resource collision.', file);
    collision.add(key);
  }
  for (const file of files.keys()) {
    const isInternal = /^docs\/conventions\/.*\.md$/.test(file);
    const isShared = /^shared\/conventions\/.*\.tpl\.md$/.test(file);
    if (
      (isInternal && ['internal-conventions', 'publish'].includes(scope)) ||
      (isShared && ['shared-conventions', 'publish'].includes(scope))
    ) {
      const parsed = parseConvention(read(file), file, { shared: isShared });
      validateLinks(read(file), file, {
        kind: 'convention',
        conventions: conventionPaths,
        skillRoots,
        outputFile: isShared
          ? `.agentscli/conventions/${file.slice('shared/conventions/'.length, -'.tpl.md'.length)}.md`
          : file,
        trigger: parsed.data.trigger,
      });
    }
    if (
      /^(?:shared\/skills|\.agents\/skills)\/[^/]+\/SKILL\.md$/.test(file) &&
      ['shared-skills', 'publish'].includes(scope)
    ) {
      const shared = file.startsWith('shared/skills/');
      const id = file.split('/').at(-2);
      if (shared && reservedNames.has(id))
        fail(
          'reserved-id',
          'Product operational skill identities are reserved.',
          file,
        );
      const parsed = parseSkill(read(file), file, id);
      const root = file.slice(0, -9);
      const configurationFile = `${root}/agentscli-skill.yml`;
      for (const candidate of files.keys()) {
        if (!candidate.startsWith(`${root}/`)) continue;
        const relative = candidate.slice(root.length + 1);
        if (relative.includes('/')) continue;
        const reserved = relative.toLowerCase();
        if (
          reserved === 'requires.yml' ||
          (reserved === 'agentscli-skill.yml' && relative !== reserved)
        )
          fail(
            'skill-config',
            'Reserved skill configuration filenames must use the current exact agentscli-skill.yml name.',
            candidate,
          );
      }
      const declaresConfiguration =
        parsed.data.metadata?.agentscli !== undefined;
      if (!declaresConfiguration && files.has(configurationFile))
        fail(
          'skill-config',
          'agentscli-skill.yml needs metadata.agentscli in SKILL.md.',
          configurationFile,
        );
      const { requires } = declaresConfiguration
        ? parseSkillConfiguration(read(configurationFile), configurationFile, {
            shared,
          })
        : { requires: [] };
      const identity = `${shared ? 'hub' : 'local'}:${id}`;
      skills.set(identity, { file, requires });
      for (const instruction of files.keys()) {
        if (
          instruction.startsWith(`${root}/`) &&
          /\.(?:md|mdx)$/.test(instruction)
        )
          validateLinks(read(instruction), instruction, {
            kind: 'skill',
            conventions: conventionPaths,
            skillRoots,
            ownRoot: root,
          });
      }
    }
  }
  if (['shared-skills', 'publish'].includes(scope)) resolveDependencies(skills);
  if (scope === 'agents') {
    const agents = read('AGENTS.md');
    if (!/^#\s+AGENTS\.md\s*$/m.test(agents))
      fail('agents', 'AGENTS.md needs its established H1.', 'AGENTS.md');
  }
  return { manifest, conventions, skills, projected };
}
export function inspectHub(root, { fs = nodeFs, scope = 'publish' } = {}) {
  let ancestor = path.resolve(root);
  while (true) {
    if (maybeStat(path.join(ancestor, 'agentscli-compose.yml'), fs))
      fail(
        'role',
        'Legacy consumer projects are not hub authoring environments.',
        ancestor,
      );
    if (
      ancestor !== path.resolve(root) &&
      maybeStat(path.join(ancestor, 'agentscli-hub.yml'), fs)
    )
      fail(
        'role',
        'A hub authoring root cannot be nested in another hub.',
        ancestor,
      );
    const entry = maybeStat(ancestor, fs);
    if (entry && (!entry.isDirectory() || entry.isSymbolicLink()))
      fail('unsafe-path', 'Hub ancestors must be real directories.', ancestor);
    if (fs.existsSync(path.join(ancestor, '.agentscli/config.yml')))
      fail(
        'role',
        'A consumer project is not a hub authoring environment.',
        ancestor,
      );
    const packageFile = path.join(ancestor, 'package.json');
    if (fs.existsSync(packageFile)) {
      let metadata;
      try {
        metadata = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
      } catch {}
      if (
        (metadata?.name === '@devel-solid/agentscli' &&
          metadata.bin?.agentscli) ||
        (metadata?.name === '@devel-solid/agentscli-hub' &&
          metadata.bin?.['agentscli-hub'])
      )
        fail(
          'role',
          'Tool packages are not hub authoring environments.',
          ancestor,
        );
      if (
        metadata?.private === true &&
        Array.isArray(metadata.workspaces) &&
        ['packages/agentscli', 'packages/agentscli-hub'].every((entry) =>
          metadata.workspaces.includes(entry),
        )
      ) {
        const identities = ['agentscli', 'agentscli-hub'].every((entry) => {
          try {
            const item = JSON.parse(
              fs.readFileSync(
                path.join(ancestor, 'packages', entry, 'package.json'),
                'utf8',
              ),
            );
            return (
              item.name === `@devel-solid/${entry}` &&
              typeof item.bin?.[entry] === 'string'
            );
          } catch {
            return false;
          }
        });
        if (identities)
          fail(
            'role',
            'The verified tool monorepo is not a hub authoring environment.',
            ancestor,
          );
      }
    }
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const files = new Map();
  for (const directory of [
    'docs/conventions',
    'shared/conventions',
    'shared/skills',
    '.agents/skills',
  ]) {
    let parent = root;
    for (const part of directory.split('/')) {
      if (maybeStat(parent, fs)?.isDirectory()) {
        const aliases = fs
          .readdirSync(parent)
          .filter(
            (name) =>
              name.normalize('NFC').toLowerCase() === part.toLowerCase(),
          );
        if (aliases.some((name) => name !== part))
          fail(
            'collision',
            'Hub resource parents have a portable path alias.',
            path.join(parent, part),
          );
      }
      parent = path.join(parent, part);
      const entry = maybeStat(parent, fs);
      if (entry && (!entry.isDirectory() || entry.isSymbolicLink()))
        fail(
          'unsafe-path',
          'Hub resource parents must be real directories.',
          parent,
        );
    }
    for (const [relative, bytes] of safeWalk(path.join(root, directory), fs))
      files.set(`${directory}/${relative}`, bytes);
  }
  for (const name of ['agentscli-hub.yml', 'AGENTS.md']) {
    const absolute = path.join(root, name);
    const stat = maybeStat(absolute, fs);
    if (stat) {
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1)
        fail('unsafe-path', 'Expected an independent regular file.', name);
      files.set(name, fs.readFileSync(absolute));
    }
  }
  const result = validateHubFiles(files, { scope });
  return { ...result, files };
}
