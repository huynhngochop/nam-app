/** Danh mục âm thanh. Âm thanh cơ bản tự tổng hợp, đóng gói trong app; âm thanh trong gói tải về sau khi mua. */
export type SoundId =
  'rain' | 'white' | 'pink' | 'brown' | 'cafe' | 'forest' | 'thunder' | 'dalat-wind' | 'dalat-mist' | 'library' | 'sea';
export type Sound = {
  id: SoundId;
  name: string;
  icon: 'cloud-rain' | 'wind' | 'radio' | 'coffee' | 'feather' | 'cloud-lightning' | 'book' | 'anchor';
  packId?: string;
  file?: number;
};

export const SOUNDS: Sound[] = [
  { id: 'rain', name: 'Mưa rào', icon: 'cloud-rain', file: require('../assets/sounds/rain.wav') },
  { id: 'white', name: 'Ồn trắng', icon: 'radio', file: require('../assets/sounds/white.wav') },
  { id: 'pink', name: 'Ồn hồng', icon: 'wind', file: require('../assets/sounds/pink.wav') },
  { id: 'brown', name: 'Ồn nâu', icon: 'wind', file: require('../assets/sounds/brown.wav') },
  { id: 'cafe', name: 'Quán cà phê', icon: 'coffee', packId: 'saigon' },
  { id: 'forest', name: 'Rừng thông', icon: 'feather', packId: 'dalat' },
  { id: 'thunder', name: 'Sấm xa', icon: 'cloud-lightning', packId: 'saigon' },
  { id: 'dalat-wind', name: 'Gió đồi thông', icon: 'wind', packId: 'dalat' },
  { id: 'dalat-mist', name: 'Sương rơi mái hiên', icon: 'cloud-rain', packId: 'dalat' },
  { id: 'library', name: 'Thư viện cũ', icon: 'book', packId: 'library' },
  { id: 'sea', name: 'Biển đêm', icon: 'anchor', packId: 'sea' },
];
export const soundById = (id: SoundId) => SOUNDS.find((s) => s.id === id)!;

export type Pack = {
  id: string;
  name: string;
  description: string;
  priceKey: string;
  productId: string;
  sizeMb: number;
  featured?: boolean;
};
export const PACKS: Pack[] = [
  {
    id: 'saigon',
    name: 'Sài Gòn mưa chiều',
    description: 'Mưa mái tôn, xe qua phố, quán cóc, sấm xa.',
    priceKey: 'PRICE_PACK_SAIGON',
    productId: 'nhip.pack.saigon',
    sizeMb: 48,
    featured: true,
  },
  {
    id: 'dalat',
    name: 'Đà Lạt sương sớm',
    description: 'Thu âm thực địa tại Đà Lạt, phát lặp liền mạch, dùng mãi.',
    priceKey: 'PRICE_PACK_DALAT',
    productId: 'nhip.pack.dalat',
    sizeMb: 60,
  },
  {
    id: 'library',
    name: 'Thư viện cũ',
    description: 'Lật trang, bút viết, tiếng quạt trần.',
    priceKey: 'PRICE_PACK_LIB',
    productId: 'nhip.pack.library',
    sizeMb: 40,
  },
  {
    id: 'sea',
    name: 'Biển đêm',
    description: 'Sóng vỗ nhẹ, gió biển.',
    priceKey: 'PRICE_PACK_SEA',
    productId: 'nhip.pack.sea',
    sizeMb: 36,
  },
];

export const BREAK_TIPS = [
  { icon: 'droplet', text: 'Uống một ly nước' },
  { icon: 'eye', text: 'Nhìn xa 20 giây' },
  { icon: 'refresh-cw', text: 'Vươn vai, xoay cổ' },
  { icon: 'sun', text: 'Ra chỗ có ánh sáng tự nhiên' },
  { icon: 'wind', text: 'Hít thở sâu 5 lần' },
  { icon: 'activity', text: 'Đi bộ một vòng' },
] as const;
