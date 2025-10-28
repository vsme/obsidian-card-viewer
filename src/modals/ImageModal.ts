import { App, Modal } from "obsidian";
import { ImageData } from "../types";

export class ImageModal extends Modal {
  private imageData: ImageData;
  private imageSrc: string;

  constructor(app: App, imageSrc: string, imageData: ImageData) {
    super(app);
    this.imageSrc = imageSrc;
    this.imageData = imageData;
  }

  onOpen() {
    const { contentEl } = this;

    // Clear any existing content
    contentEl.empty();

    // Add modal-specific class for styling
    contentEl.addClass("card-viewer-image-modal");

    // Create close button
    const closeButton = contentEl.createEl("button", {
      cls: "card-viewer-modal-close",
      text: "×",
    });

    // Add close button event listener
    closeButton.addEventListener("click", () => {
      this.close();
    });

    // Create image element
    const modalImage = contentEl.createEl("img", {
      cls: "card-viewer-modal-image",
      attr: {
        src: this.imageSrc,
        alt: this.imageData.alt || "Image",
      },
    });

    // Add title if available
    if (this.imageData.title) {
      contentEl.createEl("div", {
        cls: "card-viewer-modal-title",
        text: this.imageData.title,
      });
    }

    // Handle image load errors
    modalImage.addEventListener("error", () => {
      modalImage.addClass("card-viewer-modal-image-hidden");
      contentEl.createEl("div", {
        cls: "card-viewer-modal-error",
        text: "Failed to load image",
      });
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
