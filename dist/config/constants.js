const relativePath = process.cwd();
const entrypoint = process.argv
    .filter((item) => item.match(/(?:js|ts)/))
    .join()
    .split(',')
    .at(1)
    .split('/')
    .at(0);
export const constants = {
    relativePath,
    entrypoint
};
export default constants;
