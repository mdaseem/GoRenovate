import React from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import styles from "./HomePage.module.css";
import Link from "next/link";
import { SERVICES_ENABLED } from "@/app/utils/features";

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
    layout: "feature",
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
    layout: "wide",
  },
  {
    id: 11,
    title: "Terrace Renovation",
    description: "Open-air living elevated to its fullest",
    icon: "☀️",
    tag: null,
    categoryId: "outdoor",
    layout: "wide",
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

const servicePaths = [
  {
    id: "renovate",
    num: "01",
    variant: "renovate",
    badge: "Book a Vendor",
    icon: "🔧",
    title: "Renovate a Space",
    description:
      "Hire vetted vendors directly for your project — pick services, compare transparent pricing & more.",
    bullets: [
      "Compare verified vendors side-by-side",
      "Transparent, itemized pricing",
      "Book in a few taps and track every order",
    ],
    chips: [
      { label: "Kitchen", icon: "🍳", href: "/vendors/category/kitchen" },
      { label: "Bathroom", icon: "🚿", href: "/vendors/category/bathroom" },
      { label: "Painting", icon: "🎨", href: "/vendors/category/painting" },
      { label: "Flooring", icon: "🪵", href: "/vendors/category/flooring" },
    ],
    proof: "Verified vendors · Itemised pricing · Order tracking",
    ctaLabel: "Browse Vendors",
    ctaHref: "/vendors",
  },
  {
    id: "rooms",
    num: "02",
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

// While services are switched off (see utils/features.ts) the first path is a shop, not a booking.
const shopPaths = [
  {
    id: "shop",
    num: "01",
    variant: "renovate",
    badge: "Shop",
    icon: "🛍️",
    title: "Shop from Vendors",
    description:
      "Browse vendors, see what each one sells and buy products directly — add them to your cart and check out once, even across vendors.",
    bullets: [
      "See each vendor's products and prices",
      "Add pieces from several vendors to one cart",
      "Place one order and track every vendor's part",
    ],
    chips: [
      { label: "Sofas", icon: "🛋️", href: "/vendors/category/sofa" },
      { label: "Lighting", icon: "💡", href: "/vendors/category/lighting" },
      { label: "Rugs", icon: "🧶", href: "/vendors/category/rug" },
      { label: "Coffee Tables", icon: "🪑", href: "/vendors/category/coffee-table" },
    ],
    proof: "Clear prices · One order across vendors · Order tracking",
    ctaLabel: "Browse Vendors",
    ctaHref: "/vendors",
  },
  servicePaths[1],
] as const;

const paths = SERVICES_ENABLED ? servicePaths : shopPaths;

const promises = SERVICES_ENABLED
  ? [
  {
    icon: "🧾",
    title: "Itemised pricing",
    text: "See every service and its price before you book.",
  },
  {
    icon: "⚖️",
    title: "Compare vendors",
    text: "Services, pricing and reviews, side by side.",
  },
  {
    icon: "🛒",
    title: "One checkout",
    text: "Many vendors, one cart, one address, one order.",
  },
  {
    icon: "📍",
    title: "Track every order",
    text: "Follow your booking from confirmation to completion.",
  },
    ]
  : [
      {
        icon: "🧾",
        title: "Clear prices",
        text: "See every product's price before you buy.",
      },
      {
        icon: "⚖️",
        title: "Compare vendors",
        text: "Products and prices, side by side.",
      },
      {
        icon: "🛒",
        title: "One checkout",
        text: "Many vendors, one cart, one address, one order.",
      },
      {
        icon: "📍",
        title: "Track every order",
        text: "Follow each vendor's part of your order from your Orders page.",
      },
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

const shopSteps = [
  {
    step: "01",
    title: "Browse Vendors",
    desc: "Explore vendors and see the products each one sells, grouped by type, with prices up front.",
  },
  {
    step: "02",
    title: "Add to Your Cart",
    desc: "Pick exactly the pieces you want — from one vendor or several — and set the quantity you need.",
  },
  {
    step: "03",
    title: "Checkout Once",
    desc: "Add your address and place one order, even when your cart has products from several vendors.",
  },
  {
    step: "04",
    title: "Each Vendor Ships",
    desc: "Every vendor prepares and ships their part, and you can follow each one from your Orders page.",
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

const serviceFaqs = [
  {
    q: "What's the difference between hiring a vendor and shopping by room?",
    a: "Hiring a vendor is for services: painting, flooring, kitchens, repairs and more. You pick the services you need and book them. Shopping by room is for products: curated furniture and décor bundles you can buy and have delivered.",
  },
  {
    q: "Can I buy from several vendors in one order?",
    a: "Yes. A Room can include pieces from different vendors. You add one address and place one order, and each vendor ships their part.",
  },
  {
    q: "Can I change what's in a Room bundle?",
    a: "Yes. Swap any piece for another vendor's pick and your total updates instantly, so you only pay for what you choose.",
  },
  {
    q: "How do I track my order?",
    a: "Once you've placed an order, you can follow its status any time from your Orders page.",
  },
  {
    q: "I run a renovation or décor business. How do I list it?",
    a: "Email us at hello@gorenovate.in with a few details about your business and we'll get you set up.",
  },
];

const shopFaqs = [
  {
    q: "What's the difference between shopping from vendors and shopping by room?",
    a: "Shopping from vendors lets you browse what each vendor sells and buy exactly the pieces you want. Shopping by room gives you curated bundles you can customise piece by piece. Either way you check out once.",
  },
  serviceFaqs[1],
  serviceFaqs[2],
  serviceFaqs[3],
  {
    q: "I sell furniture or décor. How do I list my products?",
    a: "Apply on the Sell on Go Renovate page. We review every application, and once you're approved you'll have your own vendor area.",
  },
];

const faqs = SERVICES_ENABLED ? serviceFaqs : shopFaqs;
const processSteps = SERVICES_ENABLED ? renovateSteps : shopSteps;

export default function HomePage() {
  return (
    <div className={`${styles.root} ${playfairDisplay.variable} ${dmSans.variable}`}>
      <main>
        {/* HERO */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroTexture} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroIntro}>
              <p className={styles.heroPill}>
                {SERVICES_ENABLED
                  ? "✦ Renovate · Furnish · Transform"
                  : "✦ Shop · Furnish · Transform"}
              </p>
              <h1 id="hero-heading" className={styles.heroHeading}>
                Your Home, <em>Reimagined.</em>
              </h1>
              <p className={styles.heroSub}>
                {SERVICES_ENABLED
                  ? "Hire vetted vendors for a full project, or furnish a room with pieces you can buy today. Pick your path."
                  : "Shop furniture and décor from vendors, or furnish a whole room in one order. Pick your path."}
              </p>
            </div>

            {/* CHOOSE YOUR PATH */}
            <div className={styles.pathGrid}>
              {paths.map((path) => (
                <article
                  key={path.id}
                  className={`${styles.pathCard} ${styles[`pathCard--${path.variant}`]}`}
                  aria-labelledby={`path-${path.id}`}
                >
                  <span className={styles.pathNumber} aria-hidden="true">
                    {path.num}
                  </span>
                  <div className={styles.pathTop}>
                    <span className={styles.pathIcon} aria-hidden="true">
                      {path.icon}
                    </span>
                    <span className={styles.pathBadge}>{path.badge}</span>
                  </div>
                  <h2 id={`path-${path.id}`} className={styles.pathTitle}>
                    {path.title}
                  </h2>
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
                      {path.ctaLabel} <span aria-hidden="true">→</span>
                    </Link>
                    <p className={styles.pathProof}>{path.proof}</p>
                  </div>
                </article>
              ))}
              <span className={styles.pathOr} aria-hidden="true">
                or
              </span>
            </div>

            <a
              href={SERVICES_ENABLED ? "#services" : "#rooms"}
              className={styles.heroScroll}
            >
              {SERVICES_ENABLED ? "Explore all services" : "Explore rooms"}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className={styles.heroDivider} aria-hidden="true" />
        </section>

        {/* PROMISES */}
        <section
          className={styles.promiseBar}
          id="about"
          aria-label="Why Go Renovate"
        >
          <ul className={styles.promiseInner}>
            {promises.map((item) => (
              <li key={item.title} className={styles.promiseItem}>
                <span className={styles.promiseIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <strong className={styles.promiseTitle}>{item.title}</strong>
                  <span className={styles.promiseText}>{item.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* SERVICES (only while services are switched on) */}
        {SERVICES_ENABLED && (
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

          <div className={styles.bentoGrid}>
            {categories.map((cat, index) => (
              <Link
                href={
                  cat.categoryId
                    ? `/vendors/category/${cat.categoryId}`
                    : "/vendors"
                }
                key={cat.id}
                className={`${styles.bentoCard} ${
                  cat.layout ? styles[`bentoCard--${cat.layout}`] : ""
                }`}
              >
                <div className={styles.bentoTop}>
                  <span className={styles.bentoIcon} aria-hidden="true">
                    {cat.icon}
                  </span>
                  {cat.tag && (
                    <span className={styles.bentoTag}>{cat.tag}</span>
                  )}
                </div>
                <div className={styles.bentoBody}>
                  <span className={styles.bentoIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.bentoTitle}>{cat.title}</h3>
                  <p className={styles.bentoDesc}>{cat.description}</p>
                </div>
                <span className={styles.bentoArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>

          <p className={styles.servicesFoot}>
            Not sure where to start?{" "}
            <Link href="/vendors" className={styles.servicesFootLink}>
              Browse all vendors →
            </Link>
          </p>
        </section>
        )}

        {/* SHOP BY ROOM */}
        <section className={styles.services} id="rooms">
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

          <div className={`${styles.bentoGrid} ${styles.roomGrid}`}>
            {rooms.map((room, index) => (
              <Link
                href={`/roomCategory/${room.slug}`}
                key={room.slug}
                className={`${styles.bentoCard} ${styles["bentoCard--room"]}`}
              >
                <div className={styles.bentoTop}>
                  <span className={styles.bentoIcon} aria-hidden="true">
                    {room.icon}
                  </span>
                </div>
                <div className={styles.bentoBody}>
                  <span className={styles.bentoIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.bentoTitle}>{room.title}</h3>
                  <p className={styles.bentoDesc}>{room.description}</p>
                </div>
                <span className={styles.bentoArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>

          <p className={styles.servicesFoot}>
            Want to see every bundle?{" "}
            <Link href="/roomCategory" className={styles.servicesFootLink}>
              Browse all rooms →
            </Link>
          </p>
        </section>

        {/* PROCESS */}
        <section className={styles.process} id="work">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>How It Works</span>
            <h2 className={styles.sectionTitle}>
              Two Paths, <em>One Platform</em>
            </h2>
            <p className={styles.sectionSub}>
              {SERVICES_ENABLED
                ? "Whether you're renovating a space or furnishing one, here's what happens after you choose your path."
                : "Whether you're shopping from a vendor or furnishing a room, here's what happens after you choose your path."}
            </p>
          </div>

          <div
            className={`${styles.processTrack} ${styles["processTrack--renovate"]}`}
          >
            <h3 className={styles.processTrackTitle}>
              <span aria-hidden="true">{SERVICES_ENABLED ? "🔧" : "🛍️"}</span>{" "}
              {SERVICES_ENABLED ? "Renovate a Space" : "Shop from Vendors"}
            </h3>
            <div className={styles.processSteps}>
              {processSteps.map((item) => (
                <div key={item.step} className={styles.processCard}>
                  <span className={styles.processStep}>{item.step}</span>
                  <h4 className={styles.processTitle}>{item.title}</h4>
                  <p className={styles.processDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`${styles.processTrack} ${styles["processTrack--rooms"]}`}
          >
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

        {/* FAQ */}
        <section className={styles.faq} id="faq">
          <div className={styles.faqIntro}>
            <span className={styles.sectionEyebrow}>Good to Know</span>
            <h2 className={styles.sectionTitle}>
              Questions, <em>Answered</em>
            </h2>
            <p className={styles.faqSub}>
              Still stuck? Write to{" "}
              <a href="mailto:hello@gorenovate.in" className={styles.faqLink}>
                hello@gorenovate.in
              </a>
              .
            </p>
          </div>
          <div className={styles.faqList}>
            {faqs.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>{item.q}</summary>
                <p className={styles.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FOR VENDORS */}
        <section className={styles.vendorSection} id="vendors">
          <div className={styles.vendorPanel}>
            <div className={styles.vendorCopy}>
              <span className={styles.sectionEyebrow}>For Vendors</span>
              <h2 className={styles.vendorTitle}>
                Run a home business? <em>Get found.</em>
              </h2>
              <p className={styles.vendorSub}>
                {SERVICES_ENABLED
                  ? "List your services or products where homeowners are already planning their next project."
                  : "List your products where homeowners are already furnishing their homes."}
              </p>
              {SERVICES_ENABLED ? (
                <a
                  href="mailto:hello@gorenovate.in?subject=List%20my%20business"
                  className={styles.ctaButton}
                >
                  List Your Business
                </a>
              ) : (
                <Link href="/sell" className={styles.ctaButton}>
                  Sell on Go Renovate
                </Link>
              )}
            </div>
            <ul className={styles.vendorPoints}>
              <li>
                <span aria-hidden="true">✓</span>
                {SERVICES_ENABLED
                  ? "Reach customers browsing by service and by room"
                  : "Reach customers browsing by vendor and by room"}
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                {SERVICES_ENABLED
                  ? "Itemised listings, so customers know exactly what they're booking"
                  : "Clear listings, so customers know exactly what they're buying"}
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                Orders and tracking handled in one place
              </li>
            </ul>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className={styles.ctaBanner}>
          <div className={styles.ctaBannerInner}>
            <span className={styles.ctaBannerEyebrow}>Ready to Begin?</span>
            <h2 className={styles.ctaBannerTitle}>
              Let&apos;s Build Something <em>Beautiful</em>
            </h2>
            <p className={styles.ctaBannerSub}>
              {SERVICES_ENABLED
                ? "Hire a vendor for your next project, or furnish a room with pieces you can buy today. Pick a path and get started."
                : "Shop from a vendor, or furnish a room with pieces you can buy today. Pick a path and get started."}
            </p>
            <div className={styles.ctaBannerActions}>
              <Link href="/vendors" className={styles.ctaButton}>
                Browse Vendors
              </Link>
              <Link href="/roomCategory" className={styles.ctaBannerGhostButton}>
                Shop by Room →
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
              {SERVICES_ENABLED
                ? "Home renovation and home essentials, from vetted vendors."
                : "Home essentials and furnishings, from vendors we approve."}
            </p>
          </div>
          <div className={styles.footerLinks}>
            {SERVICES_ENABLED ? (
              <div className={styles.footerCol}>
                <h3>Services</h3>
                <Link href="/vendors">Full Renovation</Link>
                <Link href="/vendors/category/kitchen">Kitchen</Link>
                <Link href="/vendors/category/bathroom">Bathroom</Link>
                <Link href="/vendors/category/smart-home">Smart Home</Link>
              </div>
            ) : (
              <div className={styles.footerCol}>
                <h3>Shop</h3>
                <Link href="/vendors">All Vendors</Link>
                <Link href="/vendors/category/sofa">Sofas</Link>
                <Link href="/vendors/category/lighting">Lighting</Link>
                <Link href="/vendors/category/rug">Rugs</Link>
              </div>
            )}
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
              <a href="#work">How It Works</a>
              <a href="#faq">FAQ</a>
              {/* No destination page yet — plain (non-href) so it doesn't
                  present as a broken link to keyboard/screen-reader users. */}
              <a>Careers</a>
              <a>Blog</a>
            </div>
            <div className={styles.footerCol}>
              <h3>Contact</h3>
              <a href="mailto:hello@gorenovate.in">hello@gorenovate.in</a>
              <a>Bengaluru, India</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>
            © {new Date().getFullYear()} Gorenovate. All rights reserved.
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
