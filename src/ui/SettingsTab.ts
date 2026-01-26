import { App, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import { DEFAULT_SETTINGS } from '../utils/constants';
import LexiconDictionaryPlugin from '../main';
import { FolderSuggest } from './FolderSuggest';

export class LexiconSettingTab extends PluginSettingTab {
  plugin: LexiconDictionaryPlugin;

  constructor(app: App, plugin: LexiconDictionaryPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Template for definition insertion
    let templateTextArea: TextAreaComponent;
    new Setting(containerEl)
      .setName('Template for inserting a definition')
      .setDesc(
        'The template used for inserting a Lexicon definition. ' +
        'Use {term} for the term looked up and {definition} for the definition of that term.'
      )
      .addExtraButton(b => {
        b.setIcon('reset')
          .setTooltip('Reset to default')
          .onClick(async () => {
            this.plugin.settings.insertTemplate = DEFAULT_SETTINGS.insertTemplate;
            await this.plugin.saveSettings();
            templateTextArea.setValue(this.plugin.settings.insertTemplate);
          });
      })
      .addTextArea(cb => {
        templateTextArea = cb;
        cb.setValue(this.plugin.settings.insertTemplate);
        cb.onChange(async value => {
          const newValue = value.trim().length === 0 
            ? DEFAULT_SETTINGS.insertTemplate 
            : value;
          this.plugin.settings.insertTemplate = newValue;
          await this.plugin.saveSettings();
        });
        cb.inputEl.rows = 2;
        cb.inputEl.cols = 40;
      });

    // Vocabulary settings
    new Setting(containerEl)
      .setName('Vocabulary folder path')
      .setDesc('Folder where the vocabulary file will be stored')
      .addText(cb => {
        cb.setValue(this.plugin.settings.vocabFolderPath);
        new FolderSuggest(this.app, cb.inputEl);
        cb.onChange(async value => {
          const newValue = value.trim().length === 0 
            ? DEFAULT_SETTINGS.vocabFolderPath 
            : value.trim();
          this.plugin.settings.vocabFolderPath = newValue;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Vocabulary file name')
      .setDesc('Markdown file to store saved words')
      .addText(cb => {
        cb.setValue(this.plugin.settings.vocabFileName);
        cb.onChange(async value => {
          const newValue = value.trim().length === 0 
            ? DEFAULT_SETTINGS.vocabFileName 
            : value.trim();
          this.plugin.settings.vocabFileName = newValue;
          await this.plugin.saveSettings();
        });
      });

    // Flashcard settings
    new Setting(containerEl)
      .setName('Enable flashcard popups')
      .setDesc('Show periodic flashcards with saved vocabulary')
      .addToggle(cb => {
        cb.setValue(this.plugin.settings.flashcardAutoPopupsEnabled);
        cb.onChange(async value => {
          this.plugin.settings.flashcardAutoPopupsEnabled = value;
          await this.plugin.saveSettings();
          this.plugin.configureFlashcardInterval();
          // Re-run display to show/hide related settings
          this.display();
        });
      });

    // Only show interval setting when flashcard popups are enabled
    if (this.plugin.settings.flashcardAutoPopupsEnabled) {
      new Setting(containerEl)
        .setName('Flashcard interval (minutes)')
        .setDesc('How often to show a flashcard when enabled')
        .addSlider(cb => {
          cb.setLimits(5, 240, 5)
            .setValue(this.plugin.settings.flashcardIntervalMinutes)
            .setDynamicTooltip();
          cb.onChange(async value => {
            this.plugin.settings.flashcardIntervalMinutes = value;
            await this.plugin.saveSettings();
            this.plugin.configureFlashcardInterval();
          });
        });
    }
  }
}