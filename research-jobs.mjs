import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, open, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const jobsRoot = join(root, '.terputer', 'jobs');
const jobIdPattern = /^[a-f0-9-]{36}$/;

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }

export async function startResearchJob(args, activeRoot) {
  const scriptPath = String(args.script_path || '');
  if (!/^research\/[A-Za-z0-9._/-]+\.py$/.test(scriptPath)
      || scriptPath.split('/').some((part) => part.startsWith('.') || part === '..')) {
    throw new Error('Research jobs require a Python script under research/ without hidden or parent paths.');
  }
  const realWorkspace = await realpath(activeRoot);
  const script = resolve(activeRoot, scriptPath);
  const actual = await realpath(script);
  if (actual !== join(realWorkspace, scriptPath) || !actual.startsWith(join(realWorkspace, 'research') + sep)
      || !(await stat(actual)).isFile()) {
    throw new Error('Research job script must be a regular file inside the selected workspace.');
  }
  const argv = args.arguments ?? [];
  if (!Array.isArray(argv) || argv.length > 20 || argv.some((value) => typeof value !== 'string' || value.length > 300 || value.includes('\0'))) {
    throw new Error('Research job accepts at most 20 string arguments of at most 300 characters.');
  }
  const maxRuntimeMinutes = args.max_runtime_minutes === undefined ? 360 : args.max_runtime_minutes;
  if (!Number.isInteger(maxRuntimeMinutes) || maxRuntimeMinutes < 1 || maxRuntimeMinutes > 720) {
    throw new Error('max_runtime_minutes must be an integer from 1 to 720.');
  }
  const jobId = randomUUID();
  const jobDir = join(jobsRoot, jobId);
  await mkdir(jobDir, { recursive: true, mode: 0o700 });
  const job = {
    schema_version: 1, job_id: jobId, workspace: realWorkspace,
    script_path: scriptPath, script_sha256: sha256(await readFile(actual)),
    arguments: argv, max_runtime_minutes: maxRuntimeMinutes,
    python: process.env.TERPUTER_PYTHON || 'python3',
    queued_at_utc: new Date().toISOString(),
  };
  await writeFile(join(jobDir, 'job.json'), `${JSON.stringify(job, null, 2)}\n`, { mode: 0o600 });
  const runner = spawn(process.execPath, [join(root, 'research-job-runner.mjs'), jobDir], {
    cwd: realWorkspace, detached: true, stdio: 'ignore', env: process.env,
  });
  await new Promise((resolve, reject) => {
    runner.once('spawn', resolve);
    runner.once('error', reject);
  });
  runner.unref();
  await writeFile(join(jobDir, 'runner.json'), `${JSON.stringify({ pid: runner.pid })}\n`, { mode: 0o600 });
  return { jobId, status: 'queued', scriptPath, maxRuntimeMinutes };
}

export async function getResearchJob(args, activeRoot) {
  const jobId = String(args.job_id || '');
  if (!jobIdPattern.test(jobId)) throw new Error('Invalid research job ID.');
  const jobDir = join(jobsRoot, jobId);
  const job = JSON.parse(await readFile(join(jobDir, 'job.json'), 'utf8'));
  if (job.workspace !== await realpath(activeRoot)) throw new Error('Research job belongs to another workspace.');
  const result = await readFile(join(jobDir, 'result.json'), 'utf8').then(JSON.parse).catch(() => null);
  let status = result?.status;
  if (!status) {
    const runner = await readFile(join(jobDir, 'runner.json'), 'utf8').then(JSON.parse).catch(() => null);
    if (!runner?.pid) status = 'queued';
    else {
      try { process.kill(runner.pid, 0); status = 'running'; }
      catch (error) { status = error.code === 'ESRCH' ? 'unknown' : 'running'; }
    }
  }
  let logTail = '';
  const log = join(jobDir, 'job.log');
  const handle = await open(log, 'r').catch(() => null);
  if (handle) {
    try {
      const size = (await handle.stat()).size;
      const buffer = Buffer.alloc(Math.min(4000, size));
      await handle.read(buffer, 0, buffer.length, size - buffer.length);
      logTail = buffer.toString('utf8');
    } finally { await handle.close(); }
  }
  return { jobId, status, scriptPath: job.script_path, queuedAt: job.queued_at_utc,
    startedAt: result?.started_at_utc || null, finishedAt: result?.finished_at_utc || null,
    exitCode: result?.exit_code ?? null, timedOut: result?.timed_out || false,
    scriptSha256: job.script_sha256, error: result?.error || null, logTail };
}
