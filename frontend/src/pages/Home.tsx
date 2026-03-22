import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { NavOverlay } from '../components/layout/NavOverlay';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { AboutSection } from '../components/home/AboutSection';
import { TeamSection } from '../components/home/TeamSection';
import { WhySentinel } from '../components/home/WhySentinel';
import { AdvancedFeatures } from '../components/home/AdvancedFeatures';
import { ParticleBackground } from '../components/home/ParticleBackground';

import { NoiseOverlay } from '../components/layout/NoiseOverlay';

interface HomeProps {
  isLoading?: boolean;
}

export const Home: React.FC<HomeProps> = ({ isLoading = false }) => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <ParticleBackground />
      <NoiseOverlay />
      <Navbar visible={!isLoading} />
      <NavOverlay />

      <main>
        <HeroSection />
        <AboutSection />
        <WhySentinel />
        <AdvancedFeatures />
        <TeamSection />
      </main>

      <Footer />
    </div>
  );
};
