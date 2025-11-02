import React from 'react';
import { BASE_URL } from '../utils/api';

const short = (s='') => s.length > 36 ? s.slice(0, 36) + '…' : s;
const env = typeof window !== 'undefined' && window.location.hostname.includes('github.io') ? 'Prod' : 'Dev';

// eslint-disable-next-line no-undef
const BUILD_SHA = process.env.REACT_APP_BUILD_SHA || 'dev';
// eslint-disable-next-line no-undef
const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || '';

export default function ConnectionStatus() {
  // Hide on localhost in dev mode
  if (env === 'Dev' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return null;
  }

  return (
    <div style={{
      position:'fixed', top:10, right:10, zIndex:9999,
      padding:'6px 10px', borderRadius:12, fontSize:12,
      background:'rgba(20,20,28,.8)', color:'#fff',
      fontFamily:'monospace', backdropFilter:'blur(4px)',
      boxShadow:'0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {env} • {short(BASE_URL)} • {BUILD_SHA.slice(0,7)}
    </div>
  );
}

