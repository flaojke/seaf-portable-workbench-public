import fs from 'node:fs';
import path from 'node:path';

// Virtual file:/// paths are relative to a declared storage root, never Windows drive URLs.
export function resolveLocalFilePath(pathname, roots, native = false) {
    const decoded = decodeURIComponent(pathname);
    if (decoded.includes('\0') || decoded.includes('\\') || decoded.includes(':')) throw Error('Invalid local file path');
    const segments = decoded.replace(/^\/+/, '').split('/');
    if (segments.includes('..')) throw Error('Local file path traversal is not allowed');
    const publicAlias = native && segments[0] === '__seaf';
    if (publicAlias) segments.shift();
    if (publicAlias && !['metamodel', 'documentation'].includes(segments[0])) throw Error('Unknown packaged asset path');
    const root = fs.realpathSync(publicAlias ? roots.public : roots.file_storage);
    const candidate = path.resolve(root, ...segments);
    const real = fs.realpathSync(candidate);
    const relative = path.relative(root, real);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error('Local file is outside the declared storage');
    return real;
}
