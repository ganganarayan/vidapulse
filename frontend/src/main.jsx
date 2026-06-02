import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { captureLeadSource } from './lib/leadSource';

// Capture ad UTM params from the entry URL before routing strips them, so a
// signup later in this session can be attributed to its campaign/ad set/ad.
captureLeadSource();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
