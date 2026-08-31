import { NumberPickerCardConfig } from './types';

interface ErrorCardElement extends HTMLElement {
  setConfig(config: { type: 'error'; error: string; origConfig: NumberPickerCardConfig }): void;
}

export function createErrorCard(error: string, origConfig: NumberPickerCardConfig): HTMLElement {
  const errorCard = document.createElement('hui-error-card') as ErrorCardElement;
  errorCard.setConfig({ type: 'error', error, origConfig });
  return errorCard;
}
