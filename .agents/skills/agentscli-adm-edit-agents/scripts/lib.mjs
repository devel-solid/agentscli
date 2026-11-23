import * as fs from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { parseDocument, visit as visitYaml, isAlias } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

export const key = (value) => value.normalize('NFC').toLowerCase();
export function yaml(text) {
  const doc = parseDocument(text, { uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length)
    throw new Error(`Invalid YAML (${doc.errors[0].code}).`);
  visitYaml(doc, (_key, node) => {
    if (node?.tag) throw new Error('Explicit YAML tags are not supported.');
    if (isAlias(node)) {
      throw new Error('YAML aliases are not supported.');
    }
  });
  const value = doc.toJS({ maxAliasCount: 0 });
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a YAML object.');
  return value;
}
export function header(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
  if (text.startsWith('---') && !match)
    throw new Error('Unclosed YAML frontmatter.');
  return match
    ? { value: yaml(match[1]), body: text.slice(match[0].length) }
    : { value: null, body: text };
}
export function walk(node, fn) {
  if (node.type === 'code' || node.type === 'inlineCode') return;
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
}
export function tree(text) {
  return unified().use(remarkParse).parse(text);
}
export function plain(node) {
  return node.value ?? node.alt ?? (node.children ?? []).map(plain).join('');
}
export function slug(title) {
  return title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}
export function links(text) {
  const ast = tree(text),
    defs = new Map(),
    result = [];
  walk(ast, (node) => {
    if (node.type === 'definition')
      defs.set(node.identifier.toLowerCase(), node.url);
  });
  walk(ast, (node) => {
    let target;
    if (node.type === 'link' || node.type === 'image') target = node.url;
    if (node.type === 'linkReference' || node.type === 'imageReference') {
      target = defs.get(node.identifier.toLowerCase());
      if (!target) throw new Error(`Unresolved reference: ${node.identifier}`);
    }
    if (target !== undefined)
      result.push({ target, line: node.position?.start.line ?? 1 });
    if (node.type === 'html') {
      const html = node.value.replace(/<!--[\s\S]*?-->/gu, '');
      for (const tag of html.matchAll(
        /<[A-Za-z][\w:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>/gu,
      )) {
        for (const match of tag[0].matchAll(
          /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu,
        )) {
          const target = (match[1] ?? match[2] ?? match[3]).replace(
            /&(?:#[xX][\da-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);?/gu,
            (entity) => plain(tree(entity)).trim(),
          );
          result.push({ target, line: node.position?.start.line ?? 1 });
        }
      }
    }
  });
  return result;
}
export function regular(path, io = fs) {
  const stat = io.lstatSync(path);
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.nlink > 1 ||
    key(io.realpathSync(path)) !== key(resolve(path))
  )
    throw new Error(`Unsafe regular file: ${path}`);
  return stat;
}
export function checkPath(root, path, io = fs) {
  const absolute = resolve(path),
    rel = relative(root, absolute);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new Error(`Path escapes project: ${path}`);
  let at = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    at = resolve(at, part);
    const stat = io.lstatSync(at);
    if (
      stat.isSymbolicLink() ||
      (stat.isFile() && stat.nlink > 1) ||
      key(io.realpathSync(at)) !== key(at)
    )
      throw new Error(`Aliased path: ${at}`);
  }
  return absolute;
}
export function monorepo(start, io = fs) {
  let at = resolve(start);
  for (;;) {
    const file = resolve(at, 'package.json');
    if (io.existsSync(file)) {
      regular(file, io);
      const pkg = JSON.parse(io.readFileSync(file, 'utf8'));
      if (pkg.private === true && Array.isArray(pkg.workspaces)) {
        const identities = new Map();
        for (const workspace of pkg.workspaces) {
          if (typeof workspace !== 'string' || workspace.includes('*'))
            continue;
          const path = resolve(at, workspace, 'package.json');
          if (!io.existsSync(path)) continue;
          checkPath(at, path, io);
          regular(path, io);
          const child = JSON.parse(io.readFileSync(path, 'utf8'));
          identities.set(child.name, child);
        }
        if (
          typeof identities.get('@devel-solid/agentscli')?.bin?.agentscli ===
            'string' &&
          typeof identities.get('@devel-solid/agentscli-hub')?.bin?.[
            'agentscli-hub'
          ] === 'string'
        ) {
          if (
            io.existsSync(resolve(at, '.agentscli/config.yml')) ||
            io.existsSync(resolve(at, 'agentscli-hub.yml')) ||
            io.existsSync(resolve(at, 'agentscli-compose.yml'))
          )
            throw new Error('Conflicting tool source/consumer/hub role.');
          return at;
        }
      }
    }
    const parent = dirname(at);
    if (parent === at)
      throw new Error(
        'Expected the private agentscli tool monorepo and verified workspace identities.',
      );
    at = parent;
  }
}
export function conventionFiles(root, io = fs) {
  const entry = resolve(root, 'AGENTS.md');
  regular(entry, io);
  const ast = tree(io.readFileSync(entry, 'utf8')),
    files = [];
  let active = false;
  const section = [];
  for (const node of ast.children) {
    if (node.type === 'heading' && node.depth <= 2)
      active = node.depth === 2 && /^conventions$/iu.test(plain(node).trim());
    if (active) section.push(node);
  }
  const starts = new Set();
  for (const node of section)
    walk(node, (item) => {
      if (item.position) starts.add(item.position.start.line);
    });
  for (const { target, line } of links(io.readFileSync(entry, 'utf8'))) {
    if (
      !starts.has(line) ||
      /^[a-z][a-z0-9+.-]*:/iu.test(target) ||
      target.startsWith('#')
    )
      continue;
    const path = resolve(root, decodeURIComponent(target.split(/[?#]/u)[0]));
    if (!path.endsWith('.md')) continue;
    checkPath(root, path, io);
    regular(path, io);
    files.push(path);
  }
  if (!files.length)
    throw new Error(
      'No handwritten conventions discovered from the root AGENTS Conventions section.',
    );
  return [...new Set(files)].sort();
}
export function resourceTarget(
  target,
  owner,
  { root, conventions, skillRoots },
) {
  if (target.startsWith('#')) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    throw new Error('Malformed encoded link target.');
  }
  if (/%[\da-f]{2}/iu.test(decoded))
    throw new Error('Ambiguous repeated URL encoding.');
  decoded = decoded.replaceAll('\\', '/');
  let remote = false;
  if (/^skill:\/\//iu.test(decoded)) return 'skill';
  if (/^[a-z][a-z0-9+.-]*:/iu.test(decoded) && !decoded.startsWith('file:')) {
    if (!/^https?:/iu.test(decoded)) return null;
    try {
      decoded = new URL(decoded).pathname;
      remote = true;
    } catch {
      return null;
    }
  }
  const lexical = key(decoded.split(/[?#]/u)[0]);
  if (
    /(?:^|\/)(?:\.agents\/skills|\.agentscli\/hub\/skills|skills)\/[^/]+/u.test(
      lexical,
    )
  )
    return 'skill';
  if (
    /(?:^|\/)(?:\.agentscli\/(?:templates\/|hub\/)?|docs\/)?conventions\/.+\.(?:tpl\.)?md$/u.test(
      lexical,
    )
  )
    return 'convention';
  if (remote) {
    if (conventions.some((file) => lexical.endsWith('/' + key(basename(file)))))
      return 'convention';
    return null;
  }
  const path = resolve(
    dirname(owner),
    decoded.split(/[?#]/u)[0].replace(/^file:\/\//u, ''),
  );
  if (
    key(path) !== key(owner) &&
    conventions.some((file) => key(file) === key(path))
  )
    return 'convention';
  if (
    skillRoots.some(
      (skill) =>
        key(path) === key(skill) || key(path).startsWith(key(skill) + sep),
    )
  )
    return 'skill';
  return null;
}
export function checkConvention(source, file, context) {
  const { value, body } = header(source);
  if (
    value &&
    (Object.keys(value).some((name) => name !== 'trigger') ||
      typeof value.trigger !== 'string' ||
      !value.trigger.trim())
  )
    throw new Error(
      `${file}: handwritten convention frontmatter, when present, supports only nonempty trigger.`,
    );
  walk(tree(body), (node) => {
    if (
      node.type === 'html' &&
      /<!--\s*(?:agentscli:requires|AGENT-CARD\s+(?:START|END))/u.test(
        node.value,
      )
    )
      throw new Error(
        `${file}: obsolete or forbidden convention dependency/card declaration.`,
      );
  });
  const headings = [];
  walk(tree(body), (node) => {
    if (node.type === 'heading' && node.depth === 1) headings.push(plain(node));
  });
  if (
    headings.length !== 1 ||
    !slug(headings[0]) ||
    basename(file) !== `${slug(headings[0])}.md`
  )
    throw new Error(`${file}: expected one H1 and its canonical filename.`);
  for (const link of links(body + (value ? `\n${value.trigger}` : ''))) {
    const kind = resourceTarget(link.target, file, context);
    if (kind)
      throw new Error(
        `${file}:${link.line}: convention cannot link to ${kind}: ${link.target}`,
      );
  }
  return [];
}
export function checkOwnSkill(source, file, context) {
  const { value, body } = header(source);
  const allowed = [
    'name',
    'description',
    'license',
    'compatibility',
    'metadata',
    'allowed-tools',
  ];
  if (
    !value ||
    Object.keys(value).some((name) => !allowed.includes(name)) ||
    value.name !== basename(dirname(file)) ||
    typeof value.description !== 'string' ||
    !value.description.trim()
  )
    throw new Error(`${file}: invalid standard skill frontmatter.`);
  if (
    value.metadata !== undefined &&
    (!value.metadata ||
      typeof value.metadata !== 'object' ||
      Array.isArray(value.metadata) ||
      Object.values(value.metadata).some((v) => typeof v !== 'string'))
  )
    throw new Error(`${file}: metadata values must be strings.`);
  const own = dirname(file);
  if (Object.hasOwn(value.metadata ?? {}, 'requires'))
    throw new Error(
      `${file}: metadata.requires is unsupported; use metadata.agentscli.`,
    );
  if (
    value.metadata?.agentscli !== undefined &&
    value.metadata.agentscli !== 'agentscli-skill.yml'
  )
    throw new Error(
      `${file}: metadata.agentscli must point to agentscli-skill.yml.`,
    );
  walk(tree(body), (node) => {
    if (node.type === 'html' && /agentscli:requires/u.test(node.value))
      throw new Error(`${file}: obsolete skill dependency comment.`);
  });
  for (const link of links(body)) {
    let decoded;
    try {
      decoded = decodeURIComponent(link.target.split(/[?#]/u)[0]);
    } catch {
      throw new Error('Malformed encoded skill link.');
    }
    const ownTarget = resolve(own, decoded);
    if (
      !/(?:^|[\\/])(?:\.agents[\\/]skills|\.agentscli|skills)[\\/]/iu.test(
        decoded,
      ) &&
      !/^[a-z][a-z0-9+.-]*:/iu.test(link.target) &&
      (key(ownTarget) === key(own) || key(ownTarget).startsWith(key(own) + sep))
    )
      continue;
    const kind = resourceTarget(link.target, file, context);
    if (kind)
      throw new Error(
        `${file}:${link.line}: discover external ${kind} by identity instead of linking: ${link.target}`,
      );
  }
  const pathMentions =
    body.match(
      /(?:\.?\.?\/|[A-Za-z]:[\\/])?(?:[a-zA-Z0-9_.-]+[\\/])+(?:[a-zA-Z0-9_.-]+)/gu,
    ) ?? [];
  for (const mention of pathMentions) {
    const target = mention.replaceAll('\\', '/');
    const ownNamed = new RegExp(`(?:^|/)${basename(own)}(?:/|$)`, 'u').test(
      target,
    );
    const absolute = resolve(own, target);
    const ownRelative =
      !target.includes('.agents/skills/') &&
      !target.includes('.agentscli/') &&
      (key(absolute) === key(own) || key(absolute).startsWith(key(own) + sep));
    if (!ownNamed && !ownRelative && resourceTarget(target, file, context))
      throw new Error(`${file}: hardcoded foreign resource path: ${mention}`);
  }
  return value;
}
export function context(root, io = fs) {
  const conventions = conventionFiles(root, io),
    skillRoots = [];
  for (const base of [
    '.agents/skills',
    'packages/agentscli/assets/templates/skills',
    'packages/agentscli-hub/assets/templates/skills',
  ]) {
    const path = resolve(root, base);
    if (!io.existsSync(path)) continue;
    for (const name of io.readdirSync(path)) {
      const item = resolve(path, name);
      if (
        io.lstatSync(item).isDirectory() &&
        io.existsSync(resolve(item, 'SKILL.md'))
      )
        skillRoots.push(item);
    }
  }
  return {
    root,
    conventions,
    skillRoots,
    localSkills: skillRoots.filter(
      (path) =>
        dirname(path) === resolve(root, '.agents/skills') &&
        basename(path).startsWith('agentscli-adm-'),
    ),
  };
}
export function skillConfiguration(input, file) {
  let source;
  try {
    source =
      typeof input === 'string'
        ? input
        : new TextDecoder('utf-8', { fatal: true }).decode(input);
  } catch {
    throw new Error(`${file}: configuration must be valid UTF-8.`);
  }
  const value = yaml(source);
  if (Object.keys(value).some((name) => name !== 'requires'))
    throw new Error(
      `${file}: only the optional requires section is supported.`,
    );
  if (!Object.hasOwn(value, 'requires')) return [];
  if (!Array.isArray(value.requires))
    throw new Error(`${file}: requires must be a YAML array of skills.`);
  const seen = new Set();
  for (const ref of value.requires) {
    if (
      !ref ||
      typeof ref !== 'object' ||
      Array.isArray(ref) ||
      Object.keys(ref).sort().join(',') !== 'id,source' ||
      typeof ref.id !== 'string' ||
      ref.id.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(ref.id) ||
      !['local', 'hub'].includes(ref.source)
    )
      throw new Error(
        `${file}: skill requirements need a safe id and local/hub source.`,
      );
    const identity = `${ref.source}:${key(ref.id)}`;
    if (seen.has(identity))
      throw new Error(`${file}: duplicate skill dependency ${identity}.`);
    seen.add(identity);
  }
  return value.requires;
}
export function requirements(skill, info, ctx, io = fs, visited = new Set()) {
  if (visited.has(key(skill))) return;
  visited.add(key(skill));
  const file = resolve(skill, 'agentscli-skill.yml');
  if (
    Object.hasOwn(info.metadata ?? {}, 'requires') ||
    io.existsSync(resolve(skill, 'requires.yml'))
  )
    throw new Error(
      `${skill}: metadata.requires and requires.yml are unsupported.`,
    );
  const pointer = info.metadata?.agentscli;
  if (pointer === undefined) {
    if (io.existsSync(file))
      throw new Error(
        `${file}: declare metadata.agentscli: agentscli-skill.yml.`,
      );
    return;
  }
  if (pointer !== 'agentscli-skill.yml')
    throw new Error(
      `${skill}: metadata.agentscli must point to agentscli-skill.yml.`,
    );
  if (!io.existsSync(file))
    throw new Error(`${file}: missing declared skill configuration.`);
  checkPath(ctx.root, file, io);
  regular(file, io);
  const dependencies = skillConfiguration(io.readFileSync(file), file);
  for (const ref of dependencies) {
    const target =
      ref.source === 'local'
        ? ctx.localSkills.find((path) => key(basename(path)) === key(ref.id))
        : undefined;
    if (!target)
      throw new Error(
        `${file}: missing skills dependency ${ref.id} from ${ref.source}.`,
      );
    const entry = resolve(target, 'SKILL.md');
    checkPath(ctx.root, entry, io);
    regular(entry, io);
    const data = checkOwnSkill(io.readFileSync(entry, 'utf8'), entry, ctx);
    requirements(target, data, ctx, io, visited);
  }
}
