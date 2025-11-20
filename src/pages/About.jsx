import ParticleBackground from "../components/ParticleBackground";
import AboutHero from "./about/AboutHero";
import OriginStory from "./about/OriginStory";
import Vision from "./about/Vision";
import Mission from "./about/Mission";
import Problem from "./about/Problem";
import Hardware from "./about/Hardware";

const About = () => {
    return (
        <div className="relative min-h-screen">
            <ParticleBackground />
            <AboutHero />
            <OriginStory />
            <Vision />
            <Mission />
            <Problem />
            <Hardware />
        </div>
    );
};

export default About;
