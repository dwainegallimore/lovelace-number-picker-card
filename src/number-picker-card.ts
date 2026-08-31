import { bindActionHandler, computeDomain } from './actions';
import {
  CARD_SIZE,
  CARD_VERSION,
  DEFAULT_LAYOUT_ALIGN_CONTROLS,
  DEFAULT_LAYOUT_NAME,
  DEFAULT_MAX,
  DEFAULT_MIN,
  DEFAULT_STEP,
  ENTITY_DOMAIN,
} from './const';
import './editor';
import { createErrorCard } from './error-card';
import { decimalsForStep, formatNumber, generateNumberRange, snapToNearest } from './range';
import {
  HassEntity,
  HomeAssistant,
  Layout,
  LovelaceCard,
  LovelaceCardEditor,
  LovelaceGridOptions,
  NumberPickerCardConfig,
} from './types';
import { NumberWheel } from './wheel';

console.info(
  `%c  NUMBER-PICKER-CARD  \n%c  Version ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'number-picker-card',
  name: 'Number Picker Card',
  description: 'A Number Picker card for setting the value of Input Number entities.',
});

const CARD_STYLES = `
  :host {
    display: block;
    height: 100%;
    --nc-accent-color: var(--number-picker-accent-color, var(--primary-color));
    --nc-border-radius: var(--number-picker-border-radius, var(--ha-card-border-radius, 12px));
    --nc-item-height: 44px;
  }

  * { box-sizing: border-box; }

  .nc-card-content {
    height: 100%;
  }

  ha-card {
    height: 100%;
    width: 100%;
    overflow: hidden;
    border-radius: var(--nc-border-radius);
    display: flex;
    flex-direction: column;
  }

  ha-card.embedded {
    box-shadow: none;
    border: none;
    background: transparent;
  }

  .nc-header {
    padding: 14px 20px 10px;
    color: var(--secondary-text-color);
    background: transparent;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-align: center;
    user-select: none;
  }

  ha-card.thin .nc-header { padding: 8px 12px 6px; }

  .nc-row {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    padding: 20px 16px;
  }

  ha-card.thin .nc-row { padding: 6px !important; }
  .nc-row.embedded { padding: 0; }
  .nc-row.with-header-name { padding: 12px 16px 20px; }

  .nc-nested-name {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: 16px;
    user-select: none;
    /* The wheel (.nc-content, flex-shrink: 0 below) must never be clipped by ha-card's own
       overflow: hidden when a narrow tile can't fit both at their natural width - this is the
       one that's allowed to give ground, wrapping its text instead. Flex items default to
       min-width: auto (their own content's width as a floor), which some themes' fonts/sizing
       push wide enough that it stops this from actually shrinking - min-width: 0 removes that
       floor so the shrink can go all the way down to wrapped text. */
    min-width: 0;
    flex-shrink: 1;
  }

  .nc-nested-name state-badge { color: var(--primary-text-color); flex-shrink: 0; }
  .nc-nested-name span { color: var(--primary-text-color); font-weight: 500; min-width: 0; }

  .nc-content {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1 0 auto;
  }

  .nc-content.layout-left { justify-content: flex-start; }
  .nc-content.layout-center { justify-content: center; }
  .nc-content.layout-right { justify-content: flex-end; }

  .nc-wheel-group {
    display: flex;
    align-items: center;
    position: relative;
    border-radius: calc(var(--nc-border-radius) * 0.6);
    background: var(--secondary-background-color, rgba(127, 127, 127, 0.05));
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(127, 127, 127, 0.08);
    padding: 0 8px;
    transition: border-radius 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .nc-wheel-group::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: var(--nc-item-height);
    transform: translateY(-50%);
    background: rgba(127, 127, 127, 0.14);
    background: color-mix(in srgb, var(--nc-accent-color) 10%, transparent);
    border-radius: calc(var(--nc-border-radius) * 0.6);
    pointer-events: none;
  }

  .nc-wheel {
    position: relative;
    min-width: 3.4em;
    height: var(--nc-item-height);
    outline: none;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .nc-wheel-group.is-active .nc-wheel,
  .nc-wheel-group:focus-within .nc-wheel {
    height: calc(var(--nc-item-height) * 3);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%);
  }

  .nc-wheel:focus-visible {
    box-shadow: inset 0 0 0 2px var(--nc-accent-color);
    border-radius: 8px;
  }

  .nc-wheel-scroll {
    height: calc(var(--nc-item-height) * 3);
    overflow-y: scroll;
    overscroll-behavior: contain;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    padding: var(--nc-item-height) 0;
  }

  .nc-wheel-scroll::-webkit-scrollbar { display: none; }

  .nc-wheel-item {
    height: var(--nc-item-height);
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    white-space: nowrap;
    font-size: 1.5rem;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    transition: color 0.15s ease-out;
    user-select: none;
    cursor: pointer;
    will-change: transform, opacity;
  }

  .nc-wheel-item.is-center {
    color: var(--nc-accent-color);
    font-weight: 600;
  }

  .nc-suffix {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--nc-item-height);
    padding-left: 8px;
    padding-right: 4px;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    opacity: 0.7;
    user-select: none;
  }

  .entity-icon { cursor: pointer; }
`;

export class NumberPickerCard extends HTMLElement implements LovelaceCard {
  static getStubConfig(_hass: HomeAssistant, entities: Array<string>): Omit<NumberPickerCardConfig, 'type'> {
    const numberEntity = entities.find((entityId) => computeDomain(entityId) === ENTITY_DOMAIN);

    return {
      entity: numberEntity || '',
      layout: {
        align_controls: DEFAULT_LAYOUT_ALIGN_CONTROLS,
        name: DEFAULT_LAYOUT_NAME,
      },
    };
  }

  static getConfigElement(): LovelaceCardEditor {
    return document.createElement('number-picker-card-editor') as unknown as LovelaceCardEditor;
  }

  private _hass!: HomeAssistant;
  private _config!: NumberPickerCardConfig;
  private _currentValue?: number;
  private _decimals = 0;
  private _bounce?: number;
  private _built = false;

  private readonly _root: ShadowRoot;
  private readonly _content: HTMLDivElement;

  private _headerEl?: HTMLElement;
  private _nameLabelEl?: HTMLElement;
  private _badgeEl?: HTMLElement & { stateObj?: HassEntity };
  private _wheel?: NumberWheel;
  private _wheelGroup?: HTMLDivElement;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CARD_STYLES;
    this._root.appendChild(style);

    this._content = document.createElement('div');
    this._content.className = 'nc-card-content';
    this._root.appendChild(this._content);
  }

  setConfig(config: NumberPickerCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (!config.entity) {
      throw new Error('You must set an entity');
    }

    if (config.min !== undefined && config.max !== undefined && config.min >= config.max) {
      throw new Error('min must be less than max');
    }

    if (config.step !== undefined && config.step <= 0) {
      throw new Error('step must be greater than 0');
    }

    this._config = config;
    this._built = false;

    if (this._hass) {
      this._update();
    }
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (this._config) {
      this._update();
    }
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  getCardSize(): number {
    return CARD_SIZE;
  }

  /** Tells Lovelace's grid-based "sections" view how to size and resize this card. */
  getGridOptions(): LovelaceGridOptions {
    return {
      columns: 4,
      rows: 'auto',
      min_columns: 3,
      max_columns: 12,
      min_rows: 1,
      max_rows: 4,
    };
  }

  connectedCallback(): void {
    if (this._config && this._hass) {
      this._update();
    }
  }

  private get _entity(): HassEntity | undefined {
    return this._hass.states[this._config.entity];
  }

  private get _isEmbedded(): boolean {
    return this._config.layout?.embedded === true;
  }

  private get _hasNameInHeader(): boolean {
    return (
      Boolean(this._name) &&
      this._config.hide?.name !== true &&
      this._config.layout?.name !== Layout.Name.INSIDE &&
      this._config.layout?.embedded !== true
    );
  }

  private get _hasNameInside(): boolean {
    return (
      Boolean(this._name) &&
      (this._config.layout?.name === Layout.Name.INSIDE || Boolean(this._config.layout?.embedded))
    );
  }

  private get _name(): string | undefined {
    return this._config.name || this._entity?.attributes.friendly_name;
  }

  private get _layoutAlign(): Layout.AlignControls {
    return this._config.layout?.align_controls ?? DEFAULT_LAYOUT_ALIGN_CONTROLS;
  }

  private get _min(): number {
    const entityMin = this._entity?.attributes.min;
    return this._config.min ?? (typeof entityMin === 'number' ? entityMin : DEFAULT_MIN);
  }

  private get _max(): number {
    const entityMax = this._entity?.attributes.max;
    return this._config.max ?? (typeof entityMax === 'number' ? entityMax : DEFAULT_MAX);
  }

  private get _step(): number {
    const entityStep = this._entity?.attributes.step;
    return this._config.step ?? (typeof entityStep === 'number' && entityStep > 0 ? entityStep : DEFAULT_STEP);
  }

  private get _unit(): string {
    return this._config.unit_of_measurement ?? this._entity?.attributes.unit_of_measurement ?? '';
  }

  private _update(): void {
    if (!this._built) {
      this._build();
    } else {
      this._refreshValues();
    }
  }

  private _build(): void {
    const entity = this._entity;

    if (!entity) {
      this._showError('Entity not found');
      return;
    }

    if (computeDomain(entity.entity_id) !== ENTITY_DOMAIN) {
      this._showError(`You must set an ${ENTITY_DOMAIN} entity`);
      return;
    }

    if (this._max <= this._min) {
      this._showError('max must be greater than min');
      return;
    }

    const values = generateNumberRange(this._min, this._max, this._step);
    this._decimals = decimalsForStep(this._step);
    this._currentValue = snapToNearest(parseFloat(entity.state), values);

    this._content.innerHTML = '';
    this._headerEl = undefined;
    this._nameLabelEl = undefined;
    this._badgeEl = undefined;

    const card = document.createElement('ha-card');
    card.classList.toggle('embedded', this._isEmbedded);
    card.classList.toggle('thin', this._config.layout?.thin === true);

    if (this._hasNameInHeader) {
      card.appendChild(this._buildHeader());
    }

    const row = document.createElement('div');
    row.className = 'nc-row';
    row.classList.toggle('with-header-name', this._hasNameInHeader);
    row.classList.toggle('embedded', this._isEmbedded);

    if (this._hasNameInside) {
      row.appendChild(this._buildNestedName(entity));
    }

    const content = document.createElement('div');
    content.className = `nc-content layout-${this._layoutAlign}`;

    const wheelGroup = document.createElement('div');
    wheelGroup.className = 'nc-wheel-group';
    this._wheelGroup = wheelGroup;

    this._wheel = new NumberWheel({
      label: this._name ?? 'Value',
      format: (value) => formatNumber(value, this._decimals),
      onChange: (value) => this._onValueChange(value),
      onActiveChange: (active) => this._wheelGroup?.classList.toggle('is-active', active),
    });
    wheelGroup.appendChild(this._wheel.element);

    if (this._unit && !this._config.hide?.unit) {
      const suffix = document.createElement('div');
      suffix.className = 'nc-suffix';
      suffix.textContent = this._unit;
      wheelGroup.appendChild(suffix);
    }

    content.appendChild(wheelGroup);
    row.appendChild(content);
    card.appendChild(row);

    // Attach the whole subtree to the live document *before* populating the wheel -
    // scrollTo() on a still-detached element has no layout box and silently clamps to 0.
    this._content.appendChild(card);

    this._wheel.setValues(values, this._currentValue);

    this._built = true;
  }

  private _refreshValues(): void {
    const entity = this._entity;

    if (!entity || computeDomain(entity.entity_id) !== ENTITY_DOMAIN || this._max <= this._min) {
      this._built = false;
      this._build();
      return;
    }

    const values = generateNumberRange(this._min, this._max, this._step);
    this._decimals = decimalsForStep(this._step);
    this._currentValue = snapToNearest(parseFloat(entity.state), values);
    this._wheel?.setValue(this._currentValue);

    if (this._headerEl) {
      this._headerEl.textContent = this._name ?? '';
    }
    if (this._nameLabelEl) {
      this._nameLabelEl.textContent = this._name ?? '';
    }
    if (this._badgeEl) {
      this._badgeEl.stateObj = entity;
    }
  }

  private _showError(message: string): void {
    this._content.innerHTML = '';
    this._content.appendChild(createErrorCard(message, this._config));
    this._built = false;
    this._currentValue = undefined;
  }

  private _buildHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'nc-header';
    header.textContent = this._name ?? '';
    bindActionHandler(header, () => ({ hass: this._hass, config: this._config }));
    this._headerEl = header;
    return header;
  }

  private _buildNestedName(entity: HassEntity): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'nc-nested-name';
    bindActionHandler(wrap, () => ({ hass: this._hass, config: this._config }));

    if (!this._config.hide?.icon) {
      const badge = document.createElement('state-badge') as HTMLElement & { stateObj?: HassEntity };
      badge.classList.add('entity-icon');
      badge.stateObj = entity;
      wrap.appendChild(badge);
      this._badgeEl = badge;
    }

    if (!this._config.hide?.name) {
      const label = document.createElement('span');
      label.textContent = this._name ?? '';
      wrap.appendChild(label);
      this._nameLabelEl = label;
    }

    return wrap;
  }

  private _onValueChange(value: number): void {
    this._currentValue = value;
    this._debouncedCallHassService();
  }

  private _debouncedCallHassService(): void {
    if (this._config.delay) {
      window.clearTimeout(this._bounce);
      this._bounce = window.setTimeout(() => this._callHassService(), this._config.delay);
    } else {
      this._callHassService();
    }
  }

  private _callHassService(): Promise<void> {
    if (!this._hass || this._currentValue === undefined) {
      throw new Error('Unable to update number');
    }

    return this._hass.callService(ENTITY_DOMAIN, 'set_value', {
      entity_id: this._config.entity,
      value: this._currentValue,
    });
  }
}

customElements.define('number-picker-card', NumberPickerCard);
