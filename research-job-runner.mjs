import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { open, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const jobDir = process.argv[2];
const resultPath = join(jobDir, 'result.json');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const job = JSON.parse(await readFile(join(jobDir, 'job.json'), 'utf8'));
const startedAt = new Date().toISOString();
let result;
let log;
let timeout;
try {
  const script = join(job.workspace, job.script_path);
  if (sha256(await readFile(script)) !== job.script_sha256) throw new Error('Research job script changed after submission.');
  log = await open(join(jobDir, 'job.log'), 'a');
  const child = spawn(job.python, [script, ...job.arguments], {
    cwd: job.workspace, env: process.env, detached: true,
    stdio: ['ignore', log.fd, log.fd],
  });
  let timedOut = false;
  timeout = setTimeout(() => {
    timedOut = true;
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }, job.max_runtime_minutes * 60_000);
  const { code, signal } = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  result = { status: code === 0 && !timedOut ? 'complete' : 'failed', exit_code: code,
    signal, timed_out: timedOut, started_at_utc: startedAt, finished_at_utc: new Date().toISOString() };
} catch (error) {
  result = { status: 'failed', exit_code: null, error: String(error.message || error).slice(0, 1000),
    timed_out: false, started_at_utc: startedAt, finished_at_utc: new Date().toISOString() };
} finally {
  if (timeout) clearTimeout(timeout);
  if (log) await log.close();
  const temporary = join(jobDir, 'result.json.tmp');
  await writeFile(temporary, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, resultPath);
}
