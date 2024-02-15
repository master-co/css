import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initCSSRuntime } from '@master/css-runtime';
import config from '../master.css';

initCSSRuntime(config);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
