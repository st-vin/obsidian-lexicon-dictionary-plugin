/* global setTimeout, console */
import { 
    FuzzySuggestModal, 
    Notice, 
    MarkdownView,
    App 
  } from 'obsidian';
  import { DictionaryItem } from '../types';
  import { DictionaryService } from '../services/DictionaryService';
  import { VocabularyManager } from '../services/VocabularyManager';
  
  export class DictionarySuggester extends FuzzySuggestModal<DictionaryItem> {
    private dictionaryService: DictionaryService;
    private vocabularyManager: VocabularyManager;
    private renderTemplate: (term: string, definition: string) => string;
  
    constructor(
      app: App,
      dictionaryService: DictionaryService,
      vocabularyManager: VocabularyManager,
      renderTemplate: (term: string, definition: string) => string
    ) {
      super(app);
      this.dictionaryService = dictionaryService;
      this.vocabularyManager = vocabularyManager;
      this.renderTemplate = renderTemplate;
      this.setPlaceholder('Type a word to look up in lexicon');
    }
  
    openWithPrefill(term: string): void {
      this.open();
      setTimeout(() => {
        if (!term) return;
        this.inputEl.value = term;
        try {
          this.inputEl.setSelectionRange(0, term.length);
        } catch (error) {
          console.debug('Failed to set selection range for prefilled term', error);
        }
        this.inputEl.dispatchEvent(new Event('input'));
      }, 10);
    }
  
    private getCurrentWordFromEditor(): string {
      const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!currentView || currentView.getMode() === undefined) return '';
  
      const editor = currentView.editor;
      
      if (editor.somethingSelected()) {
        return editor.getSelection();
      }
  
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line) || '';
      const left = line.slice(0, cursor.ch);
      const right = line.slice(cursor.ch);
      const leftWord = (left.match(/[A-Za-z'-]+$/) || [''])[0];
      const rightWord = (right.match(/^[A-Za-z'-]+/) || [''])[0];
      
      return (leftWord + rightWord).trim();
    }
  
    getItems(): DictionaryItem[] {
      let searchTerm = '';
      
      if (this.inputEl.value.trim().length === 0) {
        searchTerm = this.getCurrentWordFromEditor();
        if (searchTerm.length > 0) {
          this.inputEl.value = searchTerm;
          try {
            this.inputEl.setSelectionRange(0, searchTerm.length);
          } catch (error) {
            console.debug('Failed to set selection range for derived term', error);
          }
        }
      } else {
        searchTerm = this.inputEl.value.trim();
      }
  
      return searchTerm === '' ? [] : this.dictionaryService.query(searchTerm);
    }
  
    getItemText(item: DictionaryItem): string {
      return item.SearchTerm;
    }
  
    renderSuggestion(item: { item: DictionaryItem }, el: HTMLElement): void {
      el.createEl('b', { text: item.item.Term });
      el.createEl('br');
      el.appendText(item.item.Definition);
      
      const actions = el.createDiv({ cls: 'wn-suggest-actions' });
      const saveBtn = actions.createEl('button', { text: 'Save' });
      
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        void this.vocabularyManager.addToVocabulary(
          item.item.Term, 
          item.item.Definition
        );
      });
    }
  
    onChooseItem(item: DictionaryItem, evt: MouseEvent | KeyboardEvent): void {
      const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
      
      if (currentView && currentView.getMode() === 'source') {
        currentView.editor.replaceSelection(
          this.renderTemplate(item.Term, item.Definition)
        );
      } else {
        new Notice(`${item.Term}\n${item.Definition}`, 10000);
      }
    }
  }