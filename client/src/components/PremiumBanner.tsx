import React from 'react';
import { Link } from 'wouter';

export function PremiumBanner() {
  return (
    <div className="bg-gray-900 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upgrade to Premium</h2>
          <p className="text-sm text-gray-300">
            Get access to exclusive PPV events, enjoy faster streams, and watch with no ads.
            Starting at just $5.99/month.
          </p>
        </div>
        <Link href="/premium">
          <button 
            className="mt-3 md:mt-0 px-4 py-2 rounded font-medium"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Subscribe Now
          </button>
        </Link>
      </div>
    </div>
  );
}