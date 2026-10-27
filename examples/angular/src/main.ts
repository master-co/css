import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { MasterCSSRuntime } from '@master/css-runtime';

// The default preset's program loads as its own chunk.
void MasterCSSRuntime.start({ program: () => import('@master/css-runtime/default-program').then((module) => module.defaultProgram) })
  .then((cssRuntime) => cssRuntime.observe())
  .catch((error) => console.error(error));

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
