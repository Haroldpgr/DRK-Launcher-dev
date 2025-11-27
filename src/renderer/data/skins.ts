// Modern skins with real Minecraft usernames and CORS proxy
const CORS_PROXY = 'https://corsproxy.io/?';
const MINOTAR_URL = 'https://minotar.net';

export const modernSkins = [
  { id: '1001', name: 'Aphmau', username: 'Aphmau' },
  { id: '1002', name: 'Bajan Canadian', username: 'BajanCanadian' },
  { id: '1003', name: 'CaptainSparklez', username: 'CaptainSparklez' },
  { id: '1004', name: 'DanTDM', username: 'dantdm' },
  { id: '1005', name: 'Dream', username: 'Dream' },
  { id: '1006', name: 'Grian', username: 'Grian' },
  { id: '1007', name: 'GeorgeNotFound', username: 'GeorgeNotFound' },
  { id: '1008', name: 'GoodTimesWithScar', username: 'GoodTimeWithScar' },
  { id: '1009', name: 'iHasCupquake', username: 'iHasCupquake' },
  { id: '1010', name: 'iJevin', username: 'ijevin' },
  { id: '1011', name: 'ImpulseSV', username: 'ImpulseSV' },
  { id: '1012', name: 'Martyn', username: 'InTheLittleWood' },
  { id: '1013', name: 'iScream', username: 'iScream' },
  { id: '1014', name: 'Jerome', username: 'JeromeASF' },
  { id: '1015', name: 'Kara Corvus', username: 'KaraCorvus' },
  { id: '1016', name: 'LDShadowLady', username: 'LDShadowLady' },
  { id: '1017', name: 'Mumbo Jumbo', username: 'MumboJumbo' },
  { id: '1018', name: 'Preston', username: 'PrestonPlayz' },
  { id: '1019', name: 'Rendog', username: 'Rendog' },
  { id: '1020', name: 'Sapnap', username: 'Sapnap' }
].map(skin => {
  const encodedUrl = encodeURIComponent(`${MINOTAR_URL}/skin/${skin.username}`);
  const encodedPreviewUrl = encodeURIComponent(`${MINOTAR_URL}/body/${skin.username}`);
  
  return {
    ...skin,
    url: `${CORS_PROXY}${encodedUrl}`,
    previewUrl: `${CORS_PROXY}${encodedPreviewUrl}`,
    isPublic: true
  };
});
