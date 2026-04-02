'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface ActivityData {
  id: string;
  title: string;
  category: string;
  startTime: string | null;
  endTime: string | null;
  placeName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  notes: string | null;
}

interface Props {
  tripId: string;
  dayId: string;
  activity?: ActivityData;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityForm({ tripId, dayId, activity, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(activity?.title || '');
  const [category, setCategory] = useState(activity?.category || 'sightseeing');
  const [startTime, setStartTime] = useState(activity?.startTime || '');
  const [endTime, setEndTime] = useState(activity?.endTime || '');
  const [placeName, setPlaceName] = useState(activity?.placeName || '');
  const [address, setAddress] = useState(activity?.address || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(activity?.googleMapsUrl || '');
  const [notes, setNotes] = useState(activity?.notes || '');

  const isEditing = !!activity;

  useEffect(() => {
    if ((placeName || address) && !googleMapsUrl.startsWith('https://www.google.com/maps/place/')) {
      setGoogleMapsUrl(buildGoogleMapsUrl(placeName, address));
    }
  }, [placeName, address]);

  const saveActivity = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        category,
        startTime: startTime || null,
        endTime: endTime || null,
        placeName: placeName || null,
        address: address || null,
        googleMapsUrl: googleMapsUrl || null,
        notes: notes || null,
      };

      if (isEditing) {
        const res = await api.put(`/api/trips/${tripId}/activities/${activity.id}`, payload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await api.post(`/api/trips/${tripId}/days/${dayId}/activities`, payload);
        if (!res.success) throw new Error(res.error);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Activity updated!' : 'Activity added!');
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveActivity.mutate();
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-md border-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">{isEditing ? 'Edit Activity' : 'Add Activity'}</h3>
        <button
          className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="actTitle">Title</Label>
          <Input
            id="actTitle"
            placeholder="e.g., Visit Colosseum"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actCategory">Category</Label>
          <select
            id="actCategory"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="actStart">Start Time</Label>
            <Input
              id="actStart"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actEnd">End Time</Label>
            <Input
              id="actEnd"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actPlace">Place Name</Label>
          <Input
            id="actPlace"
            placeholder="e.g., Colosseum"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actAddress">Address</Label>
          <Input
            id="actAddress"
            placeholder="e.g., Piazza del Colosseo, 1, Roma"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actMapsUrl" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Google Maps Link
          </Label>
          <div className="flex gap-2">
            <Input
              id="actMapsUrl"
              placeholder="Auto-generated or paste your own"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="flex-1"
            />
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border hover:bg-muted transition-colors flex-shrink-0"
                title="Open in Google Maps"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground/80">
            Auto-generated from place name and address. Paste your own link to override.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actNotes">Notes</Label>
          <Input
            id="actNotes"
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1 h-12 rounded-full" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 h-12 rounded-full" disabled={saveActivity.isPending}>
            {saveActivity.isPending ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Activity')}
          </Button>
        </div>
      </form>
    </div>
  );
}
