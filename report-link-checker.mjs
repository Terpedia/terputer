import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));

function manifestPath(value, workspaceRoot) {
  const path = resolve(workspaceRoot, String(value || ''));
  const name = relative(workspaceRoot, path);
  if (!name.startsWith(`research${sep}`) || !name.endsWith('.json')) {
    throw new Error('Expected a JSON report specification under research/');
  }
  return path;
}

async function statusFor(url) {
  const options = { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Terputer report link audit' } };
  let response;
  try {
    response = await fetch(url, { ...options, method: 'HEAD' });
    if ([403, 405, 501].includes(response.status)) {
      response = await fetch(url, { ...options, headers: { ...options.headers, range: 'bytes=0-0' } });
    }
    await response.body?.cancel();
    const final = new URL(response.url);
    return { status: response.status, final_location: `${final.origin}${final.pathname}`, outcome: response.ok ? 'reachable' : 'http_error' };
  } catch (error) {
    return { status: null, outcome: 'unknown', reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function checkReportLinks(specification, workspaceRoot = root) {
  const selected = manifestPath(specification, workspaceRoot);
  const actual = relative(await realpath(workspaceRoot), await realpath(selected));
  if (!actual.startsWith(`research${sep}`)) throw new Error('Report specification leaves the research workspace');
  const spec = JSON.parse(await readFile(selected, 'utf8'));
  const records = [
    ...(spec.sources || []).map((source) => ({ kind: 'source', id: source.id, url: source.url })),
    ...(spec.data_inputs || []).map((input) => ({ kind: 'data_input', id: input.path, url: input.url })),
  ];
  const results = [];
  for (const record of records) {
    let url;
    try {
      url = new URL(record.url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Expected a public HTTP(S) URL without credentials');
      results.push({ ...record, ...(await statusFor(url.toString())) });
    } catch (error) {
      results.push({ ...record, status: null, outcome: 'invalid', reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return { specification, checked: results.length, reachable: results.filter((item) => item.outcome === 'reachable').length,
    http_errors: results.filter((item) => item.outcome === 'http_error').length,
    unknown: results.filter((item) => item.outcome === 'unknown').length,
    invalid: results.filter((item) => item.outcome === 'invalid').length, results };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const specification = process.argv[2];
  if (!specification) { console.error('Usage: node report-link-checker.mjs research/<project>/report-spec.json'); process.exitCode = 2; }
  else checkReportLinks(specification).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (result.http_errors || result.invalid || result.unknown) process.exitCode = 1;
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
