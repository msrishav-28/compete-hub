import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightIcon,
    UserGroupIcon,
    ChartBarIcon,
    DocumentDuplicateIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import TextScramble from '../components/ui/TextScramble';
import MagneticButton from '../components/ui/MagneticButton';
import OnboardingWizard from '../components/OnboardingWizard';

export default function LandingPage() {
    const navigate = useNavigate();
    const [showOnboarding, setShowOnboarding] = useState(false);

    const handleOnboardingComplete = (data: any) => {
        // Store onboarding data in localStorage or state management
        localStorage.setItem('onboardingData', JSON.stringify(data));
        localStorage.setItem('onboardingComplete', 'true');
        setShowOnboarding(false);
        navigate('/explore');
    };

    const handleStartCompeting = () => {
        const hasOnboarded = localStorage.getItem('onboardingComplete');
        if (hasOnboarded) {
            navigate('/explore');
        } else {
            setShowOnboarding(true);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden font-sans text-white">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-neon-black" />
                <div className="absolute inset-0 bg-gradient-to-b from-neon-black/30 via-neon-black/10 to-neon-black/90 mix-blend-multiply" />
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                {/* Ambient Glow */}
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-neon-limit/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-neon-limit/5 rounded-full blur-3xl" />
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
                        <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-white mb-2 leading-none uppercase drop-shadow-2xl">
                            <TextScramble text="COMPETE" className="block" duration={1000} />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                                <TextScramble text="HUB." duration={1000} delay={300} />
                            </span>
                        </h1>
                        <p className="text-lg md:text-2xl font-medium text-gray-300 max-w-2xl mx-auto mt-6 tracking-wide px-4 font-display">
                            The ultimate launchpad for <span className="bg-neon-limit text-black px-2 py-0.5 rounded-sm whitespace-nowrap font-bold">Engineering Students.</span> Discover, track, and win.
                        </p>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 mt-8"
                    >
                        <MagneticButton
                            onClick={handleStartCompeting}
                            variant="primary"
                            size="lg"
                            className="min-w-[200px]"
                        >
                            Start Competing
                            <RocketLaunchIcon className="h-5 w-5" />
                        </MagneticButton>
                        <MagneticButton
                            onClick={() => navigate('/explore')}
                            variant="secondary"
                            size="lg"
                        >
                            Browse Challenges
                            <ArrowRightIcon className="h-5 w-5" />
                        </MagneticButton>
                    </motion.div>

                    {/* User Stats / Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-16 flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
                    >
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-neon-black" />
                            ))}
                        </div>
                        <div className="text-sm font-semibold text-gray-200">
                            <span className="font-bold text-white">500+</span> Live Competitions
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
                    <h3 className="text-sm font-bold mb-8 text-white/40 text-center uppercase tracking-[0.3em] font-display">Used by students from</h3>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {['IIT Bombay', 'BITS Pilani', 'NIT Trichy', 'IIIT Hyderabad', 'DTU'].map((brand) => (
                            <span key={brand} className="text-2xl md:text-3xl font-bold text-white hover:text-neon-limit transition-colors cursor-default">{brand}</span>
                        ))}
                    </div>
                </motion.div>

                {/* Features / Glass Cards Section */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            title: "Smart Aggregation",
                            icon: <UserGroupIcon className="h-6 w-6" />,
                            desc: "We scrape Devpost, Unstop, and Kaggle so you don't have to. Updates daily."
                        },
                        {
                            title: "AI Matchmaking",
                            icon: <ChartBarIcon className="h-6 w-6" />,
                            desc: "Get personalized hackathon recommendations based on your GitHub & skills."
                        },
                        {
                            title: "Verified Portfolio",
                            icon: <DocumentDuplicateIcon className="h-6 w-6" />,
                            desc: "Automatically convert your competition wins into a verified proof-of-work profile."
                        },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="p-8 rounded-xl bg-white/5 text-white backdrop-blur-lg border border-white/5 hover:border-neon-limit/50 transition-all group relative overflow-hidden"
                            style={{
                                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                            }}
                        >
                            {/* Chamfered corner visual */}
                            <div className="absolute top-0 right-0 w-4 h-4 bg-neon-black" 
                                style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
                            />
                            
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                {feature.icon}
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-neon-limit mb-6 group-hover:bg-neon-limit group-hover:text-black transition-all duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white font-display">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Onboarding Wizard Modal */}
            <OnboardingWizard
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
                onClose={() => setShowOnboarding(false)}
            />
        </div>
    );
}
