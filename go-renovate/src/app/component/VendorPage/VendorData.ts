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
