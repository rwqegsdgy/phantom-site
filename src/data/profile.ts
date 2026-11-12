import avatarPhantom from '../assets/images/avatar_phantom.jpg';
import bgMoonlitForest from '../assets/images/bg_moonlit_forest_1794516761355.jpg';
import coverNoTheMoon from '../assets/images/cover_no_the_moon_1794516761657.jpg';
import coverPhantom from '../assets/images/cover_phantom.webp';
import fonPhantom from '../assets/images/fon_phantom.webp';
import galleryMidnightGlass from '../assets/images/gallery_midnight_glass_1794516762672.jpg';
import galleryWinterShore from '../assets/images/gallery_winter_shore_1794516763079.jpg';

export interface SocialLink {
  id: 'steam' | 'steam2' | 'discord' | 'server' | 'github';
  label: string;
  handle: string;
  subtitle: string;
  url: string;
  copyable?: string;
}

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  mood: string;
  durationSec: number;
  coverUrl: string;
  audioUrl: string;
  preset: 'moon' | 'frost' | 'lifeline';
}

export interface VisualScene {
  id: string;
  index: string;
  title: string;
  caption: string;
  location: string;
  aspect: 'wide' | 'square';
  imageUrl: string;
}

const MUSIC_URL = `${import.meta.env.BASE_URL}music.mp3`;
const TRACK2_URL = `${import.meta.env.BASE_URL}track2.mp3`;
const TRACK3_URL = `${import.meta.env.BASE_URL}track3.mp3`;

export const PROFILE = {
  nickname: 'The_Phantom-_-',
  eyebrow: 'Личная страница',
  avatarUrl: avatarPhantom,
  discordTag: 'rwqegsdgy',
  serverName: 'LifeLine',
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'steam',
    label: 'Steam',
    handle: 'The_Phantom-_-',
    subtitle: 'Основной профиль',
    url: 'https://steamcommunity.com/profiles/76561199376299348/',
  },
  {
    id: 'steam2',
    label: 'Steam',
    handle: '...',
    subtitle: 'Второй профиль',
    url: 'https://steamcommunity.com/profiles/76561198738794203/',
  },
  {
    id: 'discord',
    label: 'Discord',
    handle: 'rwqegsdgy',
    subtitle: 'Личные сообщения',
    url: 'https://discord.com/users/1170673606561382420',
    copyable: 'rwqegsdgy',
  },
  {
    id: 'server',
    label: 'Сервер',
    handle: 'LifeLine',
    subtitle: 'Сообщество Discord',
    url: 'https://discord.gg/h8W4zxfbDd',
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'rwqegsdgy',
    subtitle: 'Исходный код',
    url: 'https://github.com/rwqegsdgy',
  },
];

export const TRACKS: TrackItem[] = [
  {
    id: 'no-the-moon',
    title: 'No, the moon',
    artist: 'deadflowers',
    mood: 'Ночной инди · Dm',
    durationSec: 184,
    coverUrl: coverPhantom,
    audioUrl: MUSIC_URL,
    preset: 'moon',
  },
  {
    id: 'fok',
    title: 'Fok',
    artist: 'Ólafur Arnalds',
    mood: 'Зимний неоклассик · Am',
    durationSec: 269,
    coverUrl: galleryWinterShore,
    audioUrl: TRACK2_URL,
    preset: 'frost',
  },
  {
    id: 'butterflycatcher',
    title: 'Butterflycatcher',
    artist: 'Arms and Sleepers',
    mood: 'Ночной трип-хоп · Em',
    durationSec: 221,
    coverUrl: coverNoTheMoon,
    audioUrl: TRACK3_URL,
    preset: 'lifeline',
  },
];

export const VISUAL_SCENES: VisualScene[] = [
  {
    id: 'moonlit-forest',
    index: '01',
    title: 'Лунный лес в тумане',
    caption: 'Хвойный склон под холодным полнолунием и медленным декабрьским снегом.',
    location: 'Северный массив · 01:40',
    aspect: 'wide',
    imageUrl: bgMoonlitForest,
  },
  {
    id: 'midnight-glass',
    index: '02',
    title: 'Иней на ночном стекле',
    caption: 'Тонкие ледяные узоры и расплывчатые огни спящего города за окном.',
    location: 'Полночь · -14 °C',
    aspect: 'square',
    imageUrl: galleryMidnightGlass,
  },
  {
    id: 'phantom-original',
    index: '03',
    title: 'Зимние сумерки',
    caption: 'Сумрачный зимний пейзаж в холодной ночной дымке.',
    location: 'Сумерки · Ночь',
    aspect: 'wide',
    imageUrl: fonPhantom,
  },
];
