import React from 'react';
import '../landing.css';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import SystemOverview from '../components/landing/SystemOverview';
import FieldSection from '../components/landing/FieldSection';
import Team from '../components/landing/Team';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="landing-root">
      <Navbar />

      <main>
        <Hero />

        <section id="overview" className="container section-pad">
          <SystemOverview />
        </section>

        <section id="terrain" className="terrain-section-final">
          <div className="container">
            <FieldSection />
          </div>
        </section>

        <section id="team" className="container section-pad">
          <Team />
        </section>
      </main>

      <Footer />
    </div>
  );
}