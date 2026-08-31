/**
 * Minimal local re-declarations of the Home Assistant frontend types this card needs.
 * These keep the card dependency-free - Home Assistant's own frontend defines the real
 * `hass`, `ha-card`, `ha-form`, `state-badge`, `hui-error-card`, etc. at runtime.
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    min?: number;
    max?: number;
    step?: number;
    unit_of_measurement?: string;
    [key: string]: unknown;
  };
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data?: Record<string, unknown>) => Promise<void>;
  [key: string]: unknown;
}

export interface ActionConfig {
  action: 'more-info' | 'toggle' | 'navigate' | 'url' | 'call-service' | 'perform-action' | 'none' | 'assist';
  entity?: string;
  navigation_path?: string;
  url_path?: string;
  service?: string;
  perform_action?: string;
  service_data?: Record<string, unknown>;
  data?: Record<string, unknown>;
  target?: Record<string, unknown>;
  confirmation?: unknown;
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

export interface LovelaceGridOptions {
  columns?: number | 'full';
  rows?: number | 'auto';
  max_columns?: number;
  min_columns?: number;
  min_rows?: number;
  max_rows?: number;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  isPanel?: boolean;
  editMode?: boolean;
  getCardSize(): number | Promise<number>;
  getGridOptions?(): LovelaceGridOptions;
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}

export interface NumberPickerCardConfig extends LovelaceCardConfig {
  entity: string;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  unit_of_measurement?: string;
  delay?: number;
  layout?: NumberPickerLayoutConfig;
  hide?: NumberPickerHideConfig;
  tap_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  hold_action?: ActionConfig;
}

export interface NumberPickerLayoutConfig {
  align_controls?: Layout.AlignControls;
  name?: Layout.Name;
  embedded?: boolean;
  thin?: boolean;
}

export namespace Layout {
  export enum AlignControls {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
  }

  export enum Name {
    HEADER = 'header',
    INSIDE = 'inside',
  }
}

export interface NumberPickerHideConfig {
  name?: boolean;
  icon?: boolean;
  unit?: boolean;
}
