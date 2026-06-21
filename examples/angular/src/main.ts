import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import defaultManifestJSON from '@master/css-preset/default-manifest.json';
import { initCSSRuntime } from '@master/css-runtime';
import type { MasterCSSManifest } from '@master/css-runtime';

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest;

initCSSRuntime({ manifest: defaultManifest });

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
