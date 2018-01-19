import { getTypeCollectorSnippet } from 'typewiz';
import { Compiler } from 'webpack';
import { ConcatSource } from 'webpack-sources';

interface IChunk {
    files: string[];
}

type Compilation = any;

export class TypewizPlugin {
    public apply(compiler: Compiler) {
        compiler.plugin('compilation', (compilation) => {
            compilation.plugin('optimize-chunk-assets', (chunks: IChunk[], done: () => void) => {
                this.wrapChunks(compilation, chunks);
                done();
            });
        });
    }

    private wrapFile(compilation: Compilation, fileName: string) {
        compilation.assets[fileName] = new ConcatSource(
            String(getTypeCollectorSnippet()),
            compilation.assets[fileName],
        );
    }

    private wrapChunks(compilation: Compilation, chunks: IChunk[]) {
        chunks.forEach((chunk) => {
            chunk.files.forEach((fileName) => {
                this.wrapFile(compilation, fileName);
            });
        });
    }
}
