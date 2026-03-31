'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="px-4 py-6 md:px-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <ImageUpload
            value={avatarUrl}
            onChange={(url) => setAvatarUrl(url)}
            variant="avatar"
          />
          <div>
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile.mutate();
            }}
            className="space-y-4"
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
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Button variant="destructive" onClick={logout} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
