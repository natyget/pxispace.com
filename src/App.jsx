


import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/home/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Shop from "./pages/Shop";
import TechShowcase from "./pages/TechShowcase";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";


const App = () => (

      <BrowserRouter>
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
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
