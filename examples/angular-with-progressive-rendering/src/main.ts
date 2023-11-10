import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initRuntime } from '@master/css';
import config from '../master.css';

initRuntime(config);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
