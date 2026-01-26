import { AbstractInputSuggest, App, TFolder } from 'obsidian';

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFolder[] {
    const folders = this.app.vault.getAllFolders();
    const queryLower = query.toLowerCase();
    
    return folders.filter(folder => {
      const path = folder.path.toLowerCase();
      return path.includes(queryLower);
    }).sort((a, b) => {
      // Sort by relevance (exact matches first, then by path length)
      const aMatch = a.path.toLowerCase().startsWith(queryLower);
      const bMatch = b.path.toLowerCase().startsWith(queryLower);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return a.path.length - b.path.length;
    });
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.setValue(folder.path);
    this.close();
  }
}
