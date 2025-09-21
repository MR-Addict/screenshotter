type ScreenshotHandler = () => Promise<string | null> | (string | null);

interface ScreenshotToolOptions {
  /**
   * Optional handler to take screenshot, should return data URL of the image
   */
  screenshotHandler?: ScreenshotHandler;
}

/**
 * Tool to select DOM elements and take screenshots
 */
export class ScreenshotTool {
  private hoverTimeout: number | null = null;
  private targetNode: HTMLElement | null = null;

  private readonly overlayClass = "screenshot-tool-hover-overlay";
  private screenshotHandler: ScreenshotHandler | null = null;

  constructor({ screenshotHandler }: ScreenshotToolOptions = {}) {
    this.init();
    if (screenshotHandler) this.screenshotHandler = screenshotHandler;
  }

  get active() {
    return this.overlay.classList.contains("active");
  }

  set active(value: boolean) {
    this.overlay.classList.toggle("active", value);
  }

  private get overlay() {
    let overlay = document.querySelector<HTMLDivElement>(`.${this.overlayClass}`);
    if (!overlay) {
      const handleClick = async () => {
        if (!this.active) return;
        const dataUrl = await this.screenshotHandler?.();
        if (dataUrl) this.handleTakeScreenshot(dataUrl);
      };
      overlay = document.createElement("div");
      overlay.classList.add(this.overlayClass);
      overlay.addEventListener("click", handleClick);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  private async handleTakeScreenshot(dataUrl: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "screenshot.png";
    a.click();
  }

  private updateOverlay() {
    if (!this.targetNode) return;
    const rect = this.targetNode.getBoundingClientRect();
    const overlay = this.overlay;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  private init() {
    // Register mouseover event listener
    document.addEventListener("mouseover", (event) => {
      if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(() => {
        if (!this.active) return;
        const target = event.target as HTMLElement | null;
        if (!target) return;
        this.targetNode = target;
        this.updateOverlay();
      }, 50);
    });

    // Register keydown event listener
    window.addEventListener("keydown", (event) => {
      if (!this.active) return;

      // Escape to deactivate
      if (event.key === "Escape") {
        event.preventDefault();
        this.active = false;
      }
      // Meta key to prepare for screenshot
      else if (event.metaKey) {
        event.preventDefault();
        this.overlay.classList.add("ready");
      }
    });

    // Register keyup event listener
    window.addEventListener("keyup", (event) => {
      if (!this.active) return;

      // Remove ready state when meta key is released
      if (event.key === "Meta") this.overlay.classList.remove("ready");
    });
  }
}
