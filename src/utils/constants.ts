import { LexiconSettings } from '../types';

export const DEFAULT_SETTINGS: LexiconSettings = {
  insertTemplate: "**{term}**\n{definition}\n",
  vocabFolderPath: "Vocabulary",
  vocabFileName: "lexicon.md",
  flashcardAutoPopupsEnabled: false,
  flashcardIntervalMinutes: 60
};

export const LEXICON_DICT_URL = 
"https://github.com/st-vin/obsidian-lexicon-dictionary-plugin/releases/download/1.0.4/dict-Lexicon.json";