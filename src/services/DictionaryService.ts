import { App, Notice, request, normalizePath } from 'obsidian';
import { DictionaryItem } from '../types';
import { LEXICON_DICT_URL } from '../utils/constants';

export class DictionaryService {
  private lexiconDictionary: DictionaryItem[] | null = null;
  private customDict: DictionaryItem[] | null = null;
  private manifestDir: string;

  constructor(
    private app: App,
    manifestDir: string
  ) {
    this.manifestDir = normalizePath(manifestDir);
  }

  async initialize(): Promise<void> {
    const pathLexiconJson = normalizePath(`${this.manifestDir}/dict-Lexicon.json`);
    const adapter = this.app.vault.adapter;

    if (await adapter.exists(pathLexiconJson)) {
      const fileLexicon = await adapter.read(pathLexiconJson);
      this.lexiconDictionary = JSON.parse(fileLexicon) as DictionaryItem[];
    } else {
      await this.downloadLexiconDictionary(pathLexiconJson);
    }

    // Load custom dictionary if exists
    const customDictPath = normalizePath(`${this.manifestDir}/dict-MyDict.json`);
    if (await adapter.exists(customDictPath)) {
      const fileCustomDict = await adapter.read(customDictPath);
      this.customDict = JSON.parse(fileCustomDict) as DictionaryItem[];
    }
  }

  private async downloadLexiconDictionary(pathLexiconJson: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    
    if (!navigator.onLine) {
      new Notice(
        "You do not have an internet connection, and the Lexicon dictionary cannot be downloaded. " +
        "Please restore your internet connection and restart Obsidian",
        30000
      );
      throw new Error("No internet connection");
    }

    const downloadMessage = new Notice(
      "Lexicon dictionary is being downloaded, this may take a few minutes. " +
      "This message will disappear when the process is complete.",
      0
    );

    try {
      const response = await request({ url: LEXICON_DICT_URL });
      downloadMessage.hide();

      if (response === "Not Found" || response === `{"error":"Not Found"}`) {
        new Notice(
          "The Lexicon dictionary file is not currently available for download. " +
          "Please try again later.",
          30000
        );
        throw new Error("Dictionary not found");
      }

      this.lexiconDictionary = JSON.parse(response) as DictionaryItem[];
      await adapter.write(pathLexiconJson, JSON.stringify(this.lexiconDictionary));
    } catch (e) {
      downloadMessage.hide();
      new Notice(`An error has occurred with the download, please try again later: ${e}`);
      throw e;
    }
  }

  query(term: string): DictionaryItem[] {
    const results: DictionaryItem[] = [];
    const searchTerm = term.toLowerCase();
    let countOfFoundMatches = 0;

    // Search custom dictionary first
    if (this.customDict) {
      for (let i = 0; i < this.customDict.length && countOfFoundMatches < 30; i++) {
        const item = this.customDict[i];
        if (item.SearchTerm.startsWith(searchTerm)) {
          results.push(this.customDict[i]);
          countOfFoundMatches++;
        }
      }
    }

    // Then search Lexicon dictionary
    countOfFoundMatches = 0;
    if (this.lexiconDictionary) {
      for (let i = 0; i < this.lexiconDictionary.length && countOfFoundMatches < 20; i++) {
        const item = this.lexiconDictionary[i];
        if (item.SearchTerm.startsWith(searchTerm)) {
          results.push(this.lexiconDictionary[i]);
          countOfFoundMatches++;
        }
      }
    }

    return results;
  }

  isInitialized(): boolean {
    return this.lexiconDictionary !== null;
  }
}