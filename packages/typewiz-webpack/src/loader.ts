import { instrument } from 'typewiz';
import { loader } from 'webpack';

export function typewizLoader(this: loader.LoaderContext, source: string | null) {
    const filename = this.resourcePath;
    if (source && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
        instrument(source, filename);
    }
    return source;
}
