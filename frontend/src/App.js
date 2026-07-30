import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DashboardLayout from "@/pages/DashboardLayout";
import Overview from "@/pages/dashboard/Overview";
import Journal from "@/pages/dashboard/Journal";
import Chat from "@/pages/dashboard/Chat";
import Community from "@/pages/dashboard/Community";
import Goals from "@/pages/dashboard/Goals";
import Resources from "@/pages/dashboard/Resources";
import Profile from "@/pages/dashboard/Profile";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="jurnal" element={<Journal />} />
              <Route path="asistent" element={<Chat />} />
              <Route path="comunitate" element={<Community />} />
              <Route path="obiective" element={<Goals />} />
              <Route path="resurse" element={<Resources />} />
              <Route path="profil" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
