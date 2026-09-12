import type { Festival } from '@/lib/data/types';

export interface GrahanInfo {
  name: string;
  start: string;
  maximum?: string;
  end: string;
  visibleInIndia?: boolean;
  sutak?: string;
}

export interface PanchangDay {
  date: string; // YYYY-MM-DD

  // Panchang
  tithi: string;
  tithiEnds?: string;
  paksha: 'Shukla Paksha' | 'Krishna Paksha';

  nakshatra: string;
  nakshatraEnds?: string;

  yoga: string;
  yogaEnds?: string;

  karana: string;
  karanaEnds?: string;

  // Sun / Moon
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moonPhase: string;

  // Muhurat / Kaal
  brahmaMuhurat: string;
  abhijitMuhurat: string;
  vijayMuhurat: string;
  godhuliMuhurat: string;

  rahuKaal: string;
  gulikaKaal: string;
  yamaganda: string;
  durMuhurat: string;
  varjyam: string;

  // Events
  festivals?: string[];
  vrat?: string[];
  sankranti?: string;
  special?: string[];

  // Grahan
  suryaGrahan?: GrahanInfo;
  chandraGrahan?: GrahanInfo;
}

export const TITHI_NAMES = [
  'Pratipada',
  'Dvitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
];

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashirsha',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

export const YOGAS = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shula',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyan',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti',
];

const MOVABLE_KARANAS = [
  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Gara',
  'Vanija',
  'Vishti (Bhadra)',
];

const EKADASHI_NAMES_SHUKLA: Record<number, string> = {
  0: 'Kamada Ekadashi',
  1: 'Mohini Ekadashi',
  2: 'Nirjala Ekadashi',
  3: 'Devshayani Ekadashi',
  4: 'Shravana Putrada Ekadashi',
  5: 'Parivartini Ekadashi',
  6: 'Papankusha Ekadashi',
  7: 'Devutthana Ekadashi',
  8: 'Mokshada Ekadashi',
  9: 'Pausha Putrada Ekadashi',
  10: 'Jaya Ekadashi',
  11: 'Amalaki Ekadashi',
};

const EKADASHI_NAMES_KRISHNA: Record<number, string> = {
  0: 'Papmochani Ekadashi',
  1: 'Varuthini Ekadashi',
  2: 'Apara Ekadashi',
  3: 'Yogini Ekadashi',
  4: 'Kamika Ekadashi',
  5: 'Aja Ekadashi',
  6: 'Indira Ekadashi',
  7: 'Rama Ekadashi',
  8: 'Utpanna Ekadashi',
  9: 'Saphala Ekadashi',
  10: 'Shattila Ekadashi',
  11: 'Vijaya Ekadashi',
};

export const ECLIPSE_DATABASE: Record<string, { suryaGrahan?: GrahanInfo; chandraGrahan?: GrahanInfo }> = {
  '2025-03-14': {
    chandraGrahan: {
      name: 'Total Lunar Eclipse (Chandra Grahan)',
      start: '10:39 AM',
      maximum: '12:28 PM',
      end: '02:18 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2025-03-29': {
    suryaGrahan: {
      name: 'Partial Solar Eclipse (Surya Grahan)',
      start: '02:20 PM',
      maximum: '04:17 PM',
      end: '06:13 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2025-09-07': {
    chandraGrahan: {
      name: 'Total Lunar Eclipse (Chandra Grahan)',
      start: '09:58 PM',
      maximum: '11:42 PM',
      end: '01:26 AM',
      visibleInIndia: true,
      sutak: 'Starts at 12:58 PM IST (9 hours prior)',
    },
  },
  '2025-09-21': {
    suryaGrahan: {
      name: 'Partial Solar Eclipse (Surya Grahan)',
      start: '10:59 PM',
      maximum: '01:11 AM',
      end: '03:23 AM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2026-02-17': {
    suryaGrahan: {
      name: 'Annular Solar Eclipse (Surya Grahan)',
      start: '03:26 PM',
      maximum: '05:42 PM',
      end: '07:57 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2026-03-03': {
    chandraGrahan: {
      name: 'Total Lunar Eclipse (Chandra Grahan)',
      start: '04:34 PM',
      maximum: '05:03 PM',
      end: '06:40 PM',
      visibleInIndia: true,
      sutak: 'Starts at 07:34 AM IST (9 hours prior)',
    },
  },
  '2026-08-12': {
    suryaGrahan: {
      name: 'Total Solar Eclipse (Surya Grahan)',
      start: '09:05 PM',
      maximum: '11:17 PM',
      end: '01:28 AM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2026-08-28': {
    chandraGrahan: {
      name: 'Partial Lunar Eclipse (Chandra Grahan)',
      start: '08:52 PM',
      maximum: '09:43 PM',
      end: '10:35 PM',
      visibleInIndia: true,
      sutak: 'Starts at 11:52 AM IST (9 hours prior)',
    },
  },
  '2027-02-06': {
    suryaGrahan: {
      name: 'Annular Solar Eclipse (Surya Grahan)',
      start: '06:34 PM',
      maximum: '08:45 PM',
      end: '10:55 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2027-02-21': {
    chandraGrahan: {
      name: 'Penumbral Lunar Eclipse (Chandra Grahan)',
      start: '02:44 AM',
      maximum: '04:43 AM',
      end: '06:41 AM',
      visibleInIndia: true,
      sutak: 'Penumbral eclipse — Sutak traditionally not observed',
    },
  },
  '2027-08-02': {
    suryaGrahan: {
      name: 'Total Solar Eclipse (Surya Grahan)',
      start: '01:30 PM',
      maximum: '03:40 PM',
      end: '05:50 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
  '2027-08-17': {
    chandraGrahan: {
      name: 'Penumbral Lunar Eclipse (Chandra Grahan)',
      start: '10:53 AM',
      maximum: '12:44 PM',
      end: '02:35 PM',
      visibleInIndia: false,
      sutak: 'Not applicable in India (Eclipse invisible)',
    },
  },
};

export const SACRED_FESTIVALS_MAP: Record<
  string,
  { festivals: string[]; vrats?: string[]; sankranti?: string; special?: string[] }
> = {
  // --- 2025 ---
  '2025-01-14': { festivals: ['Makar Sankranti', 'Pongal'], sankranti: 'Makar Sankranti' },
  '2025-02-02': { festivals: ['Vasant Panchami', 'Saraswati Puja'], special: ['Shri Panchami'] },
  '2025-02-04': { festivals: ['Ratha Saptami'], vrats: ['Surya Jayanti Vrat'] },
  '2025-02-26': { festivals: ['Maha Shivratri'], vrats: ['Maha Shivratri Vrat'], special: ['Nishita Kaal Puja'] },
  '2025-03-13': { festivals: ['Holika Dahan'], vrats: ['Choti Holi Vrat'] },
  '2025-03-14': { festivals: ['Holi', 'Dhulandi'], special: ['Chandra Grahan'] },
  '2025-03-30': { festivals: ['Chaitra Navratri (Day 1)', 'Gudi Padwa', 'Ugadi'], vrats: ['Navratri Vrat begins'] },
  '2025-03-31': { festivals: ['Chaitra Navratri (Day 2 - Brahmacharini)'] },
  '2025-04-01': { festivals: ['Chaitra Navratri (Day 3 - Chandraghanta)', 'Gangaur'] },
  '2025-04-02': { festivals: ['Chaitra Navratri (Day 4 - Kushmanda)'] },
  '2025-04-03': { festivals: ['Chaitra Navratri (Day 5 - Skandamata)', 'Lakshmi Panchami'] },
  '2025-04-04': { festivals: ['Chaitra Navratri (Day 6 - Katyayani)', 'Yamuna Chhath'] },
  '2025-04-05': { festivals: ['Chaitra Navratri (Day 7 - Kalaratri)'] },
  '2025-04-06': { festivals: ['Chaitra Navratri (Day 8 - Mahagauri)', 'Durga Ashtami', 'Ram Navami'], vrats: ['Ram Navami Vrat'] },
  '2025-04-12': { festivals: ['Hanuman Jayanti', 'Chaitra Purnima'], vrats: ['Satyanarayan Vrat'] },
  '2025-04-14': { festivals: ['Baisakhi', 'Mesha Sankranti', 'Puthandu', 'Vishu'], sankranti: 'Mesha Sankranti' },
  '2025-04-30': { festivals: ['Akshaya Tritiya', 'Parashurama Jayanti'], special: ['Sarva Siddhi Muhurat'] },
  '2025-05-11': { festivals: ['Narasimha Jayanti'], vrats: ['Narasimha Jayanti Vrat'] },
  '2025-05-12': { festivals: ['Buddha Purnima', 'Vaishakha Purnima'] },
  '2025-05-27': { festivals: ['Vat Savitri Vrat', 'Shani Jayanti'], vrats: ['Vat Savitri Vrat'] },
  '2025-06-06': { festivals: ['Ganga Dussehra'] },
  '2025-06-07': { festivals: ['Nirjala Ekadashi'], vrats: ['Nirjala Ekadashi Maha Vrat'] },
  '2025-06-27': { festivals: ['Jagannath Ratha Yatra'], special: ['Puri Ratha Yatra'] },
  '2025-07-06': { festivals: ['Devshayani Ekadashi'], vrats: ['Chaturmas begins'] },
  '2025-07-10': { festivals: ['Guru Purnima', 'Vyasa Puja'], vrats: ['Guru Purnima Vrat'] },
  '2025-07-28': { festivals: ['Hariyali Teej'], vrats: ['Hariyali Teej Vrat'] },
  '2025-07-30': { festivals: ['Nag Panchami'] },
  '2025-08-08': { festivals: ['Varalakshmi Vrat'], vrats: ['Varalakshmi Vrat'] },
  '2025-08-09': { festivals: ['Raksha Bandhan', 'Shravana Purnima'] },
  '2025-08-16': { festivals: ['Krishna Janmashtami'], vrats: ['Janmashtami Vrat'], special: ['Nishita Puja'] },
  '2025-08-17': { festivals: ['Dahi Handi'] },
  '2025-08-27': { festivals: ['Ganesh Chaturthi'], vrats: ['Ganesh Sthapana Vrat'], special: ['Vinayaka Sthapana'] },
  '2025-08-28': { festivals: ['Rishi Panchami'] },
  '2025-08-31': { festivals: ['Radha Ashtami'], vrats: ['Radha Ashtami Vrat'] },
  '2025-09-06': { festivals: ['Anant Chaturdashi', 'Ganesh Visarjan'], vrats: ['Anant Vrat'] },
  '2025-09-07': { festivals: ['Bhadrapada Purnima', 'Chandra Grahan'], vrats: ['Satyanarayan Vrat'] },
  '2025-09-08': { festivals: ['Pitru Paksha begins (Pratipada Shraddha)'], special: ['Pitru Paksha Tarpan'] },
  '2025-09-21': { festivals: ['Sarva Pitru Amavasya', 'Mahalaya', 'Surya Grahan'], special: ['Pitru Visarjan'] },
  '2025-09-22': { festivals: ['Sharad Navratri (Day 1 - Shailputri)', 'Ghatasthapana'], vrats: ['Navratri Vrat begins'] },
  '2025-09-23': { festivals: ['Sharad Navratri (Day 2 - Brahmacharini)'] },
  '2025-09-24': { festivals: ['Sharad Navratri (Day 3 - Chandraghanta)'] },
  '2025-09-25': { festivals: ['Sharad Navratri (Day 4 - Kushmanda)'] },
  '2025-09-26': { festivals: ['Sharad Navratri (Day 5 - Skandamata)', 'Upang Lalita Vrat'] },
  '2025-09-27': { festivals: ['Sharad Navratri (Day 6 - Katyayani)', 'Bilva Nimantran'] },
  '2025-09-28': { festivals: ['Sharad Navratri (Day 7 - Kalaratri)', 'Maha Saptami'] },
  '2025-09-29': { festivals: ['Maha Ashtami', 'Durga Ashtami', 'Sandhi Puja'], vrats: ['Kanya Pujan'] },
  '2025-09-30': { festivals: ['Maha Navami', 'Ayudha Puja'] },
  '2025-10-02': { festivals: ['Dussehra (Vijayadashami)', 'Durga Visarjan'], special: ['Shami Puja', 'Aparajita Puja'] },
  '2025-10-06': { festivals: ['Sharad Purnima', 'Kojagari Lakshmi Puja'], vrats: ['Kojagara Vrat'] },
  '2025-10-10': { festivals: ['Karwa Chauth'], vrats: ['Karwa Chauth Vrat'] },
  '2025-10-14': { festivals: ['Ahoi Ashtami'], vrats: ['Ahoi Ashtami Vrat'] },
  '2025-10-17': { festivals: ['Rama Ekadashi', 'Govatsa Dwadashi'], vrats: ['Rama Ekadashi Vrat'] },
  '2025-10-18': { festivals: ['Dhanteras (Dhanatrayodashi)'], special: ['Yamadeepdan', 'Dhanvantari Jayanti'] },
  '2025-10-19': { festivals: ['Naraka Chaturdashi (Choti Diwali)', 'Kali Puja'] },
  '2025-10-20': { festivals: ['Diwali (Lakshmi Puja)', 'Chopda Pujan'], vrats: ['Lakshmi Kuber Puja'], special: ['Deepavali Mahotsav'] },
  '2025-10-22': { festivals: ['Govardhan Puja', 'Annakoot', 'Bali Pratipada'] },
  '2025-10-23': { festivals: ['Bhai Dooj (Yama Dwitiya)'] },
  '2025-10-27': { festivals: ['Chhath Puja (Sandhya Arghya)'], vrats: ['Surya Shashthi Vrat'] },
  '2025-10-28': { festivals: ['Chhath Puja (Usha Arghya & Paran)'] },
  '2025-11-01': { festivals: ['Devutthana Ekadashi (Dev Uthani Gyaras)'], vrats: ['Tulsi Vivah begins', 'Chaturmas ends'] },
  '2025-11-05': { festivals: ['Dev Deepawali', 'Kartik Purnima'], vrats: ['Tripuri Purnima'] },
  '2025-11-30': { festivals: ['Gita Jayanti', 'Mokshada Ekadashi'], vrats: ['Mokshada Ekadashi Vrat'] },

  // --- 2026 ---
  '2026-01-14': { festivals: ['Makar Sankranti', 'Pongal'], sankranti: 'Makar Sankranti' },
  '2026-01-23': { festivals: ['Vasant Panchami', 'Saraswati Puja'], special: ['Shri Panchami'] },
  '2026-01-25': { festivals: ['Ratha Saptami'], vrats: ['Surya Jayanti Vrat'] },
  '2026-02-01': { festivals: ['Guru Ravidas Jayanti'] },
  '2026-02-15': { festivals: ['Maha Shivratri'], vrats: ['Maha Shivratri Vrat'], special: ['Char Prahar Abhishek'] },
  '2026-03-03': { festivals: ['Holika Dahan', 'Chandra Grahan'], vrats: ['Choti Holi Vrat'], special: ['Total Lunar Eclipse visible in India'] },
  '2026-03-04': { festivals: ['Holi', 'Dhulandi', 'Rangwali Holi'] },
  '2026-03-19': { festivals: ['Chaitra Navratri (Day 1)', 'Gudi Padwa', 'Ugadi'], vrats: ['Navratri Vrat begins'] },
  '2026-03-20': { festivals: ['Chaitra Navratri (Day 2 - Brahmacharini)'] },
  '2026-03-21': { festivals: ['Chaitra Navratri (Day 3 - Chandraghanta)', 'Gangaur'] },
  '2026-03-22': { festivals: ['Chaitra Navratri (Day 4 - Kushmanda)'] },
  '2026-03-23': { festivals: ['Chaitra Navratri (Day 5 - Skandamata)', 'Lakshmi Panchami'] },
  '2026-03-24': { festivals: ['Chaitra Navratri (Day 6 - Katyayani)', 'Yamuna Chhath'] },
  '2026-03-25': { festivals: ['Chaitra Navratri (Day 7 - Kalaratri)'] },
  '2026-03-26': { festivals: ['Chaitra Navratri (Day 8 - Mahagauri)', 'Durga Ashtami'], vrats: ['Kanya Pujan'] },
  '2026-03-27': { festivals: ['Ram Navami', 'Chaitra Navratri (Day 9 - Siddhidatri)'], vrats: ['Ram Navami Vrat'] },
  '2026-03-31': { festivals: ['Mahavir Jayanti'] },
  '2026-04-02': { festivals: ['Hanuman Jayanti', 'Chaitra Purnima'], vrats: ['Satyanarayan Vrat'] },
  '2026-04-14': { festivals: ['Baisakhi', 'Mesha Sankranti', 'Vishu', 'Puthandu'], sankranti: 'Mesha Sankranti' },
  '2026-04-19': { festivals: ['Akshaya Tritiya', 'Parashurama Jayanti'], special: ['Abujh Muhurat'] },
  '2026-05-01': { festivals: ['Narasimha Jayanti'], vrats: ['Narasimha Jayanti Vrat'] },
  '2026-05-02': { festivals: ['Buddha Purnima', 'Vaishakha Purnima'] },
  '2026-05-16': { festivals: ['Vat Savitri Vrat', 'Shani Jayanti'], vrats: ['Vat Savitri Vrat'] },
  '2026-05-25': { festivals: ['Ganga Dussehra'] },
  '2026-05-27': { festivals: ['Nirjala Ekadashi'], vrats: ['Nirjala Ekadashi Maha Vrat'] },
  '2026-06-16': { festivals: ['Jagannath Ratha Yatra'], special: ['Puri Ratha Yatra'] },
  '2026-06-25': { festivals: ['Devshayani Ekadashi'], vrats: ['Chaturmas begins'] },
  '2026-06-29': { festivals: ['Guru Purnima', 'Vyasa Puja'], vrats: ['Guru Purnima Vrat'] },
  '2026-07-17': { festivals: ['Hariyali Teej'], vrats: ['Hariyali Teej Vrat'] },
  '2026-07-19': { festivals: ['Nag Panchami'] },
  '2026-08-27': { festivals: ['Varalakshmi Vrat'], vrats: ['Varalakshmi Vrat'] },
  '2026-08-28': { festivals: ['Raksha Bandhan', 'Shravana Purnima', 'Chandra Grahan'], vrats: ['Rakhi Purnima'], special: ['Partial Lunar Eclipse visible in India'] },
  '2026-09-04': { festivals: ['Krishna Janmashtami'], vrats: ['Janmashtami Vrat'], special: ['Nishita Kaal Puja'] },
  '2026-09-05': { festivals: ['Dahi Handi', 'Gopal Kala'] },
  '2026-09-11': { festivals: ['Sarva Pitru Amavasya Shraddha Prep', 'Surya Grahan'] },
  '2026-09-12': { festivals: ['Bhadrapada Shukla Pratipada', 'Altar Restock'], special: ['Shukla Paksha begins'] },
  '2026-09-14': { festivals: ['Ganesh Chaturthi (Vinayaka Chaturthi)'], vrats: ['Ganesh Sthapana Vrat'], special: ['Midday Ganesh Sthapana'] },
  '2026-09-16': { festivals: ['Rishi Panchami'], vrats: ['Rishi Panchami Vrat'] },
  '2026-09-19': { festivals: ['Radha Ashtami'], vrats: ['Radha Ashtami Vrat'] },
  '2026-09-23': { festivals: ['Anant Chaturdashi', 'Ganesh Visarjan'], vrats: ['Anant Sutra Vrat'] },
  '2026-09-25': { festivals: ['Bhadrapada Purnima', 'Pitru Paksha begins'], vrats: ['Satyanarayan Vrat'] },
  '2026-10-10': { festivals: ['Sarva Pitru Amavasya', 'Mahalaya'], special: ['Pitru Visarjan & Tarpan'] },
  '2026-10-11': { festivals: ['Sharad Navratri (Day 1 - Shailputri)', 'Ghatasthapana'], vrats: ['Navratri Vrat begins'] },
  '2026-10-12': { festivals: ['Sharad Navratri (Day 2 - Brahmacharini)'] },
  '2026-10-13': { festivals: ['Sharad Navratri (Day 3 - Chandraghanta)'] },
  '2026-10-14': { festivals: ['Sharad Navratri (Day 4 - Kushmanda)'] },
  '2026-10-15': { festivals: ['Sharad Navratri (Day 5 - Skandamata)', 'Upang Lalita Vrat'] },
  '2026-10-16': { festivals: ['Sharad Navratri (Day 6 - Katyayani)', 'Durga Puja begins'] },
  '2026-10-17': { festivals: ['Sharad Navratri (Day 7 - Kalaratri)', 'Maha Saptami'] },
  '2026-10-18': { festivals: ['Maha Ashtami', 'Durga Ashtami', 'Sandhi Puja'], vrats: ['Kanya Pujan'] },
  '2026-10-19': { festivals: ['Maha Navami', 'Ayudha Puja'] },
  '2026-10-20': { festivals: ['Dussehra (Vijayadashami)', 'Durga Visarjan'], special: ['Shami Pujan', 'Aparajita Pujan'] },
  '2026-10-25': { festivals: ['Sharad Purnima', 'Kojagari Lakshmi Puja'], vrats: ['Kojagara Vrat'] },
  '2026-10-29': { festivals: ['Karwa Chauth'], vrats: ['Karwa Chauth Vrat'] },
  '2026-11-02': { festivals: ['Ahoi Ashtami'], vrats: ['Ahoi Ashtami Vrat'] },
  '2026-11-05': { festivals: ['Rama Ekadashi', 'Govatsa Dwadashi'], vrats: ['Rama Ekadashi Vrat'] },
  '2026-11-06': { festivals: ['Dhanteras (Dhanatrayodashi)'], special: ['Yamadeepdan', 'Dhanvantari Jayanti'] },
  '2026-11-07': { festivals: ['Naraka Chaturdashi (Choti Diwali)', 'Kali Puja'], special: ['Roop Chaudas'] },
  '2026-11-08': { festivals: ['Diwali (Lakshmi Puja)', 'Chopda Pujan'], vrats: ['Lakshmi Kuber Puja'], special: ['Deepavali Mahotsav'] },
  '2026-11-09': { festivals: ['Govardhan Puja', 'Annakoot', 'Bali Pratipada'] },
  '2026-11-11': { festivals: ['Bhai Dooj (Yama Dwitiya)'] },
  '2026-11-15': { festivals: ['Chhath Puja (Sandhya Arghya)'], vrats: ['Surya Shashthi Vrat'] },
  '2026-11-16': { festivals: ['Chhath Puja (Usha Arghya & Paran)'] },
  '2026-11-20': { festivals: ['Devutthana Ekadashi (Dev Uthani Gyaras)'], vrats: ['Chaturmas ends', 'Tulsi Vivah begins'] },
  '2026-11-21': { festivals: ['Tulsi Vivah'] },
  '2026-11-24': { festivals: ['Dev Deepawali', 'Kartik Purnima'], vrats: ['Tripuri Purnima'] },
  '2026-12-20': { festivals: ['Gita Jayanti', 'Mokshada Ekadashi'], vrats: ['Mokshada Ekadashi Vrat'] },

  // --- 2027 ---
  '2027-01-14': { festivals: ['Makar Sankranti', 'Pongal'], sankranti: 'Makar Sankranti' },
  '2027-02-11': { festivals: ['Vasant Panchami', 'Saraswati Puja'], special: ['Shri Panchami'] },
  '2027-02-13': { festivals: ['Ratha Saptami'], vrats: ['Surya Jayanti Vrat'] },
  '2027-02-21': { festivals: ['Magha Purnima', 'Chandra Grahan'], vrats: ['Satyanarayan Vrat'] },
  '2027-03-06': { festivals: ['Maha Shivratri'], vrats: ['Maha Shivratri Vrat'], special: ['Char Prahar Abhishek'] },
  '2027-03-21': { festivals: ['Holika Dahan'], vrats: ['Choti Holi Vrat'] },
  '2027-03-22': { festivals: ['Holi', 'Dhulandi'] },
  '2027-04-07': { festivals: ['Chaitra Navratri (Day 1)', 'Gudi Padwa', 'Ugadi'], vrats: ['Navratri Vrat begins'] },
  '2027-04-14': { festivals: ['Baisakhi', 'Mesha Sankranti', 'Puthandu'], sankranti: 'Mesha Sankranti' },
  '2027-04-15': { festivals: ['Ram Navami'], vrats: ['Ram Navami Vrat'] },
  '2027-04-19': { festivals: ['Mahavir Jayanti'] },
  '2027-04-21': { festivals: ['Hanuman Jayanti', 'Chaitra Purnima'], vrats: ['Satyanarayan Vrat'] },
  '2027-05-09': { festivals: ['Akshaya Tritiya', 'Parashurama Jayanti'] },
  '2027-05-20': { festivals: ['Buddha Purnima', 'Vaishakha Purnima'] },
  '2027-06-14': { festivals: ['Ganga Dussehra'] },
  '2027-06-16': { festivals: ['Nirjala Ekadashi'], vrats: ['Nirjala Ekadashi Maha Vrat'] },
  '2027-07-05': { festivals: ['Jagannath Ratha Yatra'] },
  '2027-07-15': { festivals: ['Devshayani Ekadashi'], vrats: ['Chaturmas begins'] },
  '2027-07-19': { festivals: ['Guru Purnima', 'Vyasa Puja'] },
  '2027-08-05': { festivals: ['Hariyali Teej'], vrats: ['Hariyali Teej Vrat'] },
  '2027-08-07': { festivals: ['Nag Panchami'] },
  '2027-08-17': { festivals: ['Raksha Bandhan', 'Shravana Purnima', 'Chandra Grahan'] },
  '2027-08-25': { festivals: ['Krishna Janmashtami'], vrats: ['Janmashtami Vrat'] },
  '2027-08-26': { festivals: ['Dahi Handi'] },
  '2027-09-04': { festivals: ['Ganesh Chaturthi'], vrats: ['Vinayaka Chaturthi Vrat'] },
  '2027-09-14': { festivals: ['Anant Chaturdashi', 'Ganesh Visarjan'], vrats: ['Anant Vrat'] },
  '2027-09-15': { festivals: ['Bhadrapada Purnima', 'Pitru Paksha begins'] },
  '2027-09-29': { festivals: ['Sarva Pitru Amavasya', 'Mahalaya'] },
  '2027-10-01': { festivals: ['Sharad Navratri (Day 1)', 'Ghatasthapana'], vrats: ['Navratri Vrat begins'] },
  '2027-10-07': { festivals: ['Maha Saptami'] },
  '2027-10-08': { festivals: ['Maha Ashtami', 'Durga Ashtami'], vrats: ['Kanya Pujan'] },
  '2027-10-09': { festivals: ['Maha Navami'] },
  '2027-10-10': { festivals: ['Dussehra (Vijayadashami)', 'Durga Visarjan'] },
  '2027-10-15': { festivals: ['Sharad Purnima', 'Kojagari Lakshmi Puja'] },
  '2027-10-18': { festivals: ['Karwa Chauth'], vrats: ['Karwa Chauth Vrat'] },
  '2027-10-22': { festivals: ['Ahoi Ashtami'], vrats: ['Ahoi Ashtami Vrat'] },
  '2027-10-27': { festivals: ['Dhanteras (Dhanatrayodashi)'] },
  '2027-10-28': { festivals: ['Naraka Chaturdashi (Choti Diwali)'] },
  '2027-10-29': { festivals: ['Diwali (Lakshmi Puja)'] },
  '2027-10-30': { festivals: ['Govardhan Puja', 'Annakoot'] },
  '2027-11-01': { festivals: ['Bhai Dooj'] },
  '2027-11-04': { festivals: ['Chhath Puja (Sandhya Arghya)'] },
  '2027-11-09': { festivals: ['Devutthana Ekadashi'], vrats: ['Tulsi Vivah begins'] },
  '2027-11-13': { festivals: ['Dev Deepawali', 'Kartik Purnima'] },
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatMinutes(minTotal: number): string {
  const norm = ((minTotal % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = Math.floor(norm % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad2(h12)}:${pad2(m)} ${ampm}`;
}

export function calculateSunTimings(date: Date) {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffDays = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );

  const latRad = (28.6139 * Math.PI) / 180;
  const B = ((360 / 365) * (diffDays - 81) * Math.PI) / 180;
  const decl =
    23.45 * Math.sin(((360 / 365) * (diffDays - 81) * Math.PI) / 180) * (Math.PI / 180);
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const timeOffset = (82.5 - 77.209) * 4;
  const solarNoon = 12 * 60 + timeOffset - EoT;

  const cosH =
    (Math.sin((-0.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));

  const H = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI / 15 * 60;

  const sunriseMin = solarNoon - H;
  const sunsetMin = solarNoon + H;

  return {
    sunriseMin,
    sunsetMin,
    sunrise: formatMinutes(sunriseMin),
    sunset: formatMinutes(sunsetMin),
  };
}

export function calculateMoonTimings(date: Date, sunriseMin: number) {
  const refNewMoon = new Date('2026-09-11T14:26:00Z').getTime();
  const synodicMonth = 29.530588853;
  const siderealMonth = 27.321661;

  const targetUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0);
  const diffDays = (targetUtc - refNewMoon) / (1000 * 60 * 60 * 24);

  const cycle = diffDays / synodicMonth;
  const phase = ((cycle % 1) + 1) % 1;

  const tithiIndex = Math.floor(phase * 30);
  const isShukla = tithiIndex < 15;
  const tithiDayNumber = (tithiIndex % 15) + 1;

  const tithiProgress = (phase * 30) % 1;
  const tithiEndsMin = sunriseMin + (1 - tithiProgress) * 24 * 60;

  const siderealCycle = diffDays / siderealMonth;
  const siderealPhase = ((siderealCycle % 1) + 1) % 1;
  const nakshatraIndex = Math.floor((siderealPhase * 27 + 11.5) % 27);
  const nakshatraProgress = (siderealPhase * 27) % 1;
  const nakshatraEndsMin = sunriseMin + (1 - nakshatraProgress) * 24 * 60;

  const yearProgress = ((diffDays / 365.25) % 1 + 1) % 1;
  const yogaIndex = Math.floor((yearProgress * 27 + siderealPhase * 27 + 14) % 27);
  const yogaProgress = (yearProgress * 27 + siderealPhase * 27) % 1;
  const yogaEndsMin = sunriseMin + (1 - yogaProgress) * 24 * 60;

  const karanaIndex = Math.floor(phase * 60) % 60;
  let karanaName: string;
  if (karanaIndex === 0) {
    karanaName = 'Kintughna';
  } else if (karanaIndex >= 57) {
    if (karanaIndex === 57) karanaName = 'Shakuni';
    else if (karanaIndex === 58) karanaName = 'Chatushpada';
    else karanaName = 'Naga';
  } else {
    karanaName = MOVABLE_KARANAS[(karanaIndex - 1) % 7] ?? 'Bava';
  }
  const karanaProgress = (phase * 60) % 1;
  const karanaEndsMin = sunriseMin + (1 - karanaProgress) * 12 * 60;

  const moonriseMin = (sunriseMin + phase * 24 * 60) % 1440;
  const moonsetMin = (moonriseMin + 12 * 60 + 20) % 1440;

  let moonPhase = 'Waxing Crescent';
  const age = phase * synodicMonth;
  if (age < 1.5 || age > 28.0) moonPhase = 'New Moon (Amavasya)';
  else if (age < 7.0) moonPhase = `Waxing Crescent (${Math.round(phase * 100)}%)`;
  else if (age < 8.5) moonPhase = 'First Quarter (50%)';
  else if (age < 13.5) moonPhase = `Waxing Gibbous (${Math.round(phase * 100)}%)`;
  else if (age < 16.0) moonPhase = 'Full Moon (Purnima)';
  else if (age < 21.5) moonPhase = `Waning Gibbous (${Math.round((1 - phase) * 100)}%)`;
  else if (age < 23.0) moonPhase = 'Third Quarter (50%)';
  else moonPhase = `Waning Crescent (${Math.round((1 - phase) * 100)}%)`;

  return {
    tithiIndex,
    isShukla,
    tithiDayNumber,
    tithiEnds: formatMinutes(tithiEndsMin),
    nakshatraIndex,
    nakshatraEnds: formatMinutes(nakshatraEndsMin),
    yogaIndex,
    yogaEnds: formatMinutes(yogaEndsMin),
    karanaName,
    karanaEnds: formatMinutes(karanaEndsMin),
    moonrise: formatMinutes(moonriseMin),
    moonset: formatMinutes(moonsetMin),
    moonPhase,
  };
}

export function calculateMuhurats(
  sunriseMin: number,
  sunsetMin: number,
  dayOfWeek: number
) {
  const daytime = sunsetMin - sunriseMin;
  const dayMuhurat = daytime / 15;
  const nighttime = 1440 - daytime;
  const nightMuhurat = nighttime / 15;
  const octant = daytime / 8;

  const brahmaStart = sunriseMin - 2 * nightMuhurat;
  const brahmaEnd = sunriseMin - 1 * nightMuhurat;

  const abhijitStart = sunriseMin + 7 * dayMuhurat;
  const abhijitEnd = sunriseMin + 8 * dayMuhurat;
  const abhijitStr =
    dayOfWeek === 3
      ? 'Not observed on Wednesday'
      : `${formatMinutes(abhijitStart)} – ${formatMinutes(abhijitEnd)}`;

  const vijayStart = sunriseMin + 10 * dayMuhurat;
  const vijayEnd = sunriseMin + 11 * dayMuhurat;

  const godhuliStart = sunsetMin - 12;
  const godhuliEnd = sunsetMin + 12;

  const rahuOctantMap = [7, 1, 6, 4, 5, 3, 2];
  const rahuOct = rahuOctantMap[dayOfWeek] ?? 7;
  const rahuStart = sunriseMin + rahuOct * octant;
  const rahuEnd = rahuStart + octant;

  const yamaOctantMap = [4, 3, 2, 1, 0, 6, 5];
  const yamaOct = yamaOctantMap[dayOfWeek] ?? 4;
  const yamaStart = sunriseMin + yamaOct * octant;
  const yamaEnd = yamaStart + octant;

  const gulikaOctantMap = [6, 5, 4, 3, 2, 1, 0];
  const gulikaOct = gulikaOctantMap[dayOfWeek] ?? 6;
  const gulikaStart = sunriseMin + gulikaOct * octant;
  const gulikaEnd = gulikaStart + octant;

  const durMuhuratStart = sunriseMin + ((dayOfWeek * 2 + 3) % 13) * dayMuhurat;
  const durMuhuratEnd = durMuhuratStart + dayMuhurat;

  const varjyamStart = sunsetMin - 90 + ((dayOfWeek * 37) % 120);
  const varjyamEnd = varjyamStart + 96;

  return {
    brahmaMuhurat: `${formatMinutes(brahmaStart)} – ${formatMinutes(brahmaEnd)}`,
    abhijitMuhurat: abhijitStr,
    vijayMuhurat: `${formatMinutes(vijayStart)} – ${formatMinutes(vijayEnd)}`,
    godhuliMuhurat: `${formatMinutes(godhuliStart)} – ${formatMinutes(godhuliEnd)}`,
    rahuKaal: `${formatMinutes(rahuStart)} – ${formatMinutes(rahuEnd)}`,
    yamaganda: `${formatMinutes(yamaStart)} – ${formatMinutes(yamaEnd)}`,
    gulikaKaal: `${formatMinutes(gulikaStart)} – ${formatMinutes(gulikaEnd)}`,
    durMuhurat: `${formatMinutes(durMuhuratStart)} – ${formatMinutes(durMuhuratEnd)}`,
    varjyam: `${formatMinutes(varjyamStart)} – ${formatMinutes(varjyamEnd)}`,
  };
}

const PRADOSH_PREFIX = [
  'Bhanu Pradosh Vrat',
  'Soma Pradosh Vrat',
  'Bhauma Pradosh Vrat',
  'Budha Pradosh Vrat',
  'Guru Pradosh Vrat',
  'Shukra Pradosh Vrat',
  'Shani Pradosh Vrat',
];

export function detectVrats(
  month: number,
  dayOfWeek: number,
  isShukla: boolean,
  tithiDayNumber: number
): string[] {
  const vrats: string[] = [];

  if (tithiDayNumber === 11) {
    const ekadashiName = isShukla
      ? EKADASHI_NAMES_SHUKLA[month] ?? 'Ekadashi Vrat'
      : EKADASHI_NAMES_KRISHNA[month] ?? 'Ekadashi Vrat';
    vrats.push(ekadashiName);
  }

  if (tithiDayNumber === 13) {
    const pradoshName = PRADOSH_PREFIX[dayOfWeek] ?? 'Pradosh Vrat';
    vrats.push(pradoshName);
  }

  if (!isShukla && tithiDayNumber === 14) {
    vrats.push('Masik Shivratri');
  }

  if (!isShukla && tithiDayNumber === 4) {
    vrats.push('Sankashti Chaturthi Vrat');
  }

  if (isShukla && tithiDayNumber === 4) {
    vrats.push('Vinayaka Chaturthi Vrat');
  }

  if (isShukla && tithiDayNumber === 15) {
    vrats.push('Satyanarayan Puja & Purnima Vrat');
  }

  if (!isShukla && tithiDayNumber === 15) {
    vrats.push('Amavasya Pitru Tarpan');
  }

  if (isShukla && tithiDayNumber === 8) {
    vrats.push('Masik Durgashtami Vrat');
  }

  return vrats;
}

export function getPanchangForDate(
  date: Date,
  customFestivals?: Festival[]
): PanchangDay {
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();
  const dateKey = `${year}-${pad2(month + 1)}-${pad2(dayOfMonth)}`;

  const sun = calculateSunTimings(date);
  const moon = calculateMoonTimings(date, sun.sunriseMin);
  const muhurats = calculateMuhurats(sun.sunriseMin, sun.sunsetMin, dayOfWeek);

  const tithiRawName =
    moon.tithiDayNumber === 15
      ? moon.isShukla
        ? 'Purnima'
        : 'Amavasya'
      : TITHI_NAMES[moon.tithiDayNumber - 1] ?? 'Pratipada';

  const pakshaLabel: 'Shukla Paksha' | 'Krishna Paksha' = moon.isShukla
    ? 'Shukla Paksha'
    : 'Krishna Paksha';
  const fullTithiLabel = `${pakshaLabel} ${tithiRawName}`;

  const nakshatraName = NAKSHATRAS[moon.nakshatraIndex] ?? 'Ashwini';
  const yogaName = YOGAS[moon.yogaIndex] ?? 'Siddhi';

  const vrats = detectVrats(month, dayOfWeek, moon.isShukla, moon.tithiDayNumber);

  const registered = SACRED_FESTIVALS_MAP[dateKey];
  const festivals: string[] = registered ? [...registered.festivals] : [];
  if (registered?.vrats) {
    for (const v of registered.vrats) {
      if (!vrats.includes(v)) vrats.push(v);
    }
  }

  if (customFestivals && customFestivals.length > 0) {
    for (const f of customFestivals) {
      if (!f.isActive || !f.startDate) continue;
      const fDate = f.startDate.slice(0, 10);
      if (fDate === dateKey && !festivals.includes(f.name)) {
        festivals.unshift(f.name);
      }
    }
  }

  const eclipse = ECLIPSE_DATABASE[dateKey];

  return {
    date: dateKey,
    tithi: fullTithiLabel,
    tithiEnds: moon.tithiEnds,
    paksha: pakshaLabel,

    nakshatra: nakshatraName,
    nakshatraEnds: moon.nakshatraEnds,

    yoga: yogaName,
    yogaEnds: moon.yogaEnds,

    karana: moon.karanaName,
    karanaEnds: moon.karanaEnds,

    sunrise: sun.sunrise,
    sunset: sun.sunset,
    moonrise: moon.moonrise,
    moonset: moon.moonset,
    moonPhase: moon.moonPhase,

    brahmaMuhurat: muhurats.brahmaMuhurat,
    abhijitMuhurat: muhurats.abhijitMuhurat,
    vijayMuhurat: muhurats.vijayMuhurat,
    godhuliMuhurat: muhurats.godhuliMuhurat,

    rahuKaal: muhurats.rahuKaal,
    gulikaKaal: muhurats.gulikaKaal,
    yamaganda: muhurats.yamaganda,
    durMuhurat: muhurats.durMuhurat,
    varjyam: muhurats.varjyam,

    festivals: festivals.length > 0 ? festivals : undefined,
    vrat: vrats.length > 0 ? vrats : undefined,
    sankranti: registered?.sankranti,
    special: registered?.special,

    suryaGrahan: eclipse?.suryaGrahan,
    chandraGrahan: eclipse?.chandraGrahan,
  };
}

export function getMonthPanchang(
  year: number,
  month: number,
  customFestivals?: Festival[]
): PanchangDay[] {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days: PanchangDay[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d, 12, 0, 0);
    days.push(getPanchangForDate(dateObj, customFestivals));
  }

  return days;
}

