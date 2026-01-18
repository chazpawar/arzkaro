import React from 'react';
import { X, MessageCircle } from 'lucide-react';

interface ChatModalProps {
  onClose: () => void;
}

export default function ChatModal({ onClose }: ChatModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>
        
        {/* Chat icon */}
        <div className="w-20 h-20 bg-[#FF785A] rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle size={40} className="text-white" />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Chat Feature</h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          Chat is only available on the mobile app. Download the Arz app to connect with hosts and other travelers!
        </p>
        
        {/* App store buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="#" 
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            onClick={(e) => e.preventDefault()}
          >
            App Store
          </a>
          <a 
            href="#" 
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold"
            onClick={(e) => e.preventDefault()}
          >
            Play Store
          </a>
        </div>
      </div>
    </div>
  );
}
