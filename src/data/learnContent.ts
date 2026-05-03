export type ContentType = 'Story' | 'Doctor Talks' | 'Micro-Lessons' | 'Science Bites' | 'Reads';

export interface LearnContent {
  id: string;
  type: ContentType;
  title: string;
  shortDesc: string;
  durationStr: string; // e.g. "5 MIN READ", "3 SWIPES"
  triggerRelevance?: string[];
  stageRelevance?: [number, number]; // [minDays, maxDays] e.g. [0, 7] for survival
  methodRelevance?: string[]; // e.g. ['cbt', 'act']
  
  // Specific to Story
  authorName?: string;
  yearsSmoking?: number;
  quitMethod?: string;
  storyContent?: { hook: string; middle: string; present: string; insight: string };

  // Specific to Doctor Talks
  doctorName?: string;
  doctorSpecialty?: string;
  videoUrl?: string; // e.g., YouTube URL
  keyTakeaway?: string;
  transcript?: string;

  // Specific to Micro-Lessons
  swipeCards?: { illustrationRef: string; title: string; desc: string }[];
  reflectionQuestion?: string;

  // Specific to Science Bites
  scienceStat?: string;
  scienceContext?: string;

  // Specific to Reads
  readContent?: { sectionTitle: string; paragraphs: string[] }[];
}

export const LEARN_CATALOG: LearnContent[] = [
  {
    id: 'story_arya1',
    type: 'Story',
    title: 'Malam Pertama Tanpa Rokok',
    shortDesc: 'Aku kira aku bakal gila pas jam 11 malam...',
    durationStr: '3 MIN READ',
    triggerRelevance: ['waking_up', 'night', 'stressed'],
    stageRelevance: [0, 7],
    authorName: 'Arya S.',
    yearsSmoking: 8,
    quitMethod: 'Habit Replacement',
    storyContent: {
      hook: "Aku kira aku bakal gila pas jam 11 malam. Udah terbiasa banget sebatang sebelum tidur, rasanya dada ini beneran ditarik-tarik.",
      middle: "Malam pertama itu aku bolak-balik kasur sampai 10 kali. Berkali-kali aku jalan ke dapur, buka laci tempat biasa nyimpen rokok cadangan, tapi kosong. Aku coba minum air es, makan kuaci, sampai akhirnya aku push up 50 kali saking frustrasinya. Di hari ketiga, aku sempat relapse gara-gara dimarahin bos. Aku merasa gagal total.",
      present: "Sekarang udah bulan kedua. Kadang kangen rasanya ditarik asap pas stres? Iya, masih. Tapi bedanya, sekarang aku tahu gelombang craving itu bakal hilang dalam 5 menit kalau aku cuekin. Gak sempurna, tapi sepadan.",
      insight: "Craving itu seperti gelombang ombak; dia akan datang, memuncak, lalu pasti pecah dan hilang sendiri kalau kita tidak bereaksi."
    }
  },
  {
    id: 'doc_dopamine',
    type: 'Doctor Talks',
    title: 'Siklus Dopamin di Otak Perokok',
    shortDesc: 'Kenapa rasanya hampa tanpa nikotin?',
    durationStr: '2 MIN VIDEO',
    triggerRelevance: ['bored', 'stressed'],
    stageRelevance: [8, 30],
    doctorName: 'Dr. Andi Gunawan',
    doctorSpecialty: 'Spesialis Kedokteran Jiwa (Psikiatri)',
    keyTakeaway: 'Nikotin membajak sistem reward alami otakmu, butuh waktu sekitar 3-4 minggu agar reseptor dopamin kembali normal.',
    transcript: 'Halo teman-teman. Pernahkah kalian merasa hampa atau kosong saat pertama kali berhenti merokok? Itu sangat wajar. Nikotin di dalam rokok bekerja dengan cara "membajak" sistem dopamin otak kita. Ibaratnya, otak kita yang biasanya bahagia gara-gara hal sederhana seperti makan enak atau ketawa bareng teman, sekarang cuma mau bahagia kalau ada nikotin. Saat nikotinnya di-stop, reseptor yang terlanjur terbiasa banjir dopamin ini jadi kebingungan dan berteriak minta nikotin lagi. Kabar baiknya, neuroplastisitas otak kita luar biasa. Dalam 3-4 minggu, jumlah reseptor ini akan pelan-pelan kembali normal, dan kalian akan mulai bisa merasakan kebahagiaan dari hal-hal kecil lagi.'
  },
  {
    id: 'micro_urge_surf',
    type: 'Micro-Lessons',
    title: 'Urge Surfing 101',
    shortDesc: 'Belajar berselancar di atas rasa ingin merokok.',
    durationStr: '4 CARDS',
    methodRelevance: ['act', 'mindfulness'],
    swipeCards: [
      { illustrationRef: 'wave', title: 'Craving Itu Seperti Ombak', desc: 'Sama seperti ombak di laut, dorongan merokok itu mulai dari kecil, membesar hingga ke puncaknya, lalu pecah dan mereda.' },
      { illustrationRef: 'resist', title: 'Jangan Dilawan, Diamati', desc: 'Makin keras kamu teriak "jangan merokok", otakmu makin fokus ke rokok. Triknya bukan melawan, tapi mengamati rasa gak nyaman itu.' },
      { illustrationRef: 'body', title: 'Pindai Tubuhmu', desc: 'Saat craving datang, rasakan di mana nyerinya? Apakah dadamu sesak? Perutmu kaku? Tarik napas ke bagian itu.' },
      { illustrationRef: 'ride', title: 'Berselancar Sampai Reda', desc: 'Tetap bersama rasa tidak nyaman itu. Ia tidak akan membunuhmu. Ia akan hilang dalam 3-5 menit.' }
    ],
    reflectionQuestion: 'Apa sensasi fisik paling kuat saat kamu ingin merokok?'
  },
  {
    id: 'science_stress',
    type: 'Science Bites',
    title: 'Paradoks Stres',
    shortDesc: 'Kenapa rokok terasa menghilangkan stres padahal tidak?',
    durationStr: '1 MIN',
    triggerRelevance: ['stressed'],
    scienceStat: '+73%',
    scienceContext: 'Rokok TIDAK benar-benar menghilangkan stres hidupmu. Saat kamu stres lalu merokok dan merasa lega, yang sebenarnya hilang adalah STRES WITHDRAWAL NIKOTIN akibat kamu kelamaan gak merokok. Detak jantung perokok justru 73% lebih cepat dan tingkat kecemasan baseline-nya lebih tinggi dibanding non-perokok.'
  },
  {
    id: 'read_trigger_mapping',
    type: 'Reads',
    title: 'Anatomi Sebuah Trigger',
    shortDesc: 'Gimana cara tahu pola merokokmu sebelum terlambat.',
    durationStr: '4 MIN READ',
    methodRelevance: ['cbt', 'habit'],
    readContent: [
      {
        sectionTitle: "Kenapa Kita Kayak Robot?",
        paragraphs: [
          "Pernah nggak kamu lagi nongkrong, tiba-tiba di tanganmu udah ada rokok yang nyala, padahal kamu nggak ingat kapan ambilnya? Itulah yang disebut automatic behavior.",
          "Otak kita itu malas. Untuk menghemat energi, otak membuat shortcut atau jalan pintas untuk hal-hal yang sering kita lakukan. Kalau kamu selalu merokok setelah makan selama 5 tahun, otak otomatis menyambungkan kabel 'selesai makan' langsung ke 'nyalakan rokok'."
        ]
      },
      {
        sectionTitle: "Memecah Rantai Kebiasaan",
        paragraphs: [
          "Untuk memutus rantai ini, kamu harus memindahkan tindakan merokok dari unconscious mind (pikiran tak sadar) ke conscious mind (pikiran sadar).",
          "Caranya? Setiap kali dorongan itu datang, STOP selama 10 detik. Tanyakan: 'Apa yang memicu ini? Apakah aku baru aja selesai presentasi? Atau aku cuman bosen?'"
        ]
      }
    ]
  },
  {
    id: 'micro_cbt_reframe',
    type: 'Micro-Lessons',
    title: 'Jurus Reframe Pikiran',
    shortDesc: 'Ubah pikiran sabotase jadi kekuatan.',
    durationStr: '3 CARDS',
    methodRelevance: ['cbt'],
    swipeCards: [
      { illustrationRef: 'brain', title: 'Pikiran Sabotase', desc: 'Pernah dengar suara di kepalamu yang bilang: "Satu batang doang nggak bakal ngerusak progress kok"? Itu namanya pikiran sabotase.' },
      { illustrationRef: 'switch', title: 'Tangkap dan Sadari', desc: 'Langkah pertama adalah menyadari saat suara itu muncul. Jangan dipercaya begitu saja. Pikiran bukanlah fakta.' },
      { illustrationRef: 'reframe', title: 'Putar Balik (Reframe)', desc: 'Balas suara itu dengan fakta: "Satu batang HARI INI mungkin gampang, tapi satu batang besok dan lusa akan mengembalikan aku ke titik nol."' }
    ],
    reflectionQuestion: 'Apa kebohongan paling sering yang kamu ucapkan ke diri sendiri buat merokok?'
  }
];
