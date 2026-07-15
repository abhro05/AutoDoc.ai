import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Home.css";
import Navbar from "../components/Navbar";

/* ----------------------------------------------------------------
   SVG icon helpers (inline to avoid extra deps)
   ---------------------------------------------------------------- */
const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const ChevronDown = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ----------------------------------------------------------------
   Data
   ---------------------------------------------------------------- */
const FEATURES = [
  { icon: "📄", title: "README Generation", desc: "Generate comprehensive README files with project overview, setup instructions, and usage guides from your codebase." },
  { icon: "🤝", title: "CONTRIBUTING Guides", desc: "Auto-create contribution guidelines covering code standards, PR workflow, and development setup." },
  { icon: "📡", title: "API Documentation", desc: "Extract and document API endpoints, request/response schemas, and authentication flows automatically." },
  { icon: "👁️", title: "Live Preview", desc: "Preview generated documentation in real-time with a GitHub-flavored markdown renderer." },
  { icon: "🔍", title: "Repository Analysis", desc: "Deep analysis of your repo structure, tech stack, and code patterns to produce context-aware docs." },
  { icon: "📥", title: "Easy Export", desc: "Download generated docs as Markdown files, copy to clipboard, or push directly to your repository." },
];

const STEPS = [
  { num: 1, title: "Paste Repository URL", desc: "Enter any public GitHub repository URL into the generator." },
  { num: 2, title: "AI Analyzes Code", desc: "Gemini AI reads your codebase, understands the architecture, and extracts key information." },
  { num: 3, title: "Review & Export", desc: "Edit the generated docs in the live preview, then copy or download them instantly." },
];

const TECH_STACK = [
  { icon: "⚛️", name: "React" },
  { icon: "⚡", name: "Vite" },
  { icon: "✨", name: "Gemini AI" },
  { icon: "🟢", name: "Express" },
  { icon: "🟩", name: "Node.js" },
  { icon: "🔐", name: "Supabase" },
];

const FAQS = [
  { q: "Is AutoDoc.ai free to use?", a: "Yes! AutoDoc.ai is completely free and open-source under the MIT License. You can use it without any limitations or paywalls." },
  { q: "Which repositories are supported?", a: "AutoDoc.ai supports any public GitHub repository. Simply paste the URL and our AI will analyze the codebase regardless of language or framework." },
  { q: "Can I edit the generated documentation?", a: "Absolutely. The generated markdown is fully editable — you can review it in the live preview, make changes, and then export the final version." },
  { q: "How accurate is the AI-generated documentation?", a: "AutoDoc.ai uses Google's Gemini AI to deeply analyze your codebase. While the output is highly accurate, we recommend reviewing the generated docs before publishing." },
  { q: "How can I contribute to the project?", a: "We welcome contributions! Check out our GitHub repository for beginner-friendly issues, read the CONTRIBUTING guide, and submit a pull request. We're especially active during SSoC." },
];

/* ----------------------------------------------------------------
   Component
   ---------------------------------------------------------------- */
function Home() {
  const { user } = useAuth();
  const revealRefs = useRef([]);

  useEffect(() => {
    document.title = "AutoDoc.ai — AI-Powered Documentation Generator";
  }, []);

  /* Intersection Observer for scroll reveal animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const els = revealRefs.current;
    els.forEach((el) => el && observer.observe(el));

    return () => els.forEach((el) => el && observer.unobserve(el));
  }, []);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="landing">
      <Navbar />

      {/* Background orbs */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-orb hero-orb--green" />
        <div className="hero-orb hero-orb--emerald" />
        <div className="hero-orb hero-orb--teal" />
      </div>

      {/* ==================== HERO ==================== */}
      <header className="hero" id="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Open Source &amp; Free Forever
        </div>

        <h1 className="hero-title">
          Documentation that<br />
          <span className="gradient-text">writes itself.</span>
        </h1>

        <p className="hero-description">
          AutoDoc.ai uses Gemini AI to analyze your GitHub repository and
          generate production-ready README, CONTRIBUTING guides, and API
          documentation — in seconds.
        </p>

        <div className="hero-actions">
          {user ? (
            <Link to="/generator" className="btn btn-primary" id="hero-cta-primary">
              Open Generator <ArrowRight className="btn-icon" />
            </Link>
          ) : (
            <Link to="/signup" className="btn btn-primary" id="hero-cta-primary">
              Get Started Free <ArrowRight className="btn-icon" />
            </Link>
          )}
          <a
            href="https://github.com/abhro05/AutoDoc.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            id="hero-cta-github"
          >
            <GitHubIcon className="btn-icon" />
            View on GitHub
          </a>
        </div>

        {/* Terminal mockup */}
        <div className="hero-terminal" aria-label="Terminal demo showing AutoDoc.ai generating documentation">
          <div className="terminal-header">
            <span className="terminal-dot terminal-dot--red" />
            <span className="terminal-dot terminal-dot--yellow" />
            <span className="terminal-dot terminal-dot--green" />
            <span className="terminal-title">AutoDoc.ai — Terminal</span>
          </div>
          <div className="terminal-body">
            <span className="terminal-line">
              <span className="terminal-prompt">$ </span>autodoc generate <span className="terminal-url">github.com/user/project</span>
            </span>
            <span className="terminal-line terminal-comment"># Analyzing repository structure...</span>
            <span className="terminal-line terminal-comment"># Found 47 files across 12 directories</span>
            <span className="terminal-line terminal-comment"># Detected: React, TypeScript, Express</span>
            <span className="terminal-line terminal-comment"># Generating documentation...</span>
            <span className="terminal-line terminal-success">✓ README.md generated (2.4 KB)</span>
            <span className="terminal-line terminal-success">✓ CONTRIBUTING.md generated (1.8 KB)</span>
          </div>
        </div>
      </header>

      {/* ==================== ABOUT ==================== */}
      <section id="about" className="landing-section section-center" ref={addRevealRef}>
        <div className="reveal" ref={addRevealRef}>
          <span className="section-label">About AutoDoc.ai</span>
          <h2 className="section-title">AI-powered docs for every repository</h2>
          <p className="section-subtitle">
            AutoDoc.ai automatically generates production-ready project
            documentation from a GitHub repository using AI — saving developers
            hours of manual writing.
          </p>
        </div>

        <div className="about-content reveal-group" ref={addRevealRef}>
          <div className="about-stat">
            <span className="about-stat-icon" aria-hidden="true">🤖</span>
            <div className="about-stat-title">AI-Powered</div>
            <div className="about-stat-desc">Built on Google&apos;s Gemini AI for deep code understanding</div>
          </div>
          <div className="about-stat">
            <span className="about-stat-icon" aria-hidden="true">🌍</span>
            <div className="about-stat-title">Open Source</div>
            <div className="about-stat-desc">MIT licensed, community-driven, and free forever</div>
          </div>
          <div className="about-stat">
            <span className="about-stat-icon" aria-hidden="true">⚡</span>
            <div className="about-stat-title">Instant Results</div>
            <div className="about-stat-desc">Generate comprehensive docs in seconds, not hours</div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="landing-section section-center">
        <div className="reveal" ref={addRevealRef}>
          <span className="section-label">Features</span>
          <h2 className="section-title">Everything you need for great docs</h2>
          <p className="section-subtitle">
            From README generation to API documentation, AutoDoc.ai covers the
            full spectrum of project documentation needs.
          </p>
        </div>

        <div className="features-grid reveal-group" ref={addRevealRef}>
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon" aria-hidden="true">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="landing-section section-center">
        <div className="reveal" ref={addRevealRef}>
          <span className="section-label">How It Works</span>
          <h2 className="section-title">Three steps to better documentation</h2>
          <p className="section-subtitle">
            No complicated setup. No configuration. Just paste a URL and let AI
            do the heavy lifting.
          </p>
        </div>

        <div className="steps-container reveal-group" ref={addRevealRef}>
          {STEPS.map((s) => (
            <div className="step-card" key={s.num}>
              <div className="step-number">{s.num}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== PRODUCT PREVIEW ==================== */}
      <section id="preview" className="landing-section">
        <div className="section-center reveal" ref={addRevealRef}>
          <span className="section-label">Product Preview</span>
          <h2 className="section-title">See it in action</h2>
          <p className="section-subtitle">
            A familiar workspace interface — paste a repo URL, hit generate, and
            watch the documentation appear in real-time.
          </p>
        </div>

        <div className="preview-container reveal" ref={addRevealRef}>
          <div className="preview-header">
            <span className="terminal-dot terminal-dot--red" />
            <span className="terminal-dot terminal-dot--yellow" />
            <span className="terminal-dot terminal-dot--green" />
            <div className="preview-tabs">
              <span className="preview-tab preview-tab--active">Generator</span>
              <span className="preview-tab">Preview</span>
            </div>
          </div>
          <div className="preview-body">
            <div className="preview-input">
              <div className="preview-input-label">Repository URL</div>
              <div className="preview-input-field">https://github.com/abhro05/AutoDoc.ai</div>
              <div className="preview-generate-btn">
                <span aria-hidden="true">⚡</span> Generate Documentation
              </div>
            </div>
            <div className="preview-output">
              <div className="preview-output-label">Generated Output</div>
              <div className="preview-output-code">
                <span className="code-heading"># AutoDoc.ai</span>{"\n\n"}
                <span className="code-badge">![MIT License](https://img.shields.io/badge/license-MIT-green)</span>{"\n\n"}
                {"AI-powered documentation generator that creates\nproduction-ready docs from your GitHub repository.\n\n"}
                <span className="code-heading">## 🚀 Quick Start</span>{"\n\n"}
                {"```bash\ngit clone https://github.com/abhro05/AutoDoc.ai\ncd AutoDoc.ai && npm install\nnpm run dev\n```\n\n"}
                <span className="code-heading">## ✨ Features</span>{"\n\n"}
                {"- AI-powered README generation\n- CONTRIBUTING guide generator\n- Live markdown preview\n- One-click export"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TECH STACK ==================== */}
      <section id="tech-stack" className="landing-section section-center">
        <div className="reveal" ref={addRevealRef}>
          <span className="section-label">Tech Stack</span>
          <h2 className="section-title">Built with modern technologies</h2>
          <p className="section-subtitle">
            Powered by a robust stack designed for performance, developer
            experience, and reliability.
          </p>
        </div>

        <div className="tech-grid reveal-group" ref={addRevealRef}>
          {TECH_STACK.map((t) => (
            <div className="tech-item" key={t.name}>
              <span className="tech-icon" aria-hidden="true">{t.icon}</span>
              <span className="tech-name">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== OPEN SOURCE ==================== */}
      <section id="open-source" className="landing-section">
        <div className="section-center reveal" ref={addRevealRef}>
          <span className="section-label">Open Source</span>
          <h2 className="section-title">Built by the community, for the community</h2>
          <p className="section-subtitle">
            AutoDoc.ai is proudly open source. Join us in building the future of
            automated documentation.
          </p>
        </div>

        <div className="opensource-content reveal" ref={addRevealRef}>
          <div className="opensource-text">
            <p>
              We believe great developer tools should be free and accessible to
              everyone. AutoDoc.ai is licensed under MIT and welcomes
              contributions from developers at every level.
            </p>
            <div className="opensource-highlights">
              <div className="opensource-highlight">
                <span className="opensource-highlight-icon" aria-hidden="true">📄</span>
                MIT License — use it anywhere
              </div>
              <div className="opensource-highlight">
                <span className="opensource-highlight-icon" aria-hidden="true">🏷️</span>
                Beginner-friendly issues available
              </div>
              <div className="opensource-highlight">
                <span className="opensource-highlight-icon" aria-hidden="true">📖</span>
                Comprehensive contribution guide
              </div>
              <div className="opensource-highlight">
                <span className="opensource-highlight-icon" aria-hidden="true">🎉</span>
                Active in SSoC &amp; open-source events
              </div>
            </div>
          </div>

          <div className="opensource-card">
            <h3 className="opensource-card-title">Start Contributing Today</h3>
            <p className="opensource-card-desc">
              Check out the repository, pick an issue, and make your first pull
              request. Every contribution matters.
            </p>
            <div className="opensource-stats">
              <div className="opensource-stat-item">
                <span className="opensource-stat-value">MIT</span>
                <span className="opensource-stat-label">License</span>
              </div>
              <div className="opensource-stat-item">
                <span className="opensource-stat-value">∞</span>
                <span className="opensource-stat-label">Free forever</span>
              </div>
            </div>
            <a
              href="https://github.com/abhro05/AutoDoc.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              id="opensource-cta"
            >
              <GitHubIcon className="btn-icon" />
              View Repository
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="landing-section section-center">
        <div className="reveal" ref={addRevealRef}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-subtitle">
            Got questions? We&apos;ve got answers. If you can&apos;t find what
            you&apos;re looking for, feel free to open a GitHub issue.
          </p>
        </div>

        <div className="faq-list reveal-group" ref={addRevealRef}>
          {FAQS.map((faq) => (
            <details className="faq-item" key={faq.q}>
              <summary>
                {faq.q}
                <ChevronDown className="faq-chevron" />
              </summary>
              <div className="faq-answer">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="cta-section" aria-label="Call to action">
        <div className="cta-banner reveal" ref={addRevealRef}>
          <h2 className="cta-title">Ready to automate your documentation?</h2>
          <p className="cta-desc">
            Join developers who are saving hours of manual writing with
            AI-powered documentation generation.
          </p>
          <div className="cta-buttons">
            {user ? (
              <Link to="/generator" className="btn btn-primary" id="cta-try">
                Open Generator <ArrowRight className="btn-icon" />
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary" id="cta-try">
                Try AutoDoc.ai Free <ArrowRight className="btn-icon" />
              </Link>
            )}
            <a
              href="https://github.com/abhro05/AutoDoc.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              id="cta-contribute"
            >
              <GitHubIcon className="btn-icon" />
              Contribute on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ==================== LANDING FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div className="footer-brand-name">AutoDoc.ai</div>
              <p className="footer-brand-desc">
                AI-powered documentation generator that transforms GitHub
                repositories into production-ready docs.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="footer-column-title">Product</div>
              <div className="footer-links">
                <Link to="/generator" className="footer-link">Generator</Link>
                <Link to="/contributors" className="footer-link">Contributors</Link>
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <div className="footer-column-title">Resources</div>
              <div className="footer-links">
                <a href="https://github.com/abhro05/AutoDoc.ai" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
                <a href="https://github.com/abhro05/AutoDoc.ai/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="footer-link">Documentation</a>
                <a href="https://github.com/abhro05/AutoDoc.ai/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="footer-link">Contributing</a>
                <a href="#faq" className="footer-link">FAQ</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="footer-column-title">Legal</div>
              <div className="footer-links">
                <a href="https://github.com/abhro05/AutoDoc.ai/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="footer-link">MIT License</a>
                <a href="https://github.com/abhro05/AutoDoc.ai/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer" className="footer-link">Code of Conduct</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span className="footer-copy">© {currentYear} AutoDoc.ai — Maintained by abhro05</span>
            <div className="footer-bottom-links">
              <a href="https://github.com/abhro05/AutoDoc.ai" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">GitHub</a>
              <a href="https://github.com/abhro05/AutoDoc.ai/issues" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">Issues</a>
              <a href="https://github.com/abhro05/AutoDoc.ai/pulls" target="_blank" rel="noopener noreferrer" className="footer-bottom-link">Pull Requests</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;