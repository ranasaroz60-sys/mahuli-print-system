import React, { useState } from 'react';

export default function App() {
  const [docType, setDocType] = useState('tamasuk');

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ background: '#2563eb', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <h2>महुली कानुनी परामर्श तथा अनलाइन सेवा केन्द्र</h2>
        <p style={{ margin: '5px 0 0', fontSize: '14px' }}>प्रिन्ट तथा कागजात प्रणाली</p>
      </header>

      <div style={{ marginTop: '20px', background: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
        <h3>कागजात छान्नुहोस्</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setDocType('tamasuk')} style={{ padding: '10px 15px', background: docType === 'tamasuk' ? '#2563eb' : '#e5e7eb', color: docType === 'tamasuk' ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>तमसुक</button>
          <button onClick={() => setDocType('bharpai')} style={{ padding: '10px 15px', background: docType === 'bharpai' ? '#2563eb' : '#e5e7eb', color: docType === 'bharpai' ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>भरपाई</button>
          <button onClick={() => setDocType('samjhauta')} style={{ padding: '10px 15px', background: docType === 'samjhauta' ? '#2563eb' : '#e5e7eb', color: docType === 'samjhauta' ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>सम्झौता पत्र</button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
        <h4>तपाईंले छान्नुभएको सेवा: {docType === 'tamasuk' ? 'तमसुक फारम' : docType === 'bharpai' ? 'भरपाई फारम' : 'सम्झौता पत्र फारम'}</h4>
        <p>यहाँ विवरण भरेर सिधै प्रिन्ट गर्न सकिनेछ।</p>
      </div>
    </div>
  );
}
