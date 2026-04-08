import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { trips, tripMembers, tripDays, users } from '../db/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { requireTripAccess } from '../middleware/tripAccess.js';
import { createTripSchema, updateTripSchema, inviteMemberSchema, updateMemberRoleSchema } from '../utils/validators.js';
import { sendInviteEmail } from '../utils/email.js';

export const tripsRouter = Router();

// All trip routes require authentication
tripsRouter.use(authenticate);

// POST /api/trips — create trip
tripsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const userId = req.user!.userId;
    const { destLat, destLng, ...restData } = parsed.data;

    // Create trip
    const [trip] = await db
      .insert(trips)
      .values({
        ...restData,
        destLat: destLat != null ? String(destLat) : null,
        destLng: destLng != null ? String(destLng) : null,
        createdBy: userId,
      })
      .returning();

    // Add creator as owner
    await db.insert(tripMembers).values({
      tripId: trip.id,
      userId,
      role: 'owner',
    });

    // Generate trip days
    const start = new Date(restData.startDate);
    const end = new Date(restData.endDate);
    const days = [];
    let dayNumber = 1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        tripId: trip.id,
        date: d.toISOString().split('T')[0],
        dayNumber: dayNumber++,
      });
    }

    if (days.length > 0) {
      await db.insert(tripDays).values(days);
    }

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to create trip' });
  }
});

// GET /api/trips — list user's trips
tripsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const memberTrips = await db
      .select({
        trip: trips,
        role: tripMembers.role,
      })
      .from(tripMembers)
      .innerJoin(trips, eq(tripMembers.tripId, trips.id))
      .where(eq(tripMembers.userId, userId))
      .orderBy(desc(trips.startDate));

    const result = memberTrips.map((mt) => ({
      ...mt.trip,
      myRole: mt.role,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('List trips error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/:id — trip details
tripsRouter.get('/:id', requireTripAccess('viewer'), async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id as string;

    const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!trip) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    // Fetch members with user info
    const members = await db
      .select({
        id: tripMembers.id,
        tripId: tripMembers.tripId,
        userId: tripMembers.userId,
        role: tripMembers.role,
        joinedAt: tripMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatarUrl,
      })
      .from(tripMembers)
      .innerJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId));

    // Fetch days
    const days = await db
      .select()
      .from(tripDays)
      .where(eq(tripDays.tripId, tripId))
      .orderBy(tripDays.dayNumber);

    res.json({
      success: true,
      data: { ...trip, members, days },
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trip' });
  }
});

// PUT /api/trips/:id — update trip
tripsRouter.put('/:id', requireTripAccess('editor'), async (req: Request, res: Response) => {
  try {
    const parsed = updateTripSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const { destLat, destLng, ...restUpdateData } = parsed.data;
    const setData: Record<string, unknown> = { ...restUpdateData, updatedAt: new Date() };
    if (destLat !== undefined) {
      setData.destLat = destLat != null ? String(destLat) : null;
    }
    if (destLng !== undefined) {
      setData.destLng = destLng != null ? String(destLng) : null;
    }

    const [trip] = await db
      .update(trips)
      .set(setData)
      .where(eq(trips.id, req.params.id as string))
      .returning();

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id — delete trip (owner only)
tripsRouter.delete('/:id', requireTripAccess('owner'), async (req: Request, res: Response) => {
  try {
    await db.delete(trips).where(eq(trips.id, req.params.id as string));
    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete trip' });
  }
});

// POST /api/trips/:id/members — invite member
tripsRouter.post(
  '/:id/members',
  requireTripAccess('owner'),
  async (req: Request, res: Response) => {
    try {
      const parsed = inviteMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const { email, role } = parsed.data;
      const tripId = req.params.id as string;

      // Get trip details and inviter info for the email
      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      const inviterUser = (req as any).user;

      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user) {
        // User not registered — send invitation email to sign up
        if (trip && inviterUser) {
          await sendInviteEmail({
            to: email,
            inviterName: inviterUser.name || 'A friend',
            tripTitle: trip.title,
            tripDestination: trip.destination,
            isNewUser: true,
          });
        }
        res.status(200).json({
          success: true,
          data: null,
          message: `Invitation email sent to ${email}. They need to register first.`,
        });
        return;
      }

      // Check if already a member
      const [existing] = await db
        .select()
        .from(tripMembers)
        .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)));

      if (existing) {
        res.status(409).json({ success: false, error: 'User is already a member' });
        return;
      }

      const [member] = await db
        .insert(tripMembers)
        .values({ tripId, userId: user.id, role: role || 'viewer' })
        .returning();

      // Send notification email to existing user
      if (trip && inviterUser) {
        await sendInviteEmail({
          to: email,
          inviterName: inviterUser.name || 'A friend',
          tripTitle: trip.title,
          tripDestination: trip.destination,
          isNewUser: false,
        });
      }

      res.status(201).json({ success: true, data: { ...member, user: { id: user.id, name: user.name, email: user.email } } });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({ success: false, error: 'Failed to invite member' });
    }
  }
);

// PUT /api/trips/:id/members/:userId — update member role
tripsRouter.put(
  '/:id/members/:userId',
  requireTripAccess('owner'),
  async (req: Request, res: Response) => {
    try {
      const parsed = updateMemberRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.issues[0].message });
        return;
      }

      const [member] = await db
        .update(tripMembers)
        .set({ role: parsed.data.role })
        .where(
          and(
            eq(tripMembers.tripId, req.params.id as string),
            eq(tripMembers.userId, req.params.userId as string)
          )
        )
        .returning();

      if (!member) {
        res.status(404).json({ success: false, error: 'Member not found' });
        return;
      }

      res.json({ success: true, data: member });
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({ success: false, error: 'Failed to update member role' });
    }
  }
);

// DELETE /api/trips/:id/members/:userId — remove member
tripsRouter.delete(
  '/:id/members/:userId',
  requireTripAccess('owner'),
  async (req: Request, res: Response) => {
    try {
      // Can't remove the owner
      const [member] = await db
        .select()
        .from(tripMembers)
        .where(
          and(
            eq(tripMembers.tripId, req.params.id as string),
            eq(tripMembers.userId, req.params.userId as string)
          )
        );

      if (!member) {
        res.status(404).json({ success: false, error: 'Member not found' });
        return;
      }

      if (member.role === 'owner') {
        res.status(400).json({ success: false, error: 'Cannot remove the trip owner' });
        return;
      }

      await db
        .delete(tripMembers)
        .where(
          and(
            eq(tripMembers.tripId, req.params.id as string),
            eq(tripMembers.userId, req.params.userId as string)
          )
        );

      res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
  }
);
