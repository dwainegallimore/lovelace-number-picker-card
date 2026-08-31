import { HomeAssistant, LovelaceCardEditor, NumberPickerCardConfig } from './types';

const NAME_TO_LABEL_MAP: Record<string, string> = {
  entity: 'input_number entity id',
  name: 'Name',
  min: 'Minimum',
  max: 'Maximum',
  step: 'Step',
  unit_of_measurement: 'Unit / suffix',
  align_controls: 'Align controls',
  embedded: 'Embedded?',
  thin: 'Thin layout?',
  icon: 'Icon',
};

const SCHEMA = [
  {
    type: 'grid',
    schema: [
      { name: 'entity', selector: { entity: { domain: 'input_number' } } },
      { name: 'name', selector: { text: {} } },
    ],
  },
  {
    // Two forced single-column sub-grids side by side - a plain multi-item grid's column
    // count depends on the dialog's width rather than staying fixed, so pairing is done
    // this way rather than trusting row-major auto-fill.
    type: 'grid',
    column_min_width: '220px',
    schema: [
      {
        type: 'grid',
        column_min_width: '100%',
        schema: [
          { name: 'min', selector: { number: { mode: 'box' } } },
          { name: 'max', selector: { number: { mode: 'box' } } },
        ],
      },
      {
        type: 'grid',
        column_min_width: '100%',
        schema: [
          { name: 'step', selector: { number: { mode: 'box', min: 0.001 } } },
          { name: 'unit_of_measurement', selector: { text: {} } },
        ],
      },
    ],
  },
  {
    // No `name` here - this expandable is purely a visual accordion. Its two direct
    // children each own exactly one data key (layout / hide) so nothing double-nests.
    type: 'expandable',
    title: 'Appearance',
    schema: [
      {
        type: 'grid',
        name: 'layout',
        column_min_width: '220px',
        schema: [
          {
            type: 'grid',
            column_min_width: '100%',
            schema: [
              {
                name: 'align_controls',
                selector: {
                  select: {
                    mode: 'box',
                    options: [
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Center' },
                      { value: 'right', label: 'Right' },
                    ],
                  },
                },
              },
              {
                name: 'name',
                selector: {
                  select: {
                    mode: 'box',
                    options: [
                      { value: 'header', label: 'Header' },
                      { value: 'inside', label: 'Inside' },
                    ],
                  },
                },
              },
            ],
          },
          {
            type: 'grid',
            column_min_width: '100%',
            schema: [
              { name: 'embedded', selector: { boolean: {} } },
              { name: 'thin', selector: { boolean: {} } },
            ],
          },
        ],
      },
      {
        type: 'grid',
        name: 'hide',
        column_min_width: '150px',
        schema: [
          { name: 'name', selector: { boolean: {} } },
          { name: 'icon', selector: { boolean: {} } },
        ],
      },
    ],
  },
  {
    type: 'expandable',
    title: 'Actions',
    schema: [
      { name: 'tap_action', selector: { action: {} } },
      { name: 'double_tap_action', selector: { action: {} } },
      { name: 'hold_action', selector: { action: {} } },
    ],
  },
];

interface HaFormElement extends HTMLElement {
  hass?: HomeAssistant;
  data?: unknown;
  schema?: unknown;
  computeLabel?: (schema: { name: string }) => string;
}

/**
 * Wraps Home Assistant's own `<ha-form>` element imperatively instead of through Lit,
 * so the visual editor keeps its full functionality (entity/action pickers, expandables)
 * without pulling in the `lit` package.
 */
export class NumberPickerCardEditor extends HTMLElement implements LovelaceCardEditor {
  private _hass?: HomeAssistant;
  private _config?: NumberPickerCardConfig;
  private _form?: HaFormElement;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
    }
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  setConfig(config: NumberPickerCardConfig): void {
    this._config = config;
    if (this._form) {
      this._form.data = config;
    }
  }

  connectedCallback(): void {
    if (this._form) {
      return;
    }

    const form = document.createElement('ha-form') as HaFormElement;
    form.hass = this._hass;
    form.data = this._config;
    form.schema = SCHEMA;
    form.computeLabel = ({ name }: { name: string }): string => NAME_TO_LABEL_MAP[name] || name;
    form.addEventListener('value-changed', ((ev: CustomEvent) => {
      ev.stopPropagation();
      const newConfig = { ...this._config, ...ev.detail.value } as NumberPickerCardConfig;
      this._config = newConfig;
      form.data = newConfig;
      this.dispatchEvent(
        new CustomEvent('config-changed', { bubbles: true, composed: true, detail: { config: newConfig } })
      );
    }) as EventListener);

    this._form = form;
    this.appendChild(form);
  }
}

customElements.define('number-picker-card-editor', NumberPickerCardEditor);
