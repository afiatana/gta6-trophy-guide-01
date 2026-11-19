// Leonida Ledger — the program that hands the guide in (Node 22, standard
// library only). It copies the guide's app/ folder and its screenshots/
// folder from beside this file into the output directory, then writes
// /output/dossier.json with the vendored make.fun library, so the sealed
// scorer can check the entry and the judge can read it. Outside the
// grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it: the
// scorer rebuilds the dossier with its own copy and compares the two byte
// for byte.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps from the kit's reference/gate.json: only text_max_bytes
// shapes the dossier's bytes; the others refuse an entry the scorer would
// refuse anyway (more than 4 screenshots or one over 256 KiB; more than 993
// files and directories in app/ or 48 MiB of app files — app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
