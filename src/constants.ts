export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  additionalImages?: string[];
}

export interface Category {
  id: string;
  title: string;
  description: string;
  items: string[];
  image: string;
  specialties?: string[];
  materials?: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'apparel',
    title: 'Modern Apparel',
    description: 'Premium everyday wear and custom casuals designed for comfort and style.',
    items: ['Round Neck T-Shirts', 'Hoodies, Jumpers & Sweatshirts', 'Jackets & Fleeces', 'Designer Tracksuits', 'Polo Shirts', 'Sweaters', 'Shorts & Jeans'],
    specialties: ['Custom Screen Printing', 'Premium Embroidery', 'Brushed Fleece Lining'],
    materials: ['100% Kenyan Cotton', 'Heavyweight Fleece', 'Cotton-Polyester Blends'],
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'heritage',
    title: 'Kenyan Heritage',
    description: 'Authentic Maasai Shukas and Kikoys that blend traditional patterns with modern fashion.',
    items: ['Maasai Shukas & Kikoys', 'Ponchos & Snoodies'],
    specialties: ['Authentic Patterns', 'Traditional Weaving', 'Cultural Gifting'],
    materials: ['Soft Acrylic', 'Hand-woven Cotton', 'Vibrant Natural Dyes'],
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'uniforms',
    title: 'Workwear & Security',
    description: 'Highly durable uniforms and security or protective gear designed for professionals in demanding environments.',
    items: ['Security & Field Uniforms', 'Corporate & School Uniforms', 'School Sweaters & Dresses', 'School Tracksuits', 'Overalls, Lab Coats & Dustcoats', 'Aprons & Scrubs'],
    specialties: ['Reinforced Stitching', 'Safety Standard Compliance', 'Bulk Corporate Branding'],
    materials: ['Ripstop Fabric', 'Heavy-duty Drill', 'Breathable Mesh', 'Water-resistant Canvas'],
    image: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'other',
    title: 'Accessories & Custom',
    description: 'Branded personal accessories and specialised custom garment projects.',
    items: ['Bags (Gift & Jute)', 'Caps & Safari Hats', 'Umbrellas', 'Socks', 'Custom Made Undergarments'],
    specialties: ['Custom Fabric Sourcing', 'Unique Prototyping', 'Small Batch Production'],
    materials: ['Jute & Eco-fibers', 'Canvas & Twill', 'Synthetic Blends'],
    image: 'https://images.unsplash.com/photo-1544816153-12ad5d714b21?auto=format&fit=crop&q=80&w=800',
  }
];

export const STRENGTHS = [
  { title: 'Made in Kenya', description: 'Entire process, from fabric to finish.' },
  { title: 'Custom Orders', description: 'Bulk and corporate branding solutions.' },
  { title: 'Quality Focused', description: 'Top-grade cotton fleece and premium blends.' },
  { title: 'Affordable Pricing', description: 'Direct manufacturing cost advantage.' },
  { title: 'Flexible Quantities', description: 'Catering for both small and large orders.' },
  { title: 'Fast Turnaround', description: 'Timely production and reliable delivery.' },
];

export interface BrandingService {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  bestFor: string[];
  features: string[];
  durability: string;
  estimatedCost: string;
  imageUrl: string;
  badge: string;
}

export const BRANDING_SERVICES: BrandingService[] = [
  {
    id: 'embroidery',
    name: 'Precision Computer Embroidery',
    tagline: 'High-Density 3D & Flat Thread Stitching',
    description: 'Industrial multi-head computer embroidery engineered for elite corporate crests, heavy jacket emblems, school logos, and durable security patches with up to 15 thread colors.',
    accentColor: '#0b2c7a',
    bestFor: ['Security Uniforms', 'Corporate Polos & Shirts', 'Heavy Hoodies & Jackets', 'School Crests & Caps'],
    features: ['High-stitch density with zero fraying', '3D puff / raised foam embroidery options', 'Metallic gold, silver & neon thread lines', 'Direct garment stitching or sew-on patches'],
    durability: 'Lifetime of garment (100+ industrial washes)',
    estimatedCost: 'From KES 250 - 450 per garment',
    imageUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800',
    badge: 'Executive & Durable',
  },
  {
    id: 'dtf_print',
    name: 'DTF Print (Direct-To-Film)',
    tagline: 'Ultra-Vibrant Full-Color Digital Transfers',
    description: 'Cutting-edge Direct-to-Film transfer technology delivering photographic clarity, crisp micro-details, and rich gradients across dark, light, cotton, and synthetic textiles with stretch elasticity.',
    accentColor: '#ff6600',
    bestFor: ['Graphic Hoodies & Sweatshirts', 'Promotional T-Shirts', 'Multi-color Brand Mascots', 'Event Apparel'],
    features: ['Infinite color spectrum with photographic detail', 'Elastic soft-touch feel with zero cracking', 'Flawless adhesion on 100% cotton & fleece', 'Sharp edge definition down to 0.5mm vector lines'],
    durability: '50+ machine washes with vibrant color retention',
    estimatedCost: 'From KES 250 - 350 per print',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    badge: 'Photorealistic & Ultra-Vivid',
  },
  {
    id: '3d_pocket_print',
    name: '3D Pocket & Silicone Printing',
    tagline: 'Raised Dimensional & Tactile Rubberized Print',
    description: 'Specialized 3D high-density silicone and plastisol pocket printing creating bold, tactile raised dimensions on garment pockets, chest panels, and sleeve trims for contemporary streetwear and tactical apparel.',
    accentColor: '#269453',
    bestFor: ['Pocket Tees & Hoodies', 'Workwear & Cargo Overalls', 'Brand Streetwear', 'Tactical Field Shirts'],
    features: ['Raised 1mm–3mm tactile silicone relief', 'Engineered pocket contour and flap placement', 'Heat-resistant, peel-proof, and flexible', 'Matte, gloss, and textured rubberized finishes'],
    durability: 'Industrial grade (resistant to heavy wear & abrasion)',
    estimatedCost: 'From KES 300 - 450 per pocket',
    imageUrl: 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&q=80&w=800',
    badge: 'Tactile & High-Density',
  },
  {
    id: 'sublimation',
    name: 'All-Over & Panel Sublimation',
    tagline: '360° Breathable Heat-Fused Molecular Dyeing',
    description: 'Gas-phase dye sublimation where artwork fuses directly into synthetic fiber molecules. Leaves zero ink weight or texture, ensuring 100% breathable athletic jerseys, reflector jackets, and heritage prints.',
    accentColor: '#7c3aed',
    bestFor: ['Sports Jerseys & Team Kits', 'Reflective Safety Overalls', 'Sublimated Heritage Shukas', 'Dri-Fit Activewear'],
    features: ['100% breathable with zero ink texture/weight', 'Full 360° seam-to-seam printing freedom', 'Never peels, cracks, or fades in sunlight', 'Vibrant fluorescent, safety neon & custom graphics'],
    durability: 'Permanent molecular bond (Never fades or cracks)',
    estimatedCost: 'From KES 300 - 550 per garment',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=800',
    badge: '360° Zero-Fade Breathable',
  },
  {
    id: 'color_customization',
    name: 'Custom Colour & Fabric Matching',
    tagline: 'Pantone Reactive Dyeing & Contrast Trims',
    description: 'Bespoke fabric color formulation tailored to your exact brand guidelines. Includes custom contrast collars, two-tone sleeve piping, colored pocket flaps, and custom dyed ribbed cuffs.',
    accentColor: '#0ea5e9',
    bestFor: ['Corporate Uniform Sets', 'School Color Combinations', 'Brand-Specific Merchandise', 'Two-Tone Workwear'],
    features: ['Precise Pantone & CMYK shade matching', 'Contrast pocket, collar & sleeve combinations', 'Heavyweight 180–320 GSM fabric options', 'Colorfast reactive dyeing prevents washing bleed'],
    durability: 'Commercial grade colorfastness',
    estimatedCost: 'Included in bulk manufacturing orders',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    badge: 'Bespoke Color Identity',
  },
  {
    id: 'screen_print',
    name: 'High-Capacity Silk Screen Printing',
    tagline: 'Plastisol & Discharge High-Volume Printing',
    description: 'Traditional high-throughput silkscreen printing perfected for large-scale production runs, corporate promotional tees, campaign merchandise, and heavy-duty dustcoats.',
    accentColor: '#e11d48',
    bestFor: ['Large Bulk Orders (50+ to 10,000+ units)', 'Promotional Event T-Shirts', 'Dustcoats & Overalls', 'Tote Bags'],
    features: ['Cost-effective for high volume production', 'Heavy plastisol or soft-feel water-based inks', 'Spot color Pantone precision', 'Rapid mass turnaround for tight event deadlines'],
    durability: 'High durability (40+ wash cycles)',
    estimatedCost: 'From KES 150 - 250 per print',
    imageUrl: 'https://images.unsplash.com/photo-1544816153-12ad5d714b21?auto=format&fit=crop&q=80&w=800',
    badge: 'Cost-Effective High Volume',
  }
];

