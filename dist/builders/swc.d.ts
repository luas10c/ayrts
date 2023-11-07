interface Item {
    entrypoint: string;
    path: string;
}
declare function build(item: Item): Promise<void>;
export declare const swc: {
    build: typeof build;
};
export default swc;
