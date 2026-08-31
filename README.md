# Number Picker Card

## Overview

This is a Number Picker Card for [Home Assistant](https://www.home-assistant.io/)'s [Lovelace UI](https://www.home-assistant.io/lovelace).

Works with any [Input Number](https://www.home-assistant.io/integrations/input_number/) entity. A dependency-free native Web Component (no `lit`, no runtime dependencies at all) with a fluid, native-momentum scroll wheel - the same look and feel as [lovelace-time-picker-card](https://github.com/dwainegallimore/lovelace-time-picker-card).

## Installation

### HACS

Install using [HACS](https://hacs.xyz) and add the following to your config:

```yaml
resources:
  - url: /hacsfiles/lovelace-number-picker-card/number-picker-card.js
    type: module
```

### Manual

Download `number-picker-card.js` from the [latest release](https://github.com/dwainegallimore/lovelace-number-picker-card/releases/latest) and place it in your `config/www` folder. Add the following to your config:

```yaml
resources:
  - url: /local/number-picker-card.js
    type: module
```

## Usage

### Visual Editor

Number Picker Card supports Lovelace's Visual Editor. Click the + button to add a card and search for number picker.

## Examples

### Default config

```yaml
type: 'custom:number-picker-card'
entity: input_number.volume
```

By default the wheel's min, max, and step come straight from the `input_number` entity's own configuration, so no card-side config is required at all.

### Overriding the range, step, and unit

```yaml
type: 'custom:number-picker-card'
entity: input_number.target_temperature
min: 16
max: 28
step: 0.5
unit_of_measurement: '°C'
```

Any of `min`, `max`, `step`, or `unit_of_measurement` you set here override the entity's own attributes - useful for showing a coarser step in the UI than the entity's native one, or adding a display suffix the entity itself doesn't define.

### Embedded, for stacking two pickers together

```yaml
type: 'custom:number-picker-card'
entity: input_number.volume
name: Volume
layout:
  embedded: true
```

`embedded` strips the card's own background/border/shadow, which is useful when placing a couple of these directly next to or below each other (e.g. a min/max pair) inside a grid or stack card.

## Options

| Name                | Type    | Requirement  | Description                                                                                       | Default                  |
| ------------------- | ------- | ------------ | --------------------------------------------------------------------------------------------------- | ------------------------ |
| type                | string  | **Required** | `custom:number-picker-card`                                                                          |                          |
| entity              | string  | **Required** | [Input Number](https://www.home-assistant.io/integrations/input_number/) entity                      |                          |
| name                | string  | **Optional** | Card name                                                                                             | Entity's `friendly_name` |
| min                 | number  | **Optional** | Overrides the entity's own `min` attribute                                                           | Entity's `min`, or `0`   |
| max                 | number  | **Optional** | Overrides the entity's own `max` attribute                                                           | Entity's `max`, or `100` |
| step                | number  | **Optional** | Overrides the entity's own `step` attribute                                                          | Entity's `step`, or `1`  |
| unit_of_measurement | string  | **Optional** | Suffix shown next to the value; overrides the entity's own `unit_of_measurement` attribute            | Entity's unit, or none   |
| delay               | number  | **Optional** | Delay in ms before updating the entity                                                               | `0`                      |
| layout              | object  | **Optional** | Card layout configuration                                                                            | `none`                   |
| hide                | object  | **Optional** | Hide object                                                                                           | `none`                   |
| tap_action          | action  | **Optional** | Home Assistant action to perform on tap                                                              | `more-info`              |
| double_tap_action   | action  | **Optional** | Home Assistant action to perform on double tap                                                       | `more-info`              |
| hold_action         | action  | **Optional** | Home Assistant action to perform on hold                                                             | `more-info`              |

### Layout Object

| Name           | Value                     | Requirement  | Description                                                                  | Default  |
| -------------- | ------------------------- | ------------ | ----------------------------------------------------------------------------- | -------- |
| align_controls | `left`, `center`, `right` | **Optional** | Horizontal alignment of the wheel                                             | `center` |
| name           | `header`, `inside`        | **Optional** | Whether to show the name as a header or inside the card                      | `header` |
| embedded       | boolean                   | **Optional** | Render with embedded style - disables padding, box shadow, and card header   | `false`  |
| thin           | boolean                   | **Optional** | Render with reduced paddings                                                 | `false`  |

### Hide Object

| Name | Type    | Requirement  | Description                                       | Default |
| ---- | ------- | ------------ | -------------------------------------------------- | ------- |
| name | boolean | **Optional** | Hides the card name                               | `false` |
| icon | boolean | **Optional** | Hides the card icon (only with controls "inside") | `false` |
| unit | boolean | **Optional** | Hides the unit / suffix next to the value         | `false` |

### Theme Variables

Number Picker Card automatically picks up colors from your Lovelace theme, but you can customize a couple of things directly:

| Name                            | Default                        | Description                |
| -------------------------------- | ------------------------------- | --------------------------- |
| number-picker-accent-color       | `var(--primary-color)`         | Selected value color        |
| number-picker-border-radius      | `var(--ha-card-border-radius)` | Border radius of the card   |

## Credits

This card's architecture and look-and-feel are based on [lovelace-time-picker-card](https://github.com/dwainegallimore/lovelace-time-picker-card), itself a rewrite of [GeorgeSG/lovelace-time-picker-card](https://github.com/GeorgeSG/lovelace-time-picker-card) by **Georgi Gardev**. Credit for the original fluid scroll-wheel picker design goes to Georgi - this card adapts that same pattern for `input_number` entities.

## Meta

**Dwaine Gallimore**

- [github.com/dwainegallimore](https://github.com/dwainegallimore)
