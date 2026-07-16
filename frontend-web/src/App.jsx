import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

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
                {/* Açık Rota */}
                <Route path="/login" element={<Login />} />
                
                {/* Trafik Polisi Rotası */}
                <Route path="/dashboard" element={<RoleRouter />} />
                
                {/* Korumalı Rotalar */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
                <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                
                {/* Bilinmeyen adresleri Trafik Polisine yolla */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;