import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { tripMembers } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

type RequiredRole = 'owner' | 'editor' | 'viewer';

const roleHierarchy: Record<string, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export function requireTripAccess(minimumRole: RequiredRole = 'viewer') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    const tripId = (req.params.tripId || req.params.id) as string;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!tripId) {
      res.status(400).json({ success: false, error: 'Trip ID is required' });
      return;
    }

    try {
      const [member] = await db
        .select()
        .from(tripMembers)
        .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)));

      if (!member) {
        res.status(403).json({ success: false, error: 'Not a member of this trip' });
        return;
      }

      const userLevel = roleHierarchy[member.role] || 0;
      const requiredLevel = roleHierarchy[minimumRole] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      console.error('Trip access check error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}
