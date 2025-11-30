import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket, Event } from '@types';
import { useAuth } from './AuthContext';

interface PurchasedTicket extends Ticket {
  quantity: number;
  ticketType: string;
  seatInfo: string;
}

interface TicketContextType {
  tickets: PurchasedTicket[];
  isLoading: boolean;
  purchaseTicket: (event: Event, quantity: number, paymentMethod: string) => Promise<PurchasedTicket>;
  getTicketById: (id: string) => PurchasedTicket | undefined;
  getUpcomingTickets: () => PurchasedTicket[];
  getPastTickets: () => PurchasedTicket[];
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

const TICKETS_STORAGE_KEY = '@arzkaro_tickets';

// Generate a unique QR code string
const generateQRCode = (eventId: string, ticketId: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AK-${eventId.toUpperCase()}-${suffix}`;
};

// Generate a booking ID
const generateBookingId = (): string => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `BK${dateStr}${random}`;
};

// Generate seat info based on quantity
const generateSeatInfo = (quantity: number): string => {
  const sections = ['A', 'B', 'C', 'D'];
  const section = sections[Math.floor(Math.random() * sections.length)];
  const row = Math.floor(Math.random() * 20) + 1;
  const startSeat = Math.floor(Math.random() * 50) + 1;
  
  if (quantity === 1) {
    return `Section ${section}, Row ${row}, Seat ${startSeat}`;
  }
  return `Section ${section}, Row ${row}, Seats ${startSeat}-${startSeat + quantity - 1}`;
};

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStoredTickets();
  }, [user?.id]);

  const loadStoredTickets = async () => {
    try {
      const storedTickets = await AsyncStorage.getItem(TICKETS_STORAGE_KEY);
      if (storedTickets) {
        const allTickets: PurchasedTicket[] = JSON.parse(storedTickets);
        // Filter tickets for current user
        const userTickets = user ? allTickets.filter(t => t.userId === user.id) : [];
        setTickets(userTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load stored tickets:', error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseTicket = async (event: Event, quantity: number, paymentMethod: string): Promise<PurchasedTicket> => {
    if (!user) {
      throw new Error('User must be logged in to purchase tickets');
    }

    const ticketId = `tkt_${Date.now()}`;
    const serviceFee = 50;
    const totalAmount = (event.ticketPrice * quantity) + serviceFee;

    const newTicket: PurchasedTicket = {
      id: ticketId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location.address,
      eventBanner: event.bannerImage,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      qrCode: generateQRCode(event.id, ticketId),
      purchaseDate: new Date().toISOString(),
      amount: totalAmount,
      paymentId: generateBookingId(),
      status: 'active',
      quantity,
      ticketType: quantity > 2 ? 'Group Pass' : quantity === 1 ? 'Standard' : 'Duo Pass',
      seatInfo: generateSeatInfo(quantity),
    };

    // Get all existing tickets from storage
    const storedTickets = await AsyncStorage.getItem(TICKETS_STORAGE_KEY);
    const allTickets: PurchasedTicket[] = storedTickets ? JSON.parse(storedTickets) : [];
    
    // Add the new ticket
    allTickets.push(newTicket);
    
    // Save back to storage
    await AsyncStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(allTickets));
    
    // Update state
    setTickets(prev => [...prev, newTicket]);

    return newTicket;
  };

  const getTicketById = (id: string): PurchasedTicket | undefined => {
    return tickets.find(t => t.id === id);
  };

  const getUpcomingTickets = (): PurchasedTicket[] => {
    const now = new Date();
    return tickets.filter(t => {
      const eventDate = new Date(t.eventDate);
      return eventDate >= now && t.status === 'active';
    });
  };

  const getPastTickets = (): PurchasedTicket[] => {
    const now = new Date();
    return tickets.filter(t => {
      const eventDate = new Date(t.eventDate);
      return eventDate < now || t.status === 'used';
    });
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        isLoading,
        purchaseTicket,
        getTicketById,
        getUpcomingTickets,
        getPastTickets,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within TicketProvider');
  }
  return context;
};
