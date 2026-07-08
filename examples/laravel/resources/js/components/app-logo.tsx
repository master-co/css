import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
  return (
    <>
      <div className="flex items-center justify-center aspect-square bg-sidebar-primary rounded-md size-8 text-sidebar-primary-foreground">
        <AppLogoIcon className="dark:text-black fill-current size-5 text-white" />
      </div>
      <div className="grid text-left flex-1 ml-1 text-sm">
        <span className="font-semibold leading-none mb-0.5 truncate">Laravel Starter Kit</span>
      </div>
    </>
  );
}
