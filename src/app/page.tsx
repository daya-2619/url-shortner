'use client';

import { useState, useEffect } from 'react';

interface HistoryItem {
  shortUrl: string;
  originalUrl: string;
}

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // History state tracking
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // FAQ Accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('url_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load history', err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');
    setCopied(false);

    try {
      const res = await fetch('/api/urls/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Failed to shorten URL');
      }

      const baseUrl = process.env.NEXT_PUBLIC_SHORT_URL_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
      const fullShortUrl = `${baseUrl}/${data.shortUrl}`;
      
      setShortUrl(fullShortUrl);

      // Save to localStorage history
      const updatedHistory = [{ shortUrl: fullShortUrl, originalUrl: longUrl }, ...history.filter(item => item.shortUrl !== fullShortUrl)].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem('url_history', JSON.stringify(updatedHistory));
      
      setLongUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number | null = null) => {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== null) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('url_history');
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "How does the URL redirect work?",
      a: "When a user visits your shortened URL, our high-speed edge handler checks our Upstash Redis cache first. If found, it instantly redirects the user. If it's a cache miss, it resolves the destination from the Neon PostgreSQL database, updates the cache, increments the analytics count, and redirects—all in a fraction of a second."
    },
    {
      q: "What database and caching tech do you use?",
      a: "Our backend utilizes Neon Database, a serverless PostgreSQL hosting provider, for durable storage of your mappings and analytics. For caching, we run Upstash serverless Redis to deliver global sub-millisecond lookups."
    },
    {
      q: "Is there a limit on shortening URLs?",
      a: "There are no limits on the number of URLs you can shorten. However, to prevent abuse and spam, our API endpoints have a built-in rate limit of 10 shorten requests per minute per IP address."
    }
  ];

  return (
    <>
      {/* Background decoration glow elements */}
      <div className="bg-glow-sphere-1"></div>
      <div className="bg-glow-sphere-2"></div>

      {/* Header / Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">
            <svg className="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>ShortLink</span>
          </a>
          <nav>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#history">Recent Links</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="https://url-shortner-aipb.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="nav-btn">API Docs</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge">
            <span className="badge-dot"></span>
            <span>Fast Edge Analytics Active</span>
          </div>
          <h1>Shorten Your Links.<br />Track Performance.</h1>
          <p>Create clean, memorable links in seconds. Benefit from sub-millisecond edge caching and asynchronous analytics delivery.</p>
        </section>

        {/* Shortener Widget */}
        <section className="shortener-container">
          <div className="glass-card">
            <form onSubmit={handleSubmit} className="form-group">
              <div className="input-wrapper">
                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                  type="url"
                  required
                  placeholder="Paste your long destination URL here..."
                  className="url-input"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading || !longUrl}>
                {loading ? <div className="spinner"></div> : 'Shorten'}
              </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {shortUrl && (
              <div className="result-container">
                <div className="result-header">
                  <div className="result-label">
                    <svg className="result-label-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Shortened successfully</span>
                  </div>
                </div>
                <div className="result-body">
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url-link">
                    {shortUrl}
                  </a>
                  <button onClick={() => handleCopy(shortUrl)} className="btn-secondary">
                    {copied ? (
                      <>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* History Tracker */}
        <section id="history" className="history-section">
          <div className="history-title-row">
            <h2 className="history-title">Recent shortened links</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">Clear all</button>
            )}
          </div>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((item, index) => {
                // Extract short ID to link to analytics
                const parts = item.shortUrl.split('/');
                const shortId = parts[parts.length - 1];
                const analyticsUrl = `https://url-shortner-aipb.onrender.com/api/analytics/${shortId}`;
                
                return (
                  <div className="history-card" key={index}>
                    <div className="history-urls">
                      <a href={item.shortUrl} target="_blank" rel="noopener noreferrer" className="history-short">
                        {item.shortUrl}
                      </a>
                      <div className="history-long">{item.originalUrl}</div>
                    </div>
                    <div className="history-actions">
                      <button onClick={() => handleCopy(item.shortUrl, index)} className="copy-mini-btn" title="Copy to clipboard">
                        {copiedIndex === index ? (
                          <svg viewBox="0 0 24 24" stroke="#10b981">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2h2a2 2 0 002 2" />
                          </svg>
                        )}
                      </button>
                      <a href={analyticsUrl} target="_blank" rel="noopener noreferrer" className="analytics-link" title="View live analytics">
                        <svg viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-history">
                Shorten a link to see it listed here in your history.
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="section-header">
            <h2>Fast. Transparent. Secure.</h2>
            <p>Designed to scale and execute redirection mappings at sub-millisecond edge speed.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3>Sub-millisecond Speed</h3>
              <p>Uses an optimized Upstash Redis read-through cache to redirect users instantaneously.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3>Real-time Analytics</h3>
              <p>Atomic counters keep track of link click analytics asynchronously without impacting redirect speed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3>Security Out-of-the-Box</h3>
              <p>Armed with slowapi rate-limiting controls to shield your backend from API spam or brute force attacks.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our link-shortening ecosystem.</p>
          </div>
          <div className="faq-list">
            {faqItems.map((item, index) => (
              <div className="faq-item" key={index}>
                <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                  <span className="faq-question">{item.q}</span>
                  <svg className={`faq-chevron ${activeFaq === index ? 'active' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`faq-answer ${activeFaq === index ? 'active' : ''}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div>© {new Date().getFullYear()} ShortLink. Built with Next.js, FastAPI, Upstash, and Neon.</div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#history">Recent Links</a>
            <a href="#faq">FAQ</a>
            <a href="https://github.com/daya-2619/url-shortner" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}
