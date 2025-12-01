import { App, Notice } from 'obsidian';
import { WordNetSettings, VocabularyEntry } from '../types';

export class VocabularyManager {
  constructor(
    private app: App,
    private settings: WordNetSettings
  ) {}

  async ensureVocabFile(): Promise<string> {
    const adapter = this.app.vault.adapter;
    const folderPath = this.settings.vocabFolderPath;
    const fileName = this.settings.vocabFileName;
    const fullFolder = folderPath.replace(/\\/g, "/");
    const fullPath = `${fullFolder}/${fileName}`;

    if (!(await adapter.exists(fullFolder))) {
      await adapter.mkdir(fullFolder);
    }

    if (!(await adapter.exists(fullPath))) {
      const header = `# Vocabulary\n\n`;
      await adapter.write(fullPath, header);
    }

    return fullPath;
  }

  async addToVocabulary(term: string, definition: string): Promise<void> {
    const filePath = await this.ensureVocabFile();
    const adapter = this.app.vault.adapter;
    const timestamp = new Date().toISOString().split("T")[0];
    const entry = `- **${term}** — ${definition}  _(added ${timestamp})_\n`;
    
    const current = await adapter.read(filePath);
    await adapter.write(filePath, current + entry);
    
    new Notice(`Added to vocabulary: ${term}`);
  }

  async getVocabularyEntries(): Promise<VocabularyEntry[]> {
    const adapter = this.app.vault.adapter;
    const filePath = await this.ensureVocabFile();
    const content = await adapter.read(filePath);
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