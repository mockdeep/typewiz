import { getTypeCollectorSnippet } from 'typewiz-core';
import { Compiler } from 'webpack';
import { ConcatSource } from 'webpack-sources';

interface IChunk {
    files: string[];
}

type Compilation = any;

function reporterSnippet(url = '/__typewiz_report', interval = 1000) {
    return `
        if (!$_$twiz.timer) {
            $_$twiz.timer = setInterval(function() {
                var xhr = new XMLHttpRequest();
                xhr.open('post', ${JSON.stringify(url)});
                xhr.send(JSON.stringify($_$twiz.get()));
            }, ${interval});
        }
    `;
}

export class TypewizPlugin {
    private typeCollectorSnippet = getTypeCollectorSnippet();
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
            this.typeCollectorSnippet,
            reporterSnippet(),
            compilation.assets[fileName],
        );
    }

    private wrapChunks(compilation: Compilation, chunks: IChunk[]) {
        chunks.forEach((chunk) => {
            chunk.files.forEach((fileName) => {
                if (/\.js$/i.test(fileName)) {
                    this.wrapFile(compilation, fileName);
                }
            });
        });
    }
}
