'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Receipt, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  // Detect if we're inside a trip context
  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripId = tripMatch ? tripMatch[1] : null;

  const navItems = tripId
    ? [
        { href: '/dashboard', label: 'Trips', icon: Map },
        { href: `/trips/${tripId}`, label: 'Itinerary', icon: Map },
        { href: `/trips/${tripId}/expenses`, label: 'Expenses', icon: Receipt },
        { href: `/trips/${tripId}/bookings`, label: 'Bookings', icon: Ticket },
      ]
    : [
        { href: '/dashboard', label: 'Trips', icon: Map },
        { href: '/profile', label: 'Profile', icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] bg-white md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3.5 text-[0.8125rem] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
