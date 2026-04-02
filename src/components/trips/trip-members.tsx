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
      const res = await api.post(`/api/trips/${tripId}/members`, { email, role });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Member invited!');
      setEmail('');
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
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <Button type="submit" className="rounded-full" disabled={invite.isPending}>
            {invite.isPending ? 'Inviting...' : 'Invite'}
          </Button>
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
            <Badge variant="secondary" className={roleColors[member.role] || ''}>
              {member.role}
            </Badge>
            {member.role !== 'owner' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeMember.mutate(member.userId)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
