/**
 * Certification Exam System for Mobilaws
 * Provides tiered certification exams for legal knowledge validation
 */

export interface ExamQuestion {
    id: string;
    moduleId: 'constitution' | 'international-law' | 'criminal-law' | 'public-law';
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Exam {
    id: string;
    title: string;
    description: string;
    requiredTier: 'free' | 'standard' | 'premium';
    questionCount: number;
    passMark: number; // percentage (e.g., 70)
    timeLimit?: number; // minutes (optional)
    badge: string; // emoji or icon
    color: string; // theme color for the exam
}

export interface ExamAttempt {
    id: string;
    examId: string;
    userId: string;
    startedAt: string;
    completedAt?: string;
    answers: Record<string, number>; // questionId -> selectedOption
    score?: number;
    passed?: boolean;
}

export interface Certificate {
    id: string;
    userId: string;
    userName: string;
    examId: string;
    examTitle: string;
    level: 'basic' | 'standard' | 'premium';
    score: number;
    issuedAt: string;
    certificateNumber: string;
}

/**
 * Available certification exams
 */
export const certificationExams: Exam[] = [
    {
        id: 'basic-cert',
        title: 'Basic Legal Knowledge Certificate',
        description: 'Demonstrate foundational understanding of South Sudan law. Available for all users including free tier.',
        requiredTier: 'free',
        questionCount: 40,
        passMark: 70,
        badge: '🎓',
        color: '#3b82f6' // blue
    },
    {
        id: 'standard-cert',
        title: 'Standard Legal Proficiency Certificate',
        description: 'Advanced certification covering intermediate legal concepts. Available for Basic and Standard users.',
        requiredTier: 'basic', // Changed from 'standard' to allow basic users
        questionCount: 100,
        passMark: 70,
        badge: '⚖️',
        color: '#8b5cf6' // purple
    },
    {
        id: 'premium-cert',
        title: 'Premium Legal Expert Certificate',
        description: 'Comprehensive certification demonstrating expert-level legal knowledge. Premium users only. Can be regenerated for continuous learning.',
        requiredTier: 'premium',
        questionCount: 200,
        passMark: 70,
        badge: '👨‍⚖️',
        color: '#f59e0b' // amber
    }
];

/**
 * Basic Certification Exam Questions (75 total)
 * Distribution: Constitution (20), International Law (20), Criminal Law (20), Public Law (15)
 */
export const basicExamQuestions: ExamQuestion[] = [
    // CONSTITUTION QUESTIONS (20)
    {
        id: 'const-exam-1',
        moduleId: 'constitution',
        question: 'What is the supreme law of South Sudan?',
        options: ['The Penal Code', 'The Constitution', 'Presidential Decrees', 'Customary Law'],
        correctAnswer: 1,
        explanation: 'The Constitution is the supreme law. All other laws must conform to it.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-2',
        moduleId: 'constitution',
        question: 'In whom does sovereignty reside according to the Constitution?',
        options: ['The President', 'The Legislature', 'The People', 'The Courts'],
        correctAnswer: 2,
        explanation: 'Sovereignty resides in the people of South Sudan, who exercise it through their elected representatives.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-3',
        moduleId: 'constitution',
        question: 'What does the Bill of Rights protect?',
        options: ['Only property rights', 'Fundamental rights and freedoms', 'Only voting rights', 'Only economic rights'],
        correctAnswer: 1,
        explanation: 'The Bill of Rights protects fundamental rights and freedoms of all persons in South Sudan.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-4',
        moduleId: 'constitution',
        question: 'Which of the following is NOT a branch of government?',
        options: ['Executive', 'Legislative', 'Judicial', 'Military'],
        correctAnswer: 3,
        explanation: 'The three branches of government are Executive, Legislative, and Judicial. The military is under executive control.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-5',
        moduleId: 'constitution',
        question: 'What is the principle of separation of powers?',
        options: [
            'Only the President has power',
            'Power is divided among Executive, Legislative, and Judicial branches',
            'States have more power than federal government',
            'Power belongs to the military'
        ],
        correctAnswer: 1,
        explanation: 'Separation of powers means government power is divided among three independent branches that check each other.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-6',
        moduleId: 'constitution',
        question: 'Can the Constitution be changed?',
        options: [
            'No, it is permanent',
            'Yes, through constitutional amendment process',
            'Only by the President',
            'Only during war'
        ],
        correctAnswer: 1,
        explanation: 'The Constitution can be amended through a specific legal process involving Parliament and sometimes referendum.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-7',
        moduleId: 'constitution',
        question: 'What does freedom of expression include?',
        options: [
            'Only speaking',
            'Speaking, writing, media, and peaceful protest',
            'Only voting',
            'Only religious speech'
        ],
        correctAnswer: 1,
        explanation: 'Freedom of expression includes speaking, writing, publishing, media, artistic expression, and peaceful protest.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-8',
        moduleId: 'constitution',
        question: 'What is the right to equality?',
        options: [
            'Everyone gets the same salary',
            'All persons are equal before the law',
            'Only citizens have rights',
            'Only adults have rights'
        ],
        correctAnswer: 1,
        explanation: 'The right to equality means all persons are equal before the law and entitled to equal protection without discrimination.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-9',
        moduleId: 'constitution',
        question: 'Which right protects you from being tortured?',
        options: [
            'Right to property',
            'Right to human dignity',
            'Right to vote',
            'Right to education'
        ],
        correctAnswer: 1,
        explanation: 'The right to human dignity absolutely prohibits torture and cruel, inhuman, or degrading treatment.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-10',
        moduleId: 'constitution',
        question: 'What are economic and social rights?',
        options: [
            'Rights to buy property only',
            'Rights to education, health, work, and property',
            'Rights for business owners only',
            'Rights that cost money'
        ],
        correctAnswer: 1,
        explanation: 'Economic and social rights include rights to education, health care, work, fair wages, and property ownership.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-11',
        moduleId: 'constitution',
        question: 'Who makes laws in South Sudan?',
        options: ['The President alone', 'The National Legislature (Parliament)', 'The Courts', 'The Army'],
        correctAnswer: 1,
        explanation: 'The National Legislature (Parliament) makes laws through a democratic process.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-12',
        moduleId: 'constitution',
        question: 'What is the role of the Judiciary?',
        options: [
            'Make laws',
            'Interpret laws and settle disputes',
            'Command the army',
            'Collect taxes'
        ],
        correctAnswer: 1,
        explanation: 'The Judiciary interprets the Constitution and laws, settles disputes, and protects rights.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-13',
        moduleId: 'constitution',
        question: 'Can government limit your constitutional rights?',
        options: [
            'Never',
            'Yes, but only when necessary for public safety and through proper legal process',
            'Anytime they want',
            'Only during elections'
        ],
        correctAnswer: 1,
        explanation: 'Rights can be limited only when necessary for public safety, protecting others\' rights, and through proper legal process.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-14',
        moduleId: 'constitution',
        question: 'What is the Bill of Rights?',
        options: [
            'A list of government powers',
            'Part of the Constitution protecting fundamental rights',
            'A tax document',
            'A criminal code'
        ],
        correctAnswer: 1,
        explanation: 'The Bill of Rights is Part Two of the Constitution that protects fundamental rights and freedoms.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-15',
        moduleId: 'constitution',
        question: 'What does the right to life mean?',
        options: [
            'Right to healthcare only',
            'Right to not be arbitrarily killed and government must protect your life',
            'Right to food only',
            'Right to housing only'
        ],
        correctAnswer: 1,
        explanation: 'The right to life means you cannot be arbitrarily killed and the government must protect your life and security.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-16',
        moduleId: 'constitution',
        question: 'Who has constitutional rights in South Sudan?',
        options: [
            'Only citizens',
            'Everyone in South Sudan - citizens, residents, refugees',
            'Only adults',
            'Only men'
        ],
        correctAnswer: 1,
        explanation: 'Constitutional rights belong to everyone in South Sudan, regardless of citizenship, age, or gender.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-17',
        moduleId: 'constitution',
        question: 'What is freedom of assembly?',
        options: [
            'Right to build things',
            'Right to peaceful gatherings and protests',
            'Right to vote',
            'Right to own property'
        ],
        correctAnswer: 1,
        explanation: 'Freedom of assembly is the right to peaceful gatherings, protests, and forming associations.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-18',
        moduleId: 'constitution',
        question: 'Can you criticize the government in South Sudan?',
        options: [
            'No, it is illegal',
            'Yes, freedom of expression protects political criticism',
            'Only if you are rich',
            'Only during elections'
        ],
        correctAnswer: 1,
        explanation: 'Freedom of expression protects your right to criticize government policies and leaders peacefully.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-19',
        moduleId: 'constitution',
        question: 'What is the purpose of checks and balances?',
        options: [
            'To count money',
            'To ensure no branch of government becomes too powerful',
            'To check attendance',
            'To balance the budget'
        ],
        correctAnswer: 1,
        explanation: 'Checks and balances ensure each branch of government can limit the others, preventing abuse of power.',
        difficulty: 'beginner'
    },
    {
        id: 'const-exam-20',
        moduleId: 'constitution',
        question: 'What does "rule of law" mean?',
        options: [
            'Only citizens must follow laws',
            'Everyone, including government, must follow the law',
            'Laws are optional',
            'Only the President makes laws'
        ],
        correctAnswer: 1,
        explanation: 'Rule of law means everyone, including government officials, must follow the law equally.',
        difficulty: 'beginner'
    },

    // INTERNATIONAL LAW QUESTIONS (20)
    {
        id: 'intl-exam-1',
        moduleId: 'international-law',
        question: 'What is international law?',
        options: [
            'Laws only for lawyers',
            'Rules and agreements between countries',
            'Laws about traveling',
            'Court procedures'
        ],
        correctAnswer: 1,
        explanation: 'International law consists of rules and agreements between countries governing their relations.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-2',
        moduleId: 'international-law',
        question: 'What is a treaty?',
        options: [
            'A type of court',
            'A written agreement between countries',
            'A law book',
            'A government building'
        ],
        correctAnswer: 1,
        explanation: 'A treaty is a legally binding written agreement between countries.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-3',
        moduleId: 'international-law',
        question: 'What does "pacta sunt servanda" mean?',
        options: [
            'Treaties can be broken',
            'Treaties must be performed in good faith',
            'Only some treaties are binding',
            'Treaties expire after 10 years'
        ],
        correctAnswer: 1,
        explanation: 'Pacta sunt servanda means treaties must be performed in good faith - a fundamental principle of international law.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-4',
        moduleId: 'international-law',
        question: 'How many members does the UN Security Council have?',
        options: ['10', '15', '20', '25'],
        correctAnswer: 1,
        explanation: 'The Security Council has 15 members: 5 permanent members and 10 elected members.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-5',
        moduleId: 'international-law',
        question: 'What is the main purpose of the United Nations?',
        options: [
            'Economic development only',
            'Maintain international peace and security',
            'Cultural exchange only',
            'Sports competitions'
        ],
        correctAnswer: 1,
        explanation: 'The primary purpose of the UN is to maintain international peace and security.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-6',
        moduleId: 'international-law',
        question: 'When did South Sudan join the United Nations?',
        options: ['2010', '2011', '2012', '2013'],
        correctAnswer: 1,
        explanation: 'South Sudan joined the United Nations on July 14, 2011, shortly after independence.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-7',
        moduleId: 'international-law',
        question: 'What is state sovereignty?',
        options: [
            'A type of money',
            'Supreme power and authority of a state over its territory',
            'A government building',
            'A type of law'
        ],
        correctAnswer: 1,
        explanation: 'State sovereignty means a state has supreme power and authority over its territory and people.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-8',
        moduleId: 'international-law',
        question: 'What are human rights?',
        options: [
            'Rights only for citizens',
            'Rights that belong to all people everywhere',
            'Rights only for adults',
            'Rights only in your own country'
        ],
        correctAnswer: 1,
        explanation: 'Human rights are universal rights that belong to all people everywhere, regardless of nationality or status.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-9',
        moduleId: 'international-law',
        question: 'What is diplomatic immunity?',
        options: [
            'Diplomats can do anything',
            'Diplomats are protected from host country jurisdiction for official acts',
            'Diplomats never get sick',
            'Diplomats can break any law'
        ],
        correctAnswer: 1,
        explanation: 'Diplomatic immunity protects diplomats from host country jurisdiction to allow them to perform their duties freely.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-10',
        moduleId: 'international-law',
        question: 'What is the International Court of Justice?',
        options: [
            'A criminal court',
            'The UN\'s main court for disputes between states',
            'A court for individuals',
            'A court for businesses'
        ],
        correctAnswer: 1,
        explanation: 'The ICJ is the UN\'s principal judicial organ that settles legal disputes between states.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-11',
        moduleId: 'international-law',
        question: 'What is a refugee?',
        options: [
            'Anyone living abroad',
            'Person who fled their country due to persecution or danger',
            'A tourist',
            'A diplomat'
        ],
        correctAnswer: 1,
        explanation: 'A refugee is someone who has fled their country due to persecution, war, or violence and cannot return safely.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-12',
        moduleId: 'international-law',
        question: 'What is the principle of non-refoulement?',
        options: [
            'States can return anyone',
            'Cannot return person to country where they face persecution',
            'Must return all refugees',
            'Only applies to criminals'
        ],
        correctAnswer: 1,
        explanation: 'Non-refoulement prohibits returning a person to a country where they would face persecution or serious harm.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-13',
        moduleId: 'international-law',
        question: 'What is the role of UN peacekeepers?',
        options: [
            'Fight wars',
            'Protect civilians and support peace processes',
            'Collect taxes',
            'Make laws'
        ],
        correctAnswer: 1,
        explanation: 'UN peacekeepers protect civilians, monitor ceasefires, and support peace processes in conflict areas.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-14',
        moduleId: 'international-law',
        question: 'Can a country use military force against another country?',
        options: [
            'Yes, anytime',
            'No, except in self-defense or with UN Security Council authorization',
            'Only if they are stronger',
            'Only during elections'
        ],
        correctAnswer: 1,
        explanation: 'The UN Charter prohibits use of force except in self-defense or when authorized by the Security Council.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-15',
        moduleId: 'international-law',
        question: 'What is the Universal Declaration of Human Rights?',
        options: [
            'A treaty',
            'A foundational document outlining fundamental human rights',
            'A court decision',
            'A government policy'
        ],
        correctAnswer: 1,
        explanation: 'The UDHR is a milestone document that sets out fundamental human rights to be universally protected.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-16',
        moduleId: 'international-law',
        question: 'What does UNMISS stand for?',
        options: [
            'United Nations Mission in Sudan',
            'United Nations Mission in South Sudan',
            'United Nations Military in South Sudan',
            'United Nations Monitoring in South Sudan'
        ],
        correctAnswer: 1,
        explanation: 'UNMISS is the United Nations Mission in South Sudan, established to protect civilians and support peace.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-17',
        moduleId: 'international-law',
        question: 'What is an embassy?',
        options: [
            'A hotel',
            'A country\'s official diplomatic mission in another country',
            'A shopping center',
            'A court'
        ],
        correctAnswer: 1,
        explanation: 'An embassy is a country\'s official diplomatic mission representing its interests in another country.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-18',
        moduleId: 'international-law',
        question: 'What is the African Union?',
        options: [
            'A trade company',
            'A continental organization of African states',
            'A sports league',
            'A bank'
        ],
        correctAnswer: 1,
        explanation: 'The African Union is a continental organization of 55 African states promoting unity, peace, and development.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-19',
        moduleId: 'international-law',
        question: 'What is mediation in international disputes?',
        options: [
            'Going to war',
            'A third party helping countries negotiate a peaceful solution',
            'Ignoring the problem',
            'Economic sanctions'
        ],
        correctAnswer: 1,
        explanation: 'Mediation is when a neutral third party helps disputing countries negotiate a peaceful settlement.',
        difficulty: 'beginner'
    },
    {
        id: 'intl-exam-20',
        moduleId: 'international-law',
        question: 'Who ratifies treaties in South Sudan?',
        options: [
            'The President alone',
            'The National Legislature',
            'The Supreme Court',
            'The UN'
        ],
        correctAnswer: 1,
        explanation: 'The National Legislature must ratify treaties after the President negotiates and signs them.',
        difficulty: 'beginner'
    },

    // CRIMINAL LAW QUESTIONS (20)
    {
        id: 'crim-exam-1',
        moduleId: 'criminal-law',
        question: 'What two elements are required for most crimes?',
        options: [
            'Victim and Witness',
            'Act and Intent (actus reus and mens rea)',
            'Arrest and Trial',
            'Judge and Jury'
        ],
        correctAnswer: 1,
        explanation: 'Most crimes require both a guilty act (actus reus) and guilty mind (mens rea).',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-2',
        moduleId: 'criminal-law',
        question: 'What is the age of criminal responsibility in South Sudan?',
        options: ['10 years', '12 years', '14 years', '18 years'],
        correctAnswer: 1,
        explanation: 'The age of criminal responsibility in South Sudan is 12 years under the Penal Code.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-3',
        moduleId: 'criminal-law',
        question: 'What is the presumption of innocence?',
        options: [
            'Everyone is guilty',
            'You are innocent until proven guilty',
            'Only rich people are innocent',
            'Guilt is assumed'
        ],
        correctAnswer: 1,
        explanation: 'The presumption of innocence means you are considered innocent until proven guilty beyond reasonable doubt.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-4',
        moduleId: 'criminal-law',
        question: 'Within what time must an arrested person be brought before court?',
        options: ['24 hours', '48 hours', '72 hours', '1 week'],
        correctAnswer: 0,
        explanation: 'An arrested person must be brought before a court within 24 hours.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-5',
        moduleId: 'criminal-law',
        question: 'What should you do if arrested?',
        options: [
            'Answer all questions immediately',
            'Cooperate but request a lawyer before answering substantive questions',
            'Run away',
            'Confess to avoid trouble'
        ],
        correctAnswer: 1,
        explanation: 'You should cooperate with police but request a lawyer before answering substantive questions. You have the right to remain silent.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-6',
        moduleId: 'criminal-law',
        question: 'What is the purpose of bail?',
        options: [
            'To punish the accused',
            'To ensure accused appears for trial',
            'To raise money for government',
            'To decide guilt'
        ],
        correctAnswer: 1,
        explanation: 'Bail ensures the accused will appear for trial while respecting the presumption of innocence.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-7',
        moduleId: 'criminal-law',
        question: 'Who has the burden of proof in a criminal case?',
        options: [
            'The accused must prove innocence',
            'The prosecution must prove guilt beyond reasonable doubt',
            'The judge decides without proof',
            'Both sides equally'
        ],
        correctAnswer: 1,
        explanation: 'The prosecution must prove guilt beyond reasonable doubt. The accused is presumed innocent.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-8',
        moduleId: 'criminal-law',
        question: 'What is actus reus?',
        options: [
            'The guilty mind',
            'The guilty act - the physical action of the crime',
            'The punishment',
            'The victim'
        ],
        correctAnswer: 1,
        explanation: 'Actus reus is the guilty act - the physical action or conduct that constitutes the crime.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-9',
        moduleId: 'criminal-law',
        question: 'What is mens rea?',
        options: [
            'The guilty act',
            'The guilty mind - the intent or mental state',
            'The evidence',
            'The sentence'
        ],
        correctAnswer: 1,
        explanation: 'Mens rea is the guilty mind - the intent, knowledge, or mental state required for a crime.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-10',
        moduleId: 'criminal-law',
        question: 'What is self-defense?',
        options: [
            'Any force is allowed',
            'Using proportional and reasonable force to protect yourself',
            'Attacking first',
            'Revenge'
        ],
        correctAnswer: 1,
        explanation: 'Self-defense allows using proportional and reasonable force to protect yourself from imminent harm.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-11',
        moduleId: 'criminal-law',
        question: 'Can you be forced to testify against yourself?',
        options: [
            'Yes, always',
            'No, you have the right to remain silent',
            'Only if guilty',
            'Only in serious crimes'
        ],
        correctAnswer: 1,
        explanation: 'You have the right to remain silent and cannot be forced to testify against yourself.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-12',
        moduleId: 'criminal-law',
        question: 'What is a fair trial?',
        options: [
            'A quick trial',
            'A trial with proper procedures, legal representation, and impartial judge',
            'A trial without lawyers',
            'A trial in secret'
        ],
        correctAnswer: 1,
        explanation: 'A fair trial includes proper procedures, right to legal representation, impartial judge, and opportunity to present your case.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-13',
        moduleId: 'criminal-law',
        question: 'What rights do you have when arrested?',
        options: [
            'No rights until trial',
            'Right to remain silent, right to a lawyer, right to be informed of charges',
            'Only right to food',
            'Only right to phone call'
        ],
        correctAnswer: 1,
        explanation: 'When arrested, you have rights including: remain silent, have a lawyer, be informed of charges, and humane treatment.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-14',
        moduleId: 'criminal-law',
        question: 'What is the difference between arrest and detention?',
        options: [
            'No difference',
            'Arrest is taking into custody; detention is holding after arrest',
            'Arrest is for serious crimes only',
            'Detention is punishment'
        ],
        correctAnswer: 1,
        explanation: 'Arrest is the act of taking someone into custody; detention is holding them after arrest pending trial or investigation.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-15',
        moduleId: 'criminal-law',
        question: 'Can police search your home without permission?',
        options: [
            'Yes, anytime',
            'No, they need a search warrant or your consent (except emergencies)',
            'Only at night',
            'Only if you look suspicious'
        ],
        correctAnswer: 1,
        explanation: 'Police need a search warrant or your consent to search your home, except in emergency situations.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-16',
        moduleId: 'criminal-law',
        question: 'What is the role of a defense lawyer?',
        options: [
            'To help the prosecution',
            'To defend the accused and ensure fair trial',
            'To decide guilt',
            'To punish the accused'
        ],
        correctAnswer: 1,
        explanation: 'A defense lawyer represents the accused, protects their rights, and ensures they receive a fair trial.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-17',
        moduleId: 'criminal-law',
        question: 'What happens during a trial?',
        options: [
            'Immediate punishment',
            'Evidence is presented, witnesses testify, judge/jury decides guilt',
            'Only the accused speaks',
            'Automatic conviction'
        ],
        correctAnswer: 1,
        explanation: 'During trial, both sides present evidence and witnesses, and a judge or jury determines guilt based on the evidence.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-18',
        moduleId: 'criminal-law',
        question: 'Can you appeal a criminal conviction?',
        options: [
            'No, decisions are final',
            'Yes, you can appeal to a higher court',
            'Only if you are rich',
            'Only for minor crimes'
        ],
        correctAnswer: 1,
        explanation: 'You have the right to appeal a conviction to a higher court if you believe there was an error in the trial.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-19',
        moduleId: 'criminal-law',
        question: 'What is a criminal record?',
        options: [
            'A music album',
            'Official record of criminal convictions',
            'A police report',
            'A witness statement'
        ],
        correctAnswer: 1,
        explanation: 'A criminal record is an official record of a person\'s criminal convictions maintained by authorities.',
        difficulty: 'beginner'
    },
    {
        id: 'crim-exam-20',
        moduleId: 'criminal-law',
        question: 'What is the purpose of punishment in criminal law?',
        options: [
            'Revenge only',
            'Deter crime, rehabilitate offender, protect society, and deliver justice',
            'Make money',
            'Humiliate the offender'
        ],
        correctAnswer: 1,
        explanation: 'Punishment aims to deter crime, rehabilitate offenders, protect society, and deliver justice - not just revenge.',
        difficulty: 'beginner'
    },

    // PUBLIC LAW QUESTIONS (15)
    {
        id: 'pub-exam-1',
        moduleId: 'public-law',
        question: 'What is public law?',
        options: [
            'Laws about public property',
            'Law governing relationship between government and citizens',
            'Laws made in public',
            'Laws for public servants only'
        ],
        correctAnswer: 1,
        explanation: 'Public law governs the relationship between the government and citizens, including constitutional and administrative law.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-2',
        moduleId: 'public-law',
        question: 'What does "rule of law" mean?',
        options: [
            'Only citizens must follow laws',
            'Government and citizens must both follow laws',
            'Laws are optional',
            'Only the President makes laws'
        ],
        correctAnswer: 1,
        explanation: 'Rule of law means everyone, including the government, must follow the law.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-3',
        moduleId: 'public-law',
        question: 'What is judicial review?',
        options: [
            'Judge reviewing case files',
            'Courts reviewing lawfulness of government decisions',
            'Reviewing judge performance',
            'Public reviewing court decisions'
        ],
        correctAnswer: 1,
        explanation: 'Judicial review is when courts review the lawfulness of government decisions for legality, rationality, and procedural fairness.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-4',
        moduleId: 'public-law',
        question: 'What does "ultra vires" mean?',
        options: [
            'Very strong',
            'Beyond legal powers',
            'Under authority',
            'Within limits'
        ],
        correctAnswer: 1,
        explanation: '"Ultra vires" means beyond legal powers - when a government body acts without legal authority.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-5',
        moduleId: 'public-law',
        question: 'Can you challenge a government decision in court?',
        options: [
            'No, government is always right',
            'Yes, through judicial review if decision is unlawful',
            'Only if you are rich',
            'Only during elections'
        ],
        correctAnswer: 1,
        explanation: 'You can challenge unlawful government decisions through judicial review in court.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-6',
        moduleId: 'public-law',
        question: 'What is administrative law?',
        options: [
            'Laws for administrators only',
            'Law controlling how government agencies exercise power',
            'Laws about administration buildings',
            'Laws about paperwork'
        ],
        correctAnswer: 1,
        explanation: 'Administrative law controls how government agencies and officials exercise their powers and make decisions.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-7',
        moduleId: 'public-law',
        question: 'What is a mandamus order?',
        options: [
            'Order to stop action',
            'Order to perform a legal duty',
            'Order to pay damages',
            'Order to arrest someone'
        ],
        correctAnswer: 1,
        explanation: 'Mandamus is a court order compelling a government body to perform a legal duty.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-8',
        moduleId: 'public-law',
        question: 'What is public interest litigation?',
        options: [
            'Litigation about public property',
            'Legal action on behalf of wider community or public good',
            'Cases heard in public',
            'Government prosecutions'
        ],
        correctAnswer: 1,
        explanation: 'Public interest litigation allows legal action on behalf of the wider community or public good, not just individual interests.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-9',
        moduleId: 'public-law',
        question: 'What is required for standing in judicial review?',
        options: [
            'Must be a lawyer',
            'Must have sufficient interest in the matter',
            'Must be a government employee',
            'Must be wealthy'
        ],
        correctAnswer: 1,
        explanation: 'You must have sufficient interest in the matter - be affected by the decision or have legitimate concern.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-10',
        moduleId: 'public-law',
        question: 'What are the three branches of government?',
        options: [
            'Army, Police, Courts',
            'Executive, Legislative, Judicial',
            'Federal, State, Local',
            'President, Ministers, Governors'
        ],
        correctAnswer: 1,
        explanation: 'The three branches are Executive (implements laws), Legislative (makes laws), and Judicial (interprets laws).',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-11',
        moduleId: 'public-law',
        question: 'What is the principle of natural justice?',
        options: [
            'Laws about nature',
            'Fair hearing and unbiased decision-maker',
            'Justice in the wild',
            'Environmental law'
        ],
        correctAnswer: 1,
        explanation: 'Natural justice requires fair hearing (right to be heard) and unbiased decision-maker (no bias).',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-12',
        moduleId: 'public-law',
        question: 'Can government take your property?',
        options: [
            'Yes, anytime they want',
            'Only for public purpose with fair compensation',
            'Never',
            'Only if you are poor'
        ],
        correctAnswer: 1,
        explanation: 'Government can take property only for legitimate public purpose and must provide fair compensation.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-13',
        moduleId: 'public-law',
        question: 'What is procedural fairness?',
        options: [
            'Fair prices',
            'Fair procedures in government decision-making',
            'Fair elections only',
            'Fair wages'
        ],
        correctAnswer: 1,
        explanation: 'Procedural fairness means government must follow fair procedures when making decisions that affect you.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-14',
        moduleId: 'public-law',
        question: 'What is the role of the Ombudsman?',
        options: [
            'Make laws',
            'Investigate complaints against government',
            'Arrest people',
            'Collect taxes'
        ],
        correctAnswer: 1,
        explanation: 'The Ombudsman investigates complaints against government agencies and promotes good administration.',
        difficulty: 'beginner'
    },
    {
        id: 'pub-exam-15',
        moduleId: 'public-law',
        question: 'What is transparency in government?',
        options: [
            'Glass buildings',
            'Openness and access to government information',
            'Invisible government',
            'Secret meetings'
        ],
        correctAnswer: 1,
        explanation: 'Transparency means government operates openly and citizens have access to information about government activities.',
        difficulty: 'beginner'
    }
];

/**
 * Get random questions for an exam
 * FETCHES FROM FIRESTORE (tutor-uploaded modules) ONLY
 * Ensures no overlap between exam levels
 */
export async function getExamQuestionsFromFirestore(examId: string, tier: string, userId?: string): Promise<ExamQuestion[]> {
    try {
        // Fetch published modules from Firestore based on user's tier
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://mobilaws-ympe.vercel.app/api'}/tutor-admin/modules/level/${tier}`);
        const modules = await response.json();
        
        if (!Array.isArray(modules) || modules.length === 0) {
            console.warn('⚠️ No modules found in Firestore. Tutor admins need to upload content first.');
            return [];
        }
        
        // Extract quiz questions from all lessons in all modules
        const allQuestions: ExamQuestion[] = [];
        modules.forEach((module: any) => {
            if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach((lesson: any, lessonIndex: number) => {
                    if (lesson.quiz && Array.isArray(lesson.quiz)) {
                        lesson.quiz.forEach((quiz: any, index: number) => {
                            allQuestions.push({
                                id: `${module.id}-${lesson.id}-q${index}`,
                                moduleId: module.id || 'general',
                                question: quiz.question,
                                options: quiz.options,
                                correctAnswer: quiz.correctAnswer,
                                explanation: quiz.explanation || 'No explanation provided',
                                difficulty: quiz.difficulty || 'beginner',
                                lessonIndex // Track lesson index for stratification
                            } as any);
                        });
                    }
                });
            }
        });
        
        if (allQuestions.length === 0) {
            console.warn('⚠️ No quiz questions found in modules. Tutor admins need to upload content with quizzes.');
            return [];
        }
        
        // Get the required number of questions based on exam type
        const exam = certificationExams.find(e => e.id === examId);
        const questionCount = exam?.questionCount || 40;
        
        let selectedQuestions: ExamQuestion[] = [];
        
        // Stratify questions based on exam level to avoid overlap
        if (examId === 'basic-cert') {
            // Basic: First 40 questions from beginner difficulty
            const beginnerQuestions = allQuestions.filter(q => q.difficulty === 'beginner' || q.difficulty === 'easy');
            selectedQuestions = shuffleArray(beginnerQuestions).slice(0, 40);
        } else if (examId === 'standard-cert') {
            // Standard: 100 questions from intermediate difficulty (no overlap with basic)
            const intermediateQuestions = allQuestions.filter(q => 
                q.difficulty === 'intermediate' || q.difficulty === 'medium'
            );
            selectedQuestions = shuffleArray(intermediateQuestions).slice(0, 100);
            
            // If not enough intermediate, supplement with advanced
            if (selectedQuestions.length < 100) {
                const advancedQuestions = allQuestions.filter(q => 
                    q.difficulty === 'advanced' || q.difficulty === 'hard'
                );
                const needed = 100 - selectedQuestions.length;
                selectedQuestions = [...selectedQuestions, ...shuffleArray(advancedQuestions).slice(0, needed)];
            }
        } else if (examId === 'premium-cert') {
            // Premium: 200 questions from all difficulties, excluding basic and standard ranges
            // Use advanced questions and mixed difficulties
            const advancedQuestions = allQuestions.filter(q => 
                q.difficulty === 'advanced' || q.difficulty === 'hard'
            );
            const mixedQuestions = shuffleArray(allQuestions);
            
            // Prioritize advanced, then fill with mixed
            selectedQuestions = shuffleArray(advancedQuestions).slice(0, 150);
            const needed = 200 - selectedQuestions.length;
            if (needed > 0) {
                const additionalQuestions = mixedQuestions
                    .filter(q => !selectedQuestions.find(sq => sq.id === q.id))
                    .slice(0, needed);
                selectedQuestions = [...selectedQuestions, ...additionalQuestions];
            }
        }
        
        // If we don't have enough questions, use all available and warn
        if (selectedQuestions.length < questionCount) {
            console.warn(`⚠️ Only ${selectedQuestions.length} questions available, exam requires ${questionCount}`);
            // Supplement with any remaining questions
            const remaining = allQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
            selectedQuestions = [...selectedQuestions, ...shuffleArray(remaining)].slice(0, questionCount);
        }
        
        return shuffleArray(selectedQuestions).slice(0, questionCount);
    } catch (error) {
        console.error('❌ Error fetching exam questions from Firestore:', error);
        return [];
    }
}

/**
 * Get random questions for an exam (FALLBACK - uses hardcoded questions)
 */
export function getExamQuestions(examId: string): ExamQuestion[] {
    if (examId === 'basic-cert') {
        // Return all 75 basic questions in random order
        return shuffleArray([...basicExamQuestions]);
    }
    return [];
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Calculate exam score
 */
export function calculateExamScore(
    answers: Record<string, number>,
    questions: ExamQuestion[]
): { score: number; passed: boolean; correctCount: number; totalCount: number } {
    let correctCount = 0;
    const totalCount = questions.length;

    questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= 70;

    return { score, passed, correctCount, totalCount };
}

/**
 * Generate certificate number
 */
export function generateCertificateNumber(level: string): string {
    const prefix = level.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
