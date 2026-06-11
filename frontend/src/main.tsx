import React from 'react';
import ReactDOM from 'react-dom/client';
// Inter variable font, self-hosted so there is no runtime CDN dependency
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';

// Note: the themed <Toaster> lives in App.tsx; a second one here caused
// duplicate toasts.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
