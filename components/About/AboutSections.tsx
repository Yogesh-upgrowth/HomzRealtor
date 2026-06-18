import React from "react";
import {
  Home,
  Building2,
  TrendingUp,
  Rocket,
  LandPlot,
  Handshake,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Users,
  LifeBuoy,
  Award,
  Target,
  Lightbulb,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

/* ---------- Shared section heading (matches existing gradient-line title) ---------- */
const SectionHeading = ({
  title,
  subtitle,
  theme = "light",
}: {
  title: string;
  subtitle?: string;
  theme?: "light" | "dark";
}) => (
  <div className="text-center mb-10">
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="md:w-[200px] w-[60px] h-px bg-gradient-to-l from-[#FDF094] to-[#B77D2B]" />
      <h2
        className={`text-3xl md:text-4xl font-bold font-corbert ${
          theme === "dark" ? "text-[#EEEEEE]" : "text-yellow-600"
        }`}
      >
        {title}
      </h2>
      <div className="md:w-[200px] w-[60px] h-px bg-gradient-to-r from-[#FDF094] to-[#B77D2B]" />
    </div>
    {subtitle && (
      <p
        className={`max-w-3xl mx-auto ${
          theme === "dark" ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {subtitle}
      </p>
    )}
  </div>
);

/* ---------- Reusable feature card (reuses existing shadow / radius / transition) ---------- */
const FeatureCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) => (
  <div className="h-full bg-white rounded-sm border border-gray-100 shadow-sm hover:shadow-xl transition p-6">
    <div className="mb-5 h-12 w-12 flex items-center justify-center rounded-md bg-gradient-to-b from-[#fdf094] to-[#b77d2b]">
      <Icon className="h-6 w-6 text-black" strokeWidth={1.75} />
    </div>
    <h3 className="font-semibold text-lg mb-2 text-[#212121]">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const whatWeDo = [
  {
    icon: Home,
    title: "Residential Properties",
    description:
      "Helping families and individuals discover apartments, villas, independent homes, and gated community projects that match their lifestyle and budget.",
  },
  {
    icon: Building2,
    title: "Commercial Real Estate",
    description:
      "Connecting businesses and investors with office spaces, retail outlets, commercial projects, and high-growth investment opportunities.",
  },
  {
    icon: TrendingUp,
    title: "Property Investments",
    description:
      "Providing expert guidance on investment-worthy properties with strong appreciation potential and long-term value creation.",
  },
  {
    icon: Rocket,
    title: "New Project Launches",
    description:
      "Offering access to premium pre-launch and newly launched projects from reputed developers.",
  },
  {
    icon: LandPlot,
    title: "Land & Plot Investments",
    description:
      "Helping investors identify strategic land opportunities in high-growth locations.",
  },
  {
    icon: Handshake,
    title: "End-to-End Property Assistance",
    description:
      "Supporting customers through property discovery, site visits, negotiations, documentation, and transaction completion.",
  },
];

const whyChooseHomz = [
  {
    icon: ShieldCheck,
    title: "Verified Opportunities",
    description:
      "Every property and project is carefully reviewed to ensure authenticity, transparency, and credibility.",
  },
  {
    icon: UserCheck,
    title: "Expert Guidance",
    description:
      "Our experienced advisors provide personalized recommendations tailored to your goals and requirements.",
  },
  {
    icon: BarChart3,
    title: "Market Intelligence",
    description:
      "We leverage real-time market insights, pricing trends, and location analytics to help customers make informed decisions.",
  },
  {
    icon: Users,
    title: "Customer-First Approach",
    description:
      "Our focus is on building trust and long-term relationships rather than simply completing transactions.",
  },
  {
    icon: LifeBuoy,
    title: "Complete Support",
    description:
      "From your first inquiry to final possession, our team remains by your side throughout the entire property journey.",
  },
];

const ourValues = [
  {
    icon: Handshake,
    title: "Trust",
    description:
      "Building relationships through honesty, transparency, and integrity.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "Delivering exceptional service and expert guidance at every stage.",
  },
  {
    icon: Target,
    title: "Customer Success",
    description:
      "Prioritizing our clients' goals and helping them achieve better outcomes.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Leveraging technology and data to create smarter real estate experiences.",
  },
  {
    icon: HeartHandshake,
    title: "Commitment",
    description:
      "Providing dedicated support and long-term partnership beyond transactions.",
  },
];

const AboutSections = () => {
  return (
    <>
      {/* SECTION 2: WHO WE ARE */}
      <section className="max-w-[1444px] w-full mx-auto px-6">
        <SectionHeading title="Who We Are" />
        <div className="max-w-4xl mx-auto space-y-5 text-gray-700 leading-relaxed text-center md:text-left">
          <p>
            Homz is a customer-focused real estate advisory and property
            solutions platform dedicated to helping individuals and businesses
            navigate the property market with confidence.
          </p>
          <p>
            With deep market knowledge, strategic partnerships, and a commitment
            to transparency, we connect our clients with verified residential and
            commercial opportunities across emerging and established real estate
            markets.
          </p>
          <p>
            We understand that every customer has unique aspirations, investment
            goals, and lifestyle preferences. That&apos;s why our approach is
            built around personalized consultation, data-driven insights, and
            long-term relationship building.
          </p>
        </div>
      </section>

      {/* SECTION 3: WHAT WE DO */}
      <section className="max-w-[1444px] w-full mx-auto px-6">
        <SectionHeading title="What We Do" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whatWeDo.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* SECTION 4: WHY CHOOSE HOMZ */}
      <section className="max-w-[1444px] w-full mx-auto px-6">
        <SectionHeading title="Why Choose Homz" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChooseHomz.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* SECTION 5: VISION & MISSION */}
      <section className="max-w-[1444px] w-full mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-full bg-white rounded-sm border border-gray-100 shadow-sm hover:shadow-xl transition p-8">
            <div className="mb-5 h-12 w-12 flex items-center justify-center rounded-md bg-gradient-to-b from-[#fdf094] to-[#b77d2b]">
              <Target className="h-6 w-6 text-black" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-corbert text-yellow-600 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To become India&apos;s most trusted real estate platform by
              combining technology, transparency, and expert advisory services to
              transform the property buying and investment experience.
            </p>
          </div>

          <div className="h-full bg-white rounded-sm border border-gray-100 shadow-sm hover:shadow-xl transition p-8">
            <div className="mb-5 h-12 w-12 flex items-center justify-center rounded-md bg-gradient-to-b from-[#fdf094] to-[#b77d2b]">
              <Rocket className="h-6 w-6 text-black" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-corbert text-yellow-600 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To simplify property buying, selling, renting, and investing through
              verified opportunities, professional guidance, and exceptional
              customer experiences that create lasting value.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: OUR VALUES */}
      <section className="max-w-[1444px] w-full mx-auto px-6">
        <SectionHeading title="Our Values" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {ourValues.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* SECTION 7: FINAL BRAND STATEMENT */}
      <section className="w-full bg-black text-white py-16 md:py-20">
        <div className="max-w-[1444px] w-full mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="md:w-[200px] w-[60px] h-px bg-gradient-to-l from-[#FDF094] to-[#B77D2B]" />
            <h2 className="text-3xl md:text-4xl font-bold font-corbert text-[#EEEEEE]">
              Building Relationships Beyond Real Estate
            </h2>
            <div className="md:w-[200px] w-[60px] h-px bg-gradient-to-r from-[#FDF094] to-[#B77D2B]" />
          </div>

          <div className="max-w-3xl mx-auto space-y-5 text-gray-300 leading-relaxed">
            <p>
              At Homz, we understand that real estate decisions are among the most
              important choices people make. Whether you are purchasing your dream
              home, expanding your investment portfolio, or exploring new
              opportunities, our team is committed to helping you move forward with
              confidence.
            </p>
            <p>
              Our success is measured not only by the properties we help our
              clients acquire but by the trust we earn and the lasting
              relationships we build.
            </p>
          </div>

          <p className="mt-10 text-2xl md:text-3xl font-semibold font-corbert bg-gradient-to-b from-[#FDF094] to-[#B77D2B] text-transparent bg-clip-text inline-block">
            &ldquo;Homz — Where Your Property Journey Begins.&rdquo;
          </p>
        </div>
      </section>
    </>
  );
};

export default AboutSections;
