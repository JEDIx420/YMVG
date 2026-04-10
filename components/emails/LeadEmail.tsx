import * as React from 'react';

interface LeadEmailProps {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  businessName: string;
}

export const LeadEmail = ({
  senderName,
  senderEmail,
  senderPhone,
  message,
  businessName,
}: LeadEmailProps) => (
  <div style={{
    fontFamily: 'Inter, sans-serif',
    color: '#0f172a',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>
    <div style={{
      backgroundColor: '#07163c',
      padding: '32px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: '900' }}>
        New Lead for {businessName}
      </h1>
      <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Y's Men International SWIR Directory
      </p>
    </div>
    
    <div style={{ padding: '40px' }}>
      <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
        Hello, you have received a new business enquiry through your spotlight profile on the YM SWIR Directory.
      </p>
      
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
          Sender Information
        </h2>
        <p style={{ margin: '8px 0', fontSize: '15px' }}><strong>Name:</strong> {senderName}</p>
        <p style={{ margin: '8px 0', fontSize: '15px' }}><strong>Email:</strong> {senderEmail}</p>
        <p style={{ margin: '8px 0', fontSize: '15px' }}><strong>Phone:</strong> {senderPhone}</p>
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
          Message
        </h2>
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.8', 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          padding: '20px', 
          borderRadius: '8px',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </p>
      </div>
      
      <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
        This lead was generated via your listing on the official Y's Men International SWIR Business Directory.
      </p>
    </div>
    
    <div style={{ backgroundColor: '#f1f5f9', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
      © {new Date().getFullYear()} Y's Men International - South West India Region. All rights reserved.
    </div>
  </div>
);
