'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  owner: 'bg-amber-100 text-amber-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-gray-100 text-gray-800',
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
    <div className="space-y-4">
      {/* Invite form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate();
            }}
            className="flex flex-col sm:flex-row gap-2"
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
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-sm">
                  {member.userName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.userEmail}
                </p>
              </div>
              <Badge variant="secondary" className={roleColors[member.role] || ''}>
                {member.role}
              </Badge>
              {member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeMember.mutate(member.userId)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
