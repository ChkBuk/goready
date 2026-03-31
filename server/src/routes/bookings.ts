import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { bookings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { requireTripAccess } from '../middleware/tripAccess.js';
import { createBookingSchema, updateBookingSchema } from '../utils/validators.js';

export const bookingsRouter = Router();

bookingsRouter.use(authenticate);

// GET /api/trips/:id/bookings
bookingsRouter.get(
  '/:id/bookings',
  requireTripAccess('viewer'),
  async (req: Request, res: Response) => {
    try {
      const tripBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.tripId, req.params.id as string));

      res.json({ success: true, data: tripBookings });
    } catch (error) {
      console.error('List bookings error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
  }
);

// POST /api/trips/:id/bookings
bookingsRouter.post(
  '/:id/bookings',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { departureAt, arrivalAt, cost, ...restData } = parsed.data;
      const [booking] = await db
        .insert(bookings)
        .values({
          ...restData,
          departureAt: departureAt ? new Date(departureAt) : null,
          arrivalAt: arrivalAt ? new Date(arrivalAt) : null,
          cost: cost != null ? String(cost) : null,
          tripId: req.params.id as string,
          userId: req.user!.userId,
        })
        .returning();

      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to create booking' });
    }
  }
);

// PUT /api/trips/:id/bookings/:bookingId
bookingsRouter.put(
  '/:id/bookings/:bookingId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const parsed = updateBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { departureAt, arrivalAt, ...restUpdateData } = parsed.data;
      const setData: Record<string, unknown> = { ...restUpdateData };
      if (departureAt !== undefined) {
        setData.departureAt = departureAt ? new Date(departureAt) : null;
      }
      if (arrivalAt !== undefined) {
        setData.arrivalAt = arrivalAt ? new Date(arrivalAt) : null;
      }

      const [booking] = await db
        .update(bookings)
        .set(setData)
        .where(eq(bookings.id, req.params.bookingId as string))
        .returning();

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      res.json({ success: true, data: booking });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to update booking' });
    }
  }
);

// DELETE /api/trips/:id/bookings/:bookingId
bookingsRouter.delete(
  '/:id/bookings/:bookingId',
  requireTripAccess('editor'),
  async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .delete(bookings)
        .where(eq(bookings.id, req.params.bookingId as string))
        .returning();

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      res.json({ success: true, message: 'Booking deleted' });
    } catch (error) {
      console.error('Delete booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete booking' });
    }
  }
);
