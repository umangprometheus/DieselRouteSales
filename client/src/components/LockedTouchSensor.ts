import { TouchSensor } from '@dnd-kit/core';

// Custom TouchSensor that prevents viewport scrolling during drag
export class LockedTouchSensor extends TouchSensor {
  private preventScrollListener: ((e: TouchEvent) => void) | null = null;
  private savedBodyStyles: {
    overflow: string;
    touchAction: string;
    position: string;
    width: string;
    top: string;
  } | null = null;
  private savedHtmlStyles: {
    overflow: string;
    touchAction: string;
    overscrollBehavior: string;
  } | null = null;
  private scrollTop: number = 0;

  static activators = TouchSensor.activators;

  onStart(event: Event) {
    // Prevent default immediately to stop scroll
    if ('touches' in event) {
      event.preventDefault();
    }

    // Save current scroll position
    this.scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Lock viewport
    this.lockViewportScroll();

    // Install non-passive touchmove listener to prevent scrolling
    this.preventScrollListener = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener('touchmove', this.preventScrollListener, { passive: false });

    // Call parent implementation
    super.onStart(event);
  }

  onMove(event: Event) {
    // Prevent default on move events too
    if ('touches' in event) {
      event.preventDefault();
    }
    super.onMove(event);
  }

  onEnd(event: Event) {
    // Restore viewport
    this.unlockViewportScroll();

    // Remove touchmove listener
    if (this.preventScrollListener) {
      document.removeEventListener('touchmove', this.preventScrollListener);
      this.preventScrollListener = null;
    }

    // Call parent implementation
    super.onEnd(event);
  }

  onCancel(event: Event) {
    // Restore viewport
    this.unlockViewportScroll();

    // Remove touchmove listener
    if (this.preventScrollListener) {
      document.removeEventListener('touchmove', this.preventScrollListener);
      this.preventScrollListener = null;
    }

    // Call parent implementation
    super.onCancel(event);
  }

  private lockViewportScroll() {
    const body = document.body;
    const html = document.documentElement;

    // Save current styles
    this.savedBodyStyles = {
      overflow: body.style.overflow,
      touchAction: body.style.touchAction,
      position: body.style.position,
      width: body.style.width,
      top: body.style.top,
    };

    this.savedHtmlStyles = {
      overflow: html.style.overflow,
      touchAction: html.style.touchAction,
      overscrollBehavior: html.style.overscrollBehavior,
    };

    // Lock body to prevent scrolling
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = `-${this.scrollTop}px`;

    // Lock html too
    html.style.overflow = 'hidden';
    html.style.touchAction = 'none';
    html.style.overscrollBehavior = 'none';
  }

  private unlockViewportScroll() {
    const body = document.body;
    const html = document.documentElement;

    // Restore body styles
    if (this.savedBodyStyles) {
      body.style.overflow = this.savedBodyStyles.overflow;
      body.style.touchAction = this.savedBodyStyles.touchAction;
      body.style.position = this.savedBodyStyles.position;
      body.style.width = this.savedBodyStyles.width;
      body.style.top = this.savedBodyStyles.top;
    }

    // Restore html styles
    if (this.savedHtmlStyles) {
      html.style.overflow = this.savedHtmlStyles.overflow;
      html.style.touchAction = this.savedHtmlStyles.touchAction;
      html.style.overscrollBehavior = this.savedHtmlStyles.overscrollBehavior;
    }

    // Restore scroll position
    window.scrollTo(0, this.scrollTop);

    this.savedBodyStyles = null;
    this.savedHtmlStyles = null;
  }
}