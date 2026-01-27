export type Achievement = {
  id: string;
  title: string;
  description: string;
  info?: string;
  image?: string;
  unlocked: boolean;
  unlockedAt?: string;
};

// definición estática de los logros/trofeos
/*const ACH_DEFS: Omit<Achievement, 'unlocked'|'unlockedAt'>[] = [
  { id: 'first_play', title: 'El novato', description: 'Has jugado tu primera especie', info: '', image: '/achievements/medalla_filosofia.png' },
  { id: '25_species', title: 'Trofeo Linn Margulis', description: 'Has completado el 25% de las especies!', info: 'La gran aportación de Lynn Margulis a la taxonomía y biología evolutiva fue la Teoría de la Endosimbiosis Seriada, explicando que las células eucariotas (con núcleo) surgieron de la fusión simbiótica de bacterias procariotas, dando origen a mitocondrias y cloroplastos, y propuso, junto a Whittaker, la clasificación de los seres vivos en cinco reinos (Moneras, Protoctistas, Hongos, Plantas y Animales) basada en la simbiogénesis, enfatizando la cooperación sobre la competencia en la evolución. ', image: '/achievements/trofeo_lynn.png' },
  { id: '50_species', title: 'Trofeo Aristóteles', description: 'Has completado el 50% de las especies!', info: 'Aristóteles es considerado el padre de la taxonomía por crear el primer sistema jerárquico de clasificación biológica, dividiendo el mundo natural en dos grandes reinos (Animal y Vegetal) y clasificando a los animales según la presencia de sangre (con sangre roja vs. sin sangre) y características como hábitat y forma de reproducción, sentando las bases para la organización científica de los seres vivos mediante la observación empírica. Introdujo por primera vez conceptos como el género y la especie.', image: '/achievements/trofeo_aristoteles.png' },
  { id: '75_species', title: 'Trofeo Darwin', description: 'Has completado el 75% de las especies!', info: '', image: '/achievements/trofeo_darwin.png' },
  { id: '100_species', title: 'Trofeo Linneo', description: 'Has completado el 100% de las species!', info: '', image: '/achievements/trofeo_linneo.png' },

  { id: '80_phylum', title: 'Amante de la filosofía', description: 'Has acertado el 80% de los filos!', info: '', image: '/achievements/medalla_filosofia.png' },
  { id: '80_class', title: 'Amante de lo clásico', description: 'Has acertado el 80% de las clases!', info: '', image: '/achievements/medalla_clasico.png' },
  { id: '80_order', title: 'Amante del orden', description: 'Has acertado el 80% de los ordenes!', info: '', image: '/achievements/medalla_orden.png'},
  { id: '80_family', title: 'Amante del orden', description: 'Has acertado el 80% de las familias!', info: '', image: '/achievements/medalla_familia.png' },
  { id: '80_genus', title: 'Generalista', description: 'Has acertado el 80% de los géneros!', info: '', image: '/achievements/medalla_genero.png' },
  { id: '80_species', title: 'Amante de las especies', description: 'Has acertado el 80% de las especies!', info: '', image: '/achievements/medalla_especie.png' }
];*/

export const ACH_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_play',
    title: 'El novato',
    description: 'Has jugado tu primera especie',
    image: '/achievements/medalla_filosofia.png'
  },
  {
    id: '25_species',
    title: 'Trofeo Linn Margulis',
    description: 'Has completado el 25% de las especies!',
    info:
      'La gran aportación de Lynn Margulis a la taxonomía y biología evolutiva fue la Teoría de la Endosimbiosis Seriada, explicando que las células eucariotas (con núcleo) surgieron de la fusión simbiótica de bacterias procariotas, dando origen a mitocondrias y cloroplastos, y propuso, junto a Whittaker, la clasificación de los seres vivos en cinco reinos (Moneras, Protoctistas, Hongos, Plantas y Animales) basada en la simbiogénesis, enfatizando la cooperación sobre la competencia en la evolución. ',
    image: '/achievements/trofeo_lynn.png'
  },
  {
    id: '50_species',
    title: 'Trofeo Aristóteles',
    description: 'Has completado el 50% de las especies!',
    info:
      'Aristóteles es considerado el padre de la taxonomía por crear el primer sistema jerárquico de clasificación biológica, dividiendo el mundo natural en dos grandes reinos (Animal y Vegetal) y clasificando a los animales según la presencia de sangre (con sangre roja vs. sin sangre) y características como hábitat y forma de reproducción, sentando las bases para la organización científica de los seres vivos mediante la observación empírica. Introdujo por primera vez conceptos como el género y la especie.',
    image: '/achievements/trofeo_aristoteles.png'
  },
  {
    id: '75_species',
    title: 'Trofeo Darwin',
    description: 'Has completado el 75% de las especies!',
    image: '/achievements/trofeo_darwin.png'
  },
  {
    id: '100_species',
    title: 'Trofeo Linneo',
    description: 'Has completado el 100% de las species!',
    image: '/achievements/trofeo_linneo.png'
  },
  {
    id: '80_phylum',
    title: 'Amante de la filosofía',
    description: 'Has acertado el 80% de los filos!',
    image: '/achievements/medalla_filosofia.png'
  },
  {
    id: '80_class',
    title: 'Amante de lo clásico',
    description: 'Has acertado el 80% de las clases!',
    image: '/achievements/medalla_clasico.png'
  },
  {
    id: '80_order',
    title: 'Amante del orden',
    description: 'Has acertado el 80% de los ordenes!',
    image: '/achievements/medalla_orden.png'
  },
  {
    id: '80_family',
    title: 'Amante del orden',
    description: 'Has acertado el 80% de las familias!',
    image: '/achievements/medalla_familia.png'
  },
  {
    id: '80_genus',
    title: 'Generalista',
    description: 'Has acertado el 80% de los géneros!',
    image: '/achievements/medalla_genero.png'
  },
  {
    id: '80_species',
    title: 'Amante de las especies',
    description: 'Has acertado el 80% de las especies!',
    image: '/achievements/medalla_especie.png'
  }
];
