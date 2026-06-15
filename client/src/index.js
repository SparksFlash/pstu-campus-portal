import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

// Set global background using public asset with server fallback.
(() => {
  try {
    const publicBg = `${process.env.PUBLIC_URL || ''}/assets/images/Adminitration.jpg`;
    const serverBg = 'http://localhost:5000/assets/pstu_bus.jpg';
    const bgValue = `linear-gradient(rgba(3,7,18,0.35), rgba(3,7,18,0.35)), url("${publicBg}"), url("${serverBg}")`;
    document.body.style.backgroundImage = bgValue;
    document.body.style.backgroundSize = 'cover';
    // move the image slightly upward for better framing
    document.body.style.backgroundPosition = 'center 80%';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    // also set on html element to make it persistent across SPA navigation
    if (document.documentElement) {
      const html = document.documentElement;
      html.style.backgroundImage = bgValue;
      html.style.backgroundSize = 'cover';
      html.style.backgroundPosition = 'center 80%';
      html.style.backgroundRepeat = 'no-repeat';
      html.style.backgroundAttachment = 'fixed';
      html.style.backgroundColor = 'transparent';
    }
  } catch (e) {
    // ignore in non-browser contexts
    // fallback to CSS defaults
  }
})();

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
