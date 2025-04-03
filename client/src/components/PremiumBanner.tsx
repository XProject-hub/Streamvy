import React from 'react';
import { Link } from 'wouter';

export function PremiumBanner() {
  return (
    <div style={{ backgroundColor: '#0f172a', padding: '12px 16px' }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>
            Upgrade to Premium
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0 }}>
            Get access to exclusive PPV events, enjoy faster streams, and watch with no ads.
            Starting at just $5.99/month.
          </p>
        </div>
        <Link href="/premium">
          <button 
            style={{
              marginLeft: '12px',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#ff5500', 
              color: '#ffffff',
              border: '2px solid #ffffff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Subscribe Now
          </button>
        </Link>
      </div>
    </div>
  );
}