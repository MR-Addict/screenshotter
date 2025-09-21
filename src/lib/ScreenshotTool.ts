import { Overlay } from "./Overlay";

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
  private active = false;
  private hoverTimeout: number | null = null;
  private targetNode: HTMLElement | null = null;

  private overlay: Overlay;
  private screenshotHandler: ScreenshotHandler | null = null;

  constructor({ screenshotHandler }: ScreenshotToolOptions = {}) {
    this.init();
    this.overlay = new Overlay();
    this.overlay.element.addEventListener("click", this.handleClickTarget.bind(this));
    if (screenshotHandler) this.screenshotHandler = screenshotHandler;
  }

  /**
   * Toggle the active state of the screenshot tool
   */
  toggle(state?: boolean) {
    this.active = state !== undefined ? state : !this.active;
    this.overlay.status = this.active ? "idle" : "hide";
    if (!this.active) this.targetNode = null;
  }

  private async cropAndDownloadScreenshot(dataUrl: string) {
    if (!this.targetNode) return;
    const rect = this.targetNode.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => (img.onload = () => resolve(true)));

    const scale = window.devicePixelRatio;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      rect.left * scale,
      rect.top * scale,
      rect.width * scale,
      rect.height * scale,
      0,
      0,
      rect.width * scale,
      rect.height * scale
    );

    // Create a link to download the cropped image
    const croppedDataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = croppedDataUrl;
    link.download = "screenshot.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private updateOverlay() {
    if (!this.targetNode) return;
    const rect = this.targetNode.getBoundingClientRect();
    const overlay = this.overlay.element;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  private async handleClickTarget(event: PointerEvent) {
    if (this.active && event.metaKey && this.screenshotHandler && this.targetNode) {
      this.overlay.status = "hide";
      const dataUrl = await this.screenshotHandler();
      if (dataUrl) await this.cropAndDownloadScreenshot(dataUrl);
      this.toggle(false);
    }
  }

  private init() {
    // Register mouseover event listener
    document.addEventListener("mouseover", (event) => {
      if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
      this.hoverTimeout = setTimeout(() => {
        if (!this.active || this.overlay.status !== "idle") return;
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
        this.targetNode = null;
        this.overlay.status = "hide";
      }
      // Meta key to prepare for screenshot
      else if (event.metaKey) {
        event.preventDefault();
        this.overlay.status = "ready";
      }
    });

    // Register keyup event listener
    window.addEventListener("keyup", (event) => {
      // Remove ready state when meta key is released
      if (this.active && event.key === "Meta") this.overlay.status = "idle";
    });
  }
}
