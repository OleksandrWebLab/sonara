import * as path from 'path';

export type MediaKind = 'image' | 'audio' | 'video' | 'other';

const MEDIA_EXTENSIONS: ReadonlyArray<[MediaKind, readonly string[]]> = [
    ['image', ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg', '.avif', '.apng']],
    ['audio', ['.mp3', '.wav', '.ogg', '.oga', '.flac', '.m4a', '.aac', '.opus', '.weba']],
    ['video', ['.mp4', '.webm', '.ogv', '.mov', '.m4v']],
];

export function mediaKind(fileName: string): MediaKind {
    const extension = path.extname(fileName).toLowerCase();
    return MEDIA_EXTENSIONS.find(([, extensions]) => extensions.includes(extension))?.[0] ?? 'other';
}

export function isPlayer(kind: MediaKind): boolean {
    return kind === 'audio' || kind === 'video';
}
