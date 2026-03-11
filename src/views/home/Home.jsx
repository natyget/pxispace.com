'use client';

import { useRef } from "react";
import Hero from "./Hero";
import ProblemSection from "./ProblemSection";
import AttendeeFeatures from "./AttendeeFeatures";
import HostFeatures from "./HostFeatures";
import VaultSection from "./VaultSection";
import SocialProof from "./SocialProof";


const Home = () => {
    const heroRef = useRef(null);

    return (
        <div ref={heroRef} className="relative min-h-screen">
            
            <Hero  />
            <ProblemSection />
            <AttendeeFeatures/>
             <HostFeatures />
            <VaultSection />
            <SocialProof />
            
        </div>
    );
};

export default Home;
