import Link from "next/link";
import { ArrowRight, ShoppingCart, Layout, ShieldCheck } from "lucide-react";

export default function HomePage() {
    return (
        <div className="flex min-h-screen flex-col bg-black text-white selection:bg-rose-500 selection:text-white">
            {/* Header */}
            <header className="container mx-auto flex items-center justify-between p-6">
                <div className="text-2xl font-bold tracking-tighter">spikad.ai</div>
                <nav className="hidden space-x-6 text-sm font-medium md:flex">
                    <Link href="#" className="hover:text-rose-500">Features</Link>
                    <Link href="#" className="hover:text-rose-500">Pricing</Link>
                    <Link href="#" className="hover:text-rose-500">Showcase</Link>
                </nav>
                <div className="flex items-center space-x-4">
                    <Link href="/login" className="text-sm font-medium hover:text-white/80">
                        Login
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-rose-500 hover:text-white"
                    >
                        Start Free Trial
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-rose-400 backdrop-blur-sm">
                    <span className="mr-2 flex h-2 w-2">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                    </span>
                    The Business Operating System v1.0
                </div>

                <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
                    Launch your business <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">
                        in 30 seconds.
                    </span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg text-white/60 sm:text-xl">
                    Not just a shop builder. An entire Operating System for your brand.
                    E-commerce, Booking, AI Branding, and Automation in one dashboard.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Link
                        href="/signup"
                        className="group flex items-center justify-center rounded-full bg-rose-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-rose-700 hover:scale-105"
                    >
                        Start Building Now
                        <ArrowRight className="ml-2 h-5 w-5 transition group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="#demo"
                        className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
                    >
                        Watch Demo
                    </Link>
                </div>

                {/* Feature Grid */}
                <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <FeatureCard
                        icon={<ShoppingCart className="h-6 w-6 text-rose-400" />}
                        title="E-Commerce Engine"
                        desc="Sell physical products, digital downloads, or service packages."
                    />
                    <FeatureCard
                        icon={<Layout className="h-6 w-6 text-orange-400" />}
                        title="Visual Builder"
                        desc="Drag & Drop interface. No coding required. Launch instantly."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="h-6 w-6 text-purple-400" />}
                        title="Enterprise Ready"
                        desc="Built on Supabase. Scalable, secure, and ready for millions of users."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 p-6 text-center text-sm text-white/40">
                © 2024 Spikad.ai. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10">
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-white/10 p-3 shadow-lg group-hover:scale-110 transition">
                {icon}
            </div>
            <h3 className="mb-2 text-xl font-bold">{title}</h3>
            <p className="text-white/60">{desc}</p>
        </div>
    )
}
