import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// CRITICAL: Capture OAuth hash BEFORE React renders
// This prevents the custom router from clearing it
if (window.location.hash && window.location.hash.includes('access_token')) {
  sessionStorage.setItem('oauth_hash', window.location.hash);
}

// Load Google Maps API
const loadGoogleMapsAPI = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_GOOGLE_PLACES_API_KEY') {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    console.warn('Google Maps API key not configured');
  }
};

loadGoogleMapsAPI();

createRoot(document.getElementById('root')!).render(<App />);
