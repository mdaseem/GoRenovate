import React from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import styles from "./HomePage.module.css";
import Link from "next/link";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-body",
});

const categories = [
  {
    id: 1,
    title: "Full Home Renovation",
    description: "Complete transformation from concept to completion",
    icon: "🏠",
    tag: "Most Popular",
    categoryId: null,
  },
  {
    id: 2,
    title: "Kitchen",
    description: "Modern kitchens built for how you live",
    icon: "🍳",
    tag: null,
    categoryId: "kitchen",
  },
  {
    id: 3,
    title: "Bathroom",
    description: "Spa-inspired retreats tailored to you",
    icon: "🚿",
    tag: null,
    categoryId: "bathroom",
  },
  {
    id: 4,
    title: "Living Room",
    description: "Spaces designed to bring people together",
    icon: "🛋️",
    tag: null,
    categoryId: null,
  },
  {
    id: 5,
    title: "Bedroom",
    description: "Restful sanctuaries crafted with care",
    icon: "🛏️",
    tag: null,
    categoryId: null,
  },
  {
    id: 6,
    title: "Painting",
    description: "Colour stories that define your identity",
    icon: "🎨",
    tag: null,
    categoryId: "painting",
  },
  {
    id: 7,
    title: "Flooring",
    description: "Premium surfaces that ground every room",
    icon: "🪵",
    tag: null,
    categoryId: "flooring",
  },
  {
    id: 8,
    title: "Repairs",
    description: "Fast, reliable fixes you can count on",
    icon: "🔧",
    tag: "Quick Turnaround",
    categoryId: null,
  },
  {
    id: 9,
    title: "Smart Home",
    description: "Intelligent living through seamless tech",
    icon: "💡",
    tag: "New",
    categoryId: "smart-home",
  },
  {
    id: 10,
    title: "Balcony Renovation",
    description: "Outdoor extensions of your personal style",
    icon: "🌿",
    tag: null,
    categoryId: "outdoor",
  },
  {
    id: 11,
    title: "Terrace Renovation",
    description: "Open-air living elevated to its fullest",
    icon: "☀️",
    tag: null,
    categoryId: "outdoor",
  },
];

const rooms = [
  {
    slug: "living-room",
    title: "Living Room",
    description: "Sofas, coffee tables & lighting from top vendors",
    icon: "🛋️",
  },
  {
    slug: "bedroom",
    title: "Bedroom",
    description: "Beds, wardrobes & bedside decor, curated",
    icon: "🛏️",
  },
  {
    slug: "bathroom",
    title: "Bathroom",
    description: "Vanities, mirrors & fittings, ready to ship",
    icon: "🚿",
  },
  {
    slug: "kitchen",
    title: "Kitchen",
    description: "Dining sets, storage & lighting for the heart of your home",
    icon: "🍳",
  },
];

const paths = [
  {
    id: "renovate",
    variant: "renovate",
    badge: "Book a Vendor",
    icon: "🔧",
    title: "Renovate a Space",
    description:
      "Hire vetted vendors directly for your project — pick services, compare transparent pricing, and book painting, flooring, kitchens & more.",
    bullets: [
      "Compare verified vendors side-by-side",
      "Transparent, itemized pricing",
      "Free, no-obligation quotes in 24 hours",
    ],
    chips: [
      { label: "Kitchen", icon: "🍳", href: "/vendors/category/kitchen" },
      { label: "Bathroom", icon: "🚿", href: "/vendors/category/bathroom" },
      { label: "Painting", icon: "🎨", href: "/vendors/category/painting" },
      { label: "Flooring", icon: "🪵", href: "/vendors/category/flooring" },
    ],
    proof: "2,400+ projects completed · 98% client satisfaction",
    ctaLabel: "Browse Vendors",
    ctaHref: "/vendors",
  },
  {
    id: "rooms",
    variant: "rooms",
    badge: "New",
    icon: "🛋️",
    title: "Shop by Room",
    description:
      "Buy curated furniture & décor bundles for your space — mix pieces from top vendors in one cart, one checkout.",
    bullets: [
      "Curated bundles, ready to buy today",
      "Swap any piece for another vendor's pick",
      "One checkout, even across vendors",
    ],
    chips: [
      { label: "Living Room", icon: "🛋️", href: "/roomCategory/living-room" },
      { label: "Bedroom", icon: "🛏️", href: "/roomCategory/bedroom" },
      { label: "Bathroom", icon: "🚿", href: "/roomCategory/bathroom" },
      { label: "Kitchen", icon: "🍳", href: "/roomCategory/kitchen" },
    ],
    proof: "4 curated rooms · Ships from multiple vendors, one order",
    ctaLabel: "Browse Rooms",
    ctaHref: "/roomCategory",
  },
] as const;

const stats = [
  { value: "2,400+", label: "Projects Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "12+", label: "Years of Expertise" },
  { value: "180+", label: "Design Specialists" },
];

const renovateSteps = [
  {
    step: "01",
    title: "Browse & Compare",
    desc: "Explore verified vendors by category and compare their services, pricing & reviews side-by-side.",
  },
  {
    step: "02",
    title: "Add Services to Cart",
    desc: "Pick exactly what you need — one service or several — with prices itemized upfront, no hidden costs.",
  },
  {
    step: "03",
    title: "Checkout Instantly",
    desc: "Add your address and place the order in a few taps, even across multiple services.",
  },
  {
    step: "04",
    title: "Vendor Gets to Work",
    desc: "Your vendor confirms the booking and completes the job, with order tracking the whole way through.",
  },
];

const shopByRoomSteps = [
  {
    step: "01",
    title: "Browse Rooms",
    desc: "Explore curated Kitchen, Living Room, Bedroom & Bathroom bundles from vetted vendors.",
  },
  {
    step: "02",
    title: "Customize It",
    desc: "Swap any piece for another vendor's pick — your total updates instantly as you go.",
  },
  {
    step: "03",
    title: "One Checkout, Every Vendor",
    desc: "Add one address and place one order, even when your Room ships from several vendors.",
  },
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
    <div className={`${styles.root} ${playfairDisplay.variable} ${dmSans.variable}`}>
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

        {/* CHOOSE YOUR PATH */}
        <section className={styles.pathSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Two Ways to Shop</span>
            <h2 className={styles.sectionTitle}>
              How Would You Like to <em>Start?</em>
            </h2>
            <p className={styles.sectionSub}>
              Hiring a vendor for a full project, or furnishing a room with
              pieces you can buy today — pick your path below.
            </p>
          </div>

          <div className={styles.pathGrid}>
            {paths.map((path) => (
              <article
                key={path.id}
                className={`${styles.pathCard} ${styles[`pathCard--${path.variant}`]}`}
              >
                <span className={styles.pathBadge}>{path.badge}</span>
                <span className={styles.pathIcon} aria-hidden="true">
                  {path.icon}
                </span>
                <h3 className={styles.pathTitle}>{path.title}</h3>
                <p className={styles.pathDesc}>{path.description}</p>

                <ul className={styles.pathBullets}>
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className={styles.pathBulletItem}>
                      <span aria-hidden="true">✓</span>
                      {bullet}
                    </li>
                  ))}
                </ul>

                <div className={styles.pathChips}>
                  {path.chips.map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      className={styles.pathChip}
                    >
                      <span aria-hidden="true">{chip.icon}</span>
                      {chip.label}
                    </Link>
                  ))}
                </div>

                <div className={styles.pathFooter}>
                  <Link href={path.ctaHref} className={styles.pathCta}>
                    {path.ctaLabel} →
                  </Link>
                  <p className={styles.pathProof}>{path.proof}</p>
                </div>
              </article>
            ))}
          </div>
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
                href={
                  cat.categoryId
                    ? `/vendors/category/${cat.categoryId}`
                    : "/vendors"
                }
                key={cat.id}
                className={styles.categoryCard}
              >
                {cat.tag && <span className={styles.cardTag}>{cat.tag}</span>}
                <span className={styles.cardIcon} aria-hidden="true">
                  {cat.icon}
                </span>
                <h3 className={styles.cardTitle}>{cat.title}</h3>
                <p className={styles.cardDesc}>{cat.description}</p>
                <span className={styles.cardArrow}>→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* SHOP BY ROOM */}
        <section className={styles.services}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Home Essentials, Curated</span>
            <h2 className={styles.sectionTitle}>
              Furnish Every Room, <em>Your Way</em>
            </h2>
            <p className={styles.sectionSub}>
              Mix and match furniture, décor, and essentials from vendors
              across the city — curated by room, customizable by you.
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {rooms.map((room) => (
              <Link
                href={`/roomCategory/${room.slug}`}
                key={room.slug}
                className={styles.categoryCard}
              >
                <span className={styles.cardIcon} aria-hidden="true">
                  {room.icon}
                </span>
                <h3 className={styles.cardTitle}>{room.title}</h3>
                <p className={styles.cardDesc}>{room.description}</p>
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
              Two Paths, <em>One Platform</em>
            </h2>
            <p className={styles.sectionSub}>
              Whether you&apos;re renovating a space or furnishing one, here&apos;s
              what happens after you choose your path.
            </p>
          </div>

          <div className={styles.processTrack}>
            <h3 className={styles.processTrackTitle}>
              <span aria-hidden="true">🔧</span> Renovate a Space
            </h3>
            <div className={styles.processSteps}>
              {renovateSteps.map((item) => (
                <div key={item.step} className={styles.processCard}>
                  <span className={styles.processStep}>{item.step}</span>
                  <h4 className={styles.processTitle}>{item.title}</h4>
                  <p className={styles.processDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.processTrack}>
            <h3 className={styles.processTrackTitle}>
              <span aria-hidden="true">🛋️</span> Shop by Room
            </h3>
            <div className={`${styles.processSteps} ${styles.processStepsThree}`}>
              {shopByRoomSteps.map((item) => (
                <div key={item.step} className={styles.processCard}>
                  <span className={styles.processStep}>{item.step}</span>
                  <h4 className={styles.processTitle}>{item.title}</h4>
                  <p className={styles.processDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
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
            <div className={styles.ctaBannerActions}>
              <Link href="#contact" className={styles.ctaButton}>
                Get Your Free Estimate
              </Link>
              <Link href="/roomCategory" className={styles.ctaBannerGhostButton}>
                Browse Rooms →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer} id="contact">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>R</span>
              <span className={styles.logoText}>Gorenovate</span>
            </Link>
            <p className={styles.footerTagline}>
              Crafting beautiful homes across India since 2012.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h3>Services</h3>
              <Link href="/vendors">Full Renovation</Link>
              <Link href="/vendors/category/kitchen">Kitchen</Link>
              <Link href="/vendors/category/bathroom">Bathroom</Link>
              <Link href="/vendors/category/smart-home">Smart Home</Link>
            </div>
            <div className={styles.footerCol}>
              <h3>Shop by Room</h3>
              {rooms.map((room) => (
                <Link href={`/roomCategory/${room.slug}`} key={room.slug}>
                  {room.title}
                </Link>
              ))}
            </div>
            <div className={styles.footerCol}>
              <h3>Company</h3>
              <a href="#about">About Us</a>
              <a href="#work">Our Work</a>
              {/* No destination page yet — plain (non-href) so it doesn't
                  present as a broken link to keyboard/screen-reader users. */}
              <a>Careers</a>
              <a>Blog</a>
            </div>
            <div className={styles.footerCol}>
              <h3>Contact</h3>
              <a href="mailto:hello@gorenovate.in">hello@gorenovate.in</a>
              <a href="tel:+918000000000">+91 80 0000 0000</a>
              <a>Bengaluru, India</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>
            © {new Date().getFullYear()} Gorenovate All rights reserved.
          </span>
          <div className={styles.footerLegal}>
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
