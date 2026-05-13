import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast'; // For those checkout alerts
import { CssBaseline } from '@mui/material'; // For consistent styling

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CssBaseline /> {/* Resets CSS for all browsers */}
    <App />
    <Toaster position="top-center" reverseOrder={false} /> {/* Global Toast container */}
  </React.StrictMode>
);