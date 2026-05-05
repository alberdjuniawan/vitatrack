import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Overview from './components/Overview';
import Logs from './components/Logs'; 
import Insights from './components/Insights';
import Profile from './components/Profile';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                
                <Route path="/dashboard" element={<Layout />}>
                    <Route index element={<Overview />} />
                    <Route path="logs" element={<Logs />} /> 
                    <Route path="insights" element={<Insights />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}