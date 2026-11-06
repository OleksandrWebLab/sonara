import { mediaKind, isPlayer, MediaKind } from '../../../shared/media/media-kind';
import { escapeHtml, renderMedia, renderNote } from '../../../shared/media/media-player-html';
import { buildWebviewHtml } from '../../../shared/webview/html-template';
import { IMAGE_ZOOM_BAR, IMAGE_ZOOM_SCRIPT, IMAGE_ZOOM_STYLES } from './binary-image-zoom-script';
import { PLAYER_SYNC_SCRIPT } from './binary-player-sync-script';

export type BinarySideContent =
    | { kind: 'file'; source: string; bytes: number; notice?: string }
    | { kind: 'note'; text: string };

export interface BinarySide {
    label: string;
    content: BinarySideContent;
}

const STYLES = `
body { padding: 0; margin: 0; }
.sides { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; min-height: 100vh; background: var(--vscode-editorGroup-border); }
.side { display: flex; flex-direction: column; background: var(--vscode-editor-background); min-width: 0; }
.side-header { display: flex; justify-content: space-between; gap: 8px; padding: 6px 12px; color: var(--vscode-descriptionForeground); border-bottom: 1px solid var(--vscode-editorGroup-border); }
.side-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px; }
.side-body img, .side-body video { max-width: 100%; max-height: calc(100vh - 64px); object-fit: contain; }
.side-body audio { width: 100%; }
.note { color: var(--vscode-descriptionForeground); text-align: center; }
`;

function renderContent(content: BinarySideContent, kind: MediaKind): string {
    return content.kind === 'note' ? renderNote(content.text) : renderMedia(content.source, kind, content.notice);
}

function renderSide(side: BinarySide, kind: MediaKind): string {
    const size = side.content.kind === 'file' ? `${side.content.bytes.toLocaleString('en-US')} bytes` : '';
    return `<section class="side">
<div class="side-header"><span>${escapeHtml(side.label)}</span><span>${size}</span></div>
<div class="side-body">${renderContent(side.content, kind)}</div>
</section>`;
}

export function buildBinaryDiffHtml(title: string, fileName: string, sides: readonly [BinarySide, BinarySide], mediaSource: string): string {
    const kind = mediaKind(fileName);
    const isImage = kind === 'image';
    const main = `<main class="sides${isImage ? ' zoomable' : ''}">${sides.map(side => renderSide(side, kind)).join('')}</main>`;
    return buildWebviewHtml({
        title: escapeHtml(title),
        body: isImage ? `${IMAGE_ZOOM_BAR}${main}` : main,
        extraStyles: isImage ? `${STYLES}${IMAGE_ZOOM_STYLES}` : STYLES,
        script: isImage ? IMAGE_ZOOM_SCRIPT : isPlayer(kind) ? PLAYER_SYNC_SCRIPT : '',
        mediaSource,
    });
}
