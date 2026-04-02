'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/image-upload';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await api.put('/api/auth/profile', { name, currency, avatarUrl });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      refreshUser();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="px-6 py-6 md:px-10 md:py-10 max-w-lg mx-auto">
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-8">Profile</h1>

      <div className="rounded-3xl bg-white p-8 shadow-md border-0 mb-6">
        <div className="flex items-center gap-5">
          <ImageUpload
            value={avatarUrl}
            onChange={(url) => setAvatarUrl(url)}
            variant="avatar"
          />
          <div>
            <p className="text-xl font-semibold">{user?.name}</p>
            <p className="text-base text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-md border-0">
        <h2 className="text-lg font-medium mb-5">Edit Profile</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="profileName">Name</Label>
            <Input
              id="profileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileCurrency">Default Currency</Label>
            <select
              id="profileCurrency"
              className=""
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="LKR">LKR (Rs)</option>
              <option value="INR">INR</option>
              <option value="AUD">AUD</option>
            </select>
          </div>

          <Button type="submit" className="rounded-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      <Separator className="my-8" />

      <Button variant="destructive" onClick={logout} className="w-full rounded-full h-12">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
