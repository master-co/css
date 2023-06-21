import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { initRuntime } from '@master/css';
import config from '../master.css';

initRuntime(config);

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
