import { Plugin, Notice } from 'obsidian';
import { LexiconSettings } from './types';
import { DEFAULT_SETTINGS } from './utils/constants';
import { LexiconSettingTab } from './ui/SettingsTab';
import { DictionarySuggester } from './ui/DictionarySuggester';
import { FlashcardModal } from './ui/FlashcardModal';
import { VocabularyManager } from './services/VocabularyManager';
import { DictionaryService } from './services/DictionaryService';
import { registerCommands, registerContextMenu } from './commands';

export default class LexiconDictionaryPlugin extends Plugin {
  settings: LexiconSettings;
  ribbonIcon: HTMLElement | null = null;
  private dictionarySuggester: DictionarySuggester;
  private vocabularyManager: VocabularyManager;
  private dictionaryService: DictionaryService;
  private flashcardIntervalHandle: number | null = null;

  async onload() {
    console.debug('loading Lexicon dictionary plugin');
    
    // Load settings
    await this.loadSettings();
    
    // Initialize services
    this.dictionaryService = new DictionaryService(this.app, this.manifest.dir ?? '');
    this.vocabularyManager = new VocabularyManager(this.app, this.settings);
    
    // Initialize dictionary service
    await this.dictionaryService.initialize().catch(error => {
      console.error('Failed to initialize dictionary service:', error);
      this.unload();
    });
    
    // Initialize UI components
    this.dictionarySuggester = new DictionarySuggester(
      this.app,
      this.dictionaryService,
      this.vocabularyManager,
      (term, definition) => this.renderDefinitionFromTemplate(term, definition)
    );
    
    // Add settings tab
    this.addSettingTab(new LexiconSettingTab(this.app, this));
    
    // Configure ribbon if enabled
    if (this.settings.enableRibbon) {
      this.configureRibbonCommand();
    }
    
    // Register commands and context menu
    registerCommands(this);
    registerContextMenu(this);
    
    // Configure flashcard interval if enabled
    this.configureFlashcardInterval();
  }

  onunload() {
    console.debug('unloading Lexicon dictionary plugin');
    
    // Clear flashcard interval
    if (this.flashcardIntervalHandle) {
      window.clearInterval(this.flashcardIntervalHandle);
      this.flashcardIntervalHandle = null;
    }
  }

  async loadSettings() {
    const stored = (await this.loadData()) as Partial<LexiconSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored ?? {});
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Update vocabulary manager settings
    if (this.vocabularyManager) {
      this.vocabularyManager = new VocabularyManager(this.app, this.settings);
    }
  }

  configureRibbonCommand() {
    this.ribbonIcon = this.addRibbonIcon('book-open-check', 'Lexicon dictionary', () => {
      this.openDictionarySuggester();
    });
  }

  configureFlashcardInterval() {
    // Clear existing interval
    if (this.flashcardIntervalHandle) {
      window.clearInterval(this.flashcardIntervalHandle);
      this.flashcardIntervalHandle = null;
    }

    // Set new interval if enabled
    if (this.settings.flashcardAutoPopupsEnabled) {
      const minutes = Math.max(1, this.settings.flashcardIntervalMinutes || 60);
      this.flashcardIntervalHandle = window.setInterval(() => {
        void this.openFlashcard();
      }, minutes * 60 * 1000);
    }
  }

  async openFlashcard() {
    const entries = await this.vocabularyManager.getVocabularyEntries();
    
    if (entries.length === 0) {
      new Notice('Your vocabulary list is empty.');
      return;
    }

    const item = entries[Math.floor(Math.random() * entries.length)];
    new FlashcardModal(
      this.app, 
      item.term, 
      item.definition,
      () => void this.openFlashcard()
    ).open();
  }

  renderDefinitionFromTemplate(term: string, definition: string): string {
    return this.settings.insertTemplate
      .replace('{term}', term)
      .replace('{definition}', definition);
  }

  // Public methods for commands
  openDictionarySuggester() {
    if (this.dictionaryService.isInitialized()) {
      this.dictionarySuggester.open();
    } else {
      new Notice('Dictionary is still loading. Please try again in a moment.');
    }
  }

  openDictionarySuggesterWithTerm(term: string) {
    if (this.dictionaryService.isInitialized()) {
      this.dictionarySuggester.openWithPrefill(term);
    } else {
      new Notice('Dictionary is still loading. Please try again in a moment.');
    }
  }

  async addToVocabulary(term: string, definition: string) {
    await this.vocabularyManager.addToVocabulary(term, definition);
  }
}