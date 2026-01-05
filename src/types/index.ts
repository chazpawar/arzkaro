// Re-export all types
export * from './user.types';
export * from './event.types';
export * from './booking.types';
export * from './ticket.types';
export * from './chat.types';

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}
