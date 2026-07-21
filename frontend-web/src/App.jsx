import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import TeachersDirectory from './pages/TeachersDirectory';
import Messages from './pages/Messages';
import InternalMarketplace from './pages/InternalMarketplace';

// Trafik Polisi: Kullanıcının rolüne bakar ve onu doğru adrese postalar
const RoleRouter = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="p-8 text-center">Sistem yükleniyor...</div>;
    if (!user) return <Navigate to="/login" replace />;

    // Rolü belirle (Normal user modelinde role veya profile modelinde user.role olarak gelebilir)
    const role = user.role || user.user?.role;

    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (role === 'STUDENT') return <Navigate to="/student" replace />;
    if (role === 'PARENT') return <Navigate to="/parent" replace />; // YENİ: Veli Yönlendirmesi
    
    return <div className="p-8">Geçersiz veya yetkisiz rol!</div>;
};

// Güvenlik Kapısı: Sadece giriş yapmış olanları içeri alır
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* YENİ: Açık Rotalar (Herkesin girebildiği vitrin ve kayıt) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/teachers" element={<TeachersDirectory />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/marketplace" element={<InternalMarketplace />} />
                {/* Trafik Polisi Rotası */}
                <Route path="/dashboard" element={<RoleRouter />} />
        
                {/* Korumalı Rotalar */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                <Route path="/parent" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />

                
                {/* Bilinmeyen adresleri Ana Sayfaya yolla */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;