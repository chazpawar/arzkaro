// src/pages/ExperienceDetailPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Calendar, MapPin } from 'lucide-react';
import Forms from '../components/Form'; // <-- ensure path is correct

// Minimal mock artists (ensure your public images exist)
const MOCK_ARTISTS_DATA = [
  { name: 'Shivam', image_url: '/shivam1.jpeg' },
  { name: 'Niyam', image_url: '/niyam1.jpeg' },
  { name: 'Kinshu', image_url: '/mockArtist3.jpg' },
  { name: 'Rajat', image_url: '/mockArtist4.jpg' },
  { name: 'Raahi', image_url: '/mockArtist5.jpg' },
  { name: 'Gauntlet', image_url: '/mockArtist6.jpg' },

  { name: 'DJ Maverick', image_url: '/mockArtist8.jpg' },
];

export type Event = {
  id: string;
  title: string;
  artist_name: string | string[];
  venue: string;
  city: string;
  event_date: string;
  ticket_price: number;
  description: string;
  image_url: string;
  banner_image_url?: string;
  includes: string[];
  notes: string[];
  contact: string;
  member_count?: number;
};

export type Artist = {
  name: string;
  image_url: string;
};

const ACCENT = '#FF785A';

const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <details className="border-b border-gray-200 py-3 cursor-pointer group">
    <summary className="flex justify-between items-center text-base font-semibold text-gray-800 list-none">
      {question}
      <svg
        className="w-5 h-5 text-[var(--accent)] transition-transform duration-300 group-open:rotate-180"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </summary>
    <div className="pt-3 pb-1 text-sm text-gray-600 leading-relaxed">{answer}</div>
  </details>
);

const getArtistsFromEvent = (event: Event): Artist[] => {
  const names = Array.isArray(event.artist_name) ? event.artist_name : [event.artist_name];
  return MOCK_ARTISTS_DATA.filter((artist) => names.includes(artist.name));
};

export default function ExperienceDetailPage({
  event,
  onBack,
  onChatOpen, // kept for compatibility; not used here
}: {
  event: Event;
  onBack?: () => void;
  onChatOpen: (eventId: string) => void;
}) {
  const currentEvent = event;

  const [owned, setOwned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const artists = getArtistsFromEvent(currentEvent);
  const formattedArtistNames = artists.map((a) => a.name).join(', ');

  const formattedDate = new Date(currentEvent.event_date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const price = currentEvent.ticket_price ?? 0;
  const priceFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const bookingCtaText = owned
    ? 'Ticket Owned'
    : processing
      ? 'Processing…'
      : `Book Experience ${priceFormatter.format(price)}`;

  const eventFaqs = [
    {
      question: 'Is there an age restriction for the event?',
      answer: 'Yes, entry is strictly for individuals aged 18 and above.',
    },
    {
      question: 'Is there parking available?',
      answer: 'Yes, paid parking facilities will be available at the venue.',
    },
    {
      question: "Can I get a refund if I can't attend the event?",
      answer: 'No, tickets are non-refundable once purchased.',
    },
    {
      question: 'Is the venue wheelchair accessible?',
      answer:
        'Yes, the venue is wheelchair accessible, with access available in the VIP and Dance Floor sections only.',
    },
    {
      question: 'Will food, beverages & alcohol be available at the venue?',
      answer:
        'Yes, a variety of food and beverage options, including alcohol, will be available for purchase.',
    },
    {
      question: 'Is re-entry into the venue allowed?',
      answer: 'No, re-entry will not be permitted once you exit the venue.',
    },
    {
      question: 'Is there a designated smoking area?',
      answer: 'Yes, a designated smoking area will be provided for attendees.',
    },
  ];

  const termsAndConditions = [
    'Please carry a valid ID proof along with you.',
    'No refunds on purchased ticket are possible, even in case of any rescheduling.',
    'Security procedures, including frisking remain the right of the management.',
    'No dangerous or potentially hazardous objects including but not limited to weapons, knives, guns, fireworks, helmets, lazer devices, bottles, musical instruments will be allowed in the venue and may be ejected with or without the owner from the venue.',
    'The attendees will be able to reserve their tickets and any applicable add-ons (as communicated on the District Platform) by paying 50% of the total amount at the checkout. The remaining balance of the reservation amount must be paid by 11:59 AM on March 7, 2026 (“Due Date”).',
    'Only attendees booking tickets and applicable add-ons through the District Platform before 11:59 PM on February 21, 2026 are eligible for this feature.',
    'If an attendee fails to pay the remaining amount by the Balance Due Date, the Reservation Amount will be forfeited and will not be refunded. The reservation for the ticket will be cancelled.',
    'In case the event is postponed or cancelled by the organiser prior to the Balance Due Date due to a force majeure event, the attendee shall be eligible for refund of the Reservation Amount. In case the event is postponed or cancelled by the organiser after the Balance Due Date, the attendee shall not be eligible for any refund.',
    'Tickets to the event or a particular category or any add-ons (if applicable) may appear as “Sold Out” on the District platform due to reservations made by other attendees. Such tickets to the event or a particular category or any add-ons (if applicable) may re-open and be listed for sale on the District platform at a price determined by the organiser in case any attendee fails to pay the remaining balance by the respective due date.',
    'Tickets and applicable add-ons will be confirmed only once full payment is successfully received before the Due Date. If an attendee fails to pay the remaining balance by the Due Date, the reservation will be cancelled, and the initial 50% payment will be non-refundable.',
    'In case of cancellation of event by organiser or due to a Force Majeure Event then the attendee shall be eligible for refund in accordance with these terms. In case the event is postponed by the organiser then also the attendee shall be entitled to refund in accordance with these terms.',
    'The sponsors/performers/organizers are not responsible for any injury or damage occurring due to the event. Any claims regarding the same would be settled in courts in Mumbai.',
    'People in an inebriated state may not be allowed entry.',
    'Organizers hold the right to deny late entry to the event.',
    'Venue rules apply.',
  ];

  if (
    !currentEvent ||
    !currentEvent.title ||
    !(currentEvent.banner_image_url || currentEvent.image_url)
  ) {
    return (
      <div className="p-10 text-center text-xl text-red-600">
        Error: Event data is missing or invalid.
      </div>
    );
  }

  return (
    <div
      style={{ ['--accent' as any]: ACCENT } as React.CSSProperties}
      className="min-h-screen bg-white text-gray-900"
    >
      {/* HERO */}
      <section className="relative h-[220px] md:h-[320px] lg:h-[480px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${currentEvent.banner_image_url || currentEvent.image_url})`,
            filter: 'brightness(0.8) blur(1px)',
          }}
        />

        <div className="absolute inset-0 bg-black/45 flex items-end">
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between md:top-4 md:left-4 md:right-4">
            <button
              onClick={() => onBack?.()}
              className="p-2 rounded-full bg-white/30 text-white backdrop-blur-sm hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Back to events list"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="max-w-6xl mx-auto px-4 pb-6 w-full">
            <div className="text-white">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                {currentEvent.title}
              </h1>
              <div className="mt-1 text-sm md:text-xl font-medium text-white/90">
                by {formattedArtistNames}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm font-medium text-white/80">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} /> {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {currentEvent.venue}, {currentEvent.city}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] md:text-xs font-semibold">
                  18+
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      {/* added pb to avoid being overlapped by mobile CTA */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 pb-[110px] md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold mb-3">About the Event</h2>
              <p className="text-base text-gray-700 leading-relaxed">{currentEvent.description}</p>
            </section>

            {artists.length > 0 && (
              <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-bold mb-4">
                  Meet the Artist{artists.length > 1 ? 's' : ''}
                </h3>

                {/* Mobile: horizontal scroll; Desktop: wrap */}
                <div className="flex gap-6 justify-start overflow-x-auto pb-2 -mx-2 md:mx-0 md:flex-wrap md:overflow-visible">
                  {artists.map((artist) => (
                    <div
                      key={artist.name}
                      className="flex flex-col items-center text-center px-2 min-w-[92px] md:min-w-0 md:max-w-[120px]"
                    >
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-4 border-gray-100 shadow-md"
                      />
                      <p className="mt-2 text-sm font-semibold text-gray-800">{artist.name}</p>
                      <p className="text-xs text-gray-500">Artist</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-4">Event Guide</h3>
              <div className="min-h-[120px] md:min-h-[150px] rounded-lg border-dashed border-2 border-gray-200 p-6 text-base text-gray-600 flex items-center justify-center">Copy as it is from District Platform.</div>
            </section> */}

            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-4">Venue: {currentEvent.venue}</h3>
              <p className="text-base text-gray-700 mb-4">
                {currentEvent.venue}, {currentEvent.city}. Check the map below for directions.
              </p>
              <div className="h-40 md:h-60 rounded-lg border-dashed border-2 border-gray-200 flex items-center justify-center text-sm text-gray-500 bg-gray-50">
                <p>Interactive Map of {currentEvent.venue} Location</p>
              </div>
            </section>
            {/* 
            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-4">Gallery & Media</h3>
              <div className="h-28 md:h-40 rounded-lg border-dashed border-2 border-gray-200 flex items-center justify-center text-sm text-gray-500">
                Event Images and Videos
              </div>
            </section> */}

            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions (FAQ)</h3>
              <div className="divide-y divide-gray-200">
                {eventFaqs.map((faq, index) => (
                  <FaqItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-4">Terms & Conditions</h3>
              <ul className="list-disc list-outside space-y-3 pl-5 text-sm text-gray-700 marker:text-[var(--accent)]">
                {termsAndConditions.map((term, index) => (
                  <li key={index} className="pl-2">
                    {term}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-1 space-y-8">
            <aside className="hidden md:block sticky top-6 bg-white rounded-xl p-6 shadow-2xl border border-gray-100">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold">{priceFormatter.format(price)}</span>
                <span className="text-sm text-gray-500">per person</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-b pb-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Duration</span>
                  <span className="text-gray-500 text-sm">4 hr</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Members</span>
                  <span className="text-gray-500 text-sm">
                    {currentEvent.member_count?.toLocaleString() ?? 'Many'} joined
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowForm(true)}
                disabled={processing || owned}
                className={`mt-5 w-full px-4 py-3 rounded-lg text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/50`}
                style={{ backgroundColor: ACCENT }}
                aria-label={owned ? 'Ticket owned' : 'Book experience'}
              >
                {owned ? 'Ticket Owned' : bookingCtaText}
              </button>

              <div className="mt-4 text-xs text-center text-gray-500">
                They've already joined: Male • Female
              </div>
            </aside>

            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold mb-3">What's Included</h3>
              <ul className="space-y-2 text-gray-700">
                {currentEvent.includes.map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-[var(--accent)] mr-2 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>

              <h3 className="text-xl font-bold mt-6 mb-3">Notes & Organizer</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Important Notes</h4>
                  <ul className="mt-1 text-sm text-gray-600 space-y-1">
                    {currentEvent.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Organizer</h4>
                  <div className="mt-1 text-sm text-gray-600">
                    {formattedArtistNames} • {currentEvent.venue}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* MOBILE CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] safe-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <div className="text-lg font-bold">{priceFormatter.format(price)}</div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={processing || owned}
            className={`flex-1 ml-3 px-4 py-3 rounded-lg text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-70 focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/50`}
            style={{ backgroundColor: ACCENT }}
            aria-label={owned ? 'Ticket owned' : 'Book Tickets'}
          >
            {owned ? 'Ticket Owned' : processing ? 'Processing…' : 'Book Tickets'}
          </button>
        </div>
        {/* safe area spacing for iOS bottom notch */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>

      {/* Forms modal (opens Razorpay on submit) */}
      <Forms
        open={showForm}
        amountINR={price}
        eventId={currentEvent.id}
        onClose={() => setShowForm(false)}
        onPaymentSuccess={(razorpayResp, buyer) => {
          // Payment succeeded in Razorpay handler inside Forms
          setOwned(true);
          setProcessing(false);
          setShowForm(false);
          console.log('Payment success:', razorpayResp, buyer);
          // TODO: send razorpayResp to your backend to verify & store order
        }}
      />

      <style>{`
        :root { --accent: ${ACCENT}; }
        /* small helper class for older tailwind setups; safe-bottom gives a tiny elevation */
        .safe-bottom { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}
