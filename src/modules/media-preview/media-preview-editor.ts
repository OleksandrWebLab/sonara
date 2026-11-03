import * as crypto from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { mediaKind } from '../../shared/media/media-kind';
import { escapeHtml, renderMedia } from '../../shared/media/media-player-html';
import { PreviewAudioTranscoder } from '../../shared/media/preview-audio-transcoder';
import { buildWebviewHtml } from '../../shared/webview/html-template';

export const MEDIA_PREVIEW_VIEW_TYPE = 'sonara.mediaPreview';

const PLAYABLE_COPY_SUFFIX = '.preview.mp4';

const STYLES = `
body { padding: 0; margin: 0; }
.media { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 100vh; padding: 12px; box-sizing: border-box; }
.media video { max-width: 100%; max-height: calc(100vh - 48px); object-fit: contain; }
.media audio { width: 100%; max-width: 640px; }
.note { color: var(--vscode-descriptionForeground); text-align: center; }
`;

class MediaDocument implements vscode.CustomDocument {
    constructor(
        readonly uri: vscode.Uri,
        readonly folder: vscode.Uri,
    ) {}

    dispose(): void {
        void vscode.workspace.fs.delete(this.folder, { recursive: true, useTrash: false }).then(undefined, () => undefined);
    }
}

export class MediaPreviewEditor implements vscode.CustomReadonlyEditorProvider<MediaDocument> {
    constructor(
        private readonly root: vscode.Uri,
        private readonly transcoder: PreviewAudioTranscoder,
    ) {}

    openCustomDocument(uri: vscode.Uri): MediaDocument {
        const key = crypto.createHash('sha1').update(uri.toString()).digest('hex');
        return new MediaDocument(uri, vscode.Uri.joinPath(this.root, key));
    }

    async resolveCustomEditor(document: MediaDocument, panel: vscode.WebviewPanel): Promise<void> {
        const name = path.posix.basename(document.uri.path);
        await vscode.workspace.fs.createDirectory(document.folder);
        const source = await this.localSource(document, name);
        panel.webview.options = { localResourceRoots: [vscode.Uri.joinPath(source, '..'), document.folder] };
        const media = await this.transcoder.playable(source, vscode.Uri.joinPath(document.folder, `${name}${PLAYABLE_COPY_SUFFIX}`));
        panel.webview.html = buildWebviewHtml({
            title: escapeHtml(name),
            body: `<main class="media">${renderMedia(panel.webview.asWebviewUri(media.file).toString(), mediaKind(name), media.notice)}</main>`,
            extraStyles: STYLES,
            script: '',
            mediaSource: panel.webview.cspSource,
        });
    }

    private async localSource(document: MediaDocument, name: string): Promise<vscode.Uri> {
        if (document.uri.scheme === 'file') {
            return document.uri;
        }
        const copy = vscode.Uri.joinPath(document.folder, name);
        await vscode.workspace.fs.writeFile(copy, await vscode.workspace.fs.readFile(document.uri));
        return copy;
    }
}
