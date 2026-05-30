// src/app/services/json-ld.service.ts

import {
  Inject,
  Injectable,
  Renderer2,
  RendererFactory2,
  DOCUMENT,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JsonLdService {
  private static scriptType = 'application/ld+json';
  private renderer: Renderer2;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Inject JSON-LD script dynamically into the DOM
   * @param data - The JSON-LD object
   */
  setStructuredData(data: object): void {
    const script = this.renderer.createElement('script');
    script.type = JsonLdService.scriptType;
    script.textContent = JSON.stringify(data, null, 2);
    this.removeExistingStructuredData(); // Clean existing data to avoid duplication
    this.renderer.appendChild(this.document.head, script);
  }

  /**
   * Remove existing JSON-LD scripts
   */
  private removeExistingStructuredData(): void {
    const existingScripts = this.document.querySelectorAll(
      `script[type="${JsonLdService.scriptType}"]`,
    );
    existingScripts.forEach((script) => script.remove());
  }
}
