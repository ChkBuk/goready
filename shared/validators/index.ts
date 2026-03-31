import { z } from 'zod';

// ============ Auth Validators ============
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  currency: z.string().length(3).optional(),
});

// ============ Trip Validators ============
export const createTripSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  destination: z.string().min(1, 'Destination is required').max(200),
  destLat: z.number().min(-90).max(90).nullable().optional(),
  destLng: z.number().min(-180).max(180).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  coverImage: z.string().url().nullable().optional(),
  currency: z.string().length(3).default('USD'),
});

export const updateTripSchema = createTripSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

// ============ Activity Validators ============
export const createActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum([
    'sightseeing',
    'meal',
    'transport',
    'accommodation',
    'shopping',
    'entertainment',
    'other',
  ]),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
    .nullable()
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM')
    .nullable()
    .optional(),
  durationMin: z.number().int().positive().nullable().optional(),
  placeId: z.string().nullable().optional(),
  placeName: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  transportTo: z
    .object({
      mode: z.enum([
        'walking',
        'driving',
        'transit',
        'bus',
        'train',
        'taxi',
        'ferry',
      ]),
      durationMin: z.number().int().positive(),
      distance: z.string().optional(),
      routeInfo: z.string().optional(),
    })
    .nullable()
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const reorderActivitiesSchema = z.object({
  activityIds: z.array(z.string().uuid()),
});

// ============ Booking Validators ============
export const createBookingSchema = z.object({
  type: z.enum([
    'flight',
    'hotel',
    'bus',
    'train',
    'ferry',
    'car_rental',
    'other',
  ]),
  provider: z.string().max(200).nullable().optional(),
  confirmationNo: z.string().max(100).nullable().optional(),
  status: z.string().max(50).default('confirmed'),
  departureAt: z.string().datetime().nullable().optional(),
  arrivalAt: z.string().datetime().nullable().optional(),
  origin: z.string().max(200).nullable().optional(),
  destination: z.string().max(200).nullable().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
  cost: z.number().positive().nullable().optional(),
  currency: z.string().length(3).default('USD'),
  bookingUrl: z.string().url().nullable().optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

// ============ Expense Validators ============
export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  category: z.enum([
    'food',
    'transport',
    'accommodation',
    'activity',
    'shopping',
    'other',
  ]),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(1000).nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
  splitType: z.enum(['equal', 'exact', 'percentage']).default('equal'),
  splits: z
    .array(
      z.object({
        userId: z.string().uuid(),
        amount: z.number().min(0),
      })
    )
    .optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ============ Type exports from validators ============
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
