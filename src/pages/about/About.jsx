import AboutHero from "./AboutHero";
import OriginStory from "./OriginStory";
import Vision from "./Vision";
import Mission from "./Mission";
import Problem from "./Problem";
import Hardware from "./Hardware";
import ParticleBackground from "../../components/ParticleBackground";

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
