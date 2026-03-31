'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { TripCard } from '@/components/trips/trip-card';
import { Plus, Plane } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImage: string | null;
  myRole: string;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get<Trip[]>('/api/trips');
      return res.data || [];
    },
  });

  const trips = data || [];
  const upcomingTrips = trips.filter(
    (t) => new Date(t.startDate) >= new Date() || t.status === 'planning'
  );
  const pastTrips = trips.filter(
    (t) => new Date(t.endDate) < new Date() && t.status === 'completed'
  );

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Trips</h1>
        <Link href="/trips/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          New Trip
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plane className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No trips yet</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Start planning your next adventure! Create a trip and add activities,
            bookings, and expenses.
          </p>
          <Link href="/trips/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {pastTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Past Trips</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
