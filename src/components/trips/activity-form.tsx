'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'meal', label: 'Meal' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

function buildGoogleMapsUrl(placeName: string, address: string): string {
  const query = [placeName, address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

interface Props {
  tripId: string;
  dayId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityForm({ tripId, dayId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('sightseeing');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-suggest Google Maps URL when place name or address changes
  useEffect(() => {
    if ((placeName || address) && !googleMapsUrl.startsWith('https://www.google.com/maps/place/')) {
      // Only auto-fill if user hasn't pasted a specific Maps link
      setGoogleMapsUrl(buildGoogleMapsUrl(placeName, address));
    }
  }, [placeName, address]);

  const createActivity = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/trips/${tripId}/days/${dayId}/activities`, {
        title,
        category,
        startTime: startTime || null,
        endTime: endTime || null,
        placeName: placeName || null,
        address: address || null,
        googleMapsUrl: googleMapsUrl || null,
        notes: notes || null,
      });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Activity added!');
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createActivity.mutate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Add Activity</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="actTitle">Title</Label>
            <Input
              id="actTitle"
              placeholder="e.g., Visit Colosseum"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actCategory">Category</Label>
            <select
              id="actCategory"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="actStart">Start Time</Label>
              <Input
                id="actStart"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="actEnd">End Time</Label>
              <Input
                id="actEnd"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actPlace">Place Name</Label>
            <Input
              id="actPlace"
              placeholder="e.g., Colosseum"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actAddress">Address</Label>
            <Input
              id="actAddress"
              placeholder="e.g., Piazza del Colosseo, 1, Roma"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actMapsUrl" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Google Maps Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="actMapsUrl"
                placeholder="Paste a Google Maps link or auto-generated"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="flex-1"
              />
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input hover:bg-muted transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-generated from place name and address. Paste your own Google Maps link to override.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actNotes">Notes</Label>
            <Input
              id="actNotes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createActivity.isPending}>
              {createActivity.isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
