'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TripMember {
  id: string;
  userId: string;
  role: string;
  userName: string;
  userEmail: string;
}

const roleColors: Record<string, string> = {
  owner: 'bg-amber-50 text-amber-700',
  editor: 'bg-blue-50 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export function TripMembers({
  tripId,
  members,
}: {
  tripId: string;
  members: TripMember[];
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const queryClient = useQueryClient();

  const invite = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ message?: string }>(`/api/trips/${tripId}/members`, { email, role });
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (res) => {
      const msg = (res.data as any)?.message || (res as any).message;
      if (msg && msg.includes('register')) {
        toast.success(msg);
      } else {
        toast.success('Member added!');
      }
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const res = await api.put(`/api/trips/${tripId}/members/${userId}`, { role: newRole });
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/api/trips/${tripId}/members/${userId}`);
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      {/* Invite form */}
      <div className="rounded-3xl bg-white p-6 shadow-md border-0">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          Invite Member
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
          className="space-y-3"
        >
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <div className="flex gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="flex-1"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button type="submit" className="rounded-full px-8" disabled={invite.isPending}>
              {invite.isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </form>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm border-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm">
                {member.userName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{member.userName}</p>
              <p className="text-base text-muted-foreground truncate">
                {member.userEmail}
              </p>
            </div>
            {member.role === 'owner' ? (
              <Badge variant="secondary" className={roleColors.owner}>
                owner
              </Badge>
            ) : (
              <>
                <select
                  value={member.role}
                  onChange={(e) => updateRole.mutate({ userId: member.userId, newRole: e.target.value })}
                  className="h-8 rounded-lg border border-border bg-white px-2 text-sm font-medium cursor-pointer"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeMember.mutate(member.userId)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
