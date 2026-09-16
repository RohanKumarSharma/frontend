"use client";

import { ArrowRight, MessageCircle, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span>
          NEXUS
        </Link>

        <div className="landing-nav-actions">
          <Link href="/login" className="nav-login">
            Login
          </Link>

          <Link href="/register" className="nav-signup">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-badge">
          <span />
          Real-time communication
        </div>

        <h1>
          Connect.
          <br />
          <span>Chat. Together.</span>
        </h1>

        <p>
          A modern social communication platform designed for meaningful
          conversations, real-time connections and communities.
        </p>

        <div className="hero-actions">
          <Link href="/register" className="primary-button">
            Start chatting
            <ArrowRight size={18} />
          </Link>

          <Link href="/login" className="secondary-button">
            Sign in
          </Link>
        </div>

        <div className="hero-features">
          <div>
            <Zap size={17} />
            Real-time
          </div>

          <div>
            <MessageCircle size={17} />
            Private chats
          </div>

          <div>
            <Shield size={17} />
            Secure
          </div>
        </div>
      </section>

      <div className="hero-preview">
        <div className="preview-topbar">
          <div className="preview-brand">
            <span className="brand-mark small">N</span>
            NEXUS
          </div>

          <div className="preview-dots">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="preview-body">
          <div className="preview-sidebar">
            <div className="preview-search">⌕ Search</div>

            <div className="preview-user active">
              <span className="avatar purple">R</span>
              <div>
                <strong>Rahul</strong>
                <small>See you tomorrow</small>
              </div>
            </div>

            <div className="preview-user">
              <span className="avatar blue">A</span>
              <div>
                <strong>Aman</strong>
                <small>Sounds good!</small>
              </div>
            </div>

            <div className="preview-user">
              <span className="avatar green">P</span>
              <div>
                <strong>Priya</strong>
                <small>Thanks 😊</small>
              </div>
            </div>
          </div>

          <div className="preview-chat">
            <div className="preview-chat-header">
              <span className="avatar purple">R</span>
              <div>
                <strong>Rahul Sharma</strong>
                <small>● Active now</small>
              </div>
            </div>

            <div className="preview-messages">
              <div className="preview-message received">
                Hey! Are you free today?
              </div>

              <div className="preview-message sent">
                Yeah, what's up?
              </div>

              <div className="preview-message received">
                Wanna work on the project?
              </div>

              <div className="preview-message sent">
                Sure! Let's do it 🔥
              </div>
            </div>

            <div className="preview-input">
              <span>Type a message...</span>
              <span>➤</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}