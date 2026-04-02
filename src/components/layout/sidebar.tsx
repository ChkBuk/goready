'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Search, User, LogOut, Receipt, Ticket } from 'lucide-react';
import { GoReadyLogo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Detect if we're inside a trip context
  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripId = tripMatch ? tripMatch[1] : null;

  const mainNav = [
    { href: '/dashboard', label: 'My Trips', icon: Map },
    { href: '/search/flights', label: 'Search Flights', icon: Search },
    { href: '/search/hotels', label: 'Search Hotels', icon: Search },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const tripNav = tripId
    ? [
        { href: `/trips/${tripId}`, label: 'Itinerary', icon: Map },
        { href: `/trips/${tripId}/expenses`, label: 'Expenses', icon: Receipt },
        { href: `/trips/${tripId}/bookings`, label: 'Bookings', icon: Ticket },
      ]
    : [];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 shadow-sm bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <GoReadyLogo size={32} />
        <span className="text-xl font-semibold tracking-tight">GoReady</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-colors',
                isActive
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Trip-specific nav */}
        {tripNav.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-5">
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Current Trip</p>
            </div>
            {tripNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border/30 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium truncate">{user?.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
