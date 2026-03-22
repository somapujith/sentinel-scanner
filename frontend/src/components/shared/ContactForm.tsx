import React, { useState } from 'react';
import { MagneticButton } from './MagneticButton';
import { ArrowUpRight } from 'lucide-react';

export const ContactForm: React.FC = () => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log({ name, message });
        // You can replace this with an API call
        const subject = encodeURIComponent(`Sentinel Scanner feedback from ${name || 'visitor'}`);
        const body = encodeURIComponent(message || '');
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
                <div className="relative">
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="peer w-full bg-transparent border-b border-white/20 text-white/80 placeholder-transparent focus:outline-none focus:border-primary transition-colors pb-2"
                        placeholder="Your Name"
                        required
                    />
                    <label
                        htmlFor="name"
                        className="absolute left-0 -top-3.5 text-white/40 text-xs xs:text-sm transition-all peer-placeholder-shown:text-sm xs:peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-primary peer-focus:text-xs xs:peer-focus:text-sm"
                    >
                        Your Name
                    </label>
                </div>
                <div className="relative">
                     <input
                        type="text"
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="peer w-full bg-transparent border-b border-white/20 text-white/80 placeholder-transparent focus:outline-none focus:border-primary transition-colors pb-2"
                        placeholder="What's on your mind?"
                        required
                    />
                    <label
                        htmlFor="message"
                        className="absolute left-0 -top-3.5 text-white/40 text-xs xs:text-sm transition-all peer-placeholder-shown:text-sm xs:peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-primary peer-focus:text-xs xs:peer-focus:text-sm"
                    >
                        What's on your mind?
                    </label>
                </div>
            </div>
            <MagneticButton className="inline-flex w-fit">
                <button
                    type="submit"
                    className="inline-flex items-center gap-2 xs:gap-3 group"
                >
                    <span className="text-[clamp(0.875rem,2vw,1.125rem)] text-white/50 hover:text-white border-b border-white/20 group-hover:border-primary pb-1 transition-all duration-300">
                        Send It
                    </span>
                    <span className="w-8 xs:w-10 h-8 xs:h-10 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                        <ArrowUpRight size={14} className="xs:size-4 text-white/50 group-hover:text-white transition-colors" />
                    </span>
                </button>
            </MagneticButton>
        </form>
    );
};
