import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
    const generatedDir = process.env.GENERATED_DIR ?? 'test-data';
    const dirPath = path.resolve(process.cwd(), generatedDir);

    if (!fs.existsSync(dirPath)) return;

    // Delete only .json files generated per sheet
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(dirPath, file);

        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted generated file: ${file}`);
        } catch (err) {
            console.log(`Failed to delete ${file}:`, err);
        }
    }
}
