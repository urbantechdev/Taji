import React, { useState, useEffect, useRef } from 'react';
import { UniformProduct, UniformCategory } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatKsh } from '../../utils/currency';
import { motion, AnimatePresence } from 'motion/react';
import academicSchoolBlazerImg from '../../assets/images/academic_school_blazer_1787666599640.jpg';
import schoolKnitSweaterImg from '../../assets/images/school_knit_sweater_1787666624927.jpg';
import schoolPiquePoloImg from '../../assets/images/school_pique_polo_1787666646059.jpg';
import schoolTracksuitJacketImg from '../../assets/images/school_tracksuit_jacket_1787666665335.jpg';
import medicalScrubSetImg from '../../assets/images/medical_scrub_set_1787666693362.jpg';
import chefJacketExecutiveImg from '../../assets/images/chef_jacket_executive_1787666710074.jpg';
import canvasBaristaApronImg from '../../assets/images/canvas_barista_apron_1787666742156.jpg';
import corporateServicePoloImg from '../../assets/images/corporate_service_polo_1787666794018.jpg';
import highVisSafetyVestImg from '../../assets/images/high_vis_safety_vest_1787666856898.jpg';
import industrialWorkwearOverallImg from '../../assets/images/industrial_workwear_overall_1787666910504.jpg';
import varsityLettermanJacketImg from '../../assets/images/varsity_letterman_jacket_1787666981298.jpg';
import fleecePulloverHoodieImg from '../../assets/images/fleece_pullover_hoodie_1787666996711.jpg';
import medicalScrubsAlternativeImg from '../../assets/images/medical_scrubs_1787463454201.jpg';
import varsityJacketAlternativeImg from '../../assets/images/varsity_jacket_1787463467084.jpg';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Package,
  Layers,
  Tag,
  Check,
  Eye,
  DollarSign,
  Palette,
  Scissors,
  CheckCircle2,
  Upload,
  UploadCloud,
  FileImage,
  Link as LinkIcon,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Boxes,
  FileText,
  Clock,
  MapPin,
  Building,
  ShieldCheck,
  Maximize2,
  LayoutGrid,
  ListOrdered,
} from 'lucide-react';

interface ERPProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: UniformProduct | null;
  onViewOnStorefront?: (product: UniformProduct) => void;
}

const CATEGORY_OPTIONS: { id: UniformCategory; label: string }[] = [
  { id: 'safety_industrial', label: '1. Safety & Industrial Wear' },
  { id: 'corporate', label: '2. Corporate Wear' },
  { id: 'school', label: '3. School & Institutional Uniforms' },
  { id: 'security', label: '4. Security & Staff Uniforms' },
  { id: 'healthcare', label: '5. Medical & Healthcare Wear' },
  { id: 'hospitality', label: '6. Hospitality & Restaurant Wear' },
  { id: 'promotional', label: '7. Promotional & Branding Wear' },
  { id: 'sportswear', label: '8. Sportswear' },
  { id: 'specialized_workwear', label: '9. Specialized Work-wear' },
  { id: 'service', label: 'Service & Corporate (Legacy)' },
  { id: 'workwear', label: 'Workwear & Industrial (Legacy)' },
  { id: 'knitwear', label: 'Custom Knitwear & Fleece (Legacy)' },
];

export interface GarmentTemplate {
  name: string;
  category: UniformCategory;
  categoryLabel: string;
  basePrice: number;
  unitCost: number;
  minOrder: number;
  leadTimeDays: number;
  stockOnHand: number;
  image: string;
  tagline: string;
  colors: { name: string; hex: string; bgClass: string }[];
  sizes: string[];
  fabricComp: string;
  fabricWeight: string;
  fabricFeatures: string[];
  description: string;
  idealFor: string[];
  customization: {
    embroidery?: boolean;
    screenPrinting?: boolean;
    wovenPatch?: boolean;
    reflectiveStripes?: boolean;
    heatTransfer?: boolean;
  };
}

const PRODUCT_TEMPLATES: GarmentTemplate[] = [
  {
    name: 'High-Vis Industrial Safety Vest',
    category: 'safety_industrial',
    categoryLabel: '1. Safety & Industrial Wear',
    basePrice: 1650,
    unitCost: 850,
    minOrder: 10,
    leadTimeDays: 4,
    stockOnHand: 150,
    image: highVisSafetyVestImg,
    tagline: 'KEBS & OSHA compliant heavy-duty fluorescent vest with 360° prism reflective tapes',
    colors: [
      { name: 'Safety Fluorescent Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]' },
      { name: 'Safety Fluorescent Yellow', hex: '#CA8A04', bgClass: 'bg-[#CA8A04]' },
    ],
    sizes: ['M', 'L', 'XL', '2XL', '3XL'],
    fabricComp: '100% Breathable Warp-Knit Polyester',
    fabricWeight: '130 GSM',
    fabricFeatures: [
      '3M High-Gloss Micro-Prismatic Reflective Striping',
      'Heavy-duty front resin zipper',
      'Dual ID pocket & radio holder',
      'Anti-fray binding',
    ],
    description:
      'Kenyan manufactured high-visibility executive safety vest engineered for construction foremen, road contractors, mining inspectors, and aviation marshals.',
    idealFor: ['Civil Engineers', 'Mining & Port Staff', 'Construction Crews', 'Traffic & Security Officers'],
    customization: { embroidery: true, screenPrinting: true, wovenPatch: true, reflectiveStripes: true, heatTransfer: true },
  },
  {
    name: 'Tailored Academic School Blazer',
    category: 'school',
    categoryLabel: '3. School & Institutional Uniforms',
    basePrice: 3800,
    unitCost: 2100,
    minOrder: 20,
    leadTimeDays: 10,
    stockOnHand: 80,
    image: academicSchoolBlazerImg,
    tagline: 'Structured tailored blazer with reinforced brass button placket and bullion chest crest embroidery',
    colors: [
      { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
      { name: 'Maroon / Burgundy', hex: '#881337', bgClass: 'bg-[#881337]' },
      { name: 'Bottle Green', hex: '#14532D', bgClass: 'bg-[#14532D]' },
    ],
    sizes: ['Age 8-9', 'Age 10-11', 'Age 12-13', 'Adult S', 'Adult M', 'Adult L'],
    fabricComp: '65% Poly, 35% Viscose Suiting Twill with Satin Lining',
    fabricWeight: '270 GSM',
    fabricFeatures: [
      'Wrinkle-resistant resin finish',
      'Interior passport & pen pocket',
      'Double vented back for ease of movement',
      'Reinforced shoulder pads',
    ],
    description:
      'Premier academic blazer designed for prestigious Kenyan academies and high schools with custom chest embroidery and gold/silver piping options.',
    idealFor: ['High School Students', 'School Prefects', 'Choir & Debate Teams', 'Graduation Uniforms'],
    customization: { embroidery: true, screenPrinting: false, wovenPatch: true, reflectiveStripes: false, heatTransfer: false },
  },
  {
    name: 'Pro-Flex Medical Scrubs Set',
    category: 'healthcare',
    categoryLabel: '5. Medical & Healthcare Wear',
    basePrice: 2850,
    unitCost: 1400,
    minOrder: 5,
    leadTimeDays: 5,
    stockOnHand: 110,
    image: medicalScrubSetImg,
    tagline: '4-way stretch antimicrobial V-neck scrub top and multi-pocket cargo jogger pant',
    colors: [
      { name: 'Ceil Sky Blue', hex: '#38BDF8', bgClass: 'bg-[#38BDF8]' },
      { name: 'Teal Scrub Green', hex: '#0D9488', bgClass: 'bg-[#0D9488]' },
      { name: 'Deep Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    fabricComp: '72% Poly, 21% Rayon, 7% Spandex Silky Weave',
    fabricWeight: '190 GSM',
    fabricFeatures: [
      'Fluid-barrier antimicrobial silver-ion weave',
      'Moisture-wicking cool dry tech',
      '6 utility cargo pockets',
      'Reinforced knee stitching',
    ],
    description:
      'Engineered for intensive 12-hour hospital shifts, theatre nurses, surgeons, and dental staff in Kenya with ultra-comfortable stretch fabric.',
    idealFor: ['Doctors & Surgeons', 'Nurses & Midwives', 'Pharmacy Technicians', 'Dental Clinics'],
    customization: { embroidery: true, screenPrinting: false, wovenPatch: true, reflectiveStripes: false, heatTransfer: true },
  },
  {
    name: 'Executive Master Chef Jacket',
    category: 'hospitality',
    categoryLabel: '6. Hospitality & Restaurant Wear',
    basePrice: 2950,
    unitCost: 1550,
    minOrder: 5,
    leadTimeDays: 6,
    stockOnHand: 75,
    image: chefJacketExecutiveImg,
    tagline: 'Double-breasted breathable hospitality chef coat with French cuffs and underarm mesh vents',
    colors: [
      { name: 'Crisp White', hex: '#F8FAFC', bgClass: 'bg-[#F8FAFC]' },
      { name: 'Classic Black', hex: '#18181B', bgClass: 'bg-[#18181B]' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    fabricComp: '100% Ring-Spun Egyptian Cotton Twill',
    fabricWeight: '220 GSM',
    fabricFeatures: [
      'Underarm Cool-Vent mesh airflow',
      'Cloth covered knot buttons',
      'Reversible front closure',
      'Thermometer / spoon sleeve pocket',
    ],
    description:
      'Designed for head chefs, culinary colleges, luxury hotel kitchen staff, and bakeries. Resists grease, high heat, and commercial laundering.',
    idealFor: ['Executive Chefs', 'Pastry Bakers', 'Hotel Kitchen Staff', 'Culinary Institutes'],
    customization: { embroidery: true, screenPrinting: false, wovenPatch: true, reflectiveStripes: false, heatTransfer: false },
  },
  {
    name: 'Corporate Performance Pique Polo',
    category: 'corporate',
    categoryLabel: '2. Corporate Wear',
    basePrice: 1950,
    unitCost: 1050,
    minOrder: 10,
    leadTimeDays: 5,
    stockOnHand: 200,
    image: corporateServicePoloImg,
    tagline: 'Subtle honeycomb pique weave with anti-curl collar and corporate chest logo embroidery',
    colors: [
      { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
      { name: 'Crisp White', hex: '#F8FAFC', bgClass: 'bg-[#F8FAFC]' },
      { name: 'Heather Grey', hex: '#94A3B8', bgClass: 'bg-[#94A3B8]' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    fabricComp: '100% Combed Compact Cotton Pique',
    fabricWeight: '220 GSM',
    fabricFeatures: [
      'Anti-curl knitted collar & cuffs',
      'Colorfast reactive dye',
      'Side vents with contrast herringbone tape',
      'Double-needle hem',
    ],
    description:
      'Smart casual corporate uniforms for banks, tech companies, sales executives, and field staff across Nairobi and East Africa.',
    idealFor: ['Bank & Telecom Staff', 'Field Service Engineers', 'Retail Store Associates', 'Corporate Events'],
    customization: { embroidery: true, screenPrinting: true, wovenPatch: true, reflectiveStripes: false, heatTransfer: true },
  },
  {
    name: 'Heavy-Duty Workwear Boiler Suit',
    category: 'safety_industrial',
    categoryLabel: '1. Safety & Industrial Wear',
    basePrice: 3400,
    unitCost: 1750,
    minOrder: 10,
    leadTimeDays: 7,
    stockOnHand: 90,
    image: industrialWorkwearOverallImg,
    tagline: 'Triple-stitched 100% cotton drill overall with heavy-duty two-way brass zipper',
    colors: [
      { name: 'Deep Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' },
      { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
      { name: 'Safety Fluorescent Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]' },
    ],
    sizes: ['36', '38', '40', '42', '44', '46', '48'],
    fabricComp: '100% Heavy Cotton Drill',
    fabricWeight: '310 GSM',
    fabricFeatures: [
      'Two-way heavy brass zip',
      'Elasticated action-back waistband',
      'Bar-tacked stress points',
      'Deep tool & rule pockets',
    ],
    description:
      'Built for mechanics, factory operators, oil refineries, and industrial manufacturing plants in Kenya requiring maximum protection and durability.',
    idealFor: ['Auto Mechanics', 'Factory Machine Operators', 'Electricians & Welders', 'Maintenance Crews'],
    customization: { embroidery: true, screenPrinting: true, wovenPatch: true, reflectiveStripes: true, heatTransfer: true },
  },
];

const PRESET_GARMENT_IMAGES = [
  { name: 'High-Vis Safety Vest / Jacket', category: 'safety_industrial', url: highVisSafetyVestImg },
  { name: 'Heavy-Duty Workwear Boiler Suit', category: 'safety_industrial', url: industrialWorkwearOverallImg },
  { name: 'Tailored Academic Blazer', category: 'school', url: academicSchoolBlazerImg },
  { name: 'School Knit Sweater', category: 'school', url: schoolKnitSweaterImg },
  { name: 'School Sports Tracksuit', category: 'school', url: schoolTracksuitJacketImg },
  { name: 'School Pique Polo', category: 'school', url: schoolPiquePoloImg },
  { name: 'Corporate Performance Polo', category: 'corporate', url: corporateServicePoloImg },
  { name: 'Pro-Flex Medical Scrubs Set', category: 'healthcare', url: medicalScrubSetImg },
  { name: 'Executive Master Chef Jacket', category: 'hospitality', url: chefJacketExecutiveImg },
  { name: 'Bistro Canvas Barista Apron', category: 'hospitality', url: canvasBaristaApronImg },
  { name: 'Custom Varsity Letterman Jacket', category: 'sportswear', url: varsityLettermanJacketImg },
  { name: 'Heritage Fleece Pullover Hoodie', category: 'sportswear', url: fleecePulloverHoodieImg },
  { name: 'Doctor Medical Lab Coat', category: 'healthcare', url: medicalScrubsAlternativeImg },
  { name: 'Sublimated Football Team Jersey', category: 'sportswear', url: varsityJacketAlternativeImg },
];

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
  { name: 'Deep Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' },
  { name: 'Crisp White', hex: '#F8FAFC', bgClass: 'bg-[#F8FAFC]' },
  { name: 'Heather Grey', hex: '#94A3B8', bgClass: 'bg-[#94A3B8]' },
  { name: 'Bottle Green', hex: '#14532D', bgClass: 'bg-[#14532D]' },
  { name: 'Maroon / Burgundy', hex: '#881337', bgClass: 'bg-[#881337]' },
  { name: 'Classic Black', hex: '#18181B', bgClass: 'bg-[#18181B]' },
  { name: 'Ceil Sky Blue', hex: '#38BDF8', bgClass: 'bg-[#38BDF8]' },
  { name: 'Teal Scrub Green', hex: '#0D9488', bgClass: 'bg-[#0D9488]' },
  { name: 'Safety Fluorescent Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]' },
  { name: 'Safety Fluorescent Yellow', hex: '#CA8A04', bgClass: 'bg-[#CA8A04]' },
];

const SIZE_PRESETS = [
  {
    name: 'Primary School (Age 4-13)',
    sizes: ['Age 4-5', 'Age 6-7', 'Age 8-9', 'Age 10-11', 'Age 12-13'],
  },
  {
    name: 'Youth & Adult Standard (S-3XL)',
    sizes: ['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L', 'Adult XL', 'Adult 2XL'],
  },
  {
    name: 'Industrial Workwear (Waist/Chest 32-46)',
    sizes: ['Size 32', 'Size 34', 'Size 36', 'Size 38', 'Size 40', 'Size 42', 'Size 44', 'Size 46'],
  },
  {
    name: 'Standard One-Size',
    sizes: ['Standard Free Size'],
  },
];

type StageStep = 1 | 2 | 3 | 4 | 5;

export const ERPProductEditModal: React.FC<ERPProductEditModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onViewOnStorefront,
}) => {
  const { addProduct, updateProduct } = useERP();

  // Workflow View Mode: 'stepper' (guided in order 1->2->3->4->5) or 'all' (wide full-canvas overview)
  const [viewLayout, setViewLayout] = useState<'stepper' | 'all'>('stepper');
  const [activeStep, setActiveStep] = useState<StageStep>(1);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<UniformCategory>('school');
  const [categoryLabel, setCategoryLabel] = useState('School & Institutional Uniforms');
  const [sku, setSku] = useState('');
  const [basePrice, setBasePrice] = useState<number>(3500);
  const [unitCost, setUnitCost] = useState<number>(2000);
  const [minOrder, setMinOrder] = useState<number>(25);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(10);
  const [stockOnHand, setStockOnHand] = useState<number>(100);
  const [stockReserved, setStockReserved] = useState<number>(15);
  const [location, setLocation] = useState('Warehouse Bay A, Rack 2');
  const [supplier, setSupplier] = useState('Nasisi Internal Tailoring Unit');
  const [published, setPublished] = useState<boolean>(true);
  const [badge, setBadge] = useState<string>('');
  const [popular, setPopular] = useState<boolean>(false);

  // Multi-image studio state
  const [images, setImages] = useState<string[]>([PRESET_GARMENT_IMAGES[2].url]);
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'presets' | 'url'>('presets');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isImageDragging, setIsImageDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Description & specs
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<{ name: string; hex: string; bgClass: string }[]>([
    { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
    { name: 'Deep Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' },
  ]);
  const [sizes, setSizes] = useState<string[]>([
    'Age 4-5',
    'Age 6-7',
    'Age 8-9',
    'Youth S',
    'Youth M',
    'Youth L',
    'Adult S',
    'Adult M',
    'Adult L',
    'Adult XL',
  ]);
  const [fabricComp, setFabricComp] = useState('65% Polyester, 35% Combed Viscose Suiting');
  const [fabricWeight, setFabricWeight] = useState('280 GSM');
  const [fabricFeatures, setFabricFeatures] = useState<string[]>([
    'Teflon stain-repellent finish',
    'High tensile double-stitch seams',
    'Crease-resistant shape retention',
  ]);
  const [customization, setCustomization] = useState({
    embroidery: true,
    screenPrinting: true,
    wovenPatch: true,
    reflectiveStripes: false,
    heatTransfer: true,
  });
  const [idealFor, setIdealFor] = useState<string[]>([
    'Junior & Senior School Students',
    'Academy Prefects & Staff',
  ]);

  // Temporary inputs
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#06163c');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newIdealInput, setNewIdealInput] = useState('');

  // Populate or reset form
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setTagline(productToEdit.tagline || '');
      setCategory(productToEdit.category || 'school');
      setCategoryLabel(productToEdit.categoryLabel || 'School & Institutional Uniforms');
      setSku(
        productToEdit.sku ||
          `SKU-GAR-${(productToEdit.category || 'SCH').substring(0, 3).toUpperCase()}-${Math.floor(
            100 + Math.random() * 900
          )}`
      );
      setBasePrice(productToEdit.basePrice || 0);
      setUnitCost(productToEdit.unitCost || Math.round((productToEdit.basePrice || 0) * 0.58));
      setMinOrder(productToEdit.minOrder || 10);
      setLeadTimeDays(productToEdit.leadTimeDays || 10);
      setStockOnHand(productToEdit.stockOnHand ?? 75);
      setStockReserved(productToEdit.stockReserved ?? 10);
      setLocation(productToEdit.location || 'Warehouse Bay A');
      setSupplier(productToEdit.supplier || 'Nasisi Internal Tailoring Unit');
      setPublished(productToEdit.published !== false);
      setBadge(productToEdit.badge || '');
      setPopular(!!productToEdit.popular);
      const initialImgs =
        productToEdit.images && productToEdit.images.length > 0
          ? productToEdit.images
          : productToEdit.image
          ? [productToEdit.image]
          : [PRESET_GARMENT_IMAGES[2].url];
      setImages(initialImgs);
      setActivePreviewIdx(0);
      setDescription(productToEdit.description || '');
      setColors(productToEdit.availableColors || []);
      setSizes(productToEdit.sizes || []);
      setFabricComp(productToEdit.fabric?.composition || '65% Polyester, 35% Viscose');
      setFabricWeight(productToEdit.fabric?.weight || '260 GSM');
      setFabricFeatures(productToEdit.fabric?.features || ['Double-stitched seams', 'Stain-repellent']);
      setCustomization({
        embroidery: !!productToEdit.customizationOptions?.embroidery,
        screenPrinting: !!productToEdit.customizationOptions?.screenPrinting,
        wovenPatch: !!productToEdit.customizationOptions?.wovenPatch,
        reflectiveStripes: !!productToEdit.customizationOptions?.reflectiveStripes,
        heatTransfer: !!productToEdit.customizationOptions?.heatTransfer,
      });
      setIdealFor(productToEdit.idealFor || []);
    } else {
      setName('');
      setTagline('Kenyan Manufactured Institutional Apparel');
      setCategory('school');
      setCategoryLabel('3. School & Institutional Uniforms');
      setSku(`SKU-GAR-SCH-${Math.floor(100 + Math.random() * 900)}`);
      setBasePrice(3200);
      setUnitCost(1850);
      setMinOrder(20);
      setLeadTimeDays(10);
      setStockOnHand(120);
      setStockReserved(10);
      setLocation('Warehouse Rack A-1');
      setSupplier('Nasisi Internal Tailoring Unit');
      setPublished(true);
      setBadge('New Platform SKU');
      setPopular(false);
      setImages([PRESET_GARMENT_IMAGES[2].url]);
      setActivePreviewIdx(0);
      setDescription(
        'Precision engineered uniform garment manufactured in Kenya with reinforced stress points, anti-shrink dyes, and commercial laundering endurance.'
      );
      setColors([
        { name: 'Royal Blue', hex: '#06163c', bgClass: 'bg-[#06163c]' },
        { name: 'Deep Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' },
      ]);
      setSizes(['Youth S', 'Youth M', 'Youth L', 'Adult S', 'Adult M', 'Adult L']);
      setFabricComp('65% Polyester, 35% Viscose Suiting');
      setFabricWeight('260 GSM');
      setFabricFeatures([
        'Anti-pill surface finish',
        'Double-stitched seams with bonded poly thread',
        'Colorfast under UV & hot wash cycles',
      ]);
      setCustomization({
        embroidery: true,
        screenPrinting: true,
        wovenPatch: true,
        reflectiveStripes: false,
        heatTransfer: true,
      });
      setIdealFor(['Academic Uniforms', 'School & College Students']);
    }
    setActiveStep(1);
  }, [productToEdit, isOpen]);

  // Image actions
  const handleAddImage = (url: string) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    setImages((prev) => (prev.includes(cleanUrl) ? prev : [...prev, cleanUrl]));
    setCustomUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert('A product must maintain at least one photo.');
      return;
    }
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activePreviewIdx >= next.length) {
        setActivePreviewIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [selected, ...remaining];
    });
    setActivePreviewIdx(0);
  };

  const handleMultipleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    setUploadedFileName(`Uploaded ${validFiles.length} photo(s)`);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          handleAddImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Sizing and specs helpers
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setColors((prev) => [
      ...prev,
      {
        name: newColorName.trim(),
        hex: newColorHex,
        bgClass: `bg-[${newColorHex}]`,
      },
    ]);
    setNewColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSize = () => {
    if (!newSizeInput.trim() || sizes.includes(newSizeInput.trim())) return;
    setSizes((prev) => [...prev, newSizeInput.trim()]);
    setNewSizeInput('');
  };

  const handleRemoveSize = (val: string) => {
    setSizes((prev) => prev.filter((s) => s !== val));
  };

  const handleApplySizePreset = (presetSizes: string[]) => {
    setSizes(presetSizes);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFabricFeatures((prev) => [...prev, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFabricFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddIdeal = () => {
    if (!newIdealInput.trim()) return;
    setIdealFor((prev) => [...prev, newIdealInput.trim()]);
    setNewIdealInput('');
  };

  const handleRemoveIdeal = (idx: number) => {
    setIdealFor((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCategoryChange = (newCat: UniformCategory) => {
    setCategory(newCat);
    const opt = CATEGORY_OPTIONS.find((c) => c.id === newCat);
    if (opt) setCategoryLabel(opt.label);

    // Auto-update SKU prefix if user hasn't made custom edits
    const prefix = (newCat || 'GAR').substring(0, 3).toUpperCase();
    setSku(`SKU-GAR-${prefix}-${Math.floor(100 + Math.random() * 900)}`);
  };

  // 1-Click Fast Template Applicator
  const handleApplyTemplate = (tmpl: GarmentTemplate) => {
    setName(tmpl.name);
    setCategory(tmpl.category);
    setCategoryLabel(tmpl.categoryLabel);
    setBasePrice(tmpl.basePrice);
    setUnitCost(tmpl.unitCost);
    setMinOrder(tmpl.minOrder);
    setLeadTimeDays(tmpl.leadTimeDays);
    setStockOnHand(tmpl.stockOnHand);
    setTagline(tmpl.tagline);
    setImages([tmpl.image]);
    setActivePreviewIdx(0);
    setColors(tmpl.colors);
    setSizes(tmpl.sizes);
    setFabricComp(tmpl.fabricComp);
    setFabricWeight(tmpl.fabricWeight);
    setFabricFeatures(tmpl.fabricFeatures);
    setDescription(tmpl.description);
    setIdealFor(tmpl.idealFor);
    setCustomization({
      embroidery: !!tmpl.customization.embroidery,
      screenPrinting: !!tmpl.customization.screenPrinting,
      heatTransfer: !!tmpl.customization.heatTransfer,
      reflectiveStripes: !!tmpl.customization.reflectiveStripes,
      wovenPatch: !!tmpl.customization.wovenPatch,
    });
    const prefix = tmpl.category.substring(0, 3).toUpperCase();
    setSku(`SKU-GAR-${prefix}-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Save product payload with optional direct redirect to live storefront
  const handleSave = (e?: React.FormEvent, andViewOnStorefront: boolean = false) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name.');
      setActiveStep(1);
      return;
    }

    const finalImages = images.length > 0 ? images : [PRESET_GARMENT_IMAGES[2].url];
    const primaryImage = finalImages[0] || PRESET_GARMENT_IMAGES[2].url;

    const payload: UniformProduct = {
      id: productToEdit?.id || `prod-${Date.now()}`,
      name: name.trim(),
      tagline: tagline.trim() || 'Premium Kenyan Manufactured Garment',
      category,
      categoryLabel,
      basePrice: Number(basePrice) || 0,
      unitCost: Number(unitCost) || 0,
      minOrder: Number(minOrder) || 1,
      leadTimeDays: Number(leadTimeDays) || 10,
      leadTime: `${leadTimeDays || 10} Business Days`,
      stockOnHand: Number(stockOnHand) || 0,
      stockReserved: Number(stockReserved) || 0,
      location: location.trim() || 'Warehouse Main Bay',
      supplier: supplier.trim() || 'Nasisi Internal Tailoring Unit',
      published: published !== false,
      badge: badge.trim() || undefined,
      popular: !!popular,
      sku: sku.trim() || `SKU-GAR-${category.toUpperCase()}-101`,
      image: primaryImage,
      images: finalImages,
      availableColors:
        colors.length > 0
          ? colors
          : [{ name: 'Navy', hex: '#0F172A', bgClass: 'bg-[#0F172A]' }],
      sizes: sizes.length > 0 ? sizes : ['Standard'],
      fabric: {
        composition: fabricComp || '65% Polyester, 35% Viscose Suiting',
        weight: fabricWeight || '260 GSM',
        features: fabricFeatures,
      },
      customizationOptions: {
        ...customization,
        customStitching: true,
      },
      description: description.trim() || `${name} manufactured with industrial-grade tailoring.`,
      idealFor,
    };

    let resultProduct: UniformProduct;
    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
      resultProduct = { ...productToEdit, ...payload };
    } else {
      resultProduct = addProduct(payload);
    }

    onClose();

    if (andViewOnStorefront && onViewOnStorefront) {
      onViewOnStorefront(resultProduct);
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Keyboard shortcut: Ctrl+S / Cmd+S for save, Ctrl+Enter / Cmd+Enter for save & view live on storefront
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveRef.current(undefined, true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveRef.current(undefined, false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Estimated gross profit margin
  const grossMarginKsh = Math.max(0, basePrice - unitCost);
  const grossMarginPercent = basePrice > 0 ? Math.round((grossMarginKsh / basePrice) * 100) : 0;
  const totalStockAssetKsh = (stockOnHand || 0) * (basePrice || 0);

  const STEPS_CONFIG: { step: StageStep; label: string; short: string; icon: any }[] = [
    { step: 1, label: '1. Identity & Category', short: 'Identity', icon: Tag },
    { step: 2, label: '2. Multi-Angle Photos', short: 'Photos', icon: FileImage },
    { step: 3, label: '3. Pricing & Logistics', short: 'Pricing', icon: DollarSign },
    { step: 4, label: '4. Sizing & Fabric Specs', short: 'Specs', icon: Scissors },
    { step: 5, label: '5. Copy & Target Audience', short: 'Overview', icon: FileText },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
        {/* WIDE MODAL CONTAINER (max-w-7xl) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {/* 1. Modal Top Bar */}
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#06163c] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-blue-950 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base md:text-lg font-black font-['Outfit'] tracking-wide truncate">
                    {productToEdit ? `Edit Garment: ${productToEdit.name}` : 'Create New Garment SKU & Catalog Item'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-900/60 text-sky-300 border border-blue-700/50">
                    {sku || 'SKU-PENDING'}
                  </span>
                </div>
                <p className="text-xs text-blue-200/90 truncate hidden xs:block">
                  Structured multi-step garment creation engine with live inventory & pricing synchronization.
                </p>
              </div>
            </div>

            {/* Top Quick Actions with Prominent Primary Save Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 self-stretch sm:self-auto justify-end shrink-0">
              {/* Layout Switcher: Step-by-step or Wide Full-Form */}
              <div className="inline-flex p-0.5 bg-blue-950/80 rounded-xl text-xs font-bold border border-blue-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewLayout('stepper')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === 'stepper'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-300 hover:text-white'
                  }`}
                  title="Navigate step-by-step in ordered sequence"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Guided Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('all')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-300 hover:text-white'
                  }`}
                  title="Display all sections together on a wide canvas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Wide Full Form</span>
                </button>
              </div>

              {/* PUBLISH & VIEW LIVE STOREFRONT BUTTON */}
              <button
                type="button"
                id="btn-modal-top-save-and-view"
                onClick={() => handleSave(undefined, true)}
                className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_22px_rgba(37,99,235,0.5)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-sky-400/40 shrink-0"
                title="Publish product and view live on customer storefront immediately (Ctrl+Enter / ⌘Enter)"
              >
                <Eye className="w-4 h-4 text-sky-200 shrink-0" />
                <span className="tracking-wide hidden xs:inline">Publish & View Live</span>
                <span className="tracking-wide xs:hidden">View Live</span>
                <span className="hidden xl:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/80 text-sky-200 border border-blue-500/50">
                  ⌘↵
                </span>
              </button>

              {/* PRIMARY PROMINENT TOP SAVE BUTTON */}
              <button
                type="button"
                id="btn-modal-top-save"
                onClick={() => handleSave()}
                className="px-3.5 sm:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 border border-emerald-400/40 shrink-0"
                title="Quick Save Garment SKU (Ctrl+S / ⌘S)"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="tracking-wide">
                  {productToEdit ? 'Save Changes' : 'Save Product'}
                </span>
                <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-600/50">
                  ⌘S
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Structured Order Navigation Stepper */}
          {viewLayout === 'stepper' && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 overflow-x-auto shrink-0">
              <div className="flex items-center justify-between gap-2 min-w-[650px]">
                {STEPS_CONFIG.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeStep === item.step;
                  const isDone = activeStep > item.step;

                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveStep(item.step)}
                      className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#06163c] text-white shadow-sm ring-2 ring-blue-500/20'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isActive
                            ? 'bg-sky-400 text-[#06163c]'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isDone ? '✓' : item.step}
                      </span>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Form Content Body */}
          <form onSubmit={(e) => handleSave(e)} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-8">
            {/* STICKY TOP QUICK-SAVE BANNER */}
            <div className="sticky top-0 z-20 -mx-5 sm:-mx-7 -mt-5 sm:-mt-7 mb-4 px-5 sm:px-7 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {name.trim() || (productToEdit ? productToEdit.name : 'New Garment SKU (Draft)')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {sku || 'SKU-PENDING'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2 mt-0.5">
                    <span>Category: <strong className="text-slate-700">{categoryLabel}</strong></span>
                    <span>•</span>
                    <span>Price: <strong className="text-emerald-700 font-mono">Ksh {Number(basePrice || 0).toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Stock: <strong className="text-blue-900 font-mono">{stockOnHand || 0} pcs</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-sticky-top-save-action"
                  onClick={() => handleSave()}
                  className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-emerald-400/40"
                  title="Save Garment SKU & Sync Instantly (Ctrl+S / ⌘S)"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>{productToEdit ? 'Save Changes Now' : 'Save Product Now'}</span>
                </button>
              </div>
            </div>

            {/* STAGE 1: IDENTITY & CATEGORY */}
            {(viewLayout === 'all' || activeStep === 1) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#06163c] text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 font-['Outfit']">
                      Garment Identity, Classification & SKU Code
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Essential storefront & catalog taxonomy</span>
                </div>

                {/* Publishing State & Visibility Ribbon */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        published ? 'bg-emerald-500 ring-4 ring-emerald-200 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Storefront Status: {published ? '✓ Live & Published' : 'Draft / Factory Internal'}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {published
                          ? 'Garment is visible in the public catalog, 3D customizer, and quotation estimator.'
                          : 'Hidden from public storefront. Visible only to factory administrators in ERP.'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPublished(!published)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      published
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {published ? '✓ Published (Click to Draft)' : 'Draft (Click to Publish)'}
                  </button>
                </div>

                {/* 1-Click Kenyan Garment Fast Templates */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-900/60 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                        1-Click Ready-to-Post Garment Templates
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-200/70">
                      Click any preset below to auto-fill specs, Kenyan pricing & images instantly
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20">
                    {PRODUCT_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.name}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 border border-white/15 text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 group active:scale-95 shadow-xs"
                      >
                        <img
                          src={tmpl.image}
                          alt={tmpl.name}
                          className="w-5 h-5 rounded-lg object-cover border border-white/20"
                        />
                        <span>{tmpl.name}</span>
                        <span className="text-[10px] opacity-75 group-hover:opacity-100 font-mono bg-black/20 group-hover:bg-cyan-900/20 px-1.5 py-0.5 rounded">
                          Ksh {tmpl.basePrice.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wide Grid for Name, SKU, Category, and Tagline */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Garment Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tailored Academic School Blazer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Platform Uniform Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as UniformCategory)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800 cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Garment SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BLZ-NAV-01"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Garment Tagline / Short Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Precision structured suiting with bespoke crest embroidery"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Ribbon Badge (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Best Seller, Anti-Stain, New"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 flex flex-col justify-end">
                    <label className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={popular}
                        onChange={(e) => setPopular(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        ⭐ Pin to Featured Showcase
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: MULTI-ANGLE PHOTO STUDIO (Wide 2-Column Studio) */}
            {(viewLayout === 'all' || activeStep === 2) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#06163c] text-white flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 font-['Outfit']">
                      High-Resolution Multi-Angle Photography Studio
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {images.length} angle(s) loaded • First image is storefront primary cover
                  </span>
                </div>

                {/* Wide 2-Column Photography Studio Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/80 p-5 rounded-3xl border border-slate-200">
                  {/* Left Column (5 cols): Large Showcase Preview */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border-2 border-slate-200 shadow-inner group">
                      <img
                        src={images[activePreviewIdx] || images[0] || PRESET_GARMENT_IMAGES[2].url}
                        alt={`Garment angle ${activePreviewIdx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {/* Primary Cover Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        {activePreviewIdx === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-md">
                            <Star className="w-3.5 h-3.5 fill-white" />
                            Primary Storefront Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(activePreviewIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-[#06163c] hover:bg-[#06163c] hover:text-white shadow-md transition-all cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            Make Primary Cover
                          </button>
                        )}
                      </div>

                      {/* Controls dock inside preview */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold z-10 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm pointer-events-auto">
                          Photo {activePreviewIdx + 1} of {images.length}
                        </span>

                        <div className="flex items-center gap-1 pointer-events-auto">
                          {images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePreviewIdx((prev) =>
                                    prev > 0 ? prev - 1 : images.length - 1
                                  )
                                }
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm cursor-pointer"
                                title="Previous photo"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePreviewIdx((prev) => (prev + 1) % images.length)
                                }
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm cursor-pointer"
                                title="Next photo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(activePreviewIdx)}
                                className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-700 text-white backdrop-blur-sm ml-1 cursor-pointer"
                                title="Delete this angle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center">
                      Tip: Multiple angles (Front, Back, Stitching Close-up, Collar) dramatically increase institutional quote requests.
                    </p>
                  </div>

                  {/* Right Column (7 cols): Thumbnails strip + Multi-Source Picker */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Multi-angle Attached Strip */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Attached Angle Thumbnails ({images.length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Click to preview • Reorder by setting cover
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5 p-2 bg-white rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                        {images.map((imgUrl, idx) => {
                          const isCurrent = activePreviewIdx === idx;
                          const isCover = idx === 0;

                          return (
                            <div
                              key={idx}
                              onClick={() => setActivePreviewIdx(idx)}
                              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all group shrink-0 ${
                                isCurrent
                                  ? 'border-[#06163c] ring-2 ring-blue-500/40 shadow-md scale-105'
                                  : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Thumb ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {isCover && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-600 text-white shadow-xs">
                                  Cover
                                </span>
                              )}
                              {images.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(idx);
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove photo"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                              <span className="absolute bottom-1 right-1 px-1 rounded text-[8px] font-bold bg-black/60 text-white font-mono">
                                #{idx + 1}
                              </span>
                            </div>
                          );
                        })}

                        {/* Add Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            if (imageSourceMode === 'upload') {
                              fileInputRef.current?.click();
                            } else {
                              setImageSourceMode('upload');
                              setTimeout(() => fileInputRef.current?.click(), 50);
                            }
                          }}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#06163c] bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-500 hover:text-[#06163c] transition-colors shrink-0 cursor-pointer"
                        >
                          <Plus className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">+ Photo</span>
                        </button>
                      </div>
                    </div>

                    {/* Source Mode Tabs */}
                    <div className="space-y-3 pt-2">
                      <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('presets')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            imageSourceMode === 'presets'
                              ? 'bg-white text-[#06163c] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <FileImage className="w-3.5 h-3.5" />
                          <span>Factory Curated Library</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('upload')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            imageSourceMode === 'upload'
                              ? 'bg-white text-[#06163c] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Multi-File Upload</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceMode('url')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            imageSourceMode === 'url'
                              ? 'bg-white text-[#06163c] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Web Asset URL</span>
                        </button>
                      </div>

                      {/* Source A: Curated Presets Grid */}
                      {imageSourceMode === 'presets' && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-500">
                            Click any factory garment photo below to add it as an angle to this product:
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-2xl border border-slate-200">
                            {PRESET_GARMENT_IMAGES.map((preset, idx) => {
                              const alreadyAdded = images.includes(preset.url);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleAddImage(preset.url)}
                                  className={`p-1.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                                    alreadyAdded
                                      ? 'bg-emerald-50 border-emerald-300'
                                      : 'bg-slate-50 hover:bg-blue-50 border-slate-200'
                                  }`}
                                >
                                  <img
                                    src={preset.url}
                                    alt={preset.name}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[11px] font-bold text-slate-900 block truncate">
                                      {preset.name}
                                    </span>
                                    <span className="text-[9px] text-slate-500 capitalize truncate block">
                                      {alreadyAdded ? '✓ Added' : '+ Add Angle'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Source B: Multi-File Upload */}
                      {imageSourceMode === 'upload' && (
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleMultipleFiles(e.target.files)}
                          />

                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsImageDragging(true);
                            }}
                            onDragLeave={() => setIsImageDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsImageDragging(false);
                              handleMultipleFiles(e.dataTransfer.files);
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                              isImageDragging
                                ? 'border-[#06163c] bg-blue-100/50 scale-[1.01]'
                                : 'border-slate-300 hover:border-[#06163c] bg-white hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="p-2.5 bg-blue-50 text-[#06163c] rounded-full">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Choose Multiple Photos or Drag & Drop Here
                            </span>
                            <p className="text-[10px] text-slate-500 max-w-sm">
                              Select front, back, side and fabric close-up images at once. Supports JPG, PNG, WebP.
                            </p>
                          </div>

                          {uploadedFileName && (
                            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold">
                              <span>✓ {uploadedFileName}</span>
                              <button
                                type="button"
                                onClick={() => setUploadedFileName('')}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Source C: Direct URL */}
                      {imageSourceMode === 'url' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://example.com/high-res-garment.jpg"
                              value={customUrlInput}
                              onChange={(e) => setCustomUrlInput(e.target.value)}
                              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddImage(customUrlInput)}
                              disabled={!customUrlInput.trim()}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#06163c] hover:bg-blue-900 text-white disabled:opacity-50 cursor-pointer"
                            >
                              Add URL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: COMMERCIAL PRICING & LOGISTICS (Wide 4-Column Layout) */}
            {(viewLayout === 'all' || activeStep === 3) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#06163c] text-white flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 font-['Outfit']">
                      Commercial Pricing, Production Costing & Stock Logistics
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Real-time margin & warehouse asset valuation</span>
                </div>

                {/* Real-Time Commercial Profitability Card */}
                <div className="p-5 rounded-2xl bg-[#06163c] text-white flex flex-wrap items-center justify-between gap-6 shadow-md border border-blue-950">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-sky-300 font-black">
                      Gross Profit Margin Per Unit
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                      {formatKsh(grossMarginKsh)}{' '}
                      <span className="text-sm font-bold text-emerald-200">({grossMarginPercent}%)</span>
                    </div>
                    <span className="text-[11px] text-slate-300">
                      Selling Price ({formatKsh(basePrice)}) - Production Cost ({formatKsh(unitCost)})
                    </span>
                  </div>

                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-[10px] uppercase tracking-widest text-sky-300 font-black">
                      Total Stock Asset Valuation
                    </span>
                    <div className="text-xl sm:text-2xl font-black font-mono text-sky-300">
                      {formatKsh(totalStockAssetKsh)}
                    </div>
                    <span className="text-[11px] text-slate-300">
                      {stockOnHand} units on hand in inventory
                    </span>
                  </div>
                </div>

                {/* 4-Column Inputs: Financials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Selling Price (Ksh) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Production Cost Basis (Ksh)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Minimum Order Qty (MOQ)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minOrder}
                      onChange={(e) => setMinOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Production Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* 4-Column Inputs: Warehouse Logistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Stock On Hand (Available)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockOnHand}
                      onChange={(e) => setStockOnHand(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Stock Reserved (In Production)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockReserved}
                      onChange={(e) => setStockReserved(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Warehouse Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Main Warehouse, Bay A"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Internal Unit / Supplier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nasisi Tailoring Unit"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: SIZING, COLORS & FABRIC SPECIFICATIONS */}
            {(viewLayout === 'all' || activeStep === 4) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#06163c] text-white flex items-center justify-center text-xs font-black">
                      4
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 font-['Outfit']">
                      Sizing Matrix, Color Swatches & Fabric Specifications
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {colors.length} color(s) • {sizes.length} size(s)
                  </span>
                </div>

                {/* 2-Column Layout for Colors vs Sizing Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Color Swatches */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Available Color Swatches
                      </span>
                      <span className="text-[11px] text-slate-500">{colors.length} active swatches</span>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 min-h-12 p-2 bg-white rounded-xl border border-slate-200">
                      {colors.map((col, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs">{col.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(idx)}
                            className="p-0.5 hover:text-rose-600 rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Color */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Color name (e.g. Maroon Burgundy)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1 min-w-[140px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-4 py-2 bg-[#06163c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        + Add Color
                      </button>
                    </div>

                    {/* Quick Color Presets */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">
                        Quick Preset Swatches:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.map((pc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (!colors.some((c) => c.name === pc.name)) {
                                setColors((prev) => [...prev, pc]);
                              }
                            }}
                            className="px-2 py-1 text-[10px] rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pc.hex }} />
                            <span>{pc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sizing Matrix */}
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Available Size Matrix
                      </span>
                      <span className="text-[11px] text-slate-500">{sizes.length} active sizes</span>
                    </div>

                    {/* Active Sizes Chips */}
                    <div className="flex flex-wrap gap-1.5 min-h-12 p-2 bg-white rounded-xl border border-slate-200">
                      {sizes.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 text-xs font-bold flex items-center gap-1.5"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(s)}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Custom Size */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add custom size (e.g. Size 38R, Age 10-11, 3XL)"
                        value={newSizeInput}
                        onChange={(e) => setNewSizeInput(e.target.value)}
                        className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddSize}
                        className="px-4 py-2 bg-[#06163c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        + Add Size
                      </button>
                    </div>

                    {/* Quick Sizing Template Buttons */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">
                        Quick Sizing Templates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySizePreset(preset.sizes)}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 cursor-pointer transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fabric Specifications & Features */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Fabric Technical Specifications & Durability
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Fabric Composition
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 65% Polyester, 35% Combed Viscose Suiting"
                        value={fabricComp}
                        onChange={(e) => setFabricComp(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Fabric GSM / Weight
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 280 GSM"
                        value={fabricWeight}
                        onChange={(e) => setFabricWeight(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  {/* Features tags */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Fabric & Durability Features Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {fabricFeatures.map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium flex items-center gap-1.5 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add feature (e.g. Stain-resistant, Double-stitched seams)..."
                        value={newFeatureInput}
                        onChange={(e) => setNewFeatureInput(e.target.value)}
                        className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-4 py-2 bg-[#06163c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>

                  {/* Customization Techniques Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Supported In-House Branding & Customization Techniques
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { key: 'embroidery', label: 'Tajima Direct Embroidery' },
                        { key: 'screenPrinting', label: 'Screen Printing' },
                        { key: 'wovenPatch', label: 'Woven Crest Patches' },
                        { key: 'reflectiveStripes', label: '3M Reflective Striping' },
                        { key: 'heatTransfer', label: 'Vinyl Heat Transfer' },
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-all ${
                            (customization as any)[opt.key]
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!(customization as any)[opt.key]}
                            onChange={(e) =>
                              setCustomization((prev) => ({
                                ...prev,
                                [opt.key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5: GARMENT DESCRIPTION & TARGET INSTITUTIONS */}
            {(viewLayout === 'all' || activeStep === 5) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#06163c] text-white flex items-center justify-center text-xs font-black">
                      5
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 font-['Outfit']">
                      Manufacturing Craftsmanship Description & Target Institutions
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Storefront customer overview</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Detailed Description */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Garment Craftsmanship & Catalog Description
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Detail the garment cut, tailoring construction, durability, stress points, and institutional benefits..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Ideal For / Target Audience */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Ideal For / Target Institutions & Industries
                    </label>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[96px] space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {idealFor.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIdeal(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="e.g. Secondary School Prefects, Safari Lodge Staff..."
                          value={newIdealInput}
                          onChange={(e) => setNewIdealInput(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddIdeal}
                          className="px-3.5 py-1.5 bg-[#06163c] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          + Add Target
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Modal Sticky Bottom Navigation & Actions */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white/95 backdrop-blur-md pb-2">
              {/* Stepper Progress or Info */}
              <div className="text-xs text-slate-500 flex items-center gap-3">
                {viewLayout === 'stepper' ? (
                  <span className="font-bold text-slate-700">
                    Step {activeStep} of 5: {STEPS_CONFIG[activeStep - 1].label}
                  </span>
                ) : (
                  <span className="font-bold text-slate-700">
                    Wide Full-Form Overview ({CATEGORY_OPTIONS.find((c) => c.id === category)?.label})
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Previous Step in Stepper Mode */}
                {viewLayout === 'stepper' && activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1) as StageStep)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                )}

                {/* Next Step in Stepper Mode */}
                {viewLayout === 'stepper' && activeStep < 5 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(5, prev + 1) as StageStep)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#06163c] hover:bg-blue-900 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: {STEPS_CONFIG[activeStep].short}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(undefined, true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-400/40"
                  title="Publish product and view live on storefront immediately"
                >
                  <Eye className="w-4 h-4 text-sky-200" />
                  <span>Publish & View Live</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>
                    {productToEdit ? 'Update Garment & Sync ERP' : 'Publish Garment SKU & Save'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
