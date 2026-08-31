import * as pkg from '../package.json';
import { Layout } from './types';

export const CARD_VERSION = pkg.version;
export const CARD_SIZE = 2;

export const ENTITY_DOMAIN = 'input_number';

// Config defaults - used only when neither the config nor the entity's own attributes set them.
export const DEFAULT_MIN = 0;
export const DEFAULT_MAX = 100;
export const DEFAULT_STEP = 1;
export const DEFAULT_LAYOUT_ALIGN_CONTROLS = Layout.AlignControls.CENTER;
export const DEFAULT_LAYOUT_NAME = Layout.Name.HEADER;
