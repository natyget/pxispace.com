import { useRef } from "react";
import ParticleBackground from "../../components/ParticleBackground";
import Hero from "./Hero";
import HowPxiWorks from "./HowPxiWorks";
import WhyPxi from "./WhyPxi";
import DownloadApp from "./DownloadApp";

const Home = () => {
    const heroRef = useRef(null);
    const featuresRef = useRef(null);

    return (
        <div ref={heroRef} className="relative min-h-screen">
            <ParticleBackground />
            <Hero heroRef={heroRef} />
            <HowPxiWorks />
            <WhyPxi featuresRef={featuresRef} />
            <DownloadApp />
        </div>
    );
};

export default Home;
