import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundleDirectory = fileURLToPath(
  new URL('../dist/assistant-spa/browser/', import.meta.url),
);
const inspectedExtensions = new Set(['.css', '.html', '.js', '.json']);
const forbiddenValues = [
  { label: 'localhost endpoint', pattern: /localhost/i },
  { label: 'loopback endpoint', pattern: /127\.0\.0\.1/ },
  { label: 'client secret field', pattern: /client[_-]?secret/i },
  { label: 'private key marker', pattern: /BEGIN (?:RSA |EC )?PRIVATE KEY/ },
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );

  return files.flat();
}

const files = (await listFiles(bundleDirectory)).filter((file) =>
  inspectedExtensions.has(extname(file)),
);

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const forbiddenValue = forbiddenValues.find(({ pattern }) => pattern.test(content));

  if (forbiddenValue) {
    throw new Error(`${forbiddenValue.label} found in ${file}`);
  }
}

console.log(`Production bundle verified (${files.length} files inspected).`);
