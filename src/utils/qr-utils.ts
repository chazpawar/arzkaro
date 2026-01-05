/**
 * QR Code Utilities
 * Helper functions for generating and validating QR codes for tickets
 */

// Generate a unique QR code for a ticket
export function generateQRCode(bookingId: string, userId: string, eventId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);

  // Create a unique code combining booking info with random elements
  const code = `AK-${eventId.substring(0, 8)}-${bookingId.substring(0, 8)}-${timestamp.toString(36)}-${random}`;

  return code.toUpperCase();
}

// Validate QR code format
export function isValidQRFormat(qrCode: string): boolean {
  // Check if it matches our format: AK-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const pattern = /^AK-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]+-[A-Z0-9]+$/;
  return pattern.test(qrCode);
}

// Extract information from QR code
export function parseQRCode(qrCode: string): {
  eventIdPrefix: string;
  bookingIdPrefix: string;
  timestamp: number;
} | null {
  if (!isValidQRFormat(qrCode)) {
    return null;
  }

  const parts = qrCode.split('-');
  if (parts.length < 5) {
    return null;
  }

  return {
    eventIdPrefix: parts[1],
    bookingIdPrefix: parts[2],
    timestamp: parseInt(parts[3], 36),
  };
}

// Generate QR data string for encoding
export function getQRDataString(qrCode: string): string {
  // For QR code libraries, we encode the ticket code as a simple string
  // This can be enhanced to include a URL for web validation
  return JSON.stringify({
    type: 'arzkaro_ticket',
    code: qrCode,
    version: 1,
  });
}

// Parse QR data string from scan
export function parseQRDataString(data: string): { code: string } | null {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(data);
    if (parsed.type === 'arzkaro_ticket' && parsed.code) {
      return { code: parsed.code };
    }
  } catch {
    // If not JSON, try to extract the code directly
    if (isValidQRFormat(data)) {
      return { code: data };
    }
  }
  return null;
}
