'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';

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

const statusColors: Record<string, string> = {
  planning: 'bg-blue-50 text-blue-700',
  active: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
};

export function TripCard({ trip }: { trip: Trip }) {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="overflow-hidden rounded-3xl bg-white shadow-md hover:shadow-lg transition-all cursor-pointer border-0">
        <div className="h-48 bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center overflow-hidden">
          {trip.coverImage ? (
            <img src={trip.coverImage} alt={trip.title} className="h-full w-full object-cover" />
          ) : (
            <MapPin className="h-12 w-12 text-primary/30" />
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="text-lg font-semibold truncate">{trip.title}</h3>
            <Badge variant="secondary" className={statusColors[trip.status] || ''}>
              {trip.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 text-base text-muted-foreground mb-1.5">
            <MapPin className="h-[18px] w-[18px] flex-shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2.5 text-base text-muted-foreground">
            <Calendar className="h-[18px] w-[18px] flex-shrink-0" />
            <span>
              {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')} ({days} days)
            </span>
          </div>
          {trip.myRole !== 'owner' && (
            <Badge variant="outline" className="mt-3">
              {trip.myRole}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
