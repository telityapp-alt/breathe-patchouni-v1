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
    title: 'First Night Without a Cigarette',
    shortDesc: 'I thought I was going to lose my mind at 11 PM...',
    durationStr: '3 MIN READ',
    triggerRelevance: ['waking_up', 'night', 'stressed'],
    stageRelevance: [0, 7],
    authorName: 'Arya S.',
    yearsSmoking: 8,
    quitMethod: 'Habit Replacement',
    storyContent: {
      hook: "I thought I was going to lose my mind at 11 PM. I was so used to having one before bed, it felt like my chest was physically being pulled.",
      middle: "That first night, I tossed and turned in bed over 10 times. I went to the kitchen multiple times, opened the drawer where I usually kept my backup pack, but it was empty. I tried drinking ice water, eating seeds, until I eventually did 50 push-ups out of pure frustration. On the third day, I almost relapsed because my boss yelled at me. I felt like a total failure.",
      present: "Now it's been two months. Do I still miss the feeling of smoke pulling me out of stress? Yes, sometimes. But the difference is, now I know the wave of a craving will pass in 5 minutes if I ignore it. It's not perfect, but it's worth it.",
      insight: "A craving is like a wave; it will rise, peak, and eventually break and fade away on its own if we don't react."
    }
  },
  {
    id: 'doc_dopamine',
    type: 'Doctor Talks',
    title: 'The Dopamine Cycle in a Smoker\'s Brain',
    shortDesc: 'Why does it feel empty without nicotine?',
    durationStr: '2 MIN VIDEO',
    triggerRelevance: ['bored', 'stressed'],
    stageRelevance: [8, 30],
    doctorName: 'Dr. Andi Gunawan',
    doctorSpecialty: 'Psychiatrist',
    keyTakeaway: 'Nicotine hijacks your natural reward system. It takes about 3-4 weeks for your dopamine receptors to return to normal.',
    transcript: 'Hello everyone. Have you ever felt empty or hollow when you first stopped smoking? That is completely normal. The nicotine in cigarettes works by "hijacking" our brain\'s dopamine system. Simply put, our brain, which usually feels happy from simple things like good food or laughing with friends, now only wants to feel happy if there is nicotine. When the nicotine stops, the receptors that are used to being flooded with dopamine get confused and scream for more nicotine. The good news is, our brain\'s neuroplasticity is amazing. In 3-4 weeks, the number of these receptors will slowly return to normal, and you will begin to feel happiness from the little things again.'
  },
  {
    id: 'micro_urge_surf',
    type: 'Micro-Lessons',
    title: 'Urge Surfing 101',
    shortDesc: 'Learn to surf over the urge to smoke.',
    durationStr: '4 CARDS',
    methodRelevance: ['act', 'mindfulness'],
    swipeCards: [
      { illustrationRef: 'wave', title: 'Cravings Are Like Waves', desc: 'Just like waves in the ocean, the urge to smoke starts small, grows to its peak, and then breaks and subsides.' },
      { illustrationRef: 'resist', title: 'Don\'t Fight It, Observe It', desc: 'The harder you scream "don\'t smoke", the more your brain focuses on cigarettes. The trick isn\'t to fight, but to observe the discomfort.' },
      { illustrationRef: 'body', title: 'Scan Your Body', desc: 'When a craving hits, feel where it hurts. Is your chest tight? Is your stomach tense? Breathe into that area.' },
      { illustrationRef: 'ride', title: 'Ride It Out', desc: 'Stay with the discomfort. It won\'t kill you. It will disappear in 3-5 minutes.' }
    ],
    reflectionQuestion: 'What is the strongest physical sensation when you want to smoke?'
  },
  {
    id: 'science_stress',
    type: 'Science Bites',
    title: 'The Stress Paradox',
    shortDesc: 'Why do cigarettes feel like stress relievers when they aren\'t?',
    durationStr: '1 MIN',
    triggerRelevance: ['stressed'],
    scienceStat: '+73%',
    scienceContext: 'Cigarettes DO NOT actually relieve your life\'s stress. When you are stressed, then smoke, and feel relieved, what is actually disappearing is the NICOTINE WITHDRAWAL STRESS because you haven\'t smoked for a while. A smoker\'s heart rate is actually 73% faster and their baseline anxiety level is higher compared to non-smokers.'
  },
  {
    id: 'read_trigger_mapping',
    type: 'Reads',
    title: 'Anatomy of a Trigger',
    shortDesc: 'How to know your smoking patterns before it\'s too late.',
    durationStr: '4 MIN READ',
    methodRelevance: ['cbt', 'habit'],
    readContent: [
      {
        sectionTitle: "Why Are We Like Robots?",
        paragraphs: [
          "Have you ever been hanging out, and suddenly there's a lit cigarette in your hand, even though you don't remember when you grabbed it? That is called automatic behavior.",
          "Our brains are lazy. To save energy, the brain creates shortcuts for things we do often. If you have always smoked after eating for 5 years, the brain automatically wires 'finished eating' directly to 'light a cigarette'."
        ]
      },
      {
        sectionTitle: "Breaking the Habit Chain",
        paragraphs: [
          "To break this chain, you have to move the act of smoking from the unconscious mind to the conscious mind.",
          "How? Every time the urge comes, STOP for 10 seconds. Ask: 'What triggered this? Did I just finish a presentation? Or am I just bored?'"
        ]
      }
    ]
  },
  {
    id: 'micro_cbt_reframe',
    type: 'Micro-Lessons',
    title: 'The Thought Reframe Technique',
    shortDesc: 'Turn sabotaging thoughts into strength.',
    durationStr: '3 CARDS',
    methodRelevance: ['cbt'],
    swipeCards: [
      { illustrationRef: 'brain', title: 'Sabotaging Thoughts', desc: 'Have you ever heard a voice in your head saying: "Just one cigarette won\'t ruin my progress"? That\'s a sabotage thought.' },
      { illustrationRef: 'switch', title: 'Catch and Realize', desc: 'The first step is to realize when that voice appears. Don\'t just believe it. Thoughts are not facts.' },
      { illustrationRef: 'reframe', title: 'Reframe It', desc: 'Counter that voice with facts: "One cigarette TODAY might be easy, but one cigarette tomorrow and the day after will bring me back to zero."' }
    ],
    reflectionQuestion: 'What is the most common lie you tell yourself to smoke?'
  }
];
