import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>महुली प्रिन्ट सिस्टम (Mahuli Print System)</h1>
      <p style={{ color: '#4b5563' }}>तपाईंको वेबसाइट सफलतापूर्वक लाइभ भएको छ!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3>डकुमेन्ट ड्यासबोर्ड</h3>
        <p>यहाँबाट तपाईंले आफ्ना सबै कानुनी कागजात तथा प्रिन्ट सेवाहरू सञ्चालन गर्न सक्नुहुन्छ।</p>
      </div>
    </div>
  );
}
