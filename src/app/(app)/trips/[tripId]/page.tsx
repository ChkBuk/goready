'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
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
      <div className="px-5 py-8 text-center">
        <p>Trip not found</p>
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white mt-4">Go back</Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-base font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-5 mt-2 text-base text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {trip.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(trip.startDate), 'MMM d')} -{' '}
                {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {trip.members.length} member{trip.members.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="self-start">{trip.status}</Badge>
        </div>
      </div>

      {/* Navigation tabs */}
      <Tabs defaultValue="itinerary">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <div className="flex gap-2 mt-3">
          <Link
            href={`/trips/${tripId}/expenses`}
            className="inline-flex items-center justify-center rounded-full border border-border h-11 px-6 text-base font-medium hover:bg-muted transition-colors"
          >
            Expenses
          </Link>
          <Link
            href={`/trips/${tripId}/bookings`}
            className="inline-flex items-center justify-center rounded-full border border-border h-11 px-6 text-base font-medium hover:bg-muted transition-colors"
          >
            Bookings
          </Link>
        </div>

        <TabsContent value="itinerary" className="mt-6">
          <DayPlanner tripId={tripId} days={trip.days} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <TripMembers tripId={tripId} members={trip.members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
