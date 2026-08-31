const DEFAULT_ITEM_HEIGHT = 44;
const SETTLE_DEBOUNCE_MS = 120;
const COLLAPSE_DELAY_MS = 500;

export interface WheelOptions {
  label: string;
  itemHeight?: number;
  format?: (value: number) => string;
  onChange?: (value: number) => void;
  /** Fires immediately on interaction start, and (after a short grace delay) on interaction end. */
  onActiveChange?: (active: boolean) => void;
}

/**
 * A vertically-scrolling "wheel" picker column bound to a fixed [min, max] range (the classic
 * iOS/Android picker interaction, but linear rather than circular - a bounded number has no
 * natural wraparound the way an hour or minute does, so it just stops at each end). Built on
 * native scroll + CSS scroll-snap so momentum, easing, touch handling and the hard stop at
 * either end all come from the platform for free; the only custom logic is a continuous
 * scale/opacity morph applied every animation frame while scrolling.
 */
export class NumberWheel {
  readonly element: HTMLDivElement;

  private readonly scrollEl: HTMLDivElement;
  private readonly itemHeight: number;
  private readonly format: (value: number) => string;
  private readonly onChange?: (value: number) => void;
  private readonly onActiveChange?: (active: boolean) => void;

  private items: HTMLDivElement[] = [];
  private values: number[] = [];
  private currentValue = 0;
  private rafId: number | null = null;
  private settleTimer: number | undefined;
  private collapseTimer: number | undefined;
  /**
   * An index whose scroll assignment was clamped to 0 because the wheel had zero size at the
   * time (a hidden dashboard view/tab, a collapsed ancestor, a sections/masonry grid cell that
   * hasn't been sized yet) - re-applied by the ResizeObserver below the moment the wheel
   * actually gets laid out. Without this, a value that arrives before the card is visible
   * gets stuck showing its default forever: `setValue()` only re-scrolls when the *value*
   * changes, and on every later hass update it already matches, so the wrong on-screen
   * position (still at index 0) is never revisited.
   */
  private pendingIndex: number | null = null;
  private readonly resizeObserver: ResizeObserver;

  constructor(options: WheelOptions) {
    this.itemHeight = options.itemHeight ?? DEFAULT_ITEM_HEIGHT;
    this.format = options.format ?? ((value) => String(value));
    this.onChange = options.onChange;
    this.onActiveChange = options.onActiveChange;

    this.element = document.createElement('div');
    this.element.className = 'nc-wheel';
    this.element.tabIndex = 0;
    this.element.setAttribute('role', 'slider');
    this.element.setAttribute('aria-label', options.label);
    this.element.style.setProperty('--nc-item-height', `${this.itemHeight}px`);

    this.scrollEl = document.createElement('div');
    this.scrollEl.className = 'nc-wheel-scroll';
    this.scrollEl.style.overflowAnchor = 'none';
    this.element.appendChild(this.scrollEl);

    this.scrollEl.addEventListener('scroll', this.onScroll, { passive: true });
    this.element.addEventListener('keydown', this.onKeydown);
    this.element.addEventListener('pointerenter', () => this.setActive(true));
    this.element.addEventListener('pointerdown', () => this.setActive(true));
    this.element.addEventListener('pointerleave', () => this.setActive(false));
    this.element.addEventListener('focus', () => this.setActive(true));
    this.element.addEventListener('blur', () => this.setActive(false));

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.scrollEl);
  }

  /** Catches up a scroll position that was deferred because the wheel had zero size when it was requested. */
  private onResize(): void {
    if (this.pendingIndex === null || this.scrollEl.clientHeight === 0) {
      return;
    }
    const index = this.pendingIndex;
    this.pendingIndex = null;
    this.scrollEl.scrollTo({ top: index * this.itemHeight, behavior: 'auto' });
    this.updateVisualState();
  }

  /** Reveals the full wheel immediately, or schedules a graceful collapse after a short delay. */
  private setActive(active: boolean): void {
    window.clearTimeout(this.collapseTimer);

    if (active) {
      this.onActiveChange?.(true);
    } else {
      this.collapseTimer = window.setTimeout(() => this.onActiveChange?.(false), COLLAPSE_DELAY_MS);
    }
  }

  setValues(values: number[], selected: number): void {
    this.values = values;
    this.currentValue = selected;
    this.scrollEl.innerHTML = '';
    this.items = [];

    for (const value of values) {
      const item = document.createElement('div');
      item.className = 'nc-wheel-item';
      item.textContent = this.format(value);
      item.addEventListener('click', () => this.scrollToIndex(this.items.indexOf(item)));
      this.scrollEl.appendChild(item);
      this.items.push(item);
    }

    const index = Math.max(values.indexOf(selected), 0);

    // Force a layout flush before scrolling - without it the browser may still be
    // measuring the pre-insertion (empty) scrollHeight and silently clamp this to 0.
    void this.scrollEl.offsetHeight;
    this.scrollToIndex(index, 'auto');
    this.updateVisualState();
  }

  /** Programmatically move to a value (e.g. syncing from hass). */
  setValue(value: number): void {
    if (value === this.currentValue || this.values.length === 0) {
      return;
    }

    const index = this.values.indexOf(value);
    if (index === -1) {
      return;
    }

    this.currentValue = value;
    this.scrollToIndex(index);
  }

  focus(): void {
    this.element.focus();
  }

  private scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const clamped = Math.min(Math.max(index, 0), this.values.length - 1);

    if (this.scrollEl.clientHeight === 0) {
      // Not laid out yet (hidden view/tab, collapsed ancestor, unsized grid cell). Assigning
      // scrollTop now would silently clamp to 0 and stick there - defer it to the
      // ResizeObserver, which re-applies it the moment this wheel actually gets a size.
      this.pendingIndex = clamped;
      return;
    }

    this.pendingIndex = null;
    this.scrollEl.scrollTo({ top: clamped * this.itemHeight, behavior });
  }

  private onKeydown = (ev: KeyboardEvent): void => {
    let delta = 0;
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') delta = -1;
    else if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') delta = 1;
    else if (ev.key === 'PageUp') delta = -3;
    else if (ev.key === 'PageDown') delta = 3;
    else if (ev.key === 'Home') delta = -Infinity;
    else if (ev.key === 'End') delta = Infinity;
    else return;

    ev.preventDefault();
    const currentIndex = Math.round(this.scrollEl.scrollTop / this.itemHeight);
    this.scrollToIndex(currentIndex + delta);
  };

  private onScroll = (): void => {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.updateVisualState();
      });
    }

    window.clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => this.onSettle(), SETTLE_DEBOUNCE_MS);
  };

  /** Continuously morphs scale/opacity by distance from center - the "fluid" feel while dragging. */
  private updateVisualState(): void {
    // Viewport-relative geometry, not offsetTop: offsetTop is measured against the item's
    // offsetParent (the outer .nc-wheel), whose effective position shifts whenever the wheel
    // is collapsed (flex centers the taller, fixed-height scroll content within the shorter
    // collapsed box), which would silently throw every distance off by one item at rest.
    // getBoundingClientRect() reflects the true rendered position regardless of that shift.
    const scrollRect = this.scrollEl.getBoundingClientRect();
    const centerY = scrollRect.top + scrollRect.height / 2;

    for (const item of this.items) {
      const itemRect = item.getBoundingClientRect();
      const itemCenterY = itemRect.top + itemRect.height / 2;
      const t = Math.min(1, Math.abs(itemCenterY - centerY) / this.itemHeight);
      item.style.transform = `scale(${1 - 0.32 * t})`;
      item.style.opacity = String(1 - 0.78 * t);
      item.classList.toggle('is-center', t < 0.12);
    }
  }

  private onSettle(): void {
    const index = Math.min(Math.max(Math.round(this.scrollEl.scrollTop / this.itemHeight), 0), this.values.length - 1);
    const value = this.values[index];
    const valueChanged = value !== this.currentValue;
    this.currentValue = value;

    if (valueChanged) {
      this.onChange?.(value);
    }

    // Settle is the authoritative resting position - recompute visuals from it directly,
    // rather than trusting whatever the last mid-scroll rAF frame happened to leave behind.
    this.updateVisualState();
    this.setActive(false);
  }
}
