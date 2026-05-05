import { fileURLToPath } from 'node:url';
import path from 'node:path';
import createNestEslint from '@hackersdeal/config/eslint/nest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createNestEslint(__dirname);
