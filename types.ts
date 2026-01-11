
export enum AppMode {
  ANALYSIS = 'ANALYSIS',
  INVENTORY = 'INVENTORY',
  CHECKER = 'CHECKER'
}

export enum ProductCategory {
  CLEANSER = '清潔類',
  TONER = '化妝水',
  PADS = '棉片類',
  SERUM = '精華液',
  SPOT = '局部治療',
  MASK = '面膜類',
  CREAM = '乳霜/乳液',
  DEVICE = '儀器',
  SUNSCREEN = '防曬'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  stockCount?: number;
  ingredients?: string[];
  effects?: string;
  usageTiming?: string;
  frontImage?: string;
  backImage?: string;
  manualIngredients?: string;
  cons?: string[];
  recommendation?: 'PASS' | 'FAIL';
}

export interface EnvironmentalData {
  temperature: number;
  humidity: number;
  dewPoint: number;
  isHeatingOn: boolean;
}

export interface UserFactors {
  isPeriod: boolean;
  onMedication: string;
  otherStatus: string;
  isHeatingOn: boolean;
}

export interface AnalysisResult {
  summary: string;
  observations: string[];
  diagnosis: string;
  routine: RoutineStep[];
}

export interface RoutineStep {
  step: number;
  label: string;
  product: string;
  reason: string;
}

export interface IngredientAnalysis {
  productName: string;
  pros: string[];
  cons: string[];
  timing: string;
  recommendation: 'PASS' | 'FAIL';
  effects?: string;
}
