import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { OutputLog } from '../output-log';

const run = promisify(execFile);

const PLAYABLE_AUDIO_CODECS: ReadonlySet<string> = new Set(['mp3', 'vorbis', 'flac']);
const MP3_QUALITY = '2';

export interface PreviewMedia {
    file: vscode.Uri;
    notice?: string;
}

function isPlayable(codec: string): boolean {
    return PLAYABLE_AUDIO_CODECS.has(codec) || codec.startsWith('pcm_');
}

function unplayableNotice(codecs: readonly string[]): string {
    const named = codecs.length > 0 ? ` (${codecs.join(', ')})` : '';
    return `The sound${named} does not play inside VS Code, and a playable copy could not be made: ffmpeg is needed for it. Open the file with the default application to hear it.`;
}

export class PreviewAudioTranscoder {
    constructor(private readonly log: OutputLog) {}

    async playable(file: vscode.Uri, copy: vscode.Uri): Promise<PreviewMedia> {
        let codecs: string[];
        try {
            codecs = await this.audioCodecs(file.fsPath);
        } catch (error) {
            this.log.error(`ffprobe could not read the audio of ${file.fsPath}`, error);
            return { file, notice: unplayableNotice([]) };
        }
        const unplayable = codecs.filter(codec => !isPlayable(codec));
        if (unplayable.length === 0) {
            this.log.info(`Preview audio of ${file.fsPath}: ${codecs.length > 0 ? `${codecs.join(', ')} plays as is` : 'no audio track'}`);
            return { file };
        }
        try {
            await run('ffmpeg', [
                '-y', '-v', 'error', '-i', file.fsPath,
                '-map', '0:V?', '-map', '0:a',
                '-c:v', 'copy', '-c:a', 'libmp3lame', '-q:a', MP3_QUALITY,
                '-f', 'mp4', copy.fsPath,
            ]);
        } catch (error) {
            this.log.error(`ffmpeg could not convert the ${unplayable.join(', ')} audio of ${file.fsPath} to MP3`, error);
            return { file, notice: unplayableNotice(unplayable) };
        }
        this.log.info(`Preview audio of ${file.fsPath} converted from ${unplayable.join(', ')} to MP3`);
        return { file: copy };
    }

    private async audioCodecs(fsPath: string): Promise<string[]> {
        const { stdout } = await run('ffprobe', [
            '-v', 'error', '-select_streams', 'a',
            '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', fsPath,
        ]);
        return stdout.split('\n').map(line => line.trim()).filter(line => line !== '');
    }
}
