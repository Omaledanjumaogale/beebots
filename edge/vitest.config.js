import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['edge/**/*.test.js'],maxWorkers:1}});
