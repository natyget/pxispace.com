import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import RouteListener from "./components/RouteListener";
import Footer from "./components/Footer";
import Home from "./pages/home/Home";
import About from "./pages/About";
import Shop from "./pages/Shop";
import TechShowcase from "./pages/TechShowcase";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import FeaturesPage from "./pages/features/FeaturesPage";

const App = () => (
    <BrowserRouter>
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <RouteListener />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/tech" element={<TechShowcase />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </div>
    </BrowserRouter>
);

export default App;
