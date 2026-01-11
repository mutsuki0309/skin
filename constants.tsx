
import { ProductCategory, InventoryItem } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  // 清潔
  { id: 'c1', name: 'Curél 潤浸保濕洗顏慕絲', category: ProductCategory.CLEANSER, brand: 'Curél' },
  // 化妝水
  { id: 't1', name: 'medicube 積雪草化妝水', category: ProductCategory.TONER, brand: 'medicube' },
  { id: 't2', name: 'Curél 潤浸保濕化粧水 II (輕潤型)', category: ProductCategory.TONER, brand: 'Curél' },
  { id: 't3', name: 'Platinum Label 積雪草化妝水', category: ProductCategory.TONER, brand: 'Platinum Label' },
  { id: 't4', name: 'ヒルマイルド 化妝水', category: ProductCategory.TONER, brand: 'Healmild' },
  // 棉片
  { id: 'p1', name: 'Torriden DIVE IN 低分子玻尿酸棉片', category: ProductCategory.PADS, brand: 'Torriden' },
  { id: 'p2', name: 'medicube Zero 毛孔爽膚棉 2.0', category: ProductCategory.PADS, brand: 'medicube' },
  { id: 'p3', name: 'medicube 積雪草修護爽膚棉', category: ProductCategory.PADS, brand: 'medicube' },
  { id: 'p4', name: 'medicube RED 修護爽膚棉', category: ProductCategory.PADS, brand: 'medicube' },
  { id: 'p5', name: 'medicube Deep 維他命 C 爽膚棉', category: ProductCategory.PADS, brand: 'medicube' },
  { id: 'p6', name: 'medicube Collagen 膠原蛋白爽膚棉', category: ProductCategory.PADS, brand: 'medicube' },
  // 精華
  { id: 's1', name: 'Torriden DIVE IN 低分子玻尿酸精華', category: ProductCategory.SERUM, brand: 'Torriden' },
  { id: 's2', name: 'Torriden 積雪草精華液', category: ProductCategory.SERUM, brand: 'Torriden' },
  { id: 's3', name: 'medicube 積雪草外泌體安瓶', category: ProductCategory.SERUM, brand: 'medicube' },
  { id: 's4', name: 'medicube PDRN 粉紅濃縮精華', category: ProductCategory.SERUM, brand: 'medicube' },
  { id: 's5', name: 'Nature Republic 維他命 C 精華', category: ProductCategory.SERUM, brand: 'Nature Republic' },
  { id: 's6', name: 'Torriden 維他命 C 精華', category: ProductCategory.SERUM, brand: 'Torriden' },
  // 局部
  { id: 'sp1', name: 'マキロン ACNEIGE 痘痘藥', category: ProductCategory.SPOT, brand: 'Makiron' },
  { id: 'sp2', name: '3M 抗痘凝露', category: ProductCategory.SPOT, brand: '3M' },
  { id: 'sp3', name: '喜能復 Post Acne 凝膠', category: ProductCategory.SPOT, brand: 'Hiruscar' },
  // 面膜
  { id: 'm1', name: "DermaLine D'LEXO PDRN 面膜", category: ProductCategory.MASK, brand: 'DermaLine', stockCount: 5 },
  { id: 'm2', name: 'DermaFarm 積雪草外泌體 PDRN 面膜', category: ProductCategory.MASK, brand: 'DermaFarm', stockCount: 3 },
  { id: 'm3', name: 'medicube PDRN 粉紅維他命濃縮面膜', category: ProductCategory.MASK, brand: 'medicube', stockCount: 1 },
  { id: 'm4', name: 'medicube ZERO 毛孔淨化冰感面膜', category: ProductCategory.MASK, brand: 'medicube', stockCount: 4 },
  { id: 'm5', name: 'KOSE 光映透 集中調理禦痘面膜', category: ProductCategory.MASK, brand: 'KOSE', stockCount: 2 },
  { id: 'm6', name: 'KOSE 光映透 爆彈保濕療癒面膜', category: ProductCategory.MASK, brand: 'KOSE', stockCount: 6 },
  { id: 'm7', name: 'KOSE 光映透 積雪草保濕面膜', category: ProductCategory.MASK, brand: 'KOSE', stockCount: 0 },
  // 乳霜
  { id: 'cr1', name: 'Curél 潤浸保濕控油保濕凝露', category: ProductCategory.CREAM, brand: 'Curél' },
  { id: 'cr2', name: 'Torriden DIVE IN 舒緩霜', category: ProductCategory.CREAM, brand: 'Torriden' },
  { id: 'cr3', name: 'ヒルマイルド 乳液', category: ProductCategory.CREAM, brand: 'Healmild' },
  // 儀器 (整合為單一設備)
  { id: 'd1', name: 'medicube AGE-R BOOSTER PRO', category: ProductCategory.DEVICE, brand: 'medicube' },
  // 防曬
  { id: 'su1', name: 'Curél 潤浸保濕防曬乳', category: ProductCategory.SUNSCREEN, brand: 'Curél' },
  { id: 'su2', name: 'Biore 含水防曬保濕水凝乳', category: ProductCategory.SUNSCREEN, brand: 'Biore' },
];
