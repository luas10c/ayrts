import { transformFile } from '@swc/core';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import constants from '../config/constants.js';
async function build(item) {
    try {
        const { code } = await transformFile(path.join(constants.relativePath, item.entrypoint, item.path), {
            jsc: {
                baseUrl: path.join(constants.relativePath, item.entrypoint),
                parser: {
                    syntax: 'typescript',
                    decorators: true,
                    tsx: false
                },
                target: 'es2021',
                paths: {
                    '#/*': ['./src/*'],
                    '@/*': ['./src/*']
                }
            },
            module: {
                strict: true,
                type: 'es6'
            }
        });
        const { dir, name } = path.parse(item.path);
        console.log('Arquivo transpilado', path.join(constants.relativePath, 'dist', dir, `${name}.js`));
        await writeFile(path.join(constants.relativePath, 'dist', dir, `${name}.js`), code);
    }
    catch { }
}
export const swc = {
    build
};
export default swc;
