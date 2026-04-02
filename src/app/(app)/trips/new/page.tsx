'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/image-upload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const createTrip = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ id: string }>('/api/trips', {
        title,
        destination,
        startDate,
        endDate,
        currency,
        coverImage,
      });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created!');
      router.push(`/trips/${data.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrip.mutate();
  };

  return (
    <div className="px-6 py-6 md:px-10 md:py-10 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="rounded-3xl bg-white p-8 md:p-10 shadow-md border-0">
        <h1 className="text-2xl font-medium mb-6">Create New Trip</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUpload value={coverImage} onChange={setCoverImage} variant="cover" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Trip Name</Label>
              <Input
                id="title"
                placeholder="e.g., Summer in Italy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g., Rome, Italy"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className=""
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
                <option value="LKR">LKR (Rs)</option>
                <option value="INR">INR</option>
                <option value="THB">THB</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full h-12"
              disabled={createTrip.isPending}
            >
              {createTrip.isPending ? 'Creating...' : 'Create Trip'}
            </Button>
          </form>
      </div>
    </div>
  );
}
