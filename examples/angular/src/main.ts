import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initCSSRuntime } from '@master/css-runtime';

initCSSRuntime();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
