import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { NavOverlay } from '../components/layout/NavOverlay';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { AboutSection } from '../components/home/AboutSection';
import { TeamSection } from '../components/home/TeamSection';
import { WhyADM } from '../components/home/WhyADM';
import { MarqueeSection } from '../components/home/MarqueeSection';
import { ProjectsSection } from '../components/home/ProjectsSection';
import { ParticleBackground } from '../components/home/ParticleBackground';

import { NoiseOverlay } from '../components/layout/NoiseOverlay';

interface HomeProps {
  isLoading?: boolean;
}

export const Home: React.FC<HomeProps> = ({ isLoading = false }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <ParticleBackground />
      <NoiseOverlay />
      <Navbar visible={!isLoading} />
      <NavOverlay />

      <main>
        <HeroSection />
        <MarqueeSection />
        <AboutSection />
        <ProjectsSection />
        <WhyADM />
        <TeamSection />
      </main>

      <Footer />
    </div>
  );
};
