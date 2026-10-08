import { spawnSync } from 'node:child_process';

const envFile = process.argv[2];
if (!envFile) {
  throw new Error('Pass an environment file, for example .env.production');
}

process.loadEnvFile(envFile);

const result = spawnSync(
  process.execPath,
  ['./node_modules/next/dist/bin/next', 'build', '--webpack'],
  { stdio: 'inherit', env: process.env },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
