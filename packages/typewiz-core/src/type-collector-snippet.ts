import { IExtraOptions } from './instrument';

class NestError extends Error {}

export type ISourceLocation = [string, number]; /* filename, offset */
export type ISourceLocationAndType = [string, number, string | null]; /* filename, offset, type */

export interface ICollectedTypeEntry extends IExtraOptions {
    types: Array<string | ISourceLocationAndType>;
}

export interface IFileTypeInfo {
    [key: number]: ICollectedTypeEntry;
    hash: string;
}

export interface IHashDictionary {
    [key: string]: string;
}

export interface ICollectedTypeInfo {
    [key: string]: IFileTypeInfo;
}

let typeNameRunning = false;
export function getTypeName(value: any, nest = 0): string | null {
    if (nest === 0 && typeNameRunning) {
        throw new NestError('Called getTypeName() while it was already running');
    }
    typeNameRunning = true;

    try {
        if (nest === 5) {
            throw new NestError('NestError');
        }
        if (value === null) {
            return 'null';
        }
        if (['undefined', 'number', 'string', 'boolean'].indexOf(typeof value) >= 0) {
            return typeof value;
        }
        if (value instanceof Array) {
            const itemTypes = Array.from(new Set(value.map((v) => getTypeName(v, nest + 1)))).filter((t) => t !== null);
            if (itemTypes.length === 0) {
                return null;
            }
            if (itemTypes.length === 1) {
                return itemTypes[0] + '[]';
            }
            return `Array<${itemTypes.sort().join('|')}>`;
        }
        if (value instanceof Function) {
            const result = getFunctionType(value);
            if (result) {
                return result;
            }
        }
        if (value.constructor && value.constructor.name) {
            const { name } = value.constructor;
            if (name === 'Object') {
                return getObjectTypes(value, nest);
            } else {
                return name;
            }
        }

        return typeof value;
    } finally {
        if (nest === 0) {
            typeNameRunning = false;
        }
    }
}

function getFunctionType(value: any): string | undefined {
    let argsStr: string = '';
    try {
        argsStr = value.toString().split('=>')[0];
    } catch (err) {
        // toString() could throw an error
        return 'Function';
    }

    // make sure argsStr is in a form of (arg1,arg2) for the following cases
    // fn = a => 3
    // fn = (a) => 3
    // function fn(a) { return 3 }

    argsStr = argsStr.includes('(') ? (argsStr.match(/\(.*?\)/gi) || '()')[0] : `(${argsStr})`;
    const args: string[] = argsStr
        .replace(/[()]/g, '')
        .split(',')
        .filter((e: string) => e !== '');

    const typedArgs = args.map((arg) => {
        let [name] = arg.split('=');
        name = name.trim();

        if (name.includes('[')) {
            const nakedName = name.replace(/\[|\]/gi, '').trim();
            name = `${nakedName}Array`;
            return `${name}: any`;
        }
        if (name.includes('{')) {
            const nakedName = name.replace(/\{|\}/gi, '').trim();
            name = `${nakedName}Object: {${nakedName}: any}`;
            return `${name}`;
        }
        if (name.includes('...')) {
            name = `${name}Array: any[]`;
            return `${name}`;
        }

        return `${name}: any`;
    });

    return `(${typedArgs}) => any`;
}

function getObjectTypes(obj: any, nest: number): string {
    const keys = Object.keys(obj).sort();
    if (keys.length === 0) {
        return '{}';
    }
    const keyValuePairs = keys.map((key) => `${escapeSpecialKey(key)}: ${getTypeName(obj[key], nest + 1)}`);
    return `{ ${keyValuePairs.join(', ')} }`;
}

function escapeSpecialKey(key: string) {
    const hasSpecialCharacters = !key.match(/^[a-z0-9_]+$/i);
    if (hasSpecialCharacters) {
        return JSON.stringify(key);
    }
    return key;
}

const collectedTypes: ICollectedTypeInfo = {};
const trackedObjects = new WeakMap<object, ISourceLocation>();

function getOrCreateFile(name: string, hash: string) {
    if (!collectedTypes[name]) {
        collectedTypes[name] = {
            hash,
        };
    }
    return collectedTypes[name];
}

export function $_$twiz(value: any, pos: number, filename: string, optsJson: string, hash: string) {
    const opts = JSON.parse(optsJson) as ICollectedTypeInfo;
    const objectDeclaration = trackedObjects.get(value) || null;
    try {
        const typeName = getTypeName(value);
        const fileInfo = getOrCreateFile(filename, hash);
        if (!fileInfo[pos]) {
            fileInfo[pos] = {
                types: [],
                ...opts,
            };
        }
        const typeOptions = fileInfo[pos].types;
        if (objectDeclaration) {
            const [source, offset] = objectDeclaration;
            if (
                !typeOptions.find((item) => {
                    if (typeof item !== 'string') {
                        const [s, o, t] = item;
                        return s === source && o === offset && t === typeName;
                    }
                    return false;
                })
            ) {
                typeOptions.push([source, offset, typeName]);
            }
        } else if (typeName) {
            if (typeOptions.indexOf(typeName) < 0) {
                typeOptions.push(typeName);
            }
        }
    } catch (e) {
        if (e instanceof NestError) {
            // simply ignore the type
            return;
        }
        throw e;
    }
}

// tslint:disable:no-namespace
export namespace $_$twiz {
    export const typeName = getTypeName;
    export const get = () => collectedTypes;
    export const track = (value: any, filename: string, offset: number, hash: string) => {
        getOrCreateFile(filename, hash);
        if (value && (typeof value === 'object' || typeof value === 'function')) {
            trackedObjects.set(value, [filename, offset]);
        }
        return value;
    };
}
