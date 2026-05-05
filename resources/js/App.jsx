import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Overview from './components/Overview';
import Logs from './components/Logs'; 
import Insights from './components/Insights';
import Profile from './components/Profile';

const ProtectedRoute = () => {
    const isAuthenticated = localStorage.getItem('vitatrack_token');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

const GuestRoute = () => {
    const isAuthenticated = localStorage.getItem('vitatrack_token');

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<Auth />} />
                    <Route path="/register" element={<Auth />} />
                </Route>
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Layout />}>
                        <Route index element={<Overview />} />
                        <Route path="logs" element={<Logs />} /> 
                        <Route path="insights" element={<Insights />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                </Route>
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}