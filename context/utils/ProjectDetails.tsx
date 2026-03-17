import { PropertyItem } from "@/models/types";
import { PropertyDetails } from "@/models/types";
import apartment from "@/public/Apartment.svg";
import mapImage from "@/public/map.svg";

export const FeatureSectionData = {
  amenitiesData: [
    { id: 1, src: "/gallary/image1.png", alt: "Swimming Pool" },
    { id: 2, src: "/gallary/image2.png", alt: "Modern Kitchen" },
    { id: 3, src: "/gallary/image3.png", alt: "Modern Kitchen" },
    { id: 4, src: "/gallary/image4.png", alt: "Modern Kitchen" },
    { id: 5, src: "/gallary/image5.png", alt: "Modern Kitchen" },
    { id: 6, src: "/gallary/image6.png", alt: "Modern Kitchen" },
    { id: 7, src: "/gallary/image7.png", alt: "Modern Kitchen" },
    { id: 8, src: "/gallary/image8.png", alt: "Modern Kitchen" },
    { id: 9, src: "/gallary/image9.png", alt: "Modern Kitchen" },
    { id: 10, src: "/gallary/image10.png", alt: "Modern Kitchen" },
    { id: 11, src: "/gallary/image11.png", alt: "Modern Kitchen" },
    { id: 12, src: "/gallary/image12.png", alt: "Modern Kitchen" },
  ],

  locationData: {
    src: mapImage,
    alt: "Project location map",
  },
};

export const projectSectionData = {
  detailsData: [
    {
      icon: apartment,
      label: "Project Type",
      value: "Apartment",
    },
    { icon: "/bedroom.svg", label: "Bedrooms", value: "3/4 BHK" },
    {
      icon: "/developmentSize.svg",
      label: "Development Size",
      value: "4.5 Acres",
    },
    { icon: "/Units.svg", label: "Total Units", value: "500 + Units" },
    {
      icon: "/location.svg",
      label: "Project Location",
      value: "Kharadi, Pune",
    },
  ],

  descriptionText: [
    "DLF The Westpark marks the legendary developer’s grand foray into Mumbai’s luxury real estate landscape. Nestled in the heart of Andheri West, this iconic development brings together timeless elegance, panoramic views, and landmark architecture. This first-ever Mumbai offering by DLF features the exclusive release of Towers 2, currently open for booking. Designed for connoisseurs of refinement, it offers spacious 3 & 4 BHK residences, lavish duplexes, and ultra-limited penthouses, all with no back-facing units, Vastu-compliant layouts, and elite lifestyle integration",
    "This is more than a home, it’s a new landmark of luxury and distinction in one of Mumbai’s highest potential zones. With only a limited inventory in a low-supply premium market, early-stage buyers stand to benefit from first-mover capital appreciation and steady rental yield potential.",
  ],

  priceData: [
    { id: 1, configuration: "2 BHK Apartments", size: "2,711 SQ. FT." },
    { id: 2, configuration: "3 BHK Apartments", size: "3897- 3929 SQ. FT." },
    { id: 3, configuration: "4 BHK Apartments", size: "4297- 4429 SQ. FT." },
  ],

  priceSubtitle:
    "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
};

export const PorjectListingData = {
  // Card 1 Data
  card1: {
    imgUrl: "/building1.svg",
    location: "Koregaon Park",
    reranumber: "P52100030486",
    title: "Luxury Apartments in Koregaon Park",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Apartment",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "3/4 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "4.5 Acres" },
      { icon: "/Units.svg", label: "Units", value: "500+" },
    ],
    btntag: "₹ 2.48* CRORE ONWORDS",
  },
  // Card 2 Data
  card2: {
    imgUrl: "/building2.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card3: {
    imgUrl: "/building3.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card4: {
    imgUrl: "/building4.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },

  card5: {
    imgUrl: "/building1.svg",
    location: "Koregaon Park",
    reranumber: "P52100030486",
    title: "Luxury Apartments in Koregaon Park",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Apartment",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "3/4 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "4.5 Acres" },
      { icon: "/Units.svg", label: "Units", value: "500+" },
    ],
    btntag: "₹ 2.48* CRORE ONWORDS",
  },

  card6: {
    imgUrl: "/building2.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card7: {
    imgUrl: "/building3.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card8: {
    imgUrl: "/building4.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card9: {
    imgUrl: "/building4.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },

  card105: {
    imgUrl: "/building1.svg",
    location: "Koregaon Park",
    reranumber: "P52100030486",
    title: "Luxury Apartments in Koregaon Park",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Apartment",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "3/4 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "4.5 Acres" },
      { icon: "/Units.svg", label: "Units", value: "500+" },
    ],
    btntag: "₹ 2.48* CRORE ONWORDS",
  },

  card116: {
    imgUrl: "/building2.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card127: {
    imgUrl: "/building3.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
  card138: {
    imgUrl: "/building4.svg",
    location: "Hinjewadi",
    reranumber: "P52100045678",
    title: "Modern Living in Hinjewadi",
    specifications: [
      {
        icon: "/Apartment.svg",
        label: "Project Type",
        value: "Townhouse",
      },
      { icon: "/bedroom.svg", label: "Bedrooms", value: "2/3 BHK" },
      { icon: "/developmentSize.svg", label: "Size", value: "3.2 Acres" },
      { icon: "/Units.svg", label: "Units", value: "300+" },
    ],
    btntag: "₹ 1.50* CRORE ONWORDS",
  },
};

type ProjectDetailMap = {
  [key: string]: PropertyItem[];
};

export const ProjectDetailData: { [key: string]: PropertyDetails } = {
  card1: {
    id: "p1",
    title: "Luxury Apartments in Koregaon Park",
    name: "Koregaon Park Residences",
    rating: 4.8,
    type: "Apartment",
    location: "Koregaon Park",
    listingId: "P52100030486",
    price: "₹ 2.48* CRORE ONWORDS",
    descriptionPoints: [
      "Project Type: Apartment",
      "Bedrooms: 3/4 BHK",
      "Size: 4.5 Acres",
      "Units: 500+",
    ],
    buttonText: "ENQUIRE NOW",
    images: [
      // <-- With an 'images' array INSIDE it
      { id: "p1-img1", image: "/building1.svg" },
      { id: "p1-img2", image: "/building2.svg" },
      { id: "p1-img3", image: "/building3.svg" },
      { id: "p1-img4", image: "/building4.svg" },
    ],
  },

  card2: {
    id: "p2",
    title: "Modern Living in Hinjewadi",
    name: "Hinjewadi Heights",
    rating: 4.5,
    type: "Apartment",
    location: "Koregaon Park",
    listingId: "P52100030486",
    price: "₹ 2.48* CRORE ONWORDS",
    descriptionPoints: [
      "Project Type: Apartment",
      "Bedrooms: 3/4 BHK",
      "Size: 4.5 Acres",
      "Units: 500+",
    ],
    buttonText: "ENQUIRE NOW",
    images: [
      // <-- With an 'images' array INSIDE it
      { id: "p1-img1", image: "/building1.svg" },
      { id: "p1-img2", image: "/building2.svg" },
      { id: "p1-img3", image: "/building3.svg" },
      { id: "p1-img4", image: "/building4.svg" },
    ],
  },
  card3: {
    id: "p2",
    title: "Modern Living in Hinjewadi",
    name: "Hinjewadi Heights",
    rating: 4.5,
    type: "Apartment",
    location: "Koregaon Park",
    listingId: "P52100030486",
    price: "₹ 2.48* CRORE ONWORDS",
    descriptionPoints: [
      "Project Type: Apartment",
      "Bedrooms: 3/4 BHK",
      "Size: 4.5 Acres",
      "Units: 500+",
    ],
    buttonText: "ENQUIRE NOW",
    images: [
      // <-- With an 'images' array INSIDE it
      { id: "p1-img1", image: "/building1.svg" },
      { id: "p1-img2", image: "/building2.svg" },
      { id: "p1-img3", image: "/building3.svg" },
      { id: "p1-img4", image: "/building4.svg" },
    ],
  },
  card4: {
    id: "p2",
    title: "Modern Living in Hinjewadi",
    name: "Hinjewadi Heights",
    rating: 4.5,
    type: "Apartment",
    location: "Koregaon Park",
    listingId: "P52100030486",
    price: "₹ 2.48* CRORE ONWORDS",
    descriptionPoints: [
      "Project Type: Apartment",
      "Bedrooms: 3/4 BHK",
      "Size: 4.5 Acres",
      "Units: 500+",
    ],
    buttonText: "ENQUIRE NOW",
    images: [
      // <-- With an 'images' array INSIDE it
      { id: "p1-img1", image: "/building1.svg" },
      { id: "p1-img2", image: "/building2.svg" },
      { id: "p1-img3", image: "/building3.svg" },
      { id: "p1-img4", image: "/building4.svg" },
    ],
  },
  card5: {
    id: "p2",
    title: "Modern Living in Hinjewadi",
    name: "Hinjewadi Heights",
    rating: 4.5,
    type: "Apartment",
    location: "Koregaon Park",
    listingId: "P52100030486",
    price: "₹ 2.48* CRORE ONWORDS",
    descriptionPoints: [
      "Project Type: Apartment",
      "Bedrooms: 3/4 BHK",
      "Size: 4.5 Acres",
      "Units: 500+",
    ],
    buttonText: "ENQUIRE NOW",
    images: [
      // <-- With an 'images' array INSIDE it
      { id: "p1-img1", image: "/building1.svg" },
      { id: "p1-img2", image: "/building2.svg" },
      { id: "p1-img3", image: "/building3.svg" },
      { id: "p1-img4", image: "/building4.svg" },
    ],
  },
  // ... and so on
};
