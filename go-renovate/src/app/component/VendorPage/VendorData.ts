// import type { Vendor } from '../types/vendor';

import { Vendor } from "./vendor";

export const MOCK_VENDOR: Vendor = {
  id: 'vendor-001',
  name: 'Buildcraft Renovations',
  tagline: 'Crafting spaces that outlive trends.',
  rating: 4.7,
  reviewCount: 312,
  completedProjects: 480,
  yearsActive: 11,
  location: 'Bengaluru, Karnataka',
  responseTime: 'Responds within 2 hrs',
  verified: true,
  badges: ['Top Rated', 'On-time Delivery', 'Licensed & Insured'],
  categories: [
    {
      id: 'flooring',
      label: 'Flooring',
      icon: '🪵',
      services: [
        {
          id: 'fl-001',
          name: 'Vitrified Tile Installation',
          description:
            'Premium vitrified tiles laid with precision using waterproof adhesive. Includes levelling, grouting, and edge finishing.',
          price: 85,
          unit: 'sqft',
          materialTag: 'tile',
          estimatedDays: 3,
          popular: true,
          includes: ['Surface prep', 'Tile laying', 'Grouting', 'Edge beading'],
        },
        {
          id: 'fl-002',
          name: 'Engineered Wood Flooring',
          description:
            'European-style engineered hardwood with click-lock installation. Suitable for living rooms and bedrooms.',
          price: 145,
          unit: 'sqft',
          materialTag: 'wood',
          estimatedDays: 2,
          includes: ['Moisture barrier', 'Underlay', 'Click-lock planks', 'Skirting'],
        },
        {
          id: 'fl-003',
          name: 'Polished Concrete Flooring',
          description:
            'Industrial-finish concrete polished to a mirror sheen. Zero grout lines, seamless and durable.',
          price: 110,
          unit: 'sqft',
          materialTag: 'concrete',
          estimatedDays: 5,
          includes: ['Grinding', 'Sealing', 'Polishing (3 passes)', 'Hardener coat'],
        },
        {
          id: 'fl-004',
          name: 'Natural Marble Installation',
          description:
            'Imported marble slabs cut and laid with precision. Ideal for bathrooms, foyers, and feature walls.',
          price: 220,
          unit: 'sqft',
          materialTag: 'stone',
          estimatedDays: 4,
          popular: true,
          includes: ['Custom cuts', 'Epoxy jointing', 'Polishing', 'Sealing'],
        },
      ],
    },
    {
      id: 'painting',
      label: 'Painting',
      icon: '🎨',
      services: [
        {
          id: 'pt-001',
          name: 'Interior Wall Painting',
          description:
            'Premium emulsion paint, two coats over primer. Smooth finish with clean tape lines at transitions.',
          price: 18,
          unit: 'sqft',
          materialTag: 'paint',
          estimatedDays: 2,
          popular: true,
          includes: ['Wall prep', 'Primer coat', '2 finish coats', 'Furniture covering'],
        },
        {
          id: 'pt-002',
          name: 'Texture / Stucco Finish',
          description:
            'Decorative textured walls using trowel-applied stucco or sand texture. Adds depth and character.',
          price: 35,
          unit: 'sqft',
          materialTag: 'paint',
          estimatedDays: 3,
          includes: ['Base coat', 'Texture application', 'Sealing', 'Touch-up'],
        },
        {
          id: 'pt-003',
          name: 'Exterior Weatherproof Painting',
          description:
            'Elastomeric exterior paint rated for 10+ year durability. Protects against rain, UV, and cracking.',
          price: 28,
          unit: 'sqft',
          materialTag: 'paint',
          estimatedDays: 4,
          includes: ['Surface cleaning', 'Crack filling', 'Primer', '2 weatherproof coats'],
        },
      ],
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: '🍳',
      services: [
        {
          id: 'kc-001',
          name: 'Modular Kitchen (Per Linear Ft)',
          description:
            'Custom modular kitchen with marine-grade plywood carcass, soft-close hinges, and choice of finish.',
          price: 1800,
          unit: 'running_ft',
          materialTag: 'wood',
          estimatedDays: 10,
          popular: true,
          includes: ['Carcass', 'Shutters', 'Hardware', 'Counter (basic)', 'Installation'],
        },
        {
          id: 'kc-002',
          name: 'Kitchen Backsplash Tiling',
          description:
            'Subway, mosaic, or large-format tiles behind your hob and prep area. Waterproof and easy to clean.',
          price: 95,
          unit: 'sqft',
          materialTag: 'tile',
          estimatedDays: 2,
          includes: ['Tile supply (basic)', 'Waterproof adhesive', 'Grouting', 'Silicone edge'],
        },
        {
          id: 'kc-003',
          name: 'Countertop Replacement',
          description:
            'Quartz or granite countertop cut to size with undermount sink cutout and polished edges.',
          price: 320,
          unit: 'running_ft',
          materialTag: 'stone',
          estimatedDays: 3,
          includes: ['Measurement', 'Cut & polish', 'Sink cutout', 'Installation'],
        },
      ],
    },
    {
      id: 'bathroom',
      label: 'Bathroom',
      icon: '🚿',
      services: [
        {
          id: 'bt-001',
          name: 'Full Bathroom Renovation',
          description:
            'End-to-end bathroom redo: tiling, plumbing fixtures, waterproofing, and fittings. Turnkey package.',
          price: 85000,
          unit: 'room',
          materialTag: 'tile',
          estimatedDays: 12,
          popular: true,
          includes: ['Waterproofing', 'Tiling', 'Plumbing', 'Fixtures', 'Accessories'],
        },
        {
          id: 'bt-002',
          name: 'Shower Enclosure Installation',
          description:
            'Frameless or semi-frameless glass shower enclosure with chrome or matte black hardware.',
          price: 28000,
          unit: 'unit',
          materialTag: 'glass',
          estimatedDays: 2,
          includes: ['Toughened glass panels', 'Hardware', 'Silicone sealing', 'Installation'],
        },
        {
          id: 'bt-003',
          name: 'Waterproofing Membrane',
          description:
            'Multi-coat waterproofing system for wet areas — walls up to 2m and full floor coverage.',
          price: 65,
          unit: 'sqft',
          materialTag: 'concrete',
          estimatedDays: 3,
          includes: ['Surface prep', '3-coat membrane', 'Flood test', 'Certification'],
        },
      ],
    },
    {
      id: 'electrical',
      label: 'Electrical',
      icon: '⚡',
      services: [
        {
          id: 'el-001',
          name: 'Full Rewiring (Per Point)',
          description:
            'Safe concealed wiring using ISI-marked cables. Each point includes switch, socket, or fixture outlet.',
          price: 850,
          unit: 'point',
          materialTag: 'electrical',
          estimatedDays: 1,
          popular: true,
          includes: ['ISI cable', 'Conduit', 'Junction box', 'Switch / socket', 'Testing'],
        },
        {
          id: 'el-002',
          name: 'MCB Distribution Board',
          description:
            'New MCB panel with ELCB and surge protection. Properly labelled circuits for safety.',
          price: 12000,
          unit: 'unit',
          materialTag: 'electrical',
          estimatedDays: 1,
          includes: ['MCB panel', 'ELCB', 'Surge protector', 'Circuit labelling'],
        },
        {
          id: 'el-003',
          name: 'Smart Switch Upgrade',
          description:
            'Wi-Fi enabled smart switches with app control, schedules, and voice assistant compatibility.',
          price: 2200,
          unit: 'point',
          materialTag: 'electrical',
          estimatedDays: 1,
          includes: ['Smart switch unit', 'Neutral wire check', 'App setup', '1-yr warranty'],
        },
      ],
    },
    {
      id: 'doors-windows',
      label: 'Doors & Windows',
      icon: '🪟',
      services: [
        {
          id: 'dw-001',
          name: 'UPVC Window Installation',
          description:
            'Energy-efficient UPVC windows with double-glazing option. Noise reduction up to 35dB.',
          price: 650,
          unit: 'sqft',
          materialTag: 'glass',
          estimatedDays: 2,
          includes: ['Frame fabrication', 'Glass panes', 'Weather sealing', 'Installation'],
        },
        {
          id: 'dw-002',
          name: 'Solid Wood Door Fitting',
          description:
            'Teak or engineered wood doors with mortise lock, hinges, and frame. Custom sizing available.',
          price: 18000,
          unit: 'unit',
          materialTag: 'wood',
          estimatedDays: 2,
          popular: true,
          includes: ['Door slab', 'Frame', 'Hinges', 'Mortise lock', 'Finishing'],
        },
        {
          id: 'dw-003',
          name: 'Steel Security Door',
          description:
            'Multi-point locking steel door with powder-coat finish. Rated for forced entry resistance.',
          price: 22000,
          unit: 'unit',
          materialTag: 'steel',
          estimatedDays: 1,
          includes: ['Steel frame', '5-point lock', 'Peephole', 'Installation'],
        },
      ],
    },
  ],
};

export const MATERIAL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tile: { bg: '#E8F4F8', text: '#2A7A9B', label: 'Tile' },
  wood: { bg: '#FDF3E7', text: '#8B5E3C', label: 'Wood' },
  concrete: { bg: '#EFEFEF', text: '#555555', label: 'Concrete' },
  paint: { bg: '#F0EAF8', text: '#6A3FA0', label: 'Paint' },
  glass: { bg: '#E6F8F6', text: '#1F8A7A', label: 'Glass' },
  steel: { bg: '#E8EDF2', text: '#3A5068', label: 'Steel' },
  stone: { bg: '#F3EDE8', text: '#7A5C4A', label: 'Stone' },
  fabric: { bg: '#FEF0F4', text: '#A03060', label: 'Fabric' },
  electrical: { bg: '#FFFBE6', text: '#8A6C00', label: 'Electrical' },
  plumbing: { bg: '#E8F0FE', text: '#2A50A0', label: 'Plumbing' },
};

export const UNIT_LABELS: Record<string, string> = {
  sqft: 'per sq.ft',
  unit: 'per unit',
  room: 'per room',
  point: 'per point',
  running_ft: 'per running ft',
  day: 'per day',
};