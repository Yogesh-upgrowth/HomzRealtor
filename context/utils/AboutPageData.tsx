import dummy from "../../public/dummy.svg";
import aboutHomz from "../../assets/images/aboutHomz.jpg";
import type { TestimonialsType } from "@/components/Common/Testimonial";
import { initialsAvatar } from "@/lib/initialsAvatar";
import { PropertyItem } from "@/models/types";

// Real client photos aren't available yet — generated initials avatars are
// an honest stand-in (distinct per person) rather than reusing one identical
// placeholder icon across every testimonial, which reads as fake.
export const testimonials: TestimonialsType[] = [
  {
    id: 1,
    name: "Arush Deshmukh",
    role: "Marketing Manager, Happy Living Realty",
    image: initialsAvatar("Arush Deshmukh"),
    text: "From initial consultation to closing, the journey was smooth and transparent. Their commitment to understanding my needs and providing tailored solutions was exceptional.",
    rating: 5,
  },
  {
    id: 2,
    name: "Pooja Jain",
    role: "Marketing Manager, Green Spaces Realty",
    image: initialsAvatar("Pooja Jain"),
    text: "From initial consultation to closing, the journey was smooth and transparent. Their commitment to understanding my needs and providing tailored solutions was exceptional.",
    rating: 5,
  },
  {
    id: 3,
    name: "Dr. Narayan Deshmukh",
    role: "Financial Advisor, Urban Elite Residences",
    image: initialsAvatar("Dr. Narayan Deshmukh"),
    text: "From initial consultation to closing, the journey was smooth and transparent. Their commitment to understanding my needs and providing tailored solutions was exceptional.",
    rating: 5,
  },
];
const aboutPageData = {
  // about us Section
  aboutUs: {
    title: "ABOUT US",
    para1: {
      text1: `At Homz, we believe buying or investing in property should feel clear, confident and rewarding — not overwhelming. We are a trusted real estate advisory platform that brings verified residential and commercial opportunities together with honest guidance, so you always know exactly what you're getting into.`,
      text2: `From first enquiry to final handover, our team supports you with transparent information, on-ground insight and end-to-end assistance. Whether you're searching for a home to live in or a property to grow your wealth, Homz is built to help you make the right decision with complete peace of mind.`,
    },
    imageSrc: aboutHomz,
    imageAlt: "Modern luxury residential apartment buildings at golden hour",

    btnTxt: "Contact Now",
  },
  // overView Section
  overView: {
    title: "OVERVIEW",
    para2: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. Dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
    para3: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been.`,
    imageSrc: dummy,
    imageAlt: "A team collaborating on their mission.",
    btnTxt: "Contact Now",
  },
  // Our story Section
  ourStory: {
    title: "OUR STORY",
    subtitle: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse variu.`,
    // para1: ` <p>Every idea starts with a problem. For us, it was the question: </P> <br>

    // <strong>“Why is sending money across borders still so complicated and costly?”</strong>`,
    para1: {
      text1: `Every idea starts with a problem. For us, it was the question:`,
      text2: `“Why is sending money across borders still so complicated and costly?”`,
    },
    para2: `Every idea starts with a problem. For us, it was the question:
  
  “Why is sending money across borders still so complicated and costly?”
  We saw people struggling with hidden charges, confusing processes, and a lack of transparency when transferring money abroad. With our experience in building financial apps, we set out to create a better way.
  That’s how MoneyRateFinder was born a platform that empowers you with real-time comparisons from top remittance providers, saving you both time and money.`,
    imageSrc: dummy,
    imageAlt: "A team collaborating on their mission.",

    btnTxt: "READ MORE",
  },
  //   Our Mission Section
  ourMission: {
    title: "OUR MISSION",
    subtitle: `Our goal is to provide transparent and fair financial services.`,
    para1: {
      text1: "Transparency. Convenience. Savings.",
      text2: `MoneyRateFinder was built to make global remittances fair, simple, and reliable. We believe everyone deserves access to competitive exchange rates—whether you’re:`,
    },

    features: [
      { id: 1, text: "Sending money to family overseas" },
      { id: 2, text: "Paying for international services" },
      { id: 3, text: "Managing business transactions" },
    ],
    imageSrc: dummy,
    imageAlt: "A team collaborating on their mission.",
    para3:
      "We’re not just building another finance tool. we’re creating solutions that make a real difference in people’s lives",
  },
  // why Zenith Section
  whyZenith: {
    title: "WHY ZENITH DEVELOPMENT ",
    subtitle: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse variu.`,
    features: [
      {
        id: 1,
        icon: "/icons/architect.svg",
        title: "ARCHITECTURAL EXCELLENCE",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
      {
        id: 2,
        icon: "/icons/architect.svg",
        title: "UNMATCHED BUILD QUALITY",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
      {
        id: 3,
        icon: "/icons/architect.svg",
        title: "TIMELY PROJECT COMPLETION",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
      {
        id: 4,
        icon: "/icons/architect.svg",
        title: "LUXURY AMENITIES LIFESTYLE",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
    ],
    imageSrc: "/building.svg",
    imageAlt: "Modern buildings",
    btnTxt: "READ MORE",
  },
};
export default aboutPageData;

export const propertyList: PropertyItem[] = [
  {
    id: "9134526",
    name: "DLF Pink Town House",
    title: "4 Bedroom 150 Sq.Yd. Villa in DLF City Phase 3 Gurgaon",
    rating: 4.8,
    type: "Residential",
    location: "Gurgaon",
    listingId: "#9134526",
    price: "₹ 3.5 Cr.",
    descriptionPoints: [
      "4 Bedrooms + Servant Room",
      "Semi-Furnished",
      "4 Bathroom",
      "150 Sq. Ft (Built-up Area)",
      "Park View",
    ],
    image: "/building1.svg",
    buttonText: "Request For Call",
  },
  {
    id: "9134527",
    name: "Elite Golf Greens",
    title: "3 Bedroom Luxury Flat in Noida Sector 79",
    rating: 4.7,
    type: "Apartment",
    location: "Noida",
    listingId: "#9134527",
    price: "₹ 2.8 Cr.",
    descriptionPoints: [
      "3 Bedrooms + Study Room",
      "Fully Furnished",
      "3 Bathroom",
      "180 Sq. Ft (Built-up Area)",
      "Golf Course View",
    ],
    image: "/building2.svg",
    buttonText: "Request For Call",
  },
  {
    id: "9134528",
    name: "Palm Springs Villa",
    title: "5 Bedroom Villa in DLF Phase 5 Gurgaon",
    rating: 4.9,
    type: "Villa",
    location: "Gurgaon",
    listingId: "#9134528",
    price: "₹ 5.2 Cr.",
    descriptionPoints: [
      "5 Bedrooms + Servant Room",
      "Semi-Furnished",
      "5 Bathroom",
      "250 Sq. Ft (Built-up Area)",
      "Private Pool & Garden",
    ],
    image: "/building3.svg",
    buttonText: "Request For Call",
  },
  {
    id: "9134529",
    name: "Palm  Villa",
    title: "5 Bedroom Villa in DLF Phase 5 Gurgaon",
    rating: 4.9,
    type: "Villa",
    location: "Gurgaon",
    listingId: "#9134528",
    price: "₹ 5.2 Cr.",
    descriptionPoints: [
      "5 Bedrooms + Servant Room",
      "Semi-Furnished",
      "5 Bathroom",
      "250 Sq. Ft (Built-up Area)",
      "Private Pool & Garden",
    ],
    image: "/residential.svg",
    buttonText: "Request For Call",
  },
];
