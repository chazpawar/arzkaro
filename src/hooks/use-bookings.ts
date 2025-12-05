import { useState, useEffect, useCallback } from 'react';
import * as BookingService from '../services/booking-service';
import type { BookingWithDetails, TicketWithDetails, CreateBooking } from '../types';
import { hasValidCredentials } from '../../backend/supabase';

const FETCH_TIMEOUT = 3000;

/**
 * Hook for managing user's bookings
 */
export function useBookings(userId: string | undefined) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!userId || !hasValidCredentials) {
      setLoading(false);
      setBookings([]);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      setLoading(true);
      setError(null);

      const fetchPromise = BookingService.getUserBookings(userId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
      if (timeoutId!) {
        clearTimeout(timeoutId);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refresh: fetchBookings,
  };
}

/**
 * Hook for managing user's tickets
 */
export function useTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId || !hasValidCredentials) {
      setLoading(false);
      setTickets([]);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      setLoading(true);
      setError(null);

      const fetchPromise = BookingService.getUserTickets(userId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT);
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
      setTickets([]);
    } finally {
      setLoading(false);
      if (timeoutId!) {
        clearTimeout(timeoutId);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets by status
  const validTickets = tickets.filter((t) => t.status === 'valid');
  const usedTickets = tickets.filter((t) => t.status === 'used');
  const expiredTickets = tickets.filter((t) => t.status === 'expired' || t.status === 'cancelled');

  return {
    tickets,
    validTickets,
    usedTickets,
    expiredTickets,
    loading,
    error,
    refresh: fetchTickets,
  };
}

/**
 * Hook for creating a booking
 */
export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createBooking = useCallback(async (bookingData: CreateBooking, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await BookingService.createBooking(bookingData, userId);
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    createBooking,
    loading,
    error,
    success,
    reset,
  };
}

/**
 * Hook for a single ticket
 */
export function useTicket(ticketId: string | undefined) {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await BookingService.getTicketById(ticketId);
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return {
    ticket,
    loading,
    error,
    refresh: fetchTicket,
  };
}

/**
 * Hook for ticket validation (for hosts)
 */
export function useTicketValidation() {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    ticket?: any;
  } | null>(null);

  const validateTicket = useCallback(async (ticketNumber: string, hostId: string) => {
    try {
      setValidating(true);
      setResult(null);
      const validationResult = await BookingService.validateTicket(ticketNumber, hostId);
      setResult(validationResult);
      return validationResult;
    } catch (err) {
      const errorResult = {
        valid: false,
        message: err instanceof Error ? err.message : 'Validation failed',
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setValidating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    validateTicket,
    validating,
    result,
    reset,
  };
}
