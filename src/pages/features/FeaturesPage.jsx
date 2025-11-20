
import Hero from "./Hero";
import PXIStudio from "./PXIStudio";
import FeatureSlider from "./FeatureSlider";
import PXIClip from "./PXIClip";
import VideoSection from "./VideoSection";
import CTA from "./CTA";
import ParticleBackground from "../../components/ParticleBackground";

const FeaturesPage = () => {
    return (
        <div className="relative min-h-screen">
            <ParticleBackground />
            <Hero />
            <PXIStudio />
            <FeatureSlider />
            <VideoSection />
            <PXIClip />
            <CTA />
        </div>
    );
};

export default FeaturesPage;
