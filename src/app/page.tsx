'use client';

import { useState } from 'react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
        throw new Error(data.error || 'Failed to shorten URL');
      }

      const baseUrl = process.env.NEXT_PUBLIC_SHORT_URL_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
      const fullShortUrl = `${baseUrl}/${data.shortUrl}`;
      setShortUrl(fullShortUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <main>
      <div className="hero">
        <h1>Shorten Your Links.</h1>
        <p>A fast, secure, and beautiful URL shortener with analytics tracking. Paste your long URL below to get started.</p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="input-group">
          <div className="input-wrapper">
            <input
              type="url"
              required
              placeholder="https://your-very-long-url.com/something"
              className="url-input"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !longUrl}>
            {loading ? <div className="spinner"></div> : 'Shorten URL'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {shortUrl && (
          <div className="result-container">
            <div className="result-label">Your shortened URL is ready</div>
            <div className="short-url">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                {shortUrl}
              </a>
            </div>
            <button onClick={handleCopy} className="btn-secondary">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
