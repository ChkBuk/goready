'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DayPlanner } from '@/components/trips/day-planner';
import { TripMembers } from '@/components/trips/trip-members';

interface TripMember {
  id: string;
  userId: string;
  role: string;
  userName: string;
  userEmail: string;
}

interface TripDay {
  id: string;
  date: string;
  dayNumber: number;
  notes: string | null;
}

interface TripDetail {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  currency: string;
  members: TripMember[];
  days: TripDay[];
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await api.get<TripDetail>(`/api/trips/${tripId}`);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-4 py-6 text-center">
        <p>Trip not found</p>
        <Link href="/dashboard" className={cn(buttonVariants(), "mt-4")}>Go back</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "mb-3")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {trip.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(trip.startDate), 'MMM d')} -{' '}
                {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {trip.members.length} member{trip.members.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Badge variant="secondary">{trip.status}</Badge>
        </div>
      </div>

      {/* Navigation tabs */}
      <Tabs defaultValue="itinerary">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <div className="flex gap-2 mt-2">
          <Link
            href={`/trips/${tripId}/expenses`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Expenses
          </Link>
          <Link
            href={`/trips/${tripId}/bookings`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Bookings
          </Link>
        </div>

        <TabsContent value="itinerary" className="mt-4">
          <DayPlanner tripId={tripId} days={trip.days} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <TripMembers tripId={tripId} members={trip.members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
