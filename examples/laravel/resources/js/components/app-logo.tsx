import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
  return (
    <>
      <div className="display:flex align-items:center justify-content:center aspect-square bg-sidebar-primary rounded-md size-8 text-sidebar-primary-foreground">
        <AppLogoIcon className="fill-current dark:text-black size-5 text-white" />
      </div>
      <div className="display:grid text-sm text-align:left flex-1 ml-1">
        <span className="font-semibold leading-none mb-0.5 truncate">Laravel Starter Kit</span>
      </div>
    </>
  );
}
