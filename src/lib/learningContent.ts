/**
 * Learning path content for Mobilaws legal education
 * Content sourced from South Sudan law PDFs
 */

import { 
  getAllModules, 
  getModulesForTier, 
  getTopicById, 
  isTopicAccessible,
  type LegalTopic,
  type ExtractedModule 
} from './pdfContentExtractor';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  xpReward: number;
  quiz: QuizQuestion[];
  locked: boolean;
  completed: boolean;
  pdfSource?: string;
  tier: 'basic' | 'standard' | 'premium';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  locked: boolean;
  requiredTier: 'free' | 'basic' | 'standard' | 'premium';
}

/**
 * Quiz questions for each topic
 */
const quizDatabase: Record<string, QuizQuestion[]> = {
  'const-intro-free': [
    {
      id: 'q0-1',
      question: 'What is the Constitution?',
      options: ['A book of stories', 'The highest law of the country', 'A history book', 'A government building'],
      correctAnswer: 1,
      explanation: 'The Constitution is the supreme law that governs how the country operates.'
    },
    {
      id: 'q0-2',
      question: 'Who does the Constitution protect?',
      options: ['Only government officials', 'Only rich people', 'Everyone in South Sudan', 'Only adults'],
      correctAnswer: 2,
      explanation: 'The Constitution protects the rights and freedoms of all people in South Sudan.'
    }
  ],
  'intl-intro-free': [
    {
      id: 'q0-3',
      question: 'What is international law?',
      options: ['Laws only for lawyers', 'Rules between countries', 'Laws about traveling', 'Court procedures'],
      correctAnswer: 1,
      explanation: 'International law consists of rules and agreements between countries.'
    }
  ],
  'penal-intro-free': [
    {
      id: 'q0-4',
      question: 'At what age can someone be charged with a crime in South Sudan?',
      options: ['Any age', '12 years', '18 years', '21 years'],
      correctAnswer: 1,
      explanation: 'In South Sudan, the age of criminal responsibility is 12 years.'
    },
    {
      id: 'q0-5',
      question: 'If you are arrested, what is one of your rights?',
      options: ['Right to remain silent', 'Must answer all questions', 'No rights until trial', 'Can only speak to police'],
      correctAnswer: 0,
      explanation: 'You have the right to remain silent and to have a lawyer present during questioning.'
    }
  ],
  'pub-intro-free': [
    {
      id: 'q0-6',
      question: 'What does "rule of law" mean?',
      options: [
        'Only citizens must follow laws',
        'Government and citizens must both follow laws',
        'Laws are optional',
        'Only the President makes laws'
      ],
      correctAnswer: 1,
      explanation: 'Rule of law means everyone, including the government, must follow the law.'
    }
  ],
  'const-intro': [
    {
      id: 'q1',
      question: 'What is the supreme law of South Sudan?',
      options: ['The Penal Code', 'The Constitution', 'Presidential Decrees', 'Customary Law'],
      correctAnswer: 1,
      explanation: 'The Constitution is the supreme law. All other laws must conform to it.'
    },
    {
      id: 'q2',
      question: 'In whom does sovereignty reside according to the Constitution?',
      options: ['The President', 'The Legislature', 'The People', 'The Courts'],
      correctAnswer: 2,
      explanation: 'Sovereignty resides in the people of South Sudan, who exercise it through their elected representatives.'
    }
  ],
  'const-rights': [
    {
      id: 'q3',
      question: 'Which document protects your fundamental rights?',
      options: ['Criminal Code', 'Bill of Rights', 'Civil Procedure', 'Land Act'],
      correctAnswer: 1,
      explanation: 'The Bill of Rights, part of the Constitution, protects fundamental rights and freedoms.'
    },
    {
      id: 'q4',
      question: 'What are economic and social rights?',
      options: [
        'Rights to buy and sell property only',
        'Rights to education, health, work, and property',
        'Rights for business owners only',
        'Rights that cost money to exercise'
      ],
      correctAnswer: 1,
      explanation: 'Economic and social rights include rights to education, health care, work, and property.'
    }
  ],
  'const-enforcement': [
    {
      id: 'q5',
      question: 'Which court has primary jurisdiction over constitutional matters?',
      options: ['Magistrate Court', 'High Court', 'Constitutional Court', 'Customary Court'],
      correctAnswer: 2,
      explanation: 'The Constitutional Court has primary jurisdiction over constitutional interpretation and enforcement.'
    },
    {
      id: 'q6',
      question: 'What is public interest litigation?',
      options: [
        'Litigation about public roads',
        'Court cases brought by government',
        'Legal action on behalf of wider community',
        'Cases heard in public'
      ],
      correctAnswer: 2,
      explanation: 'Public interest litigation allows legal action on behalf of groups or the wider community, not just individuals.'
    },
    {
      id: 'q7',
      question: 'Why are time limits important in constitutional cases?',
      options: [
        'Courts prefer quick cases',
        'To prevent stale claims and ensure timely justice',
        'Lawyers charge more for delayed cases',
        'Evidence is always lost'
      ],
      correctAnswer: 1,
      explanation: 'Time limits ensure timely justice and prevent parties from sitting on their rights. Constitutional remedies often have strict deadlines.'
    }
  ],
  'intl-intro': [
    {
      id: 'q8',
      question: 'Who are the primary subjects of international law?',
      options: ['Individuals', 'States', 'Corporations', 'NGOs'],
      correctAnswer: 1,
      explanation: 'States are the primary subjects of international law, though international organizations also have limited personality.'
    },
    {
      id: 'q9',
      question: 'What are the main sources of international law?',
      options: [
        'UN decisions only',
        'Treaties and customary law',
        'International newspapers',
        'World leaders\' speeches'
      ],
      correctAnswer: 1,
      explanation: 'Treaties and customary international law are the primary sources, along with general principles of law.'
    }
  ],
  'intl-treaties': [
    {
      id: 'q10',
      question: 'What does "pacta sunt servanda" mean?',
      options: [
        'Treaties are political documents',
        'Treaties must be performed in good faith',
        'Treaties can be broken easily',
        'Treaties only bind some parties'
      ],
      correctAnswer: 1,
      explanation: 'Pacta sunt servanda is a fundamental principle meaning treaties must be performed in good faith.'
    },
    {
      id: 'q11',
      question: 'Who ratifies international treaties in South Sudan?',
      options: ['The President alone', 'The National Legislature', 'The Supreme Court', 'The UN'],
      correctAnswer: 1,
      explanation: 'The National Legislature must ratify treaties after the President negotiates and signs them.'
    }
  ],
  'intl-state-responsibility': [
    {
      id: 'q12',
      question: 'When is conduct attributable to a State?',
      options: [
        'Only when the President acts',
        'When government officials or organs act',
        'Only in wartime',
        'Never - only individuals are responsible'
      ],
      correctAnswer: 1,
      explanation: 'Conduct of government officials and organs exercising government authority is attributable to the State.'
    },
    {
      id: 'q13',
      question: 'What are the three forms of reparation in international law?',
      options: [
        'Apology, fine, imprisonment',
        'Restitution, compensation, satisfaction',
        'Warning, sanction, expulsion',
        'Negotiation, mediation, arbitration'
      ],
      correctAnswer: 1,
      explanation: 'The three forms of reparation are restitution (restore situation), compensation (financial damages), and satisfaction (acknowledgment/apology).'
    },
    {
      id: 'q14',
      question: 'Which is a valid defense to state responsibility?',
      options: [
        'Economic difficulty',
        'Self-defense',
        'Political pressure',
        'Inconvenience'
      ],
      correctAnswer: 1,
      explanation: 'Self-defense is a valid defense, along with consent, force majeure, distress, and necessity under strict conditions.'
    }
  ],
  'penal-intro': [
    {
      id: 'q15',
      question: 'What two elements are required for most crimes?',
      options: ['Victim and Witness', 'Act and Intent (actus reus and mens rea)', 'Arrest and Trial', 'Judge and Jury'],
      correctAnswer: 1,
      explanation: 'Most crimes require both a guilty act (actus reus) and guilty mind (mens rea).'
    },
    {
      id: 'q16',
      question: 'What is the age of criminal responsibility in South Sudan?',
      options: ['10 years', '12 years', '14 years', '18 years'],
      correctAnswer: 1,
      explanation: 'The age of criminal responsibility in South Sudan is 12 years under the Penal Code.'
    }
  ],
  'penal-defenses': [
    {
      id: 'q17',
      question: 'Which of these is a complete defense to a criminal charge?',
      options: ['Poverty', 'Insanity', 'Ignorance of law', 'Peer pressure'],
      correctAnswer: 1,
      explanation: 'Insanity is a complete defense if the accused lacked understanding due to mental disorder.'
    },
    {
      id: 'q18',
      question: 'What is required for self-defense to be valid?',
      options: [
        'Any force is allowed',
        'Force must be proportional and reasonable',
        'Must have a weapon',
        'Must be defending property only'
      ],
      correctAnswer: 1,
      explanation: 'Self-defense must use proportional and reasonable force. Excessive force is not justified.'
    },
    {
      id: 'q19',
      question: 'Who has the burden of proof in a criminal case?',
      options: [
        'The accused must prove innocence',
        'The prosecution must prove guilt beyond reasonable doubt',
        'The judge decides without proof',
        'Both sides equally'
      ],
      correctAnswer: 1,
      explanation: 'The prosecution must prove guilt beyond reasonable doubt. The accused is presumed innocent.'
    }
  ],
  'penal-procedure': [
    {
      id: 'q20',
      question: 'Within what time must an arrested person be brought before court?',
      options: ['24 hours', '48 hours', '72 hours', '1 week'],
      correctAnswer: 0,
      explanation: 'An arrested person must be brought before a court within 24 hours.'
    },
    {
      id: 'q21',
      question: 'What should you do if arrested?',
      options: [
        'Answer all questions immediately',
        'Cooperate but request a lawyer before answering substantive questions',
        'Run away',
        'Confess to avoid trouble'
      ],
      correctAnswer: 1,
      explanation: 'You should cooperate with police but request a lawyer before answering substantive questions. You have the right to remain silent.'
    },
    {
      id: 'q22',
      question: 'What is the purpose of bail?',
      options: [
        'To punish the accused',
        'To ensure accused appears for trial',
        'To raise money for government',
        'To decide guilt'
      ],
      correctAnswer: 1,
      explanation: 'Bail ensures the accused will appear for trial while respecting the presumption of innocence.'
    },
    {
      id: 'q23',
      question: 'Within what time must an appeal be filed?',
      options: ['7 days', '14 days', '30 days', '90 days'],
      correctAnswer: 2,
      explanation: 'Appeals must typically be filed within 30 days of judgment.'
    }
  ],
  'pub-intro': [
    {
      id: 'q24',
      question: 'What does the separation of powers mean?',
      options: [
        'Different levels of government',
        'Executive, Legislative, and Judicial branches are independent',
        'Only the President has power',
        'States have more power than federal government'
      ],
      correctAnswer: 1,
      explanation: 'Separation of powers means the Executive, Legislative, and Judicial branches are independent and check each other.'
    }
  ],
  'pub-admin': [
    {
      id: 'q25',
      question: 'What is judicial review?',
      options: [
        'Judge reviewing case files',
        'Courts reviewing lawfulness of government decisions',
        'Reviewing judge performance',
        'Public reviewing court decisions'
      ],
      correctAnswer: 1,
      explanation: 'Judicial review is when courts review the lawfulness of government decisions for legality, rationality, and procedural fairness.'
    },
    {
      id: 'q26',
      question: 'What does "ultra vires" mean?',
      options: [
        'Very strong',
        'Beyond legal powers',
        'Under authority',
        'Within limits'
      ],
      correctAnswer: 1,
      explanation: '"Ultra vires" means beyond legal powers - when a government body acts without legal authority.'
    },
    {
      id: 'q27',
      question: 'What is a mandamus order?',
      options: [
        'Order to stop action',
        'Order to perform a legal duty',
        'Order to pay damages',
        'Order to arrest someone'
      ],
      correctAnswer: 1,
      explanation: 'Mandamus is a court order compelling a government body to perform a legal duty.'
    }
  ],
  'pub-practice': [
    {
      id: 'q28',
      question: 'What should you do before filing a judicial review application?',
      options: [
        'Go straight to court',
        'Write to government body requesting reconsideration',
        'Protest publicly',
        'Wait one year'
      ],
      correctAnswer: 1,
      explanation: 'You should first write to the government body outlining concerns and requesting reconsideration before going to court.'
    },
    {
      id: 'q29',
      question: 'What is required for standing in judicial review?',
      options: [
        'Must be a lawyer',
        'Must have sufficient interest in the matter',
        'Must be a government employee',
        'Must be wealthy'
      ],
      correctAnswer: 1,
      explanation: 'You must have sufficient interest in the matter - be affected by the decision or have legitimate concern.'
    },
    {
      id: 'q30',
      question: 'Why should you act quickly when challenging government action?',
      options: [
        'Judges prefer quick cases',
        'Judicial review has strict time limits',
        'Evidence is always destroyed',
        'Lawyers are cheaper early'
      ],
      correctAnswer: 1,
      explanation: 'Judicial review applications must usually be filed within 3-6 months. Time limits are strict.'
    },
    {
      id: 'q31',
      question: 'What is public interest litigation?',
      options: [
        'Litigation about public property',
        'Legal action on behalf of wider community or public good',
        'Cases heard in public',
        'Government prosecutions'
      ],
      correctAnswer: 1,
      explanation: 'Public interest litigation allows legal action on behalf of the wider community or public good, not just individual interests.'
    }
  ]
};

/**
 * Module icons by category
 */
const moduleIcons: Record<string, string> = {
  constitution: '📜',
  'international-law': '🌍',
  'criminal-law': '⚖️',
  'public-law': '🏛️'
};

/**
 * XP rewards by tier
 */
const xpByTier: Record<string, number> = {
  basic: 10,
  standard: 20,
  premium: 50
};

/**
 * Convert extracted PDF topics to lessons
 */
function topicToLesson(topic: LegalTopic, userTier: 'free' | 'basic' | 'standard' | 'premium'): Lesson {
  const accessible = isTopicAccessible(topic.id, userTier);
  const quiz = quizDatabase[topic.id] || [];
  
  return {
    id: topic.id,
    title: topic.title,
    content: accessible ? topic.content : `🔒 This lesson is available in ${topic.tier.toUpperCase()} subscription.\n\nUpgrade to unlock detailed content about: ${topic.description}`,
    xpReward: accessible ? xpByTier[topic.tier] : 0,
    quiz: accessible ? quiz : [],
    locked: !accessible,
    completed: false,
    pdfSource: topic.pdfSource,
    tier: topic.tier
  };
}

/**
 * Get learning modules for user's subscription tier
 */
export function getLearningModules(userTier: 'free' | 'basic' | 'standard' | 'premium' = 'free'): Module[] {
  const extractedModules = getModulesForTier(userTier === 'free' ? 'basic' : userTier);
  
  return extractedModules.map(module => ({
    id: module.id,
    title: module.title,
    description: module.description,
    icon: moduleIcons[module.id] || '📚',
    requiredTier: module.tier as 'free' | 'basic' | 'standard' | 'premium',
    locked: false, // Module visibility is handled by getModulesForTier
    lessons: module.topics.map(topic => topicToLesson(topic, userTier))
  }));
}

/**
 * Default export for backwards compatibility
 */
export const learningModules = getLearningModules('free');
