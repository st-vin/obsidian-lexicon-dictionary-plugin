import { App, Notice, normalizePath, TFile } from 'obsidian';
import { LexiconSettings, VocabularyEntry } from '../types';

export class VocabularyManager {
  constructor(
    private app: App,
    private settings: LexiconSettings
  ) {}

  async ensureVocabFile(): Promise<TFile> {
    const folderPath = normalizePath(this.settings.vocabFolderPath);
    const fileName = this.settings.vocabFileName;
    const fullPath = normalizePath(`${folderPath}/${fileName}`);

    // Ensure folder exists using Vault API
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }

    // Check if file exists, create if not
    let file = this.app.vault.getAbstractFileByPath(fullPath);
    if (!file || !(file instanceof TFile)) {
      const header = `# Vocabulary\n\n`;
      file = await this.app.vault.create(fullPath, header);
    }

    // TypeScript narrowing: file is guaranteed to be TFile at this point
    if (!(file instanceof TFile)) {
      throw new Error('Failed to create vocabulary file');
    }

    return file;
  }

  async addToVocabulary(term: string, definition: string): Promise<void> {
    const file = await this.ensureVocabFile();
    const timestamp = new Date().toISOString().split("T")[0];
    const entry = `- **${term}** — ${definition}  _(added ${timestamp})_\n`;
    
    // Use Vault.append to modify file in background
    await this.app.vault.append(file, entry);
    
    new Notice(`Added to vocabulary: ${term}`);
  }

  async getVocabularyEntries(): Promise<VocabularyEntry[]> {
    const file = await this.ensureVocabFile();
    const content = await this.app.vault.read(file);
    const rawLines = content.split(/\r?\n/);
    const entries: VocabularyEntry[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (line.length === 0) continue;

      // Single-line bullet: - **term** — definition
      let m = line.match(/^-\s+\*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
      if (m) {
        entries.push({ term: m[1], definition: m[2] });
        continue;
      }

      // Two-line format: **term** then next non-empty line as definition
      m = line.match(/^\*\*(.+?)\*\*$/);
      if (m) {
        let j = i + 1;
        let defLine = "";
        while (j < rawLines.length && defLine.trim().length === 0) {
          defLine = rawLines[j].trim();
          j++;
        }
        if (defLine.length > 0) {
          entries.push({ term: m[1], definition: defLine });
          i = j - 1;
        }
      }
    }

    return entries;
  }
}