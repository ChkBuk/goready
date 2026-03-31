'use client';

import { MapPin, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-bold">GoReady</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Avatar className="h-8 w-8">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover p-1 shadow-md">
              <Link
                href="/profile"
                className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
