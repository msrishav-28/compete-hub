import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightIcon,
    UserGroupIcon,
    ChartBarIcon,
    DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden selection:bg-lime-400 selection:text-black font-sans">
            {/* Background Video Blob */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full object-cover opacity-80 dark:opacity-60 blur-sm scale-110"
                >
                    <source src="/hero-blob.mp4" type="video/mp4" />
                </video>
                {/* Overlay Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/90 dark:from-black/30 dark:via-transparent dark:to-black/90" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
                {/* Hero Section */}
                <div className="flex flex-col items-center justify-center text-center mt-10 md:mt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="mb-8"
                    >
                        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-black dark:text-white mb-2 leading-none uppercase">
                            Compete
                            <br />
                            Hub.
                        </h1>
                        <p className="text-lg md:text-2xl font-medium text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mt-6 tracking-wide px-4">
                            All the must haves of a professional <span className="bg-lime-400 text-black px-2 py-1 rounded-sm whitespace-nowrap">career accelerator.</span>
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-8"
                    >
                        <button
                            onClick={() => navigate('/explore')}
                            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:scale-105 transition-transform flex items-center gap-2 group"
                        >
                            Get Started
                            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-transparent border-2 border-gray-900 dark:border-white text-black dark:text-white font-bold text-lg rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors backdrop-blur-sm">
                            How it works?
                        </button>
                    </motion.div>

                    {/* User Stats / Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-16 flex items-center gap-3 bg-white/50 dark:bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-gray-200 dark:border-gray-800"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white dark:border-black" />
                            ))}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <span className="font-bold">2M+</span> World active user
                        </div>
                    </motion.div>
                </div>

                {/* Trusted By Marquee */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-32"
                >
                    <h3 className="text-2xl font-bold mb-8 text-black dark:text-white">Trusted by.</h3>
                    <div className="flex flex-wrap gap-8 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos */}
                        {['Webflow', 'Grammarly', 'Scale', 'Adobe', 'Slack'].map((brand) => (
                            <span key={brand} className="text-2xl md:text-3xl font-bold text-black dark:text-white">{brand}</span>
                        ))}
                    </div>
                </motion.div>

                {/* Features / Glass Cards Section */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: "Realtime Collaboration",
                            icon: <UserGroupIcon className="h-6 w-6" />,
                            desc: "Work with your team in real-time and set individual permissions."
                        },
                        {
                            title: "Smart Tracking",
                            icon: <ChartBarIcon className="h-6 w-6" />,
                            desc: "Track every competition and hackathon with intelligent analytics."
                        },
                        {
                            title: "Templates Library",
                            icon: <DocumentDuplicateIcon className="h-6 w-6" />,
                            desc: "A repository of resumes, portfolios, and resources ready to use."
                        },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="p-8 rounded-3xl bg-black/90 dark:bg-white/5 text-white backdrop-blur-lg border border-gray-800 dark:border-white/10 hover:border-lime-400/50 transition-colors group"
                        >
                            <div className="h-12 w-12 rounded-full bg-gray-800 dark:bg-white/10 flex items-center justify-center text-lime-400 mb-6 group-hover:bg-lime-400 group-hover:text-black transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
