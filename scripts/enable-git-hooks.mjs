import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const gitRootResult = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

if (gitRootResult.status !== 0) {
  process.stdout.write('No Git worktree found; skipping hook activation.\n');
  process.exit(0);
}

if (gitRootResult.stdout.trim() !== projectRoot.replace(/\/$/, '')) {
  process.stdout.write('Project is inside another Git worktree; skipping hook activation.\n');
  process.exit(0);
}

const configureHooks = spawnSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (configureHooks.status !== 0) {
  process.exitCode = configureHooks.status ?? 1;
}
