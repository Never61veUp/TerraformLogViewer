"use client";

import React from "react";
import './globals.css';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Features from "@/components/FeatureCard";
import HowTo from "@/components/HowTo";

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
