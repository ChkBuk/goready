'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Plus,
  MapPin,
  Utensils,
  Camera,
  Bus,
  Hotel,
  ShoppingBag,
  Star,
  Trash2,
  Navigation,
  Pencil,
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
  sightseeing: 'bg-blue-500',
  meal: 'bg-orange-500',
  transport: 'bg-purple-500',
  accommodation: 'bg-green-500',
  shopping: 'bg-pink-500',
  entertainment: 'bg-yellow-500',
  other: 'bg-gray-400',
};

export function DayPlanner({ tripId, days }: { tripId: string; days: TripDay[] }) {
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
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
      {/* Day selector — wrapping pill buttons (no scrollbar) */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(daysWithActivities || days).map((day) => {
          const isActive = selectedDay === day.id || (!selectedDay && day.dayNumber === 1);
          return (
            <button
              key={day.id}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => { setSelectedDay(day.id); setShowAddForm(false); setEditingActivity(null); }}
            >
              Day {day.dayNumber}
              <span className="ml-1.5 opacity-80">
                {format(new Date(day.date), 'MMM d')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date heading */}
      {currentDay && (
        <h3 className="text-lg font-semibold mb-6">
          {format(new Date(currentDay.date), 'EEEE dd MMM')}
        </h3>
      )}

      {/* Vertical timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : currentDay && currentDay.activities.length > 0 ? (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-[23px] top-3 bottom-3 w-[3px] bg-primary/80 rounded-full" />

          <div className="space-y-0">
            {currentDay.activities
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((activity) => {
                const Icon = categoryIcons[activity.category] || MapPin;
                const dotColor = categoryColors[activity.category] || 'bg-gray-400';
                return (
                  <div key={activity.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex flex-col items-center flex-shrink-0" style={{ width: '48px' }}>
                      <div className={`flex items-center justify-center h-[48px] w-[48px] rounded-full ${dotColor} text-white shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 min-w-0 group pt-0.5">
                      {/* Time */}
                      {activity.startTime && (
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {activity.startTime}
                          {activity.endTime && (
                            <span className="text-muted-foreground font-normal"> — {activity.endTime}</span>
                          )}
                        </p>
                      )}

                      {/* Title */}
                      <h4 className="text-base font-semibold leading-snug">{activity.title}</h4>

                      {/* Place / address */}
                      {activity.placeName && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {activity.placeName}
                          {activity.address && `, ${activity.address}`}
                        </p>
                      )}

                      {/* Google Maps link */}
                      {activity.googleMapsUrl && (
                        <a
                          href={activity.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Navigation className="h-3 w-3" />
                          Open in Maps
                        </a>
                      )}

                      {/* Notes */}
                      {activity.notes && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {activity.notes}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          onClick={() => { setEditingActivity(activity); setShowAddForm(false); }}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => deleteActivity.mutate(activity.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base text-muted-foreground">No activities planned for this day yet.</p>
        </div>
      )}

      {/* Edit activity form */}
      {editingActivity && currentDay && (
        <div className="mt-6">
          <ActivityForm
            tripId={tripId}
            dayId={currentDay.id}
            activity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSuccess={() => {
              setEditingActivity(null);
              queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
            }}
          />
        </div>
      )}

      {/* Add activity */}
      {!editingActivity && (
        <>
          {showAddForm && currentDay ? (
            <div className="mt-6">
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
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-base font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          )}
        </>
      )}
    </div>
  );
}
