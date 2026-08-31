/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Home from './pages/Home';
import Membership from './pages/Membership';
import Donations from './pages/Donations';
import BloodBank from './pages/BloodBank';
import Cabinet from './pages/Cabinet';
import Voting from './pages/Voting';
import News from './pages/News';
import Events from './pages/Events';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="membership" element={<Membership />} />
            <Route path="donations" element={<Donations />} />
            <Route path="blood-bank" element={<BloodBank />} />
            <Route path="cabinet" element={<Cabinet />} />
            <Route path="voting" element={<Voting />} />
            <Route path="news" element={<News />} />
            <Route path="events" element={<Events />} />
            <Route path="admin" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
