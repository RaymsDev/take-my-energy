import { isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
} from '@angular/core';

@Injectable()
export class ScriptLoaderService {
  private renderer: Renderer2;
  private platformId: Object;
  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.platformId = platformId;
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadScript(src: string, defer: boolean = true): void {
    if (isPlatformBrowser(this.platformId)) {
      const script = this.renderer.createElement('script');
      script.src = src;
      script.defer = defer;
      this.renderer.appendChild(document.body, script);
    }
  }
}
