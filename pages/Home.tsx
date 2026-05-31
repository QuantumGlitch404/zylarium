import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, Briefcase, FileText, TrendingUp, CheckCircle, Lock, Smartphone, Sparkles, Activity, Code2, Layers } from 'lucide-react';
import { Button, Card, Badge } from '../components/CommonUI';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxProductGrid = ({ products }: { products: any[] }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) setColumns(3); // lg breakpoint
      else if (window.innerWidth >= 768) setColumns(2); // md breakpoint
      else setColumns(1); // sm breakpoint
    };

    updateColumns(); // Set initial columns
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Track scroll position
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Calculate transforms for each column (3-column layout)
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]); // Moves opposite/slower
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150]);

  // Calculate transforms for each column (2-column layout)
  const y2_1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2_2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  // Distribute products into columns dynamically
  const distributedProducts = React.useMemo(() => {
    const cols: any[][] = Array.from({ length: columns }, () => []);
    products.forEach((p, i) => {
      cols[i % columns].push(p);
    });
    return cols;
  }, [products, columns]);

  const ProductCard = ({ p }: { p: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="mb-8"
    >
      <div className="group relative">
        {/* Simple elegant glass card - NO color blooming on hover */}
        <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.06] hover:border-white/20">

          <div className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${p.gradient} shadow-lg ring-1 ring-white/20 text-white`}>
                {p.icon}
              </div>
              <Badge color="blue" className="bg-white/5 border border-white/10 text-gray-300 font-signature tracking-wider">Free</Badge>
            </div>

            <h3 className="text-2xl font-bold mb-3 text-white font-heading tracking-wide group-hover:text-white transition-colors">{p.name}</h3>
            <p className="text-gray-400 mb-8 font-light text-sm leading-relaxed max-w-[90%]">{p.desc}</p>

            <div className="space-y-4 mb-8">
              {p.features.map((f: string) => (
                <div key={f} className="flex items-center text-sm text-gray-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500/50 mr-3" />
                  {f}
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white group-hover:border-white/20 transition-all font-light tracking-wide flex items-center justify-center gap-2 group/btn"
              onClick={() => navigate(p.path)}
            >
              <span className="font-signature text-lg">Launch</span> App
              <ArrowRight className="w-4 h-4 text-white/50 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className={`grid gap-8 ${columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {distributedProducts.map((colProducts, colIndex) => {
        let style = {};
        let className = "flex flex-col gap-8";

        if (columns === 3) {
          if (colIndex === 0) style = { y: y1 };
          if (colIndex === 1) { style = { y: y2 }; className += " pt-32"; }
          if (colIndex === 2) { style = { y: y3 }; className += " pt-16"; }
        } else if (columns === 2) {
          if (colIndex === 0) style = { y: y2_1 };
          if (colIndex === 1) { style = { y: y2_2 }; className += " pt-16"; }
        }
        // For 1 column, style remains empty, effectively disabling parallax

        return (
          <motion.div key={colIndex} style={style} className={className}>
            {colProducts.map(p => p && <ProductCard key={p.id} p={p} />)}
          </motion.div>
        );
      })}
    </div>
  );
};

// --- Parallax Stats Grid ---
// --- Parallax Stats Grid ---
const ParallaxStatsGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) setColumns(4);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // 3D Flip & Float Effect
  const yOdd = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yEven = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  // Rotate on X axis - like cards flipping up on a table
  const rotateX = useTransform(scrollYProgress, [0.2, 0.8], [15, -15]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  const stats = [
    { label: 'Total Tools', value: 'N/A' },
    { label: 'Users', value: 'N/A' },
    { label: 'Cost', value: 'N/A' },
    { label: 'Privacy', value: 'N/A' }
  ];

  const distributedStats = React.useMemo(() => {
    const cols: any[][] = Array.from({ length: columns }, () => []);
    stats.forEach((s, i) => { cols[i % columns].push(s); });
    return cols;
  }, [stats, columns]);

  return (
    <div ref={containerRef} className={`grid gap-8 ${columns === 4 ? 'grid-cols-4' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1'} perspective-1000`}>
      {distributedStats.map((colStats, colIndex) => {
        let style = {};
        // Staggered Y motion with shared 3D rotation
        if (colIndex % 2 === 0) style = { y: yOdd, rotateX, opacity };
        else style = { y: yEven, rotateX, opacity };

        return (
          <motion.div key={colIndex} style={{ ...style, perspective: 1000 }} className="flex flex-col gap-6">
            {colStats.map((s: any) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative overflow-hidden rounded-[2rem] bg-white/[0.04] backdrop-blur-[40px] border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.05)] p-10 hover:bg-white/[0.08] hover:scale-105 transition-all group hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:border-white/30"
              >
                {/* Pure White Text - No Gradients */}
                <div className="text-6xl font-bold mb-3 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all font-heading tracking-tight">
                  {s.value}
                </div>
                <div className="text-white/60 font-medium tracking-widest uppercase text-xs">{s.label}</div>

                {/* Icy Glint */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
};

// --- Parallax Features Grid ---
const ParallaxFeaturesGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 768) setColumns(3);
      else setColumns(1);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // "Arch" Motion: Center rises faster than sides
  const centerRise = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const sideRise = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const scale = useTransform(scrollYProgress, [0.2, 0.8], [0.95, 1.05]);

  const features = [
    {
      title: 'Privacy', highlight: 'First', highlightColor: 'text-primary-300', icon: <Lock className="w-10 h-10 text-white" />,
      desc: 'All processing happens in your browser. Data never leaves your device.',
      bg: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Mobile', highlight: 'Ready', highlightColor: 'text-cyan-300', icon: <Smartphone className="w-10 h-10 text-white" />,
      desc: 'Fully responsive design that works perfectly on phones, tablets, and desktops.',
      bg: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Always', highlight: 'Free', highlightColor: 'text-indigo-300', icon: <TrendingUp className="w-10 h-10 text-white" />,
      desc: 'No subscriptions, no paywalls, no hidden fees. Just useful tools.',
      bg: 'from-primary-600 to-secondary-500'
    }
  ];

  const distributed = React.useMemo(() => {
    const cols: any[][] = Array.from({ length: columns }, () => []);
    features.forEach((f, i) => cols[i % columns].push(f));
    return cols;
  }, [features, columns]);

  return (
    <div ref={containerRef} className={`grid gap-8 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {distributed.map((colFeats, i) => {
        let style = {};
        let className = "flex flex-col gap-8";
        if (columns === 3) {
          if (i === 1) style = { y: centerRise, scale }; // Center
          else style = { y: sideRise }; // Sides
        }

        return (
          <motion.div key={i} style={style} className={className}>
            {colFeats.map((f: any) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7 }}
                className="text-center p-10 rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/[0.08] hover:border-white/30 transition-all duration-500 group relative overflow-hidden"
              >
                <div className={`w-20 h-20 mx-auto mb-8 bg-gradient-to-br ${f.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-xl shadow-white/5`}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-4 text-white text-2xl font-heading">
                  <span className={`font-signature text-3xl ${f.highlightColor}`}>{f.title}</span> {f.highlight}
                </h3>
                <p className="text-base text-gray-400 leading-relaxed font-light">{f.desc}</p>

                {/* Liquid Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        )
      })}
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();

  const products = [
    {
      id: 'unitoolbox',
      name: 'UniToolBox',
      desc: '30+ powerful conversion & utility tools.',
      icon: <Box className="w-8 h-8" />,
      features: ['Image Compressor', 'PDF Tools', 'Format Converter'],
      path: '/unitoolbox',
      color: 'purple',
      gradient: 'from-primary-500 to-primary-600'
    },
    {
      id: 'hustlefinder',
      name: 'HustleFinder',
      desc: '120+ verified remote side hustle ideas.',
      icon: <Briefcase className="w-8 h-8" />,
      features: ['Skill Matcher', 'Earnings Calc', 'Filtering'],
      path: '/hustlefinder',
      color: 'cyan',
      gradient: 'from-secondary-500 to-secondary-600'
    },
    {
      id: 'resume',
      name: 'Resume Builder',
      desc: 'AI-powered professional resume creation.',
      icon: <FileText className="w-8 h-8" />,
      features: ['AI Assistant', 'Live Preview', 'PDF Export'],
      path: '/resume-builder',
      color: 'purple',
      gradient: 'from-primary-600 to-secondary-500'
    },
    {
      id: 'finance',
      name: 'Finance Tools',
      desc: '37+ personal finance management tools.',
      icon: <TrendingUp className="w-8 h-8" />,
      features: ['Budgeting', 'Investment', 'Loan Calc'],
      path: '/finance-tools',
      color: 'cyan',
      gradient: 'from-secondary-400 to-primary-500'
    },
    {
      id: 'codexray',
      name: 'Code X-Ray',
      desc: 'System design visualizer & load simulator.',
      icon: <Activity className="w-8 h-8" />,
      features: ['Architecture Diagrams', 'Traffic Simulation', 'Bottleneck Detection'],
      path: '/code-xray',
      color: 'purple',
      gradient: 'from-indigo-500 to-violet-600'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent pt-24 pb-36">
        <div className="container mx-auto px-4 text-center z-10 relative">
          <Badge color="purple">
            <Sparkles className="w-3 h-3 mr-1" /> <span className="font-signature text-sm">Now Live</span>
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mt-8 mb-8 tracking-tight font-heading">
            <span className="bg-gradient-to-r from-white via-primary-200 to-secondary-300 bg-clip-text text-transparent">Your Complete</span>
            <br />
            <span className="font-signature text-6xl md:text-8xl bg-gradient-to-r from-primary-400 via-primary-300 to-secondary-400 bg-clip-text text-transparent">Digital Toolkit</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            <span className="font-signature text-2xl text-indigo-300">5 Powerful Platforms.</span> Zero Cost. <span className="font-signature text-2xl text-cyan-300">Unlimited Potential.</span> <br />
            <span className="text-gray-400">Everything you need to build, earn, and manage.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="font-signature text-lg mr-1">Explore</span> All Tools
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Background effects - subtle glow orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-[100px] -z-0 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-[120px] -z-0 animate-pulse"></div>
      </section>

      {/* Products Showcase - Parallax Scroll */}
      <section id="products" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold mb-6 text-white font-heading tracking-tight">
              Our <span className="font-signature text-6xl text-white/50">Ecosystem</span>
            </h2>
            <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
              A unified suite of professional tools designed for the modern creator.
            </p>
          </div>

          <ParallaxProductGrid products={products} />

        </div>
      </section>

      {/* Stats Section - N/A */}
      <section className="py-24 relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border-y border-white/5">
        <div className="container mx-auto px-4">
          <ParallaxStatsGrid />
        </div>
      </section>

      {/* Features List */}
      <section className="py-24 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <ParallaxFeaturesGrid />
        </div>
      </section>
    </div>
  );
};

export default Home;