import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TEST_DIRS = ['tests', 'pages', 'fixtures', 'utils'];

const FORBIDDEN_PATTERNS = [
    { pattern: /\btest\.only\s*\(/, message: 'test.only() found' },
    { pattern: /\btest\.describe\.only\s*\(/, message: 'test.describe.only() found' },
    { pattern: /\bdescribe\.only\s*\(/, message: 'describe.only() found' },

    { pattern: /\btest\.skip\s*\(/, message: 'test.skip() found' },
    { pattern: /\btest\.describe\.skip\s*\(/, message: 'test.describe.skip() found' },
    { pattern: /\bdescribe\.skip\s*\(/, message: 'describe.skip() found' },

    { pattern: /\.pause\s*\(\s*\)/, message: 'page.pause() found' },
];

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue;
            walk(fullPath, files);
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

let hasErrors = false;

for (const dir of TEST_DIRS) {
    const fullDir = path.join(ROOT, dir);
    const files = walk(fullDir);

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');

        for (const rule of FORBIDDEN_PATTERNS) {
            if (rule.pattern.test(content)) {
                console.error(`${rule.message} in file: ${file}`);
                hasErrors = true;
            }
        }
    }
}

if (hasErrors) {
    console.error('\n Forbidden Playwright patterns detected. Fix and push again.\n');
    process.exit(1);
}

console.log('Forbidden pattern check passed.');
