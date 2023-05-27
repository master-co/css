import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import MasterCSS from '@master/css';
import config from '../master.css';

new MasterCSS(config);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
