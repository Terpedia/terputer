import { access, readFile, realpath } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = fileURLToPath(new URL('.', import.meta.url));
const slugPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;

async function command(file, args) {
  try {
    const { stdout } = await run(file, args, { cwd: root, timeout: 120_000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    throw new Error(String(error.stderr || error.message || error).trim().slice(0, 1000));
  }
}

async function githubUser() {
  const user = JSON.parse(await command('gh', ['api', 'user']));
  if (!/^[A-Za-z0-9-]{1,39}$/.test(user.login || '')) throw new Error('GitHub CLI is not authenticated. Run gh auth login in this Codespace.');
  return user.login;
}

async function reportRepository() {
  const remote = await command('git', ['remote', 'get-url', 'origin']);
  const match = remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9-]+)\/terpedia-report(?:\.git)?$/);
  if (!match) throw new Error('Open your username/terpedia-report fork in Codespaces before managing project submodules.');
  const user = await githubUser();
  if (match[1].toLowerCase() !== user.toLowerCase()) throw new Error('This report repository is not owned by the authenticated GitHub user.');
  return user;
}

export async function forkReportWorkspace(session = process.env.TERPUTER_GITHUB_SESSION) {
  if (session) {
    const base = (process.env.TERPEDIA_CHAT_API_URL || 'https://api.terpedia.com').replace(/\/$/, '');
    const response = await fetch(`${base}/api/github/research/report-workspace`, {
      method: 'POST', headers: { authorization: `Bearer ${session}` }, signal: AbortSignal.timeout(30_000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Report workspace creation failed (${response.status})`);
    return result;
  }
  const user = await githubUser();
  const existing = await run('gh', ['api', `repos/${user}/terpedia-report`], { cwd: root }).catch(() => null);
  if (existing) {
    const repo = JSON.parse(existing.stdout);
    if (repo.parent?.full_name !== 'Terpedia/terputer') throw new Error(`${user}/terpedia-report already exists and is not a fork of Terpedia/terputer.`);
    return { repository: repo.html_url, codespace_url: `https://github.com/codespaces/new?repo=${repo.id}`, created: false };
  }
  const source = JSON.parse(await command('gh', ['api', 'repos/Terpedia/terputer']));
  if (source.private) throw new Error('Terpedia/terputer must be public before users can fork it.');
  const repo = JSON.parse(await command('gh', ['api', '-X', 'POST', 'repos/Terpedia/terputer/forks', '-f', 'name=terpedia-report', '-F', 'default_branch_only=true']));
  return { repository: repo.html_url, codespace_url: `https://github.com/codespaces/new?repo=${repo.id}`, created: true };
}

export async function listResearchProjects() {
  const output = await command('git', ['submodule', 'status', '--', 'projects']);
  return { projects: output ? output.split('\n').map((line) => {
    const match = line.match(/^([ +\-U])([0-9a-f]{40})\s+projects\/([a-z0-9-]+)(?:\s|$)/);
    return match ? { slug: match[3], commit: match[2], initialized: match[1] !== '-', changed: match[1] === '+' } : null;
  }).filter(Boolean) : [] };
}

export async function resolveResearchWorkspace(slug) {
  if (slug == null || slug === '') return root;
  if (!slugPattern.test(slug)) throw new Error('Invalid project slug.');
  const remote = await command('git', ['remote', 'get-url', 'origin']);
  const owner = remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9-]+)\/terpedia-report(?:\.git)?$/)?.[1];
  if (!owner) throw new Error('Project-scoped tools require a terpedia-report fork checkout.');
  const path = `projects/${slug}`;
  const entry = `submodule.${path}`;
  const configPath = await command('git', ['config', '-f', '.gitmodules', '--get', `${entry}.path`]);
  const configUrl = await command('git', ['config', '-f', '.gitmodules', '--get', `${entry}.url`]);
  if (configPath !== path || configUrl.replace(/\.git$/, '').toLowerCase() !== `https://github.com/${owner}/terpedia-${slug}`.toLowerCase()) {
    throw new Error(`Unrecognized research submodule: ${path}`);
  }
  const indexed = await command('git', ['ls-files', '--stage', '--', path]);
  if (!indexed.startsWith('160000 ')) throw new Error(`${path} is not staged as a Git submodule.`);
  const absolute = await realpath(join(root, path)).catch(() => { throw new Error(`Initialize ${path} with git submodule update --init.`); });
  if (!absolute.startsWith(await realpath(root) + sep)) throw new Error('Project path leaves the report workspace.');
  const checkout = await realpath(await command('git', ['-C', absolute, 'rev-parse', '--show-toplevel']));
  if (checkout !== absolute) throw new Error(`${path} is not an initialized project checkout.`);
  return absolute;
}

export async function addResearchProjectSubmodule({ slug, repository }) {
  const user = await reportRepository();
  if (!slugPattern.test(slug || '')) throw new Error('Use a lowercase project slug with letters, numbers, and hyphens.');
  const expected = `https://github.com/${user}/terpedia-${slug}`;
  if (repository && repository.replace(/\.git$/, '').toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`The project repository must be ${expected}.`);
  }
  const path = `projects/${slug}`;
  const registered = await run('git', ['config', '-f', '.gitmodules', '--get', `submodule.${path}.url`], { cwd: root }).catch(() => null);
  if (registered) {
    const url = registered.stdout.trim().replace(/\.git$/, '');
    if (url.toLowerCase() !== expected.toLowerCase()) throw new Error(`${path} already points to a different repository.`);
    await command('git', ['submodule', 'update', '--init', '--', path]);
    return { path, repository: expected, commit: await command('git', ['-C', path, 'rev-parse', 'HEAD']), staged: false, alreadyAttached: true };
  }
  await access(join(root, path)).then(() => { throw new Error(`${path} already exists.`); }).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  const repo = JSON.parse(await command('gh', ['api', `repos/${user}/terpedia-${slug}`]));
  if (repo.owner?.login?.toLowerCase() !== user.toLowerCase()) throw new Error('Project repository is not owned by the authenticated user.');
  await command('git', ['submodule', 'add', repo.clone_url, path]);
  await command('git', ['add', '--', '.gitmodules', path]);
  const commit = await command('git', ['-C', path, 'rev-parse', 'HEAD']);
  return { path, repository: repo.html_url, commit, staged: true, next: 'Review and commit the staged .gitmodules and submodule pointer, then push your report repository.' };
}

export async function updateResearchProjectSubmodule({ slug }) {
  await reportRepository();
  if (!slugPattern.test(slug || '')) throw new Error('Invalid project slug.');
  const path = `projects/${slug}`;
  const modules = await readFile(join(root, '.gitmodules'), 'utf8').catch(() => '');
  if (!modules.includes(`path = ${path}`)) throw new Error(`${path} is not a registered research submodule.`);
  await command('git', ['submodule', 'update', '--init', '--remote', '--', path]);
  await command('git', ['add', '--', path]);
  return { path, commit: await command('git', ['-C', path, 'rev-parse', 'HEAD']), staged: true, next: 'Review the new project revision, then commit and push the report repository.' };
}
