import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' };
import { initCSSRuntime } from '@master/css-runtime';
import type { MasterCSSPlan } from '@master/css-runtime';

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan;

initCSSRuntime({ plan: defaultPlan });

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
