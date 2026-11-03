import * as vscode from 'vscode';
import { PreviewAudioTranscoder } from '../../shared/media/preview-audio-transcoder';
import { ChannelOutputLog } from '../../shared/output-log';
import { createTimestampedOutputChannel } from '../../shared/timestamped-channel';
import { MEDIA_PREVIEW_VIEW_TYPE, MediaPreviewEditor } from './media-preview-editor';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

async function removeStaleSessions(root: vscode.Uri): Promise<void> {
    const entries = await vscode.workspace.fs.readDirectory(root).then(undefined, () => []);
    for (const [name] of entries) {
        const folder = vscode.Uri.joinPath(root, name);
        const stat = await vscode.workspace.fs.stat(folder);
        if (Date.now() - stat.mtime > STALE_AFTER_MS) {
            await vscode.workspace.fs.delete(folder, { recursive: true, useTrash: false });
        }
    }
}

export function registerMediaPreviewModule(context: vscode.ExtensionContext): void {
    const channel = createTimestampedOutputChannel('Sonara Media Preview');
    const log = new ChannelOutputLog(channel);
    const root = vscode.Uri.joinPath(context.globalStorageUri, 'media-preview');
    removeStaleSessions(root).catch(error => log.error('Removing old media preview copies failed', error));
    const editor = new MediaPreviewEditor(vscode.Uri.joinPath(root, vscode.env.sessionId), new PreviewAudioTranscoder(log));
    context.subscriptions.push(
        channel,
        vscode.window.registerCustomEditorProvider(MEDIA_PREVIEW_VIEW_TYPE, editor, { webviewOptions: { retainContextWhenHidden: true } }),
    );
}
