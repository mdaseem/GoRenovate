import React from "react";
import styles from "./HomePage.module.css";
import Link from "next/link";

const categories = [
  {
    id: 1,
    title: "Full Home Renovation",
    description: "Complete transformation from concept to completion",
    icon: "🏠",
    tag: "Most Popular",
  },
  {
    id: 2,
    title: "Kitchen",
    description: "Modern kitchens built for how you live",
    icon: "🍳",
    tag: null,
  },
  {
    id: 3,
    title: "Bathroom",
    description: "Spa-inspired retreats tailored to you",
    icon: "🚿",
    tag: null,
  },
  {
    id: 4,
    title: "Living Room",
    description: "Spaces designed to bring people together",
    icon: "🛋️",
    tag: null,
  },
  {
    id: 5,
    title: "Bedroom",
    description: "Restful sanctuaries crafted with care",
    icon: "🛏️",
    tag: null,
  },
  {
    id: 6,
    title: "Painting",
    description: "Colour stories that define your identity",
    icon: "🎨",
    tag: null,
  },
  {
    id: 7,
    title: "Flooring",
    description: "Premium surfaces that ground every room",
    icon: "🪵",
    tag: null,
  },
  {
    id: 8,
    title: "Repairs",
    description: "Fast, reliable fixes you can count on",
    icon: "🔧",
    tag: "Quick Turnaround",
  },
  {
    id: 9,
    title: "Smart Home",
    description: "Intelligent living through seamless tech",
    icon: "💡",
    tag: "New",
  },
  {
    id: 10,
    title: "Balcony Renovation",
    description: "Outdoor extensions of your personal style",
    icon: "🌿",
    tag: null,
  },
  {
    id: 11,
    title: "Terrace Renovation",
    description: "Open-air living elevated to its fullest",
    icon: "☀️",
    tag: null,
  },
];

const stats = [
  { value: "2,400+", label: "Projects Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "12+", label: "Years of Expertise" },
  { value: "180+", label: "Design Specialists" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Bengaluru",
    quote:
      "They transformed our entire apartment in 6 weeks. The attention to detail was extraordinary.",
    rating: 5,
  },
  {
    name: "Rohan Mehta",
    location: "Mumbai",
    quote:
      "Our kitchen renovation exceeded every expectation. Functional, beautiful, on time.",
    rating: 5,
  },
  {
    name: "Ananya Iyer",
    location: "Chennai",
    quote:
      "The smart home integration was seamless. Best investment we've made for our home.",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className={styles.root}>
      <main>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroTexture} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.heroPill}>✦ Premium Home Renovation</p>
            <h1 className={styles.heroHeading}>
              Your Home,
              <br />
              <em>Reimagined.</em>
            </h1>
            <p className={styles.heroSub}>
              End-to-end renovation services built around your vision — from a
              single room to a full home transformation.
            </p>
            <div className={styles.heroActions}>
              <a href="#services" className={styles.ctaButton}>
                Explore Services
              </a>
              <a href="#work" className={styles.ghostButton}>
                View Our Work →
              </a>
            </div>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <span className={styles.heroCardDot} />
                <span className={styles.heroCardDot} />
                <span className={styles.heroCardDot} />
              </div>
              <div className={styles.heroCardLines}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.heroCardLine}
                    style={{ width: `${60 + Math.sin(i) * 30}%` }}
                  />
                ))}
              </div>
              <div className={styles.heroCardBadge}>
                ✦ Trusted by 2,400+ homes
              </div>
            </div>
          </div>
          <div className={styles.heroDivider} aria-hidden="true" />
        </section>

        {/* STATS */}
        <section className={styles.statsBar} id="about">
          <div className={styles.statsInner}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className={styles.services} id="services">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>What We Do</span>
            <h2 className={styles.sectionTitle}>
              Every Space, <em>Every Need</em>
            </h2>
            <p className={styles.sectionSub}>
              Choose from our full suite of renovation services, each delivered
              with the same obsessive commitment to quality.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link
                // href={`#${cat.title.toLowerCase().replace(/\s+/g, "-")}`}
                href={"/products"}
                key={cat.id}
                className={styles.categoryCard}
              >
                {cat.tag && <span className={styles.cardTag}>{cat.tag}</span>}
                <span className={styles.cardIcon}>{cat.icon}</span>
                <h3 className={styles.cardTitle}>{cat.title}</h3>
                <p className={styles.cardDesc}>{cat.description}</p>
                <span className={styles.cardArrow}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section className={styles.process} id="work">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>How It Works</span>
            <h2 className={styles.sectionTitle}>
              Simple Process, <em>Stunning Results</em>
            </h2>
          </div>
          <div className={styles.processSteps}>
            {[
              {
                step: "01",
                title: "Consultation",
                desc: "We understand your vision, lifestyle, and budget in a free 30-min call.",
              },
              {
                step: "02",
                title: "Design & Quote",
                desc: "Our designers craft a detailed plan with transparent pricing — no surprises.",
              },
              {
                step: "03",
                title: "Execution",
                desc: "Our vetted craftsmen bring the design to life with precision and care.",
              },
              {
                step: "04",
                title: "Handover",
                desc: "We do a final walkthrough together and ensure you love every detail.",
              },
            ].map((item) => (
              <div key={item.step} className={styles.processCard}>
                <span className={styles.processStep}>{item.step}</span>
                <h3 className={styles.processTitle}>{item.title}</h3>
                <p className={styles.processDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className={styles.testimonials} id="testimonials">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Client Stories</span>
            <h2 className={styles.sectionTitle}>
              Homes Weve <em>Transformed</em>
            </h2>
          </div>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((t) => (
              <div key={t.name} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>
                  {"★".repeat(t.rating)}
                </div>
                <p className={styles.testimonialQuote}>{`"${t.quote}"`}</p>
                <div className={styles.testimonialAuthor}>
                  <span className={styles.testimonialAvatar}>{t.name[0]}</span>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className={styles.ctaBanner} id="estimate">
          <div className={styles.ctaBannerInner}>
            <span className={styles.ctaBannerEyebrow}>Ready to Begin?</span>
            <h2 className={styles.ctaBannerTitle}>
              Lets Build Something <em>Beautiful</em>
            </h2>
            <p className={styles.ctaBannerSub}>
              Get a free, no-obligation estimate tailored to your space and
              goals. Most projects get back to you within 24 hours.
            </p>
            <Link href="#contact" className={styles.ctaButton}>
              Get Your Free Estimate
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer} id="contact">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>R</span>
              <span className={styles.logoText}>Renovare</span>
            </Link>
            <p className={styles.footerTagline}>
              Crafting beautiful homes across India since 2012.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Services</h4>
              <a href="#">Full Renovation</a>
              <a href="#">Kitchen</a>
              <a href="#">Bathroom</a>
              <a href="#">Smart Home</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Our Work</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Contact</h4>
              <a href="mailto:hello@renovare.in">hello@renovare.in</a>
              <a href="tel:+918000000000">+91 80 0000 0000</a>
              <a href="#">Bengaluru, India</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>
            © {new Date().getFullYear()} Renovare. All rights reserved.
          </span>
          <div className={styles.footerLegal}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
