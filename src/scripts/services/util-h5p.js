/**
 * Get localization defaults from H5P core if possible to keep uniform.
 * @param {object[]} keyPairs containing local key and h5pCore key.
 * @returns {object} Translation object with available l10n from H5P core.
 */
export const getH5PCoreL10ns = (keyPairs = []) => {
  const l10n = {};

  keyPairs.forEach((keys) => {
    if (typeof keys.local !== 'string' || typeof keys.h5pCore !== 'string') {
      return;
    }

    const h5pCoreTranslation = H5PEditor.t('core', keys.h5pCore);
    if (h5pCoreTranslation.indexOf('Missing translation') !== 0) {
      l10n[keys.local] = h5pCoreTranslation;
    }
  });

  return { l10n: l10n };
};
