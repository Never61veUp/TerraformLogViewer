"use client";

import React from "react";
import { motion } from "framer-motion";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import Hero from "../Components/Hero";
import Features from "../Components/FeatureCard";
import HowTo from "../Components/HowTo";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[var(--background)] text-[var(--text)] antialiased">
      <Header />
      <main className="px-6 md:px-12">
        <Hero />
        <Features />
        <HowTo />
      </main>
      <Footer />
    </div>
  );
}
