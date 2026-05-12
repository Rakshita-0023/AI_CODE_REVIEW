import { useNavigate } from 'react-router-dom';
import {
  CodeBracketIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: CodeBracketIcon, title: 'Deep Code Analysis', body: 'Find bugs, anti-patterns, and maintainability risks with context-aware AI analysis.' },
    { icon: ShieldCheckIcon, title: 'Security & Trust', body: 'Surface insecure patterns, dependency risks, and hardening suggestions before production.' },
    { icon: BoltIcon, title: 'Performance Guidance', body: 'Get practical optimization suggestions with impact explanations and diff-ready fixes.' },
    { icon: ChatBubbleLeftRightIcon, title: 'AI Developer Chat', body: 'Discuss architecture, debug issues, and iterate quickly with code-aware conversations.' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100">
      <div className="fixed inset-0 pointer-events-none" />

      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 text-black flex items-center justify-center text-sm font-bold">CS</div>
            <span className="text-sm tracking-wide font-semibold">CodeSense AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/signin')} className="btn btn-secondary">Sign In</button>
            <button onClick={() => navigate('/signup')} className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-14 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs border border-white/15 bg-white/[0.03] rounded-full px-3 py-1.5 text-slate-300 mb-6">
              <CheckBadgeIcon className="w-4 h-4 text-indigo-300" />
              Trusted AI code intelligence for engineering teams
            </div>
            <h1 className="text-5xl md:text-6xl leading-tight font-semibold tracking-tight mb-6">
              Build cleaner, safer, faster software with AI that understands code.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mb-8">
              CodeSense AI is the developer platform for code review, debugging, performance improvement, and AI-guided engineering decisions.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => navigate('/signup')} className="btn btn-primary">Start Free <ArrowRightIcon className="w-4 h-4" /></button>
              <button onClick={() => navigate('/signin')} className="btn btn-secondary">Open Dashboard</button>
            </div>
          </div>

          <div className="card p-5 bg-[#0b0d10]">
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="h-10 border-b border-white/10 bg-[#0f1217] flex items-center px-4 gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <span className="text-xs text-slate-500 ml-3">analysis.ts</span>
              </div>
              <pre className="text-sm font-mono p-4 text-slate-300 leading-7 overflow-x-auto"><code>{`const report = await codesense.review(code)

// Bug (High): unchecked async rejection
// Security: unsafe string interpolation
// Perf: repeated O(n) lookup in loop

report.fixes[0].apply()`}</code></pre>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="card p-5 hover:border-white/20 transition-colors">
                <feature.icon className="w-5 h-5 text-indigo-300 mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
