import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components//layout/Navbar";
import RouteListener from "./components/RouteListener";
import Footer from "./components/Footer";
import Home from "./pages/home/Home";
import About from "./pages/about/About";
import NotFound from "./pages/NotFound";
import SupportPage from "./pages/support/SupportPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Events from "./pages/events/Events";
import EventDetails from "./pages/eventDetails/EventDetails";

const App = () => (
    <BrowserRouter>
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <RouteListener />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetails />} />

                    <Route path="/support" element={<SupportPage />} />
                    <Route
                        path="/terms_of_service"
                        element={<TermsOfService />}
                    />
                    <Route path="/privacy_policy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </div>
    </BrowserRouter>
);

export default App;
