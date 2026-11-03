import { MediaKind } from './media-kind';

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderNote(text: string): string {
    return `<p class="note">${escapeHtml(text)}</p>`;
}

function renderPlayer(source: string, kind: MediaKind): string {
    switch (kind) {
        case 'image':
            return `<img src="${source}" alt="">`;
        case 'audio':
            return `<audio controls src="${source}"></audio>`;
        case 'video':
            return `<video controls src="${source}"></video>`;
        case 'other':
            return renderNote('This file type has no preview.');
    }
}

export function renderMedia(source: string, kind: MediaKind, notice: string | undefined): string {
    return `${renderPlayer(escapeHtml(source), kind)}${notice === undefined ? '' : renderNote(notice)}`;
}
