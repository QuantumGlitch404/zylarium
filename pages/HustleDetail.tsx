import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft, Star, DollarSign, Clock, Wrench, BarChart3,
    ChevronDown, ChevronUp, ExternalLink, CheckCircle, Lightbulb,
    BookOpen, Users, MessageCircle, HelpCircle, Tag, Share2,
    Copy, Check, GraduationCap, Target, TrendingUp, X,
    Twitter, Facebook, Linkedin, Mail, Link2
} from 'lucide-react';
import { Button, Badge, Card } from '../components/CommonUI';
import { ScrollReveal } from '../components/ScrollReveal';
import { HUSTLE_DATA } from '../data/hustleData';
import { generateHustleDetailContent, HustleDetailContent } from '../data/hustleDetailContent';
import { HustleIdea } from '../types';

interface HustleDetailProps {
    hustleId: number;
    onBack: () => void;
    favorites: number[];
    onToggleFavorite: (id: number) => void;
}

const HustleDetail: React.FC<HustleDetailProps> = ({ hustleId, onBack, favorites, onToggleFavorite }) => {
    const [activeSection, setActiveSection] = useState('about');
    const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
    const [showAllTestimonials, setShowAllTestimonials] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [starAnimating, setStarAnimating] = useState(false);



    const handleToggleFavorite = () => {
        setStarAnimating(true);
        setTimeout(() => setStarAnimating(false), 400);
        onToggleFavorite(hustleId);
    };

    const hustle = HUSTLE_DATA.find(h => h.id === hustleId);

    const content = useMemo(() => {
        if (!hustle) return null;
        return generateHustleDetailContent(hustle);
    }, [hustle]);

    if (!hustle || !content) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Hustle Not Found</h2>
                    <Button onClick={onBack}>Go Back</Button>
                </div>
            </div>
        );
    }

    const sections = [
        { id: 'about', label: 'About', icon: BookOpen },
        { id: 'steps', label: 'Steps to Start', icon: Target },
        { id: 'proof', label: 'Proof & Resources', icon: TrendingUp },
        { id: 'tips', label: 'Tips for Success', icon: Lightbulb },
        { id: 'learn', label: 'What to Learn', icon: GraduationCap },
        { id: 'keyinfo', label: 'Key Information', icon: BarChart3 },
        { id: 'testimonials', label: 'Testimonials', icon: Users },
        { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    ];

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
        }
    };

    const toggleFaq = (index: number) => {
        setExpandedFaqs(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    // Generate shareable link
    const getShareUrl = () => {
        return `${window.location.origin}/hustlefinder?hustle=${hustleId}`;
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareToTwitter = () => {
        const text = `Check out this side hustle opportunity: ${hustle.title} - ${hustle.earningPotential}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`, '_blank');
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank');
    };

    const shareToLinkedin = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = `Check out this side hustle: ${hustle.title}`;
        const body = `I found this great side hustle opportunity:\n\n${hustle.title}\nEarning Potential: ${hustle.earningPotential}\n\nCheck it out: ${getShareUrl()}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };

    const displayedTestimonials = showAllTestimonials
        ? content.testimonials
        : content.testimonials.slice(0, 6);

    const averageRating = (content.testimonials.reduce((sum, t) => sum + t.rating, 0) / content.testimonials.length).toFixed(1);
    const isFavorited = favorites.includes(hustleId);

    return (
        <div className="min-h-screen bg-transparent">
            {/* Hero Section */}
            <div className="relative bg-transparent text-white pt-10">
                <div className="absolute inset-0 bg-transparent"></div>
                <div className="relative container mx-auto px-4 py-12">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to HustleFinder
                    </button>

                    <div className="max-w-4xl">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4 animate-fade-in-down stagger-1">
                            {content.tags.slice(0, 5).map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-default text-white">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-left stagger-2 font-heading">{hustle.title}</h1>
                        <p className="text-xl text-white/90 mb-6 animate-fade-in-left stagger-3 max-w-2xl"><span className="font-signature text-2xl text-indigo-200">{hustle.description}</span></p>

                        {/* Stats Bar */}
                        <div className="flex flex-wrap gap-6 mb-8 animate-fade-in-up stagger-4 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 inline-flex">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-400" />
                                <span className="font-semibold text-white">{hustle.earningPotential}</span>
                            </div>
                            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                                <BarChart3 className="w-5 h-5 text-yellow-400" />
                                <span className="text-white">{hustle.difficulty}</span>
                            </div>
                            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="text-white">{averageRating} ({content.testimonials.length} reviews)</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 animate-fade-in-up stagger-5">
                            <Button
                                onClick={() => scrollToSection('steps')}
                                className="bg-white text-purple-700 hover:bg-white/90 hover:text-purple-800 font-semibold shadow-lg btn-premium"
                            >
                                Get Started Now
                            </Button>

                            {/* Save Button */}
                            <Button
                                variant="outline"
                                onClick={handleToggleFavorite}
                                className={`border-white btn-premium transition-all ${isFavorited ? 'bg-yellow-500 border-yellow-500 text-white' : 'text-white hover:bg-white/10'}`}
                            >
                                <Star className={`w-4 h-4 mr-2 transition-transform ${isFavorited ? 'fill-white' : ''} ${starAnimating ? 'star-animate' : ''}`} />
                                {isFavorited ? 'Saved' : 'Save'}
                            </Button>

                            {/* Share Button with Dropdown */}
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="border-white text-white hover:bg-white/10 btn-premium"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>

                                {showShareMenu && (
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[200px]">
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                        <button
                                            onClick={shareToTwitter}
                                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <Twitter className="w-4 h-4" />
                                            Twitter / X
                                        </button>
                                        <button
                                            onClick={shareToFacebook}
                                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <Facebook className="w-4 h-4" />
                                            Facebook
                                        </button>
                                        <button
                                            onClick={shareToLinkedin}
                                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </button>
                                        <button
                                            onClick={shareViaEmail}
                                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside to close share menu */}
            {showShareMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)}></div>
            )}

            {/* Navigation Bar */}
            <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4">
                    <div className="flex overflow-x-auto scrollbar-hide py-3 gap-2 animate-fade-in-right stagger-6">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 text-sm font-medium border ${activeSection === section.id
                                    ? 'bg-primary-500/30 text-primary-300 border-primary-500/50 shadow-lg shadow-primary-500/20'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <section.icon className="w-4 h-4" />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-16">

                    {/* About Section */}
                    <section id="about">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">About This <span className="font-signature text-3xl text-purple-300">Hustle</span></h2>
                        </div>
                        <Card className="prose dark:prose-invert max-w-none premium-card bg-white/10 backdrop-blur-xl border-white/20 text-gray-300">
                            {content.aboutSection.split('\n\n').map((paragraph, i) => (
                                <p key={i} className="text-gray-300 leading-relaxed mb-4 last:mb-0">
                                    {paragraph}
                                </p>
                            ))}
                        </Card>
                    </section>

                    {/* Steps to Start */}
                    {/* Steps to Start */}
                    <section id="steps">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">Steps to <span className="font-signature text-3xl text-blue-300">Start</span></h2>
                        </div>
                        <div className="space-y-4">
                            {content.stepsToStart.map((step, i) => (
                                <ScrollReveal key={i} animation="fade-left" staggerIndex={(i % 5) + 1}>
                                    <Card className="relative pl-16 hover:shadow-lg transition-all premium-card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20">
                                        <div className="absolute left-4 top-4 w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30">
                                            {step.step}
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                                        <p className="text-gray-400">{step.description}</p>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* Proof of Success */}
                    <section id="proof">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">Proof of Success & <span className="font-signature text-3xl text-green-300">Resources</span></h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {content.proofOfSuccess.map((resource, i) => (
                                <ScrollReveal key={i} animation="scale" staggerIndex={(i % 5) + 1}>
                                    <Card className="hover:shadow-lg transition-shadow group premium-card h-full">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{resource.title}</h3>
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{resource.description}</p>
                                        <a
                                            href={resource.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1 group/link"
                                        >
                                            {resource.source} <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                                        </a>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* Tips for Success */}
                    <section id="tips">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Lightbulb className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">Tips for <span className="font-signature text-3xl text-yellow-300">Success</span></h2>
                        </div>
                        <Card className="premium-card bg-white/10 backdrop-blur-xl border-white/20">
                            <div className="space-y-4">
                                {content.tipsForSuccess.map((tip, i) => (
                                    <ScrollReveal key={i} animation="fade-left" staggerIndex={(i % 5) + 1}>
                                        <div className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-300">{tip}</p>
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </Card>
                    </section>

                    {/* What to Learn */}
                    <section id="learn">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">What to <span className="font-signature text-3xl text-indigo-300">Learn</span></h2>
                        </div>
                        <div className="space-y-4">
                            {['Essential', 'Recommended', 'Optional'].map((priority, pIndex) => {
                                const skills = content.whatToLearn.filter(s => s.priority === priority);
                                if (skills.length === 0) return null;
                                return (
                                    <ScrollReveal key={priority} animation="fade-up" staggerIndex={pIndex + 1}>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${priority === 'Essential' ? 'bg-red-500' :
                                                priority === 'Recommended' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></span>
                                            {priority}
                                        </h3>
                                        <div className="grid gap-3">
                                            {skills.map((skill, i) => (
                                                <Card key={i} className="border-l-4 border-l-primary-500 premium-card bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all">
                                                    <h4 className="font-medium text-white mb-1">{skill.skill}</h4>
                                                    <p className="text-sm text-gray-400">{skill.description}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollReveal>
                                );
                            })}
                        </div>
                    </section>

                    {/* Key Information */}
                    <section id="keyinfo">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-cyan-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white font-heading">Key <span className="font-signature text-3xl text-cyan-300">Information</span></h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <ScrollReveal animation="scale" staggerIndex={1} className="h-full">
                                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 premium-card h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Earning Potential</h3>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{content.keyInfo.earningPotential}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on experience level, time invested, and market conditions</p>
                                </Card>
                            </ScrollReveal>

                            <ScrollReveal animation="scale" staggerIndex={2} className="h-full">
                                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 premium-card h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Time Required</h3>
                                    </div>
                                    <p className="text-xl font-bold text-blue-600">{content.keyInfo.timeRequired}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Flexible scheduling allows you to work around other commitments</p>
                                </Card>
                            </ScrollReveal>

                            <ScrollReveal animation="scale" staggerIndex={3} className="h-full">
                                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800 premium-card h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Wrench className="w-6 h-6 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Tools & Platforms</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {content.keyInfo.toolsAndPlatforms.map((tool, i) => (
                                            <span key={i} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            </ScrollReveal>

                            <ScrollReveal animation="scale" staggerIndex={4} className="h-full">
                                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 premium-card h-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <BarChart3 className="w-6 h-6 text-orange-600" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Difficulty Level</h3>
                                    </div>
                                    <Badge color={content.keyInfo.difficultyLevel === 'Beginner' ? 'green' : content.keyInfo.difficultyLevel === 'Intermediate' ? 'yellow' : 'red'} className="text-lg px-4 py-2">
                                        {content.keyInfo.difficultyLevel}
                                    </Badge>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                                        {content.keyInfo.difficultyLevel === 'Beginner'
                                            ? 'Perfect for newcomers with basic skills'
                                            : content.keyInfo.difficultyLevel === 'Intermediate'
                                                ? 'Requires some prior experience or training'
                                                : 'Best suited for experienced professionals'}
                                    </p>
                                </Card>
                            </ScrollReveal>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section id="testimonials">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <Users className="w-6 h-6 text-pink-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white font-heading">Real User <span className="font-signature text-3xl text-pink-300">Testimonials</span></h2>
                                    <p className="text-gray-600 dark:text-gray-400">{content.testimonials.length} verified reviews • {averageRating} average rating</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {displayedTestimonials.map((testimonial, i) => (
                                <ScrollReveal key={i} animation="scale" staggerIndex={i + 1}>
                                    <Card className="hover:shadow-lg transition-shadow premium-card h-full">
                                        <div className="flex items-start gap-4 mb-4">
                                            <img
                                                src={testimonial.avatar}
                                                alt={testimonial.name}
                                                className="w-12 h-12 rounded-full bg-gray-200"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                                                <p className="text-sm text-gray-500">{testimonial.location}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {Array.from({ length: 5 }).map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            className={`w-4 h-4 ${idx < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">{testimonial.date}</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{testimonial.review}</p>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>

                        {content.testimonials.length > 6 && (
                            <div className="text-center mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAllTestimonials(!showAllTestimonials)}
                                    className="btn-premium"
                                >
                                    {showAllTestimonials ? 'Show Less' : `Show All ${content.testimonials.length} Reviews`}
                                </Button>
                            </div>
                        )}
                    </section>

                    {/* FAQs */}
                    <section id="faqs">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-500/20 rounded-lg">
                                <HelpCircle className="w-6 h-6 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-3">
                            {content.faqs.map((faq, i) => (
                                <ScrollReveal key={i} animation="fade-left" staggerIndex={(i % 5) + 1}>
                                    <div
                                        className={`rounded-xl border transition-all cursor-pointer backdrop-blur-md ${expandedFaqs.includes(i)
                                            ? 'bg-white/10 ring-1 ring-purple-500/50 border-purple-500/50 shadow-lg'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleFaq(i)}
                                            className="w-full flex items-center justify-between p-6 text-left"
                                        >
                                            <h3 className="font-medium text-white pr-4">{faq.question}</h3>
                                            {expandedFaqs.includes(i) ? (
                                                <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0 transition-transform duration-300" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300" />
                                            )}
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedFaqs.includes(i) ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="px-6 pb-6 pt-0">
                                                <div className="border-t border-white/10 pt-4">
                                                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="text-center py-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl text-white scroll-animate-scale shadow-xl shadow-primary-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Start Your <span className="font-signature text-4xl text-white">{hustle.title}</span> Journey?</h2>
                            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                                Join thousands of successful practitioners who have built sustainable income streams with {hustle.title}.
                            </p>
                            <Button
                                onClick={() => scrollToSection('steps')}
                                className="bg-white text-primary-600 hover:bg-white/90 hover:text-primary-700 font-semibold text-lg px-8 py-3 shadow-lg btn-premium transition-transform hover:scale-105"
                            >
                                Get Started Now
                            </Button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default HustleDetail;
