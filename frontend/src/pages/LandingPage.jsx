import React, { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import * as THREE from 'three';
import Lenis from 'lenis';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export default function LandingPage() {
  const containerRef = useRef();
  const lenisRef = useRef();
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useGSAP(() => {
    // 1. Setup Lenis
    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // 2. Navigation Scroll State
    const updateNav = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', updateNav);

    const mm = gsap.matchMedia();

    // 3. Desktop Animations (WebGL, Pinned Sections)
    mm.add('(min-width: 768px)', () => {
      // Hero WebGL
      const heroCanvas = document.getElementById('hero-canvas');
      let heroRenderer, heroScene, heroCamera, heroParticles;
      if (heroCanvas) {
        heroScene = new THREE.Scene();
        heroCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        heroCamera.position.z = 5;

        heroRenderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
        heroRenderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.BufferGeometry();
        const count = 2000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 20;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
          color: 0x1a5cf5,
          size: 0.015,
          transparent: true,
          opacity: 0.4
        });

        heroParticles = new THREE.Points(geometry, material);
        heroScene.add(heroParticles);

        const renderHero = () => {
          if (heroParticles) heroParticles.rotation.y += 0.0003;
          heroRenderer.render(heroScene, heroCamera);
        };
        gsap.ticker.add(renderHero);

        const onMouseMove = (e) => {
          gsap.to(heroParticles.rotation, {
            x: -(e.clientY / window.innerHeight) * 0.3,
            y: (e.clientX / window.innerWidth) * 0.3,
            duration: 1
          });
        };
        window.addEventListener('mousemove', onMouseMove);

        const onResize = () => {
          heroCamera.aspect = window.innerWidth / window.innerHeight;
          heroCamera.updateProjectionMatrix();
          heroRenderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
      }

      // Final CTA WebGL
      const ctaCanvas = document.getElementById('cta-canvas');
      let ctaRenderer, ctaScene, ctaCamera, ctaMesh;
      if (ctaCanvas) {
        ctaScene = new THREE.Scene();
        ctaCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        ctaCamera.position.z = 5;

        ctaRenderer = new THREE.WebGLRenderer({ canvas: ctaCanvas, alpha: true, antialias: true });
        ctaRenderer.setSize(window.innerWidth, window.innerHeight);

        const planeGeo = new THREE.PlaneGeometry(20, 20);
        const planeMat = new THREE.MeshBasicMaterial({
          color: 0x1a5cf5,
          transparent: true,
          opacity: 0.04
        });
        ctaMesh = new THREE.Mesh(planeGeo, planeMat);
        ctaScene.add(ctaMesh);

        const renderCta = () => {
          if (ctaMesh) {
            ctaMesh.rotation.z += 0.001;
            ctaMesh.scale.x = 1 + Math.sin(Date.now() * 0.001) * 0.1;
            ctaMesh.scale.y = 1 + Math.cos(Date.now() * 0.001) * 0.1;
          }
          ctaRenderer.render(ctaScene, ctaCamera);
        };
        gsap.ticker.add(renderCta);
      }

      // Pinned How it works
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#how-it-works',
          start: 'top top',
          end: '+=400%',
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        }
      });
      tl.to('.step-indicator-1', { color: 'var(--blue-primary)' }, 0)
        .to('.step-title-1', { color: 'var(--text-primary)' }, 0)
        .to('.step-panel-1', { autoAlpha: 1 }, 0)
        
        .to('.step-line', { scaleY: 0.33, duration: 1 }, 'step2')
        .to('.step-indicator-1', { color: 'var(--text-dimmed)' }, 'step2')
        .to('.step-title-1', { color: 'var(--text-secondary)' }, 'step2')
        .to('.step-panel-1', { autoAlpha: 0 }, 'step2')
        .to('.step-indicator-2', { color: 'var(--blue-primary)' }, 'step2')
        .to('.step-title-2', { color: 'var(--text-primary)' }, 'step2')
        .to('.step-panel-2', { autoAlpha: 1 }, 'step2')

        .to('.step-line', { scaleY: 0.66, duration: 1 }, 'step3')
        .to('.step-indicator-2', { color: 'var(--text-dimmed)' }, 'step3')
        .to('.step-title-2', { color: 'var(--text-secondary)' }, 'step3')
        .to('.step-panel-2', { autoAlpha: 0 }, 'step3')
        .to('.step-indicator-3', { color: 'var(--blue-primary)' }, 'step3')
        .to('.step-title-3', { color: 'var(--text-primary)' }, 'step3')
        .to('.step-panel-3', { autoAlpha: 1 }, 'step3')

        .to('.step-line', { scaleY: 1, duration: 1 }, 'step4')
        .to('.step-indicator-3', { color: 'var(--text-dimmed)' }, 'step4')
        .to('.step-title-3', { color: 'var(--text-secondary)' }, 'step4')
        .to('.step-panel-3', { autoAlpha: 0 }, 'step4')
        .to('.step-indicator-4', { color: 'var(--blue-primary)' }, 'step4')
        .to('.step-title-4', { color: 'var(--text-primary)' }, 'step4')
        .to('.step-panel-4', { autoAlpha: 1 }, 'step4');

      return () => {
        if (heroRenderer) heroRenderer.dispose();
        if (ctaRenderer) ctaRenderer.dispose();
      };
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // SplitText Reveal for Headings
      const headings = gsap.utils.toArray('.section-heading');
      headings.forEach(heading => {
        const split = new SplitText(heading, { type: 'chars,words' });
        gsap.from(split.chars, {
          opacity: 0,
          y: 20,
          rotateX: -20,
          stagger: 0.025,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            once: true
          }
        });
      });

      // SplitText Reveal for Why SalesAgent lines
      const whyLines = gsap.utils.toArray('.why-paragraph');
      whyLines.forEach(p => {
        const split = new SplitText(p, { type: 'lines' });
        gsap.from(split.lines, {
          opacity: 0,
          y: 10,
          stagger: 0.03,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: p,
            start: 'top 90%',
            once: true
          }
        });
      });

      // Stats Counter
      const counters = gsap.utils.toArray('.stat-counter');
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        gsap.from(counter, {
          textContent: 0,
          duration: 1.8,
          ease: 'power2.out',
          snap: { textContent: target % 1 === 0 ? 1 : 0.1 },
          scrollTrigger: { trigger: counter, start: 'top 80%', once: true }
        });
      });

      // Feature Cards Batch Reveal
      ScrollTrigger.batch('.feature-card', {
        onEnter: (batch) => gsap.from(batch, {
          opacity: 0, y: 24, stagger: 0.06, duration: 0.5, ease: 'power2.out'
        }),
        start: 'top 88%',
        once: true
      });

      // Problem Cards Slide In
      gsap.from('.problem-card-left', {
        x: -40, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '#problem', start: 'top 70%', once: true }
      });
      gsap.from('.problem-card-right', {
        x: 40, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '#problem', start: 'top 70%', once: true }
      });

      // Hero Terminal Animation
      const heroLines = gsap.utils.toArray('.hero-term-line');
      if (heroLines.length > 0) {
        gsap.from(heroLines, {
          opacity: 0,
          clipPath: 'inset(0 100% 0 0)',
          stagger: 0.08,
          duration: 0.4,
          ease: 'power1.out',
          delay: 0.35
        });
      }

      // Feature Cards Magnetic Hover
      const cards = document.querySelectorAll('.feature-card');
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(card, { x: x * 0.06, y: y * 0.06, duration: 0.3, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        });
      });
    });

    // Intersection Observer for scroll-spy
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { threshold: 0.3 });
    sections.forEach(sec => observer.observe(sec));

    return () => {
      window.removeEventListener('scroll', updateNav);
      lenis.destroy();
      observer.disconnect();
    };
  }, { scope: containerRef });

  const scrollTo = (id) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(id);
    }
  };

  const handlePricingToggle = () => {
    gsap.to('.price-val', {
      opacity: 0, duration: 0.1, onComplete: () => {
        setBillingAnnual(!billingAnnual);
        gsap.to('.price-val', { opacity: 1, duration: 0.2 });
      }
    });
  };

  const handleStepClick = (step) => {
    gsap.to('.docs-panel', {
      opacity: 0, y: -8, duration: 0.15, onComplete: () => {
        setActiveStep(step);
        gsap.fromTo('.docs-panel', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.15 });
      }
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    gsap.to('.contact-form-field', {
      opacity: 0, y: -8, stagger: 0.03, duration: 0.2, onComplete: () => {
        setFormSubmitted(true);
        gsap.fromTo('.contact-success', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 });
      }
    });
  };

  return (
    <div ref={containerRef} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '60px',
        background: isScrolled ? 'rgba(8,10,15,0.92)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: isScrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.25s ease',
        display: 'flex', justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '1100px', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>SalesAgent</div>
          <div className="hidden md:flex gap-6 items-center">
            {['features', 'pricing', 'docs'].map(id => (
              <button key={id} onClick={() => scrollTo(`#${id}`)} style={{
                fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer',
                color: activeSection === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                position: 'relative'
              }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
                {activeSection === id && <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--blue-primary)' }} />}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" className="hidden md:block" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/login" className="sa-btn-primary" style={{ textDecoration: 'none' }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: '60px' }}>
        <canvas id="hero-canvas" className="hidden md:block" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ maxWidth: '1100px', width: '100%', padding: '0 24px', position: 'relative', zIndex: 1, display: 'flex', gap: '40px', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 55%' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '24px' }} className="hero-overline">
              COLD EMAIL OUTREACH
            </div>
            <h1 className="section-heading" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '24px' }}>
              Cold emails that read<br/>like <span style={{ color: 'var(--blue-primary)' }}>you</span> wrote them.
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '480px', marginBottom: '32px' }}>
              SalesAgent researches your leads, finds the right angle, and writes 3 personalized variants — in the tone that actually converts. Powered by Gemini. Sent from Gmail.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/login" className="sa-btn-primary" style={{ textDecoration: 'none' }}>Start for free</Link>
              <button onClick={() => scrollTo('#how-it-works')} className="sa-btn-ghost">See how it works</button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Free tier available. No credit card required.</div>
          </div>

          <div className="hidden md:block" style={{ flex: '1 1 45%' }}>
            <div style={{ background: '#060810', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '32px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3a3a3a' }} />
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3a3a3a' }} />
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3a3a3a' }} />
              </div>
              <div style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}>
                <div className="hero-term-line" style={{ color: 'var(--text-primary)' }}>Company Research — Stripe, Inc.</div>
                <div className="hero-term-line" style={{ borderBottom: '1px solid var(--border-subtle)', width: '100%', marginBottom: '12px' }} />
                <div className="hero-term-line" style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Stage</span><span style={{ color: 'var(--text-secondary)' }}>growth_stage</span></div>
                <div className="hero-term-line" style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Best angle</span><span style={{ color: 'var(--text-secondary)' }}>API-first infrastructure play</span></div>
                <div className="hero-term-line" style={{ display: 'flex', marginBottom: '20px' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Pain points</span><span style={{ color: 'var(--text-secondary)' }}>developer experience, uptime SLAs</span></div>
                
                <div className="hero-term-line" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Generating 3 variants...</div>
                
                <div className="hero-term-line"><span style={{ color: 'var(--blue-primary)' }}>▸</span> Friendly</div>
                <div className="hero-term-line" style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subject: Quick question about Stripe's API docs<br/>—</div>
                
                <div className="hero-term-line"><span style={{ color: 'var(--blue-primary)' }}>▸</span> Direct</div>
                <div className="hero-term-line" style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subject: Reducing integration time for Stripe SDKs<br/>—</div>
                
                <div className="hero-term-line"><span style={{ color: 'var(--blue-primary)' }}>▸</span> Curiosity</div>
                <div className="hero-term-line" style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Subject: How does Stripe think about dev onboarding?<br/>—</div>
                
                <div className="hero-term-line" style={{ color: 'var(--status-replied-text)' }}>3 emails generated in 14s ✓<span className="cursor" style={{ marginLeft: '4px', color: 'var(--text-primary)' }}>|</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div style={{ height: '56px', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '16px' }}>Used by sales teams, founders, and SDRs at companies like</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.02em' }}>
            Razorpay <span style={{ color: 'var(--text-dimmed)', margin: '0 8px' }}>·</span> Zepto <span style={{ color: 'var(--text-dimmed)', margin: '0 8px' }}>·</span> Groww <span style={{ color: 'var(--text-dimmed)', margin: '0 8px' }}>·</span> BrowserStack <span style={{ color: 'var(--text-dimmed)', margin: '0 8px' }}>·</span> Meesho <span style={{ color: 'var(--text-dimmed)', margin: '0 8px' }}>·</span> Chargebee
          </span>
        </div>
      </div>

      {/* Stats Section */}
      <section id="stats" style={{ padding: '48px 0', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}><span className="stat-counter" data-target="8.3">0</span>%</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average reply rate<br/>Campaigns using company enrichment</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}><span className="stat-counter" data-target="14">0</span>s</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Time to first email<br/>Per lead including research</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}><span className="stat-counter" data-target="3">0</span></div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email variants<br/>Friendly · Direct · Curiosity</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" style={{ padding: '120px 0', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', display: 'inline-block', marginBottom: '16px' }}>THE PROBLEM</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '24px' }}>
              Every AI email sounds<br/>the same. That's the problem.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.65 }}>
              Decision-makers receive hundreds of cold emails. They can spot AI-written copy in the first sentence. Long, structured, full of buzzwords — deleted before the second line.<br/><br/>
              The emails that get replies are short. Specific. They reference something real. They sound like a person who did their homework, not a prompt that said "write a cold email to a VP of Sales."
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="md:grid-cols-2 grid-cols-1">
            <div className="sa-card problem-card-left" style={{ padding: '24px', borderColor: 'rgba(252,129,129,0.2)' }}>
              <div style={{ fontSize: '10px', color: '#fc8181', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>WHAT GETS DELETED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(252,129,129,0.6)', background: 'rgba(252,129,129,0.04)', padding: '12px', borderRadius: '6px', lineHeight: 1.6 }}>
                Hi [First Name],<br/><br/>
                I hope this message finds you well! I wanted to reach out and introduce myself. We are a cutting-edge AI-powered solution that helps companies leverage their data to drive synergistic outcomes...<br/><br/>
                Would love to schedule a 30-minute discovery call at your earliest convenience.<br/><br/>
                Best regards,<br/>[Your Name]
              </div>
            </div>
            <div className="sa-card problem-card-right" style={{ padding: '24px', borderColor: 'rgba(52,211,153,0.2)' }}>
              <div style={{ fontSize: '10px', color: 'var(--status-replied-text)', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>WHAT GETS REPLIES</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--status-replied-text)', background: 'rgba(52,211,153,0.04)', padding: '12px', borderRadius: '6px', lineHeight: 1.6 }}>
                Subject: Razorpay's checkout latency — quick thought<br/><br/>
                Hey Harshil,<br/><br/>
                Saw the thread on latency spikes during UPI surges in Razorpay's engineering blog. We reduced checkout drop-offs 18% for a payments company with a similar stack — took 2 weeks.<br/><br/>
                Worth a 15-minute call?<br/><br/>
                — Arjun
              </div>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', marginTop: '24px' }}>
            The difference: research, specificity, brevity. SalesAgent automates all three.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ height: '100vh', background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', height: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '64px' }}>
          
          {/* Left Sticky Content */}
          <div style={{ flex: '1 1 50%' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '16px' }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '48px' }}>
              From lead to inbox<br/>in four steps.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
              <div className="step-line" style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: 'var(--blue-primary)', transformOrigin: 'top', transform: 'scaleY(0)' }} />
              
              {[1, 2, 3, 4].map((step) => (
                <div key={step} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div className={`step-indicator-${step}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '48px', color: step === 1 ? 'var(--blue-primary)' : 'var(--text-dimmed)', lineHeight: 1, backgroundColor: 'var(--bg-surface)' }}>0{step}</div>
                  <div>
                    <h3 className={`step-title-${step}`} style={{ fontSize: '20px', fontWeight: 500, color: step === 1 ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '8px' }}>
                      {step === 1 ? 'Import your leads' : step === 2 ? 'Gemini researches each company' : step === 3 ? 'Three personalized variants — instantly' : 'Preview, pick a tone, send'}
                    </h3>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {step === 1 && "Paste a Google Sheets URL, upload a CSV, or add leads manually. Any format with name, role, company, and email."}
                      {step === 2 && "Before writing a single word, SalesAgent uses Gemini with Google Search grounding to understand what the company does, what stage they're at, and what angle will resonate."}
                      {step === 3 && "Friendly, Direct, and Curiosity tones. Each one uses the research context. Each one sounds like it was written for that specific person, not generated from a template."}
                      {step === 4 && "Review every email before it goes out. Select the tone that fits your style. One click sends to your entire list from your own Gmail account."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Changing Content */}
          <div className="hidden md:block" style={{ flex: '1 1 50%', height: '400px', position: 'relative' }}>
            <div className="step-panel-1 sa-card" style={{ position: 'absolute', inset: 0, padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, visibility: 'visible', opacity: 1 }}>
              <div style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Google Sheets import<br/>URL: docs.google.com/...</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Parsing...</div>
              <div style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--status-replied-text)' }}>✓</span> 47 leads found</div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}><span style={{ color: 'var(--status-replied-text)' }}>✓</span> 2 duplicates skipped</div>
              <div style={{ color: 'var(--text-primary)' }}>Ready to generate</div>
            </div>

            <div className="step-panel-2 sa-card" style={{ position: 'absolute', inset: 0, padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, visibility: 'hidden', opacity: 0 }}>
              <div style={{ color: 'var(--text-primary)' }}>Researching: Chargebee</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Using: Gemini 2.5 Flash + Google Search</div>
              <div style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Stage:</span><span style={{ color: 'var(--text-secondary)' }}>growth_stage</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Industry:</span><span style={{ color: 'var(--text-secondary)' }}>SaaS / billing infrastructure</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Pain points:</span><span style={{ color: 'var(--text-secondary)' }}>dunning, failed payments,<br/>enterprise contracts</span></div>
              <div style={{ display: 'flex' }}><span style={{ color: 'var(--text-muted)', width: '120px' }}>Best angle:</span><span style={{ color: 'var(--text-secondary)' }}>revenue recovery automation</span></div>
            </div>

            <div className="step-panel-3 sa-card" style={{ position: 'absolute', inset: 0, padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, visibility: 'hidden', opacity: 0 }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>Generating 3 variants...</div>
              <div style={{ color: 'var(--text-primary)' }}><span style={{ color: 'var(--blue-primary)' }}>▸</span> Friendly</div>
              <div style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subject: Quick question about...<br/>—</div>
              <div style={{ color: 'var(--text-primary)' }}><span style={{ color: 'var(--blue-primary)' }}>▸</span> Direct</div>
              <div style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subject: Reducing integration time...<br/>—</div>
              <div style={{ color: 'var(--text-primary)' }}><span style={{ color: 'var(--blue-primary)' }}>▸</span> Curiosity</div>
              <div style={{ paddingLeft: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Subject: How does Stripe think about...<br/>—</div>
              <div style={{ color: 'var(--status-replied-text)' }}>3 emails generated in 14s ✓</div>
            </div>

            <div className="step-panel-4 sa-card" style={{ position: 'absolute', inset: 0, padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, visibility: 'hidden', opacity: 0 }}>
              <div style={{ color: 'var(--text-primary)' }}>Campaign: Fintech Founders - May</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Tone selected: Direct</div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Sending via gmail.com...</div>
              <div style={{ color: 'var(--text-secondary)' }}>&nbsp;&nbsp;1/47 <span style={{ color: 'var(--blue-primary)' }}>→</span> <span style={{ color: 'var(--status-replied-text)' }}>✓</span> harshil@chargebee.com</div>
              <div style={{ color: 'var(--text-secondary)' }}>&nbsp;&nbsp;2/47 <span style={{ color: 'var(--blue-primary)' }}>→</span> <span style={{ color: 'var(--status-replied-text)' }}>✓</span> kunal@razorpay.com</div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>&nbsp;&nbsp;3/47 <span style={{ color: 'var(--blue-primary)' }}>→</span> <span style={{ color: 'var(--status-replied-text)' }}>✓</span> ...</div>
              <div style={{ color: 'var(--text-primary)' }}>47 emails sent in 8s</div>
              <div style={{ color: 'var(--text-muted)' }}>Reply rate: tracking...</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" style={{ padding: '120px 0', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '16px' }}>PRODUCT</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Everything a serious<br/>outreach operation needs.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              { title: "Company research before every email", desc: "Gemini searches the web for each company before generating. Stage, pain points, recent news — all used to personalize the angle.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z M9 2v4 M2 9h4" },
              { title: "Import directly from Google Sheets", desc: "Paste any public Google Sheets URL. No CSV export, no copy-paste. Your sales team's workflow stays exactly the same.", icon: "M3 3h18v18H3V3z M3 9h18 M9 21V9" },
              { title: "Friendly, Direct, Curiosity — always three", desc: "Every lead gets three complete emails, each with a different tone and angle. Pick what fits the prospect or your style.", icon: "M4 6h16 M4 12h10 M4 18h14" },
              { title: "Structured output — no hallucinations", desc: "Uses Gemini's response_schema API, not just prompting. The output is contractually bound to be valid JSON. No parsing failures.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
              { title: "Bring your own API key", desc: "Your Gemini key, your Gmail credentials. SalesAgent never sees your emails. Keys are encrypted at rest with AES-128.", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
              { title: "Automatic tone-shifted follow-ups", desc: "Leads who don't reply get a follow-up in a different tone. Friendly → Curiosity. Direct → Friendly. Curiosity → Direct.", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
              { title: "Track which tone converts", desc: "The dashboard shows reply rates by tone across all campaigns. Over time, you learn what works for your audience.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { title: "Credentials encrypted at rest", desc: "SMTP passwords and API keys are encrypted with Fernet (AES-128-CBC + HMAC-SHA256) before touching the database.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }
            ].map((feature, i) => (
              <div key={i} className="sa-card feature-card" style={{ padding: '24px', transition: 'background 0.15s, border-color 0.15s' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={feature.icon} /></svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: '6px' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SalesAgent */}
      <section id="why" style={{ padding: '120px 0', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '16px' }}>WHY SALESAGENT</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              The gap between AI output<br/>and human writing. Closed.
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '2px solid var(--blue-primary)', paddingLeft: '20px', marginBottom: '32px' }}>
                "Every AI email tool produces the same email. That's not a writing problem. That's a research problem."
              </div>
              <p className="why-paragraph" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                The people you're emailing are not idiots. A VP of Sales at a Series B company gets 40 cold emails a day. They know what ChatGPT output looks like. They delete it before finishing the first sentence.
              </p>
              <p className="why-paragraph" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                What gets a reply is specificity. "I read your blog post about your API latency issue." "I noticed your team expanded into APAC last quarter." Real context, real angle, real reason to respond.
              </p>
              <p className="why-paragraph" style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                SalesAgent adds that research layer automatically. Gemini uses Google Search grounding per lead — meaning it looks up the actual company, not just guesses from training data. That's the difference.
              </p>
            </div>

            <div style={{ flex: '1 1 400px' }}>
              <div className="sa-card" style={{ padding: '24px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>SalesAgent vs. the alternatives</h3>
                <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>Feature</th>
                      <th style={{ padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>SalesAgent</th>
                      <th style={{ padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>Generic AI</th>
                      <th style={{ padding: '12px 8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}>Instantly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { f: "Company research per lead", sa: "Yes", ga: "No", i: "Partial" },
                      { f: "Tone variants (3)", sa: "Yes", ga: "No", i: "No" },
                      { f: "Uses your Gmail", sa: "Yes", ga: "No", i: "Yes" },
                      { f: "BYOK (your API key)", sa: "Yes", ga: "No", i: "No" },
                      { f: "Readable by humans", sa: "Yes", ga: "Rarely", i: "No" },
                      { f: "Reply rate analytics", sa: "Yes", ga: "No", i: "Partial" }
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)' }}>
                        <td style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{row.f}</td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: 500, color: 'var(--status-replied-text)', borderBottom: '1px solid var(--border-subtle)' }}>{row.sa}</td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', color: row.ga === 'Rarely' ? '#f6ad55' : 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>{row.ga}</td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', color: row.i === 'Partial' ? '#f6ad55' : row.i === 'Yes' ? 'var(--status-replied-text)' : 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>{row.i}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '120px 0', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', display: 'inline-block', marginBottom: '16px' }}>PRICING</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
              One model. Four levels.<br/>Start free, scale when ready.
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>All plans use your own API keys (BYOK). We never store your emails.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '64px' }}>
            <button onClick={handlePricingToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: !billingAnnual ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: !billingAnnual ? 500 : 400 }}>Monthly</button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />
            <button onClick={handlePricingToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: billingAnnual ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: billingAnnual ? 500 : 400 }}>
              Annual <span style={{ color: 'var(--status-replied-text)', fontSize: '11px', marginLeft: '4px' }}>(save 20%)</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {/* Free */}
            <div className="sa-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>FREE</div>
              <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}>$0 <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>forever</span></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>No credit card required</p>
              <Link to="/login" className="sa-btn-ghost" style={{ textAlign: 'center', textDecoration: 'none', marginBottom: '32px' }}>Start free</Link>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['BYOK — Gemini only', 'Up to 20 emails / month', '3 tone variants per lead', 'Google Sheets import', 'Company enrichment (limited)'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-secondary)' }}><span style={{ width: '5px', height: '5px', background: 'var(--blue-primary)', marginTop: '6px', marginRight: '10px' }}/>{f}</div>)}
                {['Cannot edit email before sending', 'Rate-limited generation', 'No follow-up automation', 'No analytics'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-dimmed)' }}><span style={{ marginRight: '10px' }}>–</span>{f}</div>)}
              </div>
            </div>

            {/* Starter */}
            <div className="sa-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>STARTER</div>
              <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }} className="price-val">${billingAnnual ? '4' : '5'} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Billed {billingAnnual ? 'annually' : 'monthly'}, cancel anytime</p>
              <Link to="/login" className="sa-btn-ghost" style={{ textAlign: 'center', textDecoration: 'none', marginBottom: '32px' }}>Get Starter</Link>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Everything in Free', 'BYOK — any provider', 'Up to 200 emails / month', 'Editable emails before sending', 'Import your resume', 'Custom attachment support', 'Faster generation speed', 'Priority support'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-secondary)' }}><span style={{ width: '5px', height: '5px', background: 'var(--blue-primary)', marginTop: '6px', marginRight: '10px' }}/>{f}</div>)}
                {['No access to SalesAgent model', 'No automatic reply tracking'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-dimmed)' }}><span style={{ marginRight: '10px' }}>–</span>{f}</div>)}
              </div>
            </div>

            {/* Pro */}
            <div className="sa-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', borderColor: 'var(--border-accent)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--blue-subtle)', border: '1px solid var(--border-accent)', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: 'var(--blue-primary)', whiteSpace: 'nowrap' }}>Most Popular</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>PRO</div>
              <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }} className="price-val">${billingAnnual ? '8' : '10'} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Billed {billingAnnual ? 'annually' : 'monthly'}, cancel anytime</p>
              <Link to="/login" className="sa-btn-primary" style={{ textAlign: 'center', textDecoration: 'none', marginBottom: '32px' }}>Get Pro</Link>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Everything in Starter', 'BYOK + 100 generations / mo', 'SalesAgent domain model', 'Custom writing style', 'Email templates that convert', 'Automatic reply tracking', 'Detailed analytics', 'Unlimited generations with your key', 'Write-in-your-voice mode', 'CSV export'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-secondary)' }}><span style={{ width: '5px', height: '5px', background: 'var(--blue-primary)', marginTop: '6px', marginRight: '10px' }}/>{f}</div>)}
              </div>
            </div>

            {/* Enterprise */}
            <div className="sa-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>ENTERPRISE</div>
              <div style={{ fontSize: '40px', fontWeight: 600, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '4px' }}>Custom <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>/ year</span></div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>For teams of 5 or more</p>
              <button onClick={() => scrollTo('#contact')} className="sa-btn-ghost" style={{ textAlign: 'center', marginBottom: '32px' }}>Contact us</button>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Everything in Pro, for teams', 'Shared lead pools', 'Team analytics and attribution', 'Custom fine-tuned model', 'Dedicated onboarding', 'SLA guarantees', 'Custom integrations', 'Invoice billing'].map((f, i) => <div key={i} style={{ display: 'flex', color: 'var(--text-secondary)' }}><span style={{ width: '5px', height: '5px', background: 'var(--blue-primary)', marginTop: '6px', marginRight: '10px' }}/>{f}</div>)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', margin: '32px auto 0', textAlign: 'center' }}>
            All paid plans use your own API keys. We never make Gemini or OpenAI calls on your behalf without your key. Your emails are your business.
          </div>
        </div>
      </section>

      {/* Docs / Setup Guide */}
      <section id="docs" style={{ padding: '120px 0', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '16px' }}>SETUP GUIDE</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '48px' }}>
              From zero to first campaign<br/>in under 10 minutes.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { id: 1, title: 'Get a Gemini API key' },
                { id: 2, title: 'Set up Gmail App Password' },
                { id: 3, title: 'Import your first leads' },
                { id: 4, title: 'Run your first campaign' }
              ].map(step => (
                <button key={step.id} onClick={() => handleStepClick(step.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 0' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: activeStep === step.id ? 'var(--blue-primary)' : 'var(--bg-elevated)', color: activeStep === step.id ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 500 }}>{step.id}</div>
                  <div style={{ fontSize: '15px', color: activeStep === step.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeStep === step.id ? 500 : 400 }}>{step.title}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: '2 1 500px' }}>
            <div className="sa-card docs-panel" style={{ padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}>
              {activeStep === 1 && (
                <>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Getting your Gemini API key</div>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-secondary)' }}>1. Open: aistudio.google.com/app/apikey</div>
                  <div style={{ color: 'var(--text-secondary)' }}>2. Sign in with your Google account</div>
                  <div style={{ color: 'var(--text-secondary)' }}>3. Click "Create API key"</div>
                  <div style={{ color: 'var(--text-secondary)' }}>4. Copy the key (starts with AIza...)</div><br/>
                  <div style={{ color: 'var(--text-secondary)' }}>5. In SalesAgent <span style={{ color: 'var(--blue-primary)' }}>→</span> Settings <span style={{ color: 'var(--blue-primary)' }}>→</span> Gemini API Key</div>
                  <div style={{ color: 'var(--text-secondary)' }}>&nbsp;&nbsp;&nbsp;Paste your key and click Save</div><br/>
                  <div style={{ color: 'var(--text-muted)' }}>Free tier: 15 req/min · 1,500/day</div>
                  <div style={{ color: 'var(--text-muted)' }}>Paid tier: Higher limits with billing enabled</div><br/>
                  <div style={{ color: 'var(--text-muted)' }}>Note: Your key is encrypted before storage.<br/>We cannot read it.</div>
                </>
              )}
              {activeStep === 2 && (
                <>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Creating a Gmail App Password</div>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Important: This is NOT your Gmail password.<br/>It's a separate 16-character code.</div>
                  <div style={{ color: 'var(--text-secondary)' }}>1. Open: myaccount.google.com/security</div>
                  <div style={{ color: 'var(--text-secondary)' }}>2. Enable 2-Step Verification (if not already)</div>
                  <div style={{ color: 'var(--text-secondary)' }}>3. Search "App passwords" in the search bar</div>
                  <div style={{ color: 'var(--text-secondary)' }}>4. App name: SalesAgent</div>
                  <div style={{ color: 'var(--text-secondary)' }}>5. Copy the 16-character code</div><br/>
                  <div style={{ color: 'var(--text-secondary)' }}>In SalesAgent <span style={{ color: 'var(--blue-primary)' }}>→</span> Settings <span style={{ color: 'var(--blue-primary)' }}>→</span> Email Delivery</div>
                  <div style={{ color: 'var(--text-secondary)' }}>&nbsp;&nbsp;Email: your Gmail address</div>
                  <div style={{ color: 'var(--text-secondary)' }}>&nbsp;&nbsp;App Password: the 16-character code</div><br/>
                  <div style={{ color: 'var(--text-muted)' }}>You can revoke this at any time from Google.</div>
                </>
              )}
              {activeStep === 3 && (
                <>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Importing leads</div>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-secondary)' }}>Option A: Google Sheets</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>URL format: docs.google.com/spreadsheets/d/...</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Required columns: name, role, company, email</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Sheet must be public ("Anyone with link")</div><br/>
                  <div style={{ color: 'var(--text-secondary)' }}>Option B: CSV upload</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Same four columns required</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Max 1MB, up to 500 rows per upload</div><br/>
                  <div style={{ color: 'var(--text-secondary)' }}>Option C: Manual entry</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Add one lead at a time via the form</div><br/>
                  <div style={{ color: 'var(--text-muted)' }}>Duplicates are automatically skipped.</div>
                </>
              )}
              {activeStep === 4 && (
                <>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Running your first campaign</div>
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }} />
                  <div style={{ color: 'var(--text-secondary)' }}>1. Go to Campaigns</div>
                  <div style={{ color: 'var(--text-secondary)' }}>2. Name your campaign: "Batch 1 — Fintech Founders"</div>
                  <div style={{ color: 'var(--text-secondary)' }}>3. Select up to 50 leads</div>
                  <div style={{ color: 'var(--text-secondary)' }}>4. Click Generate</div><br/>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Gemini will:</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}><span style={{ color: 'var(--blue-primary)' }}>→</span> Research each company (Google Search grounding)</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}><span style={{ color: 'var(--blue-primary)' }}>→</span> Generate 3 email variants per lead</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}><span style={{ color: 'var(--blue-primary)' }}>→</span> Show you the AI's reasoning</div>
                  <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>Time: ~12 seconds per lead</div><br/>
                  <div style={{ color: 'var(--text-secondary)' }}>5. Review the emails and enrichment cards</div>
                  <div style={{ color: 'var(--text-secondary)' }}>6. Select a tone: Friendly / Direct / Curiosity</div>
                  <div style={{ color: 'var(--text-secondary)' }}>7. Click Send Campaign</div><br/>
                  <div style={{ color: 'var(--text-muted)' }}>Your emails go out from your Gmail account.</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 0', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
        <canvas id="cta-canvas" className="hidden md:block" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', marginBottom: '16px' }}>YOUR FIRST CAMPAIGN</div>
          <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: '24px' }}>
            The research is done.<br/>The email is written.<br/>You just hit send.
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 32px' }}>
            Start free. No credit card. Your first campaign takes less time than writing one email manually.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" className="sa-btn-primary" style={{ textDecoration: 'none' }}>Start free</Link>
            <button onClick={() => scrollTo('#docs')} className="sa-btn-ghost">Read the docs</button>
          </div>
        </div>
      </section>

      {/* Enterprise Contact Form */}
      <section id="contact" style={{ padding: '120px 0', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-accent)', paddingLeft: '10px', marginBottom: '16px' }}>ENTERPRISE</div>
            <h2 className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '24px' }}>
              Building a sales team?<br/>Let's talk.
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
              For teams of 5 or more. We offer custom model fine-tuning on your domain, shared lead management, team analytics, CRM integrations, and dedicated support.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
              Custom pricing based on team size, usage, and integrations required.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ borderLeft: '2px solid var(--blue-primary)', paddingLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>Custom Gemini model, fine-tuned on your product and ICP</div>
              <div style={{ borderLeft: '2px solid var(--blue-primary)', paddingLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>Team-level campaign management and attribution</div>
              <div style={{ borderLeft: '2px solid var(--blue-primary)', paddingLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>SLA guarantees and dedicated onboarding</div>
            </div>
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <div className="sa-card" style={{ padding: '28px', position: 'relative' }}>
              {!formSubmitted ? (
                <form onSubmit={handleFormSubmit}>
                  <div className="contact-form-field" style={{ marginBottom: '16px' }}>
                    <label className="sa-label">Name</label>
                    <input type="text" className="sa-input" required />
                  </div>
                  <div className="contact-form-field" style={{ marginBottom: '16px' }}>
                    <label className="sa-label">Work email</label>
                    <input type="email" className="sa-input" required />
                  </div>
                  <div className="contact-form-field" style={{ marginBottom: '16px' }}>
                    <label className="sa-label">Company</label>
                    <input type="text" className="sa-input" required />
                  </div>
                  <div className="contact-form-field" style={{ marginBottom: '16px' }}>
                    <label className="sa-label">Team size</label>
                    <select className="sa-input" required>
                      <option value="">Select size...</option>
                      <option value="5-15">5-15</option>
                      <option value="15-50">15-50</option>
                      <option value="50-200">50-200</option>
                      <option value="200+">200+</option>
                    </select>
                  </div>
                  <div className="contact-form-field" style={{ marginBottom: '24px' }}>
                    <label className="sa-label">Message</label>
                    <textarea className="sa-input" rows="4"></textarea>
                  </div>
                  <div className="contact-form-field">
                    <button type="submit" className="sa-btn-primary" style={{ width: '100%' }}>Send message</button>
                  </div>
                </form>
              ) : (
                <div className="contact-success" style={{ padding: '64px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>Message received.</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>We'll be in touch within 1 business day.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', padding: '40px 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>SalesAgent</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cold email outreach, done right.</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>PRODUCT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(link => <a key={link} href="#" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>{link}</a>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>RESOURCES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Docs', 'GitHub', 'Status'].map(link => <a key={link} href="#" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>{link}</a>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>LEGAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Privacy Policy', 'Terms of Service'].map(link => <a key={link} href="#" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>{link}</a>)}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2025 SalesAgent. All rights reserved.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Built for PromptWars — Google × Scaler</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
