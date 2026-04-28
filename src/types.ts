// Type definitions for the Lexicon dictionary plugin

export interface LexiconSettings {
    insertTemplate: string;
    vocabFolderPath: string;
    vocabFileName: string;
    flashcardAutoPopupsEnabled: boolean;
    flashcardIntervalMinutes: number;
    glossarySectionTitle: string;
    saveToVocabOnFooterInsert: boolean;
  }
  
  export interface DictionaryItem {
    SearchTerm: string;
    Term: string;
    Definition: string;
    item?: {
      Term: string;
      Definition: string;
    };
  }
  
  export interface VocabularyEntry {
    term: string;
    definition: string;
  }