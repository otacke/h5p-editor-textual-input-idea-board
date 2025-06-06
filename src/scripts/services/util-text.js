import { decode } from 'he';
import showdown from 'showdown';

/**
 * Retrieve string without HTML tags.
 * @param {string} html Input string.
 * @returns {string} Output string.
 */
export const stripHTML = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

/**
 * HTML decode and strip HTML.
 * @param {string|object} html html.
 * @returns {string} html value.
 */
export const purifyHTML = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  return stripHTML(decode(html));
};

/**
 * Convert markdown to html.
 * @param {string} markdown Markdown text.
 * @param {object} [options] Options.
 * @param {boolean} [options.separateWithBR] True separate parapgraphs with breaks.
 * @returns {string} HTML text.
 */
export const markdownToHTML = (markdown, options = {}) => {
  const converter = new showdown.Converter();
  let html = converter.makeHtml(markdown) ?? '';

  if (options.separateWithBR) {
    html = html
      .replace(/<\/p>(\n)?<p>/g, '\n\n')
      .replace(/<(\/)?p>/g, '')
      .replace(/\n/g, '<br />');
  }

  return html;
};
