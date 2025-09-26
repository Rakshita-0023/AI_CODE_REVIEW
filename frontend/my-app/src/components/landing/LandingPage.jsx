import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CodeBracketIcon, 
  ShieldCheckIcon, 
  AcademicCapIcon, 
  GlobeAltIcon,
  CheckIcon,
  ChevronDownIcon,
  PlayIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import DemoModal from '../ui/DemoModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: CodeBracketIcon,
      title: "Instant Code Feedback",
      description: "AI points out bugs, inefficiencies, and security issues instantly."
    },
    {
      icon: ShieldCheckIcon,
      title: "Style & Standards Compliance", 
      description: "Auto-checks against industry coding standards or your custom rules."
    },
    {
      icon: AcademicCapIcon,
      title: "Learning Assistant",
      description: "Explains issues and suggests improvements so developers learn as they code."
    },
    {
      icon: GlobeAltIcon,
      title: "Multi-Language Support",
      description: "Works with Python, Java, C++, JavaScript, and more."
    }
  ];

  const steps = [
    { title: "Sign Up / Sign In", description: "Create your account or log in" },
    { title: "Upload or Paste Code", description: "Add your snippet/project" },
    { title: "Get AI Review", description: "AI reviews and highlights issues in real time" },
    { title: "Fix & Improve", description: "Apply suggestions or auto-fix with one click" }
  ];

  const testimonials = [
    {
      quote: "Saved our dev team hours of manual review — now every PR gets an instant AI review.",
      author: "Priya Sharma",
      role: "Senior Software Engineer",
      company: "TechCorp"
    },
    {
      quote: "Perfect for juniors — explains not just what's wrong, but why.",
      author: "Arjun Patel", 
      role: "Tech Lead",
      company: "StartupXYZ"
    },
    {
      quote: "The security scanning feature caught vulnerabilities we missed in manual reviews.",
      author: "Sarah Chen",
      role: "DevOps Engineer", 
      company: "SecureCode Inc"
    }
  ];

  const faqs = [
    {
      question: "Which programming languages are supported?",
      answer: "We support 13+ languages including Python, JavaScript, Java, C++, C#, PHP, Ruby, Go, Rust, Kotlin, Swift, and SQL with auto-detection."
    },
    {
      question: "Can I integrate with GitHub/GitLab?",
      answer: "Yes! We offer seamless integration with GitHub, GitLab, and Bitbucket for automated PR reviews and repository analysis."
    },
    {
      question: "Is my code stored securely?",
      answer: "Your code is processed securely and never stored permanently. We use enterprise-grade encryption and your code stays private."
    },
    {
      question: "Do I need to install anything?",
      answer: "No installation required! CodeSense works entirely in your browser. Just paste your code or upload files to get started."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>
      
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-500/40 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-purple-400/20 rounded-full animate-bounce"></div>
      </div>
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="text-xl font-bold">CodeSense</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#changelog" className="text-gray-300 hover:text-white transition-colors">Changelog</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
            <a href="#resources" className="text-gray-300 hover:text-white transition-colors">Resources</a>
          </div>
          
          <button 
            onClick={() => navigate('/signin')}
            className="text-gray-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-8">
              <SparklesIcon className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Code Analysis</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The AI Code Reviewer for
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                faster, cleaner code
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Our tool helps developers write better code by providing instant, AI-driven reviews, 
              suggestions, and fixes. Ship production-ready code with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center gap-2"
              >
                <BoltIcon className="w-5 h-5 group-hover:animate-pulse" />
                Get Started Free
              </button>
              <button 
                onClick={() => setShowDemo(true)}
                className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800/50 flex items-center gap-2"
              >
                <EyeIcon className="w-5 h-5" />
                Try Demo
              </button>
            </div>
          </div>
          
          {/* Code Preview */}
          <div className={`mt-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-3xl"></div>
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-4">main.py</span>
                </div>
                <div className="font-mono text-left space-y-2">
                  <div className="text-gray-300">def calculate_sum(a, b):</div>
                  <div className="text-red-400 pl-4">return a + b  # ⚠️ Missing type hints</div>
                  <div className="text-purple-400 italic"># 🤖 AI Suggestion: Add type annotations</div>
                  <div className="text-green-400">def calculate_sum(a: int, b: int) -&gt; int:</div>
                  <div className="text-green-400 pl-4">return a + b  # ✅ Type-safe</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why developers choose
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> CodeSense</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful AI-driven features that make code review effortless and intelligent
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in just 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-400 transition-colors">{step.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Enterprise-ready
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> features</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mt-1">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">Customizable Rules</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">Define your own review standards and coding guidelines</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mt-1">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">Version Control Integration</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">Works seamlessly with GitHub, GitLab, and Bitbucket</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mt-1">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors">Enterprise-Grade Security</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">Your code stays private with end-to-end encryption</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 transform hover:scale-105 transition-transform">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">🚀 Ready to Scale?</h3>
                  <p className="mb-6 opacity-90">Join thousands of developers using CodeSense</p>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Start Free Trial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Developers Say</h2>
            <p className="text-xl text-gray-400">Trusted by developers worldwide</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1">
                <p className="text-gray-300 mb-4 italic text-lg">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-gray-400">{testimonial.role}</p>
                  <p className="text-purple-400 text-sm">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Everything you need, completely free</p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-purple-500/50 rounded-3xl p-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-purple-900/50 border border-purple-500/50 rounded-full px-4 py-2 mb-6">
                    <SparklesIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300">Limited Time</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Free Forever</h3>
                  <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">$0</p>
                  <p className="text-gray-400 mb-8">Everything you need to review code like a pro</p>
                  <ul className="text-left space-y-3 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Unlimited code reviews</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">13+ programming languages</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">AI-powered suggestions</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Security vulnerability detection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Code execution & testing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Analysis history</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-purple-500/50 transition-all">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-800/50 rounded-2xl transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to review your code smarter?</h2>
              <p className="text-xl mb-8 opacity-90">Start for free and let AI catch your next bug</p>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105 hover:shadow-2xl"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demo Modal */}
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
};

export default LandingPage;