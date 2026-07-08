import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
  },
];

const rightNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/laravel/react-starter-kit',
    icon: Folder,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits',
    icon: BookOpen,
  },
];

const activeItemStyles = 'text-900 dark:bg-neutral-800 dark:text-100';

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const page = usePage<SharedData>();
  const { auth } = page.props;
  const getInitials = useInitials();
  return (
    <>
      <div className="border-b border-sidebar-border/80">
        <div className="flex items-center h-16 md:max-w-7xl mx-auto px-4">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-[34px] mr-2 w-[34px]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col items-stretch justify-between bg-sidebar h-full w-64">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetHeader className="flex justify-start text-left">
                  <AppLogoIcon className="dark:text-white fill-current h-6 text-black w-6" />
                </SheetHeader>
                <div className="flex flex-col flex-1 h-full p-4 space-y-4">
                  <div className="flex flex-col justify-between h-full text-sm">
                    <div className="flex flex-col space-y-4">
                      {mainNavItems.map((item) => (
                        <Link key={item.title} href={item.href} className="flex items-center font-medium space-x-2">
                          {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                          <span>{item.title}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-col space-y-4">
                      {rightNavItems.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center font-medium space-x-2"
                        >
                          {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                          <span>{item.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/dashboard" prefetch className="flex items-center space-x-2">
            <AppLogo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center h-full lg:flex ml-6 space-x-6">
            <NavigationMenu className="flex items-stretch h-full">
              <NavigationMenuList className="flex items-stretch h-full space-x-2">
                {mainNavItems.map((item, index) => (
                  <NavigationMenuItem key={index} className="flex items-center h-full relative">
                    <Link
                      href={item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        page.url === item.href && activeItemStyles,
                        'h-9 cursor-pointer px-3',
                      )}
                    >
                      {item.icon && <Icon iconNode={item.icon} className="h-4 mr-2 w-4" />}
                      {item.title}
                    </Link>
                    {page.url === item.href && (
                      <div className="absolute bg-black bottom-0 dark:bg-white h-0.5 left-0 translate-y-px w-full"></div>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center ml-auto space-x-2">
            <div className="flex items-center relative space-x-1">
              <Button variant="ghost" size="icon" className="cursor-pointer group h-9 w-9">
                <Search className="!size-5 group-hover:opacity-100 opacity-80" />
              </Button>
              <div className="hidden lg:flex">
                {rightNavItems.map((item) => (
                  <TooltipProvider key={item.title} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-transparent disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring font-medium group h-9 hover:bg-accent hover:text-accent-foreground ml-1 p-0 ring-offset-background rounded-md text-accent-foreground text-sm transition-colors w-9"
                        >
                          <span className="sr-only">{item.title}</span>
                          {item.icon && <Icon iconNode={item.icon} className="group-hover:opacity-100 opacity-80 size-5" />}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 rounded-full size-10">
                  <Avatar className="overflow-hidden rounded-full size-8">
                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                    <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 dark:text-white rounded-lg text-black">
                      {getInitials(auth.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <UserMenuContent user={auth.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {breadcrumbs.length > 1 && (
        <div className="flex border-b border-sidebar-border/70 w-full">
          <div className="flex items-center justify-start h-12 md:max-w-7xl mx-auto px-4 text-500 w-full">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </>
  );
}
