import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/home/Home";
import About from "./pages/about/About";
import NotFound from "./pages/NotFound";
import SupportPage from "./pages/support/SupportPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Events from "./pages/events/Events";
import EventDetails from "./pages/eventDetails/EventDetails";

import LoginPage from "./pages/auth/LoginPage";
import EmailAuthPage from "./pages/auth/EmailAuthPage";
import PassportRequiredPage from "./pages/auth/PassportRequiredPage";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PassportPage from "./pages/dashboard/PassportPage";
import VendorUpgradePage from "./pages/dashboard/VendorUpgradePage";

const App = () => (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
        <AuthProvider>
            <Routes>
                {/* Public routes — with Navbar + Footer */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetails />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/terms_of_service" element={<TermsOfService />} />
                    <Route path="/privacy_policy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Auth routes — no Navbar/Footer */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/email" element={<EmailAuthPage />} />
                <Route path="/signup" element={<EmailAuthPage />} />
                <Route path="/passport-required" element={<PassportRequiredPage />} />

                {/* Dashboard — protected, no public Navbar */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="passport" element={<PassportPage />} />
                        <Route path="vendor-upgrade" element={<VendorUpgradePage />} />
                    </Route>
                </Route>
            </Routes>
        </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
);

export default App;
