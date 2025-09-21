type OverlayState = "hide" | "idle" | "ready";

interface OverlayOptions {
  /** Optional class name for the overlay element */
  overlayClass?: string;
}

export class Overlay {
  private overlayClass = "screenshot-tool-overlay";

  constructor({ overlayClass }: OverlayOptions = {}) {
    if (overlayClass) this.overlayClass = overlayClass;
  }

  get element() {
    let overlay = document.querySelector<HTMLDivElement>(`.${this.overlayClass}`);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.classList.add(this.overlayClass);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  get status() {
    if (this.element.classList.contains("ready")) return "ready";
    if (this.element.classList.contains("idle")) return "idle";
    return "hide";
  }

  set status(state: OverlayState) {
    this.element.classList.remove("hide", "idle", "ready");
    this.element.classList.add(state);
  }
}
