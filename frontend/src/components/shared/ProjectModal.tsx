import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  desc: string;
  location: string;
  industry: string;
  scope: string;
  size: string;
  logo: string;
  images: string[];
  url?: string;
}

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, isOpen, onClose }) => {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveImage(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />
          
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-[90vh] bg-[#111] grid grid-cols-1 lg:grid-cols-2 overflow-y-auto lg:overflow-hidden z-10"
          >
            <button 
              onClick={onClose}
              aria-label="Close project details"
              className="absolute top-5 right-5 z-20 w-10 h-10 bg-white/10 flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-primary group cursor-none"
            >
              <X size={18} className="text-white group-hover:text-white transition-colors" />
            </button>

            <div className="relative h-[35vh] sm:h-[40vh] lg:h-full bg-[#111] overflow-hidden shrink-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  src={project.images[activeImage]}
                  alt={`${project.title} — image ${activeImage + 1}`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
              
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {project.images.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1} of ${project.images.length}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-none ${activeImage === i ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 md:p-12 lg:overflow-y-auto">
              <h2 className="text-[22px] sm:text-[28px] font-extrabold tracking-[-0.02em] text-white mb-4 sm:mb-6">
                {project.title}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/5">
                  <div className="text-[10px] tracking-[0.12em] text-primary font-bold mb-1">CONTEXT</div>
                  <div className="text-[13px] text-white font-semibold">{project.location}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-[10px] tracking-[0.12em] text-primary font-bold mb-1">MODE</div>
                  <div className="text-[13px] text-white font-semibold">{project.industry}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-[10px] tracking-[0.12em] text-primary font-bold mb-1">SURFACES</div>
                  <div className="text-[13px] text-white font-semibold">{project.scope}</div>
                </div>
                <div className="p-4 bg-white/5">
                  <div className="text-[10px] tracking-[0.12em] text-primary font-bold mb-1">DEPTH</div>
                  <div className="text-[13px] text-white font-semibold">{project.size}</div>
                </div>
              </div>
              
              <p className="text-sm text-white/50 leading-[1.8] mb-8">
                {project.desc}
              </p>

              {project.url &&
                (project.url.startsWith('/') ? (
                  <Link
                    to={project.url}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 bg-primary text-black text-[12px] tracking-[0.1em] font-bold uppercase px-6 py-3 rounded-full transition-all duration-300 hover:bg-white hover:scale-105 cursor-pointer"
                  >
                    Open scanner
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                  </Link>
                ) : (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-black text-[12px] tracking-[0.1em] font-bold uppercase px-6 py-3 rounded-full transition-all duration-300 hover:bg-white hover:scale-105 cursor-pointer"
                  >
                    Visit site
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                  </a>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
