import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ProjectModal } from '../shared/ProjectModal';

const projects = [
  {
    id: '0',
    title: 'Port scan',
    category: 'all',
    desc: 'TCP connect to common ports to surface exposed services. Non-destructive discovery for authorized targets.',
    location: 'Module',
    industry: 'Non-destructive',
    scope: 'Open ports | Service hints',
    size: 'TCP connect',
    logo: '/logos/anthill.svg',
    images: ['/projects/anthill.png'],
    url: '/app',
  },
  {
    id: '1',
    title: 'HTTP headers',
    category: 'others',
    desc: 'Live fetch for CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and related headers that affect browser security posture.',
    location: 'Module',
    industry: 'Passive',
    scope: 'CSP | HSTS | framing',
    size: 'Header review',
    logo: '/logos/anaar.svg',
    images: ['/projects/anaar.jpg'],
    url: '/app',
  },
  {
    id: '2',
    title: 'TLS / SSL',
    category: 'all',
    desc: 'Certificate validity, protocol and cipher posture — quick TLS snapshot before release or after infra changes.',
    location: 'Module',
    industry: 'Passive',
    scope: 'Cert lifetime | ciphers',
    size: 'TLS snapshot',
    logo: '/logos/sunday_everyday.svg',
    images: ['/projects/sunday_everyday.jpg'],
    url: '/app',
  },
  {
    id: '3',
    title: 'Reflection probes',
    category: 'others',
    desc: 'Intrusive / careful: controlled test strings to detect echoes. Reports verbatim signals — not confirmed exploit chains.',
    location: 'Module',
    industry: 'Careful',
    scope: 'Echo checks | Lab use',
    size: 'Marked intrusive',
    logo: '/logos/smiley.svg',
    images: ['/projects/pulp.jpg'],
    url: '/app',
  },
];

export const ProjectsSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<typeof projects[number] | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Cursor-following image position (MotionValues = no re-renders)
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 250, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 250, damping: 28 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  }, [cursorX, cursorY]);

  return (
    <section
      id="modules"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="bg-black relative min-h-screen py-20 sm:py-[120px] px-4 sm:px-6 md:px-12 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col mb-16 md:mb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2.5 mb-6 text-[10px] tracking-[0.2em] text-primary font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-primary animate-spin-slow" />
            Scan modules
          </div>
          <h2 className="text-[clamp(50px,8vw,110px)] font-sans font-extrabold tracking-tighter leading-[0.9]">
            What you can<br />
            <span className="font-serif italic font-medium text-white/40 tracking-normal pr-4">run in one flow.</span>
          </h2>
        </motion.div>
      </div>

      {/* Floating cursor-following image */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="hidden lg:block fixed top-0 left-0 z-30 pointer-events-none will-change-transform"
            style={{
              x: springX,
              y: springY,
              translateX: '20px',
              translateY: '-50%',
            }}
          >
            <div className="w-[280px] sm:w-[320px] h-[180px] sm:h-[220px] overflow-hidden rounded-md shadow-2xl">
              <img
                src={projects[activeIndex].images[0]}
                alt={projects[activeIndex].title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project rows — typographic list */}
      <div className="relative z-10 border-t border-white/10">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={() => {
              if (typeof window !== 'undefined' && 'ontouchstart' in window) {
                if (activeIndex === i) {
                  setSelectedProject(project);
                } else {
                  setActiveIndex(i);
                }
              } else {
                setSelectedProject(project);
              }
            }}
            className="group border-b border-white/10 cursor-none"
          >
            <div className="flex items-center justify-between py-6 sm:py-10 md:py-14 relative">
              {/* Left: index + title */}
              <div className="flex items-baseline gap-4 md:gap-8 overflow-hidden">
                <span className="text-[11px] md:text-xs font-mono tracking-widest text-primary/70 font-semibold tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className={`font-sans text-[clamp(2rem,6vw,5.5rem)] font-extrabold uppercase tracking-tighter leading-none transition-all duration-700 ease-out-expo ${
                    activeIndex === null || activeIndex === i
                      ? 'text-white'
                      : 'text-white/15'
                  }`}
                >
                  <span className="inline-block transition-transform duration-700 ease-out-expo group-hover:translate-x-4">
                    {project.title}
                  </span>
                </h3>
              </div>

              {/* Right: meta + arrow */}
              <div className="flex items-center gap-6 md:gap-10 shrink-0">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <span
                    className={`text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors duration-500 ${
                      activeIndex === i ? 'text-white/60' : 'text-white/20'
                    }`}
                  >
                    {project.industry}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${
                      activeIndex === i ? 'text-primary' : 'text-primary/30'
                    }`}
                  >
                    {project.size}
                  </span>
                </div>

                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 ease-out-expo ${
                    activeIndex === i
                      ? 'border-primary bg-primary text-black scale-100'
                      : 'border-white/10 text-white/30 scale-75'
                  }`}
                >
                  <ArrowUpRight
                    strokeWidth={2}
                    size={18}
                    className="transition-transform duration-500 ease-out-expo group-hover:rotate-45"
                  />
                </div>
              </div>
            </div>

            {/* Scope tags — slide in on hover */}
            <motion.div
              initial={false}
              animate={{
                height: activeIndex === i ? 'auto' : 0,
                opacity: activeIndex === i ? 1 : 0,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-8 flex flex-wrap items-center gap-2 md:pl-[60px]">
                {project.scope.split(' | ').map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.12em] text-white/50 uppercase font-semibold border border-white/10 rounded-full px-4 py-1.5"
                  >
                    {tag}
                  </span>
                ))}
                <a
                  href={project.url}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-black uppercase font-semibold bg-primary rounded-full px-4 py-1.5 ml-2 transition-all duration-300 hover:bg-white hover:text-black cursor-pointer"
                >
                  Open scanner
                  <ArrowUpRight size={11} strokeWidth={2.5} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <ProjectModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
};
