import Dictionary from '@services/dictionary.js';
import { markdownToHTML } from '@services/util-text.js';
import { getH5PCoreL10ns } from '@services/util-h5p.js';
import Util from '@services/util.js';

/** Class for TextualInput H5P widget */
export default class TextualInputIdeaBoard {

  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;

    if (this.field.type !== 'group') {
      throw new Error('TextualInput must be a group field');
    }

    this.dictionary = new Dictionary();
    this.fillDictionary();

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    // DOM
    this.$container = H5P.jQuery('<div>', { class: 'h5peditor-textual-input-idea-board' });

    // Instantiate original field (or create your own and call setValue)
    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, this.params, this.setValue);
    this.fieldInstance.appendTo(this.$container);

    // Relay changes
    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    // Errors (or add your own)
    this.$errors = this.$container.find('.h5p-errors');

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-textual-input-container');

    this.dialog = new H5P.ConfirmationDialog({
      headerText: this.dictionary.get('l10n.warningHeaderText'),
      dialogText: this.dictionary.get('l10n.warningDialogText'),
      confirmText: this.dictionary.get('l10n.ok'),
      hideCancel: true
    });

    this.parent.ready(() => {
      this.handleParentReady();
    });

    // Use H5PEditor.t('H5PEditor.Boilerplate', 'foo'); to output translatable strings
  }

  /**
   * Handle parent field ready.
   */
  handleParentReady() {
    this.input = this.findInputInstance();
    this.editor = this.findEditorInstance();

    this.completeDOM();
  }

  /**
   * Find input instance in field.
   * @throws {Error} If input instance is not found.
   * @returns {H5PEditor.Textarea} Input instance.
   */
  findInputInstance() {
    const input = H5PEditor.findField(this.field.textualInput?.textarea ?? '', this.fieldInstance);
    if (!input) {
      throw new Error('TextualInput input not found');
    }

    return input;
  }

  /**
   * Find editor instance in field.
   * @throws {Error} If editor instance is not found or does not have required methods.
   * @returns {H5P.IdeaBoard} Editor instance.
   */
  findEditorInstance() {
    const editor = H5PEditor.findField(this.field.textualInput?.editor ?? '', this.parent);
    if (!editor) {
      throw new Error('TextualInput editor not found');
    }

    if (typeof editor.getTextualRepresentation !== 'function') {
      throw new Error('TextualInput editor does not have getTextualRepresentation method');
    }

    if (typeof editor.setFromTextualRepresentation !== 'function') {
      throw new Error('TextualInput editor does not have setFromTextualRepresentation method');
    }

    return editor;
  }

  /**
   * Complete DOM structure for the TextualInput widget.
   */
  completeDOM() {
    this.input.appendTo(this.dom);
    this.dom.append(this.buildHelpText());
    this.dom.append(this.buildButtonWrapper());

    this.dialog.appendTo(document.body);
  }

  /**
   * Build help text from different snippets.
   * Will look like important description widget for text fields.
   * @returns {string} HTML string representing help text.
   */
  buildHelpText() {
    // Header
    const title = `<div class="title">${this.dictionary.get('l10n.helpTextTitleMain')}</div>`;
    const header = `<div class="header">${title}</div>`;

    // Body with description and example
    const introductionText = markdownToHTML(
      this.dictionary.get('l10n.helpTextIntroduction'),
      { separateWithBR: true }
    );
    const description = `<div class="description">${introductionText}</div>`;

    const exampleTitle = `<div class="example-title">${this.dictionary.get('l10n.helpTextTitleExample')}</div>`;
    const exampleText = markdownToHTML(
      this.dictionary.get('l10n.helpTextExample'),
      { separateWithBR: true }
    );
    const exampleTextDOM = `<div class="example-text">${exampleText}</div>`;
    const example = `<div class="example">${exampleTitle}${exampleTextDOM}</div>`;

    const body = `<div class="body">${description}${example}</div>`;

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5peditor-textual-input-help-text');
    wrapper.innerHTML = `${header}${body}`;

    return wrapper;
  }

  /**
   * Build button wrapper with buttons to get from editor and set to editor.
   * @returns {HTMLElement} Button wrapper element.
   */
  buildButtonWrapper() {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5peditor-textual-input-button-wrapper');

    const buttonGetFromEditor = document.createElement('button');
    buttonGetFromEditor.classList.add('h5peditor-textual-input-button');
    buttonGetFromEditor.classList.add('get-from-editor');
    buttonGetFromEditor.textContent = this.dictionary.get('l10n.getFromEditor');
    buttonGetFromEditor.addEventListener('click', () => {
      this.dialog.show();
      const textualRepresentation = this.editor.getTextualRepresentation();
      this.input.$input.get(0).value = textualRepresentation;
      this.handleFieldChange();
    });
    buttonWrapper.appendChild(buttonGetFromEditor);

    const buttonSetToEditor = document.createElement('button');
    buttonSetToEditor.classList.add('h5peditor-textual-input-button');
    buttonSetToEditor.classList.add('set-to-editor');
    buttonSetToEditor.textContent = this.dictionary.get('l10n.updateEditor');
    buttonSetToEditor.addEventListener('click', () => {
      const value = this.input.$input.get(0).value;
      this.editor.setFromTextualRepresentation(value);
      this.handleFieldChange();
    });
    buttonWrapper.appendChild(buttonSetToEditor);

    return buttonWrapper;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    this.fieldInstance.$content.get(0).innerHTML = '';
    this.fieldInstance.$content.get(0).append(this.dom);

    $wrapper.get(0).append(this.$container.get(0));
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.fieldInstance.validate();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  /**
   * Fill Dictionary.
   */
  fillDictionary() {
    // Convert H5PEditor language strings into object.
    const plainTranslations =
      H5PEditor.language['H5PEditor.TextualInputIdeaBoard'].libraryStrings || {};

    // Get l10n from H5P core if available to keep uniform translations
    let translations = getH5PCoreL10ns([
      { local: 'helpTextTitleMain', h5pCore: 'importantInstructions' },
      { local: 'helpTextTitleExample', h5pCore: 'example' }
    ]);

    for (const key in plainTranslations) {
      let current = translations;
      // Assume string keys separated by . or / for defining path
      const splits = key.split(/[./]+/);
      const lastSplit = splits.pop();

      // Create nested object structure if necessary
      splits.forEach((split) => {
        if (!current[split]) {
          current[split] = {};
        }
        current = current[split];
      });

      // Add translation string if not set already
      current[lastSplit] = current[lastSplit] ?? plainTranslations[key];
    }

    translations = this.sanitizeTranslations(translations);

    this.dictionary.fill(translations, {
      markdownToHTML: ['helpTextIntroduction']
    });
  }

  /**
   * Sanitize translations with defaults.
   * @param {object} translations Translations.
   * @returns {object} Sanitized translations.
   */
  sanitizeTranslations(translations) {
    // TODO: Add function to retrieve default translations
    return Util.extend({
      l10n: {
        helpTextTitleMain: 'Important Instructions',
        helpTextTitleExample: 'Example',
        helpTextIntroduction: 'You can add cards by setting the desired texts here. Cards need to be separated by a blank line.',
        helpTextExample: 'Raspberries\n\nStrawberries\n(yummie)\n\nBlueberries',
        warningHeaderText: 'Confirm warning notice',
        warningDialogText: 'Warning! If you change the task in the textual editor all rich text formatting will be removed.',
        ok: 'OK'
      }
    }, translations);
  }
}
