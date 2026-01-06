// src/components/ProfileSidebar.tsx
import React from 'react';
import { User, MapPin, Users } from 'lucide-react';

type Props = {
  selected: 'about' | 'past' | 'connections';
  onSelect: (t: 'about' | 'past' | 'connections') => void;
};

export default function ProfileSidebar({ selected, onSelect }: Props) {
  const itemClass = (active = false) =>
    `flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`;

  return (
    <div className="sticky top-24">
      <div className="text-2xl font-bold mb-6">Profile</div>

      <div className="space-y-3">
        <div className={itemClass(selected === 'about')} onClick={() => onSelect('about')}>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><User size={16} /></div>
          <div>About me</div>
        </div>

        <div className={itemClass(selected === 'past')} onClick={() => onSelect('past')}>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><MapPin size={16} /></div>
          <div>Past trips</div>
        </div>

        <div className={itemClass(selected === 'connections')} onClick={() => onSelect('connections')}>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700"><Users size={16} /></div>
          <div>Connections</div>
        </div>
      </div>
    </div>
  );
}
