import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
  const getInitials = useInitials();

  return (
    <>
      <Avatar className="h-8 overflow-hidden rounded-full w-8">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="dark:text-white bg-neutral-200 rounded-lg text-black">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="display:grid text-sm text-align:left flex-1 leading-tight">
        <span className="font-medium truncate">{user.name}</span>
        {showEmail && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
      </div>
    </>
  );
}
