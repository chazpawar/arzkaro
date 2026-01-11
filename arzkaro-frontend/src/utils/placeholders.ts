// Utility function to generate inline SVG placeholders
// This replaces via.placeholder.com which has DNS issues

export const getPlaceholderImage = (width: number, height: number, text: string = 'No Image'): string => {
  // Create a data URI with an inline SVG
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="14" 
        fill="#9ca3af"
      >${text}</text>
    </svg>
  `;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Common placeholder sizes
export const PLACEHOLDER_IMAGES = {
  small: getPlaceholderImage(56, 56, ''),
  card: getPlaceholderImage(256, 160, 'No Image'),
  medium: getPlaceholderImage(400, 300, 'No Image'),
  large: getPlaceholderImage(1200, 500, 'No Image'),
  event: getPlaceholderImage(100, 100, 'Event'),
  trip: getPlaceholderImage(1200, 600, 'Trip'),
  gallery: getPlaceholderImage(800, 600, 'Image'),
};
