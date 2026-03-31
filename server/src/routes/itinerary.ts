import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { tripDays, activities } from '../db/schema.js';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { requireTripAccess } from '../middleware/tripAccess.js';
import {
  createActivitySchema,
  updateActivitySchema,
  reorderActivitiesSchema,
} from '../utils/validators.js';

export const itineraryRouter = Router();

itineraryRouter.use(authenticate);

// GET /api/trips/:id/days — list trip days with activities
itineraryRouter.get(
  '/:id/days',
  requireTripAccess('viewer'),
  async (req: Request, res: Response) => {
    try {
      const tripId = req.params.id as string;

      const days = await db
        .select()
        .from(tripDays)
        .where(eq(tripDays.tripId, tripId))
        .orderBy(asc(tripDays.dayNumber));

      // Fetch activities for all days
      const dayIds = days.map((d) => d.id);
      let allActivities: (typeof activities.$inferSelect)[] = [];

      if (dayIds.length > 0) {
        allActivities = await db
          .select()
          .from(activities)
          .where(inArray(activities.tripDayId, dayIds))
          .orderBy(asc(activities.sortOrder));
      }

      // Group activities by day
      const activityMap = new Map<string, typeof allActivities>();
      for (const activity of allActivities) {
        const existing = activityMap.get(activity.tripDayId) || [];
        existing.push(activity);
        activityMap.set(activity.tripDayId, existing);
      }

      const result = days.map((day) => ({
        ...day,
        activities: activityMap.get(day.id) || [],
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('List days error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch itinerary' });
    }
  }
);

// POST /api/trips/:id/days/:dayId/activities — add activity
itineraryRouter.post(
  '/:id/days/:dayId/activities',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = createActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      // Verify the day belongs to this trip
      const [day] = await db
        .select()
        .from(tripDays)
        .where(
          and(eq(tripDays.id, req.params.dayId as string), eq(tripDays.tripId, req.params.id as string))
        );

      if (!day) {
        res.status(404).json({ success: false, error: 'Day not found in this trip' });
        return;
      }

      // Get the next sort order
      const existingActivities = await db
        .select({ sortOrder: activities.sortOrder })
        .from(activities)
        .where(eq(activities.tripDayId, req.params.dayId as string))
        .orderBy(asc(activities.sortOrder));

      const nextOrder =
        existingActivities.length > 0
          ? existingActivities[existingActivities.length - 1].sortOrder + 1
          : 0;

      const { lat, lng, ...restActivityData } = parsed.data;
      const [activity] = await db
        .insert(activities)
        .values({
          ...restActivityData,
          lat: lat != null ? String(lat) : null,
          lng: lng != null ? String(lng) : null,
          tripDayId: req.params.dayId as string,
          sortOrder: parsed.data.sortOrder ?? nextOrder,
        })
        .returning();

      res.status(201).json({ success: true, data: activity });
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({ success: false, error: 'Failed to create activity' });
    }
  }
);

// PUT /api/trips/:id/activities/:activityId — update activity
itineraryRouter.put(
  '/:id/activities/:activityId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = updateActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { lat, lng, ...restUpdateData } = parsed.data;
      const setData: Record<string, unknown> = { ...restUpdateData };
      if (lat !== undefined) {
        setData.lat = lat != null ? String(lat) : null;
      }
      if (lng !== undefined) {
        setData.lng = lng != null ? String(lng) : null;
      }
      const [activity] = await db
        .update(activities)
        .set(setData)
        .where(eq(activities.id, req.params.activityId as string))
        .returning();

      if (!activity) {
        res.status(404).json({ success: false, error: 'Activity not found' });
        return;
      }

      res.json({ success: true, data: activity });
    } catch (error) {
      console.error('Update activity error:', error);
      res.status(500).json({ success: false, error: 'Failed to update activity' });
    }
  }
);

// DELETE /api/trips/:id/activities/:activityId — delete activity
itineraryRouter.delete(
  '/:id/activities/:activityId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .delete(activities)
        .where(eq(activities.id, req.params.activityId as string))
        .returning();

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Activity not found' });
        return;
      }

      res.json({ success: true, message: 'Activity deleted' });
    } catch (error) {
      console.error('Delete activity error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete activity' });
    }
  }
);

// PUT /api/trips/:id/days/:dayId/reorder — reorder activities
itineraryRouter.put(
  '/:id/days/:dayId/reorder',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = reorderActivitiesSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { activityIds } = parsed.data;

      // Update sort orders
      const updates = activityIds.map((id, index) =>
        db
          .update(activities)
          .set({ sortOrder: index })
          .where(eq(activities.id, id))
      );

      await Promise.all(updates);

      res.json({ success: true, message: 'Activities reordered' });
    } catch (error) {
      console.error('Reorder activities error:', error);
      res.status(500).json({ success: false, error: 'Failed to reorder activities' });
    }
  }
);
