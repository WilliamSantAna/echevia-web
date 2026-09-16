import type { Plant, PlantPhoto, PlantVideo } from '../types/plant'

function publicUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

function photo(id: string, file: string, isMain = false): PlantPhoto {
  return {
    id,
    isMain,
    url: publicUrl(`mock/${file}`),
  }
}

function video(id: string, url: string, poster: string, durationSeconds: number): PlantVideo {
  return {
    id,
    url,
    posterUrl: publicUrl(`mock/${poster}`),
    durationSeconds,
  }
}

const FLOWER_CLIP = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const PLANT_CLIP = 'https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_25fps.mp4'
const LEAF_CLIP = 'https://videos.pexels.com/video-files/1448735/1448735-uhd_2560_1440_24fps.mp4'

export const seedPlants: Plant[] = [
  {
    id: 'plant-lola',
    name: 'Lola',
    species: "Echeveria 'Lola'",
    botanicalFamily: 'Crassulaceae',
    identification: 'ECH-LOLA-01',
    notes:
      'Roseta compacta com tons lilás-acinzentados e pontas que rosadeiam com mais sol. Prefere sol da manhã e sombra leve à tarde, sobretudo no verão. O substrato precisa drenar rápido: mistura de terra para suculentas, areia grossa e um pouco de perlita. Regar só quando o vaso estiver completamente seco, molhando o solo e evitando encharcar o miolo da roseta. No inverno, reduzir bastante a água. Gosta de vaso raso, com boa ventilação, e reage bem a uma adubação leve na primavera.',
    favorite: true,
    photos: [
      photo('lola-1', 'echeveria-pot.jpg', true),
      photo('lola-2', 'echeveria-mix.jpg'),
      photo('lola-3', 'collection.jpg'),
    ],
    videos: [video('lola-v1', FLOWER_CLIP, 'echeveria-pot.jpg', 12)],
    createdAt: '2026-03-12T10:15:00.000Z',
    updatedAt: '2026-08-02T18:40:00.000Z',
  },
  {
    id: 'plant-elegans',
    name: 'Rosa de alabastro',
    species: 'Echeveria elegans',
    botanicalFamily: 'Crassulaceae',
    identification: 'ECH-ELE-02',
    notes:
      'Clássica mexicana de folhas glaucas, quase azuladas, que forma colônias densas com o tempo. As flores aparecem no verão em hastes arqueadas, rosadas por fora e amarelas por dentro. Precisa de muita luz para manter o formato compacto; com pouca luz estica e perde a cor. Deixe o substrato secar entre as regas e use vaso com furo. Tolera um pouco de frio, mas não geada forte. Separar as mudas laterais na primavera ajuda a renovar o vaso sem perder o aspecto de tapete.',
    favorite: true,
    photos: [
      photo('ele-1', 'echeveria-mix.jpg', true),
      photo('ele-2', 'collection.jpg'),
      photo('ele-3', 'haworthia-shelf.jpg'),
      photo('ele-4', 'echeveria-pot.jpg'),
    ],
    videos: [video('ele-v1', PLANT_CLIP, 'echeveria-mix.jpg', 18)],
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-07-11T14:22:00.000Z',
  },
  {
    id: 'plant-fantasma',
    name: 'Fantasma',
    species: 'Graptopetalum paraguayense',
    botanicalFamily: 'Crassulaceae',
    identification: 'GRA-PAR-03',
    notes: 'Cresce bem em vaso pendente. As pontas ficam rosadas com mais sol.',
    favorite: false,
    photos: [photo('fan-1', 'collection.jpg', true), photo('fan-2', 'cacti.jpg')],
    videos: [],
    createdAt: '2026-02-04T16:30:00.000Z',
    updatedAt: '2026-06-18T11:05:00.000Z',
  },
  {
    id: 'plant-jade',
    name: 'Jade',
    species: 'Crassula ovata',
    botanicalFamily: 'Crassulaceae',
    identification: 'CRA-OVA-04',
    notes:
      'Tronco lenhoso que engrossa com os anos, fácil de cultivar dentro de casa perto de janela clara. Evitar excesso de rega no inverno, quando a planta quase pára de crescer. Folhas caídas e moles costumam indicar água demais, não de menos. Aceita poda para formar uma arvorezinha; os galhos cortados enraízam com facilidade. Poeira nas folhas reduz a luz, então um pano seco de vez em quando ajuda. No calor, pode ir para a varanda, mas o sol do meio-dia queima as pontas se a planta estiver acostumada à meia-sombra.',
    favorite: true,
    photos: [
      photo('jade-1', 'sansevieria.jpg', true),
      photo('jade-2', 'potting.jpg'),
      photo('jade-3', 'collection.jpg'),
    ],
    videos: [video('jade-v1', LEAF_CLIP, 'sansevieria.jpg', 24)],
    createdAt: '2025-11-08T13:10:00.000Z',
    updatedAt: '2026-09-01T08:12:00.000Z',
  },
  {
    id: 'plant-sedum',
    name: 'Rabo de burro',
    species: 'Sedum morganianum',
    botanicalFamily: 'Crassulaceae',
    identification: 'SED-MOR-05',
    notes: 'Haste longa e frágil. Melhor em local alto, longe de vento.',
    favorite: false,
    photos: [photo('sed-1', 'haworthia-shelf.jpg', true), photo('sed-2', 'cacti.jpg')],
    videos: [],
    createdAt: '2026-04-22T19:45:00.000Z',
    updatedAt: '2026-04-22T19:45:00.000Z',
  },
  {
    id: 'plant-kalanchoe',
    name: 'Orelha de gato',
    species: 'Kalanchoe tomentosa',
    botanicalFamily: 'Crassulaceae',
    identification: 'KAL-TOM-06',
    notes: 'Folhas aveludadas com margem marrom. Gosta de muita luz.',
    favorite: false,
    photos: [
      photo('kal-1', 'haworthia-shelf.jpg', true),
      photo('kal-2', 'echeveria-pot.jpg'),
      photo('kal-3', 'collection.jpg'),
    ],
    videos: [video('kal-v1', FLOWER_CLIP, 'haworthia-shelf.jpg', 10)],
    createdAt: '2026-05-09T07:20:00.000Z',
    updatedAt: '2026-08-21T21:00:00.000Z',
  },
  {
    id: 'plant-lithops',
    name: 'Pedra viva',
    species: 'Lithops lesliei',
    botanicalFamily: 'Aizoaceae',
    identification: 'LIT-LES-07',
    notes:
      'Quase não regar durante a troca de folhas, fase em que a planta vive das reservas da folha antiga. Substrato bem drenado, quase mineral, com muita areia e pedrisco. Qualquer acúmulo de água no colo apodrece rápido. Precisa de muita luz, inclusive sol direto filtrado, para manter o corpo compacto e as marcas visíveis. Floresce no outono/inverno em haste fina. Depois da flor, a planta-mãe em geral dá lugar aos filhos. Observar o ritmo das folhas novas é o melhor guia de rega: se ainda está “comendo” a folha velha, esperar.',
    favorite: true,
    photos: [photo('lit-1', 'echeveria-mix.jpg', true), photo('lit-2', 'cacti.jpg')],
    videos: [],
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-09-10T17:33:00.000Z',
  },
  {
    id: 'plant-senecio',
    name: 'Colar de pérolas',
    species: 'Senecio rowleyanus',
    botanicalFamily: 'Asteraceae',
    identification: 'SEN-ROW-08',
    notes:
      'Haste pendente com folhas esféricas que estouram se receberem água demais ou sol forte demais de uma hora para outra. Sensível a fungos quando o vaso fica úmido por dias. Melhor em local alto, com luz difusa e corrente de ar. Regar pela borda do vaso, sem molhar as pérolas. Os ramos quebram com facilidade: cada segmento pode virar muda se apoiado em substrato seco. No inverno, a planta pede ainda menos água. Se as pérolas murcharam e o substrato está seco, aí sim molhar com calma até escorrer.',
    favorite: false,
    photos: [
      photo('sen-1', 'collection.jpg', true),
      photo('sen-2', 'haworthia-shelf.jpg'),
      photo('sen-3', 'echeveria-pot.jpg'),
      photo('sen-4', 'echeveria-mix.jpg'),
    ],
    videos: [video('sen-v1', PLANT_CLIP, 'collection.jpg', 16)],
    createdAt: '2026-02-28T15:55:00.000Z',
    updatedAt: '2026-07-30T10:10:00.000Z',
  },
  {
    id: 'plant-sempervivum',
    name: 'Sempre-viva',
    species: 'Sempervivum tectorum',
    botanicalFamily: 'Crassulaceae',
    identification: 'SEM-TEC-09',
    notes: 'Forma mudas ao redor da roseta-mãe. Tolera frio melhor que a maioria.',
    favorite: false,
    photos: [photo('sem-1', 'echeveria-mix.jpg', true), photo('sem-2', 'echeveria-pot.jpg')],
    videos: [],
    createdAt: '2026-03-30T11:11:00.000Z',
    updatedAt: '2026-03-30T11:11:00.000Z',
  },
  {
    id: 'plant-lua',
    name: 'Lua',
    species: 'Pachyphytum oviferum',
    botanicalFamily: 'Crassulaceae',
    identification: 'PAC-OVI-10',
    notes: 'Folhas ovais com pruína branca. Evitar encostar para não marcar.',
    favorite: true,
    photos: [
      photo('lua-1', 'echeveria-pot.jpg', true),
      photo('lua-2', 'echeveria-mix.jpg'),
      photo('lua-3', 'collection.jpg'),
    ],
    videos: [video('lua-v1', LEAF_CLIP, 'echeveria-pot.jpg', 21)],
    createdAt: '2026-07-14T08:40:00.000Z',
    updatedAt: '2026-09-05T19:18:00.000Z',
  },
  {
    id: 'plant-cooperi',
    name: 'Cooperi',
    species: 'Haworthia cooperi',
    botanicalFamily: 'Asphodelaceae',
    identification: 'HAW-COO-11',
    notes: 'Janelas translúcidas nas folhas. Prefere luz filtrada.',
    favorite: false,
    photos: [photo('coo-1', 'haworthia-shelf.jpg', true), photo('coo-2', 'collection.jpg')],
    videos: [],
    createdAt: '2026-08-08T20:05:00.000Z',
    updatedAt: '2026-08-19T09:27:00.000Z',
  },
  {
    id: 'plant-aeonium',
    name: 'Aeonium negro',
    species: 'Aeonium arboreum',
    botanicalFamily: 'Crassulaceae',
    identification: 'AEO-ARB-12',
    notes: 'Rosetas escuras no sol forte. Dormência no auge do verão.',
    favorite: false,
    photos: [
      photo('aeo-1', 'cacti.jpg', true),
      photo('aeo-2', 'sansevieria.jpg'),
      photo('aeo-3', 'potting.jpg'),
    ],
    videos: [],
    createdAt: '2026-09-02T14:00:00.000Z',
    updatedAt: '2026-09-12T16:44:00.000Z',
  },
]
