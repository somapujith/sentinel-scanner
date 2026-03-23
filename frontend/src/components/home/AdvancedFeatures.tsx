import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lightbulb, SplitSquareVertical } from 'lucide-react';

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-4">
    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
      <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
    </div>
    <p className="text-[15px] font-medium leading-relaxed text-slate-600">{text}</p>
  </div>
);

export const AdvancedFeatures: React.FC = () => {
  return (
    <section className="relative w-full bg-[#626de4] py-20 lg:py-32">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 md:px-8">

        {/* Feature 2: EPSS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:flex-row"
        >
          <div className="flex w-full flex-col justify-center p-10 lg:w-[45%] lg:p-14">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#5c67db] md:text-4xl">
              Issue Insight with EPSS & Severity
            </h2>
            <div className="flex flex-col gap-6">
              <CheckItem text="See severity, exploit likelihood, and impact at a glance." />
              <CheckItem text="Prioritise fixes based on real-world exploit probability." />
            </div>
          </div>
          <div className="w-full border-t border-slate-100 bg-[#fbfcfd] p-8 lg:w-[55%] lg:border-l lg:border-t-0">
             <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">EPSS Historical Trend (30 Days)</h3>
                <div className="mt-2 flex flex-col gap-1 text-[12px] text-slate-600">
                  <p>Latest EPSS Score: <span className="font-semibold text-slate-800">0.123%</span></p>
                  <p>Latest EPSS %ile: <span className="font-semibold text-slate-800">0.323%</span></p>
                  <p className="mt-1 text-slate-500">Low exploitation probability in the next 30 days</p>
                </div>
                <div className="mt-8 h-48 w-full">
                  <svg viewBox="0 0 400 150" className="h-full w-full overflow-visible">
                    {/* Grid */}
                    <path d="M 40 10 L 40 130" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M 40 130 L 380 130" stroke="#e2e8f0" strokeWidth="2" />
                    <path d="M 40 100 L 380 100" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M 40 70 L 380 70" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M 40 40 L 380 40" stroke="#f1f5f9" strokeWidth="1" />
                    {/* Lines */}
                    <path d="M 50 120 L 220 120 L 240 80 L 320 80 L 340 30 L 370 30" fill="none" stroke="#3b82f6" strokeWidth="3" />
                    <path d="M 50 125 L 220 125 L 240 90 L 320 90 L 340 20 L 370 20" fill="none" stroke="#22c55e" strokeWidth="3" />
                    {/* Dots */}
                    <circle cx="370" cy="30" r="4" fill="#3b82f6" />
                    <circle cx="370" cy="20" r="4" fill="#22c55e" />
                  </svg>
                  <div className="mt-2 flex justify-between px-10 text-[9px] text-slate-400">
                    <span>Sep 28</span>
                    <span>Oct 4</span>
                    <span>Oct 12</span>
                    <span>Oct 20</span>
                    <span>Oct 28</span>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Feature 3: AI Fix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:flex-row"
        >
          <div className="flex w-full flex-col justify-center p-10 lg:w-[45%] lg:p-14">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-[#5c67db] md:text-4xl">
              AI-Generated Secure Fix
            </h2>
            <div className="flex flex-col gap-6">
              <CheckItem text="Clear before/after logic shows exactly what changed." />
              <CheckItem text="Security improved instantly, not just flagged with AI-fix" />
            </div>
          </div>
          <div className="w-full border-t border-slate-100 bg-[#fbfcfd] p-8 lg:w-[55%] lg:border-l lg:border-t-0">
             <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">AI Security Fix Analysis</span>
                </div>
                <div className="flex justify-around border-b border-slate-100 bg-slate-50/50 px-2 py-0 text-xs font-semibold text-slate-500">
                  <div className="cursor-pointer border-b-2 border-transparent px-4 py-4 hover:bg-slate-100">Problem</div>
                  <div className="cursor-pointer border-b-2 border-indigo-500 text-indigo-600 px-4 py-4">Solution</div>
                  <div className="cursor-pointer border-b-2 border-transparent px-4 py-4 hover:bg-slate-100">Best Practices</div>
                </div>
                <div className="bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Fixed Code</span>
                    <div className="flex gap-2">
                       <button className="rounded border border-indigo-100 bg-indigo-50 px-2 flex items-center gap-1 py-1 text-[10px] font-bold text-indigo-600">Code</button>
                       <button className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500">Diff</button>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 font-mono text-[10px] sm:text-[11px] leading-relaxed text-slate-700 border border-slate-100 overflow-x-auto">
                    <div className="text-blue-600">func <span className="text-slate-900">(e *NotifyExecutor) runCommand(command <span className="text-teal-600">string</span>)</span> &#123;</div>
                    <div className="pl-4 text-emerald-600 bg-emerald-50/50 py-0.5 border-l-2 border-emerald-400">
                      // Prevent a common trick where caller supplies a shell as the program<br />
                      // e.g. "sh", "bash", and passes -c via args to achieve shell execution<br />
                      lowerProg := strings.ToLower(progBase)<br />
                      if lowerProg == "sh" || lowerProg == "bash" &#123;<br />
                      &nbsp;&nbsp;return nil, fmt.Errorf("refusing to execute shell to prevent command injection")<br />
                      &#125;
                    </div>
                    <div>&#125;</div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
