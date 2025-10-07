import { uuid } from "./uuid";
import { Overlay } from "./Overlay";
import { ApiResultType } from "../type";

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

  private async cropAndDownloadScreenshot(dataUrl: string): Promise<ApiResultType<string>> {
    if (!this.targetNode) return { success: false, message: "No target node selected" };
    const rect = this.targetNode.getBoundingClientRect();

    // Check if element is within the visible viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate the intersection of the element with the viewport
    const cropX = Math.max(0, rect.left);
    const cropY = Math.max(0, rect.top);
    const cropWidth = Math.min(rect.right, viewportWidth) - cropX;
    const cropHeight = Math.min(rect.bottom, viewportHeight) - cropY;

    // If element is completely outside viewport, don't proceed
    if (cropWidth <= 0 || cropHeight <= 0) {
      return { success: false, message: "Element is not visible in the current viewport" };
    }

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => (img.onload = () => resolve(true)));

    // Scale up for better quality
    const upscaleFactor = 1;
    const windowScale = window.devicePixelRatio;
    const finalScale = windowScale * upscaleFactor;

    canvas.width = cropWidth * finalScale;
    canvas.height = cropHeight * finalScale;
    const ctx = canvas.getContext("2d", {
      alpha: false,
      colorSpace: "srgb",
      desynchronized: false,
      willReadFrequently: false
    });
    if (!ctx) return { success: false, message: "Failed to get canvas context" };

    // Set high-quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Crop and upscale from the screenshot using viewport-relative coordinates
    ctx.drawImage(
      img,
      cropX * windowScale,
      cropY * windowScale,
      cropWidth * windowScale,
      cropHeight * windowScale,
      0,
      0,
      cropWidth * finalScale,
      cropHeight * finalScale
    );

    // Create a link to download the cropped image with best quality PNG
    const croppedDataUrl = canvas.toDataURL("image/png", 1.0);

    const link = document.createElement("a");
    link.target = "_blank";
    link.href = croppedDataUrl;
    link.download = `screenshot-${uuid(5)}.png`;
    link.click();

    return { success: true, message: "Screenshot downloaded", data: croppedDataUrl };
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
      await new Promise((resolve) => setTimeout(resolve, 10));
      const dataUrl = await this.screenshotHandler();
      if (dataUrl) {
        const res = await this.cropAndDownloadScreenshot(dataUrl);
        if (!res.success) alert(res.message);
        else this.toggle(false);
      }
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
