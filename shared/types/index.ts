// ============ User Types ============
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============ Trip Types ============
export type TripStatus = 'planning' | 'active' | 'completed';
export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  destination: string;
  destLat: number | null;
  destLng: number | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  status: TripStatus;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripWithMembers extends Trip {
  members: TripMember[];
  days: TripDay[];
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user?: User;
}

// ============ Itinerary Types ============
export interface TripDay {
  id: string;
  tripId: string;
  date: string;
  dayNumber: number;
  notes: string | null;
  activities: Activity[];
}

export type ActivityCategory =
  | 'sightseeing'
  | 'meal'
  | 'transport'
  | 'accommodation'
  | 'shopping'
  | 'entertainment'
  | 'other';

export interface TransportInfo {
  mode: 'walking' | 'driving' | 'transit' | 'bus' | 'train' | 'taxi' | 'ferry';
  durationMin: number;
  distance?: string;
  routeInfo?: string;
}

export interface Activity {
  id: string;
  tripDayId: string;
  title: string;
  description: string | null;
  category: ActivityCategory;
  startTime: string | null;
  endTime: string | null;
  durationMin: number | null;
  placeId: string | null;
  placeName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  sortOrder: number;
  transportTo: TransportInfo | null;
  notes: string | null;
  createdAt: string;
}

// ============ Booking Types ============
export type BookingType =
  | 'flight'
  | 'hotel'
  | 'bus'
  | 'train'
  | 'ferry'
  | 'car_rental'
  | 'other';

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  type: BookingType;
  provider: string | null;
  confirmationNo: string | null;
  status: string;
  departureAt: string | null;
  arrivalAt: string | null;
  origin: string | null;
  destination: string | null;
  details: Record<string, unknown>;
  cost: number | null;
  currency: string;
  bookingUrl: string | null;
  documentId: string | null;
  createdAt: string;
}

// ============ Expense Types ============
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other';

export type SplitType = 'equal' | 'exact' | 'percentage';

export interface Expense {
  id: string;
  tripId: string;
  paidBy: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  notes: string | null;
  receiptUrl: string | null;
  splitType: SplitType;
  createdAt: string;
  splits?: ExpenseSplit[];
  paidByUser?: User;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  isSettled: boolean;
  settledAt: string | null;
  user?: User;
}

export interface BalanceSummary {
  userId: string;
  userName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface Settlement {
  from: User;
  to: User;
  amount: number;
}

// ============ Document Types ============
export type ParseStatus = 'pending' | 'parsed' | 'failed';

export interface Document {
  id: string;
  tripId: string | null;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  parsedData: Record<string, unknown> | null;
  parseStatus: ParseStatus;
  createdAt: string;
}

// ============ API Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
