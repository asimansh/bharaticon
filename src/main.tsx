import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

// Check if we are on the admin subdomain or have an admin flag
const hostname = window.location.hostname;
const isAdminSubdomain = hostname.startsWith('admin.') || hostname === 'admin.bharaticon.online';
const isAdminFlag = window.location.search.includes('admin=true');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {(isAdminSubdomain || isAdminFlag) ? <AdminApp /> : <App />}
  </StrictMode>,
);
