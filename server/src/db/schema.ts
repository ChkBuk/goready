import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  decimal,
  boolean,
  time,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============ Users ============
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Trips ============
export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  destination: text('destination').notNull(),
  destLat: decimal('dest_lat', { precision: 10, scale: 7 }),
  destLng: decimal('dest_lng', { precision: 10, scale: 7 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  coverImage: text('cover_image'),
  status: text('status').notNull().default('planning'),
  currency: text('currency').notNull().default('USD'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Trip Members ============
export const tripMembers = pgTable(
  'trip_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('viewer'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('trip_members_trip_user_idx').on(table.tripId, table.userId)]
);

// ============ Trip Days ============
export const tripDays = pgTable(
  'trip_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    dayNumber: integer('day_number').notNull(),
    notes: text('notes'),
  },
  (table) => [uniqueIndex('trip_days_trip_date_idx').on(table.tripId, table.date)]
);

// ============ Activities ============
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripDayId: uuid('trip_day_id')
    .notNull()
    .references(() => tripDays.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  durationMin: integer('duration_min'),
  placeId: text('place_id'),
  placeName: text('place_name'),
  address: text('address'),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),
  sortOrder: integer('sort_order').notNull().default(0),
  transportTo: jsonb('transport_to'),
  googleMapsUrl: text('google_maps_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Bookings ============
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  provider: text('provider'),
  confirmationNo: text('confirmation_no'),
  status: text('status').notNull().default('confirmed'),
  departureAt: timestamp('departure_at', { withTimezone: true }),
  arrivalAt: timestamp('arrival_at', { withTimezone: true }),
  origin: text('origin'),
  destination: text('destination'),
  details: jsonb('details').notNull().default({}),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  currency: text('currency').notNull().default('USD'),
  bookingUrl: text('booking_url'),
  documentId: uuid('document_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Expenses ============
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  paidBy: uuid('paid_by')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  date: date('date').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  splitType: text('split_type').notNull().default('equal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Expense Splits ============
export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    isSettled: boolean('is_settled').notNull().default(false),
    settledAt: timestamp('settled_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('expense_splits_expense_user_idx').on(table.expenseId, table.userId),
  ]
);

// ============ Documents ============
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size'),
  parsedData: jsonb('parsed_data'),
  parseStatus: text('parse_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============ Connected Emails ============
export const connectedEmails = pgTable('connected_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emailAddress: text('email_address').notNull(),
  provider: text('provider').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  isActive: boolean('is_active').notNull().default(true),
  lastSynced: timestamp('last_synced', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
