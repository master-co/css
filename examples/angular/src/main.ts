import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import defaultManifestJSON from '@master/css-preset/default-manifest.json';
import CSSRuntime from '@master/css-runtime';
import type { MasterCSSManifest } from '@master/css-runtime';

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest;

void CSSRuntime.start({ manifest: defaultManifest })
  .then((cssRuntime) => cssRuntime.observe())
  .catch((error) => console.error(error));

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
