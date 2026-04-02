'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Plus,
  Clock,
  MapPin,
  Utensils,
  Camera,
  Bus,
  Hotel,
  ShoppingBag,
  Star,
  Trash2,
  Navigation,
} from 'lucide-react';
import { format } from 'date-fns';
import { ActivityForm } from './activity-form';
import { toast } from 'sonner';

interface TripDay {
  id: string;
  date: string;
  dayNumber: number;
  notes: string | null;
}

interface Activity {
  id: string;
  tripDayId: string;
  title: string;
  description: string | null;
  category: string;
  startTime: string | null;
  endTime: string | null;
  placeName: string | null;
  address: string | null;
  sortOrder: number;
  googleMapsUrl: string | null;
  notes: string | null;
}

interface DayWithActivities extends TripDay {
  activities: Activity[];
}

const categoryIcons: Record<string, typeof Camera> = {
  sightseeing: Camera,
  meal: Utensils,
  transport: Bus,
  accommodation: Hotel,
  shopping: ShoppingBag,
  entertainment: Star,
  other: MapPin,
};

const categoryColors: Record<string, string> = {
  sightseeing: 'bg-blue-50 text-blue-600',
  meal: 'bg-orange-50 text-orange-600',
  transport: 'bg-purple-50 text-purple-600',
  accommodation: 'bg-green-50 text-green-600',
  shopping: 'bg-pink-50 text-pink-600',
  entertainment: 'bg-yellow-50 text-yellow-600',
  other: 'bg-gray-100 text-gray-600',
};

export function DayPlanner({ tripId, days }: { tripId: string; days: TripDay[] }) {
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: daysWithActivities, isLoading } = useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async () => {
      const res = await api.get<DayWithActivities[]>(`/api/trips/${tripId}/days`);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await api.delete(`/api/trips/${tripId}/activities/${activityId}`);
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      toast.success('Activity removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentDay = daysWithActivities?.find((d) => d.id === selectedDay) ||
    daysWithActivities?.[0];

  return (
    <div>
      {/* Day selector — pill buttons */}
      <ScrollArea className="w-full whitespace-nowrap mb-6">
        <div className="flex gap-2 pb-2">
          {(daysWithActivities || days).map((day) => {
            const isActive = selectedDay === day.id || (!selectedDay && day.dayNumber === 1);
            return (
              <button
                key={day.id}
                className={`flex-shrink-0 rounded-full px-6 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setSelectedDay(day.id)}
              >
                Day {day.dayNumber}
                <span className="ml-1.5 text-sm opacity-80">
                  {format(new Date(day.date), 'MMM d')}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Activities list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : currentDay && currentDay.activities.length > 0 ? (
        <div className="space-y-3">
          {currentDay.activities
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((activity) => {
              const Icon = categoryIcons[activity.category] || MapPin;
              return (
                <div
                  key={activity.id}
                  className="group flex items-start gap-5 rounded-3xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow border-0"
                >
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-xl flex-shrink-0 ${
                      categoryColors[activity.category] || 'bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-semibold">{activity.title}</h4>
                        {activity.placeName && (
                          <p className="text-base text-muted-foreground flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{activity.placeName}</span>
                            {activity.googleMapsUrl && (
                              <a
                                href={activity.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline flex-shrink-0 ml-1 text-sm font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Navigation className="h-3 w-3" />
                                Map
                              </a>
                            )}
                          </p>
                        )}
                        {!activity.placeName && activity.googleMapsUrl && (
                          <a
                            href={activity.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[0.9375rem] text-primary hover:underline mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Open in Google Maps
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteActivity.mutate(activity.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {activity.startTime && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {activity.startTime}
                          {activity.endTime && ` - ${activity.endTime}`}
                        </span>
                      )}
                      <Badge variant="secondary" className="capitalize">
                        {activity.category}
                      </Badge>
                    </div>
                    {activity.notes && (
                      <p className="text-[0.9375rem] text-muted-foreground mt-2 leading-relaxed">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base text-muted-foreground">No activities planned for this day yet.</p>
        </div>
      )}

      {/* Add activity */}
      {showAddForm && currentDay ? (
        <div className="mt-5">
          <ActivityForm
            tripId={tripId}
            dayId={currentDay.id}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
            }}
          />
        </div>
      ) : (
        <button
          className="w-full mt-5 flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border py-5 text-base font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Activity
        </button>
      )}
    </div>
  );
}
