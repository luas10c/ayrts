import { readdir, mkdir, stat } from 'node:fs/promises';
import { fork } from 'node:child_process';
import { rimraf } from 'rimraf';
import path from 'node:path';
import chalk from 'chalk';
import * as emoji from 'node-emoji';
import { terminal } from './utils/terminal.js';
import { constants } from './config/constants.js';
import { swc } from './builders/swc.js';
import { pids } from './config/pids.js';
async function* scan() {
    const entrypoint = process.argv
        .filter((item) => item.match(/(?:js|ts)/))
        .join()
        .split(',')
        .at(1)
        .split('/')
        .at(0);
    const pathname = path.resolve(path.join(constants.relativePath, entrypoint));
    const allPaths = await readdir(pathname, {
        recursive: true
    });
    for (const pathItem of allPaths) {
        if (pathItem.match(/node_modules|dist|.git|.github/)) {
            continue;
        }
        const info = await stat(path.resolve(path.join(pathname, pathItem)));
        if (info.isDirectory()) {
            yield {
                isFile: false,
                entrypoint,
                path: pathItem
            };
        }
        const extensions = ['.ts', '.js'];
        if (!extensions.includes(path.extname(pathItem))) {
            continue;
        }
        yield {
            isFile: info.isFile(),
            entrypoint,
            path: pathItem
        };
    }
}
export async function builder() {
    const start = performance.now();
    try {
        terminal.clear();
        await rimraf(path.join(constants.relativePath, 'dist'));
        await mkdir(path.join(constants.relativePath, 'dist'));
        for await (const item of scan()) {
            if (!item.isFile) {
                await mkdir(path.join(constants.relativePath, 'dist', item.path));
                continue;
            }
            await swc.build(item);
        }
        for (const pid of pids.values()) {
            try {
                process.kill(pid, 'SIGTERM');
            }
            catch { }
            pids.delete(pid);
        }
        const { pid } = fork(path.join(constants.relativePath, 'dist', 'main.js'));
        if (pid) {
            pids.add(pid);
        }
        const end = performance.now();
        console.log(chalk.green(`${emoji.get('heavy_check_mark')} Ready in ${Math.round(end - start)}ms`));
    }
    catch (error) {
        console.log(chalk.red(`${emoji.get('heavy_multiplication_x')} Failed to compile`));
        console.log(error);
    }
}
export default builder;
