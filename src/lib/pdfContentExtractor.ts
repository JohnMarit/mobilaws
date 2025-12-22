/**
 * PDF Content Extractor for Law Documents
 * 
 * This module extracts and structures legal content from PDFs
 * for the Mobilaws learning system.
 */

export interface LegalTopic {
  id: string;
  title: string;
  description: string;
  pdfSource: string;
  content: string;
  tier: 'basic' | 'standard' | 'premium';
}

export interface ExtractedModule {
  id: string;
  title: string;
  description: string;
  topics: LegalTopic[];
  tier: 'basic' | 'standard' | 'premium';
}

/**
 * South Sudan Constitution topics extracted from PDFs
 */
export const constitutionTopics: LegalTopic[] = [
  {
    id: 'const-intro-free',
    title: 'What is the Constitution?',
    description: 'Quick introduction to the supreme law of South Sudan',
    pdfSource: 'south sudan laws.pdf',
    content: `The Constitution is the highest law in South Sudan. Everything starts here!

What it does:
• Organizes government powers (President, Parliament, Courts)
• Protects your rights and freedoms
• Sets rules for how laws are made

Think of it like the rulebook for the entire country. Every other law must follow what the Constitution says.

Want to learn more? Upgrade to see how the Constitution affects your daily life!`,
    tier: 'free'
  },
  {
    id: 'const-intro',
    title: 'Introduction to South Sudan Constitution',
    description: 'Overview of the constitutional framework and fundamental principles',
    pdfSource: 'south sudan laws.pdf',
    content: `The Constitution of the Republic of South Sudan establishes the fundamental legal framework for governance and protection of rights.

Key Principles:
• Sovereignty resides in the people
• Rule of law and separation of powers
• Protection of fundamental rights and freedoms
• Federal system of governance

The Constitution serves as the supreme law, and all other laws must conform to its provisions.`,
    tier: 'basic'
  },
  {
    id: 'const-rights',
    title: 'Fundamental Rights and Freedoms',
    description: 'Bill of Rights: civil, political, economic and social rights',
    pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
    content: `The Bill of Rights guarantees fundamental freedoms to all persons in South Sudan:

Civil and Political Rights:
• Right to life and human dignity
• Freedom of expression and assembly
• Right to fair trial and due process
• Freedom from torture and discrimination
• Right to vote and participate in governance

Economic and Social Rights:
• Right to property
• Right to education
• Right to health care
• Right to work and fair wages

The state has a duty to respect, protect, and fulfill these rights.`,
    tier: 'standard'
  },
  {
    id: 'const-enforcement',
    title: 'Enforcing Constitutional Rights',
    description: 'Legal mechanisms for protecting and enforcing constitutional rights',
    pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
    content: `Citizens can enforce their constitutional rights through various legal mechanisms:

1. Constitutional Court Petitions
   - Direct challenge to violations
   - Judicial review of laws
   - Interpretation of constitutional provisions

2. High Court Applications
   - Enforcement orders
   - Compensation for violations
   - Injunctions against state action

3. Legal Standing and Remedies
   - Individual standing (direct injury)
   - Public interest litigation
   - Declaratory orders
   - Damages and restitution

Practical Steps:
1. Document the violation with evidence
2. Consult a constitutional lawyer
3. File petition within prescribed time limits
4. Attend court proceedings
5. Seek enforcement of judgment

Important: Constitutional remedies have strict time limits and procedural requirements.`,
    tier: 'premium'
  }
];

/**
 * International Law topics
 */
export const internationalLawTopics: LegalTopic[] = [
  {
    id: 'intl-intro-free',
    title: 'What is International Law?',
    description: 'How countries make and follow rules together',
    pdfSource: 'intlawintro.pdf',
    content: `International law is like rules between countries - how they work together and solve problems.

Key Ideas:
• Countries sign treaties (like contracts between nations)
• United Nations helps keep peace
• South Sudan follows international agreements

Example: When South Sudan joined the UN, it agreed to follow certain rules about human rights and peace.

Curious about treaties and how they affect you? Upgrade to learn more!`,
    tier: 'free'
  },
  {
    id: 'intl-intro',
    title: 'Introduction to International Law',
    description: 'Basic principles and sources of international law',
    pdfSource: 'intlawintro.pdf',
    content: `International law consists of rules and principles governing relations between States and international organizations.

Key Concepts:
• States as primary subjects of international law
• International legal personality
• Sovereignty and territorial integrity
• Treaty obligations and customary law

South Sudan's International Obligations:
As a member of the United Nations and African Union, South Sudan is bound by international treaties and conventions it has ratified.`,
    tier: 'basic'
  },
  {
    id: 'intl-treaties',
    title: 'Treaties and Conventions',
    description: 'How international treaties become law in South Sudan',
    pdfSource: 'intlawintro.pdf',
    content: `Treaties are written agreements between States governed by international law.

Treaty Process:
1. Negotiation - States discuss treaty terms
2. Signature - Indicates intent to be bound
3. Ratification - State formally consents
4. Entry into Force - Treaty becomes binding

Key Principles:
• Pacta sunt servanda: Treaties must be performed in good faith
• Treaties bind only parties (no third-party effect)
• Domestic law cannot excuse treaty breach

In South Sudan:
- President negotiates and signs treaties
- National Legislature must ratify
- Treaties incorporated into domestic law

Important South Sudan Treaties:
• UN Charter
• African Charter on Human Rights
• Geneva Conventions (humanitarian law)
• International human rights treaties`,
    tier: 'standard'
  },
  {
    id: 'intl-state-responsibility',
    title: 'State Responsibility and Remedies',
    description: 'When States violate international obligations and available remedies',
    pdfSource: 'intlawintro.pdf',
    content: `States are responsible for internationally wrongful acts.

Elements of State Responsibility:
1. Conduct attributable to the State
   - Acts of government officials
   - Acts of organs exercising government authority
   - State failure to prevent private acts (duty to protect)

2. Breach of international obligation
   - Treaty violation
   - Customary law violation
   - Violation of jus cogens norms

Attribution Rules:
• Executive, legislative, judicial acts are attributable
• Military and police actions are attributable
• Private conduct not attributable unless State failed to prevent

Consequences:
• Duty to cease wrongful act
• Obligation to make reparations
• Restitution, compensation, or satisfaction

Forms of Reparation:
1. Restitution: Restore situation before breach
2. Compensation: Financial payment for damages
3. Satisfaction: Acknowledgment, apology, guarantee of non-repetition

Legal Remedies:
• International Court of Justice (ICJ)
• African Court on Human and Peoples' Rights
• Diplomatic negotiations
• UN Security Council intervention

Defenses:
• Consent of injured State
• Self-defense
• Force majeure (unforeseeable circumstances)
• Distress or necessity

Case Example:
If South Sudan violates a treaty obligation (e.g., human rights treaty), the injured State or international body can bring a claim for reparations.`,
    tier: 'premium'
  }
];

/**
 * Criminal Law topics (Penal Code)
 */
export const criminalLawTopics: LegalTopic[] = [
  {
    id: 'penal-intro-free',
    title: 'Understanding Criminal Law Basics',
    description: 'What makes something a crime?',
    pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
    content: `Criminal law tells us what actions are crimes and what happens if you commit one.

Important to Know:
• You are innocent until proven guilty
• For most crimes, you need both: the action AND the intention
• Children under 12 cannot be charged with crimes

Types of Crimes:
• Crimes against people (assault, murder)
• Crimes against property (theft, robbery)
• Crimes against the state (treason)

Your Rights: If arrested, you have the right to a lawyer and fair trial.

Want to know your rights if arrested? Upgrade to learn the step-by-step process!`,
    tier: 'free'
  },
  {
    id: 'penal-intro',
    title: 'Introduction to South Sudan Penal Code',
    description: 'Overview of criminal law principles and offenses',
    pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
    content: `The Penal Code Act 2008 defines criminal offenses and punishments in South Sudan.

Key Principles:
• Nullum crimen sine lege: No crime without law
• Presumption of innocence
• Right to fair trial
• Proportionality of punishment

Categories of Offenses:
1. Offenses Against the State (treason, sedition)
2. Offenses Against Public Order (riot, unlawful assembly)
3. Offenses Against Person (murder, assault)
4. Offenses Against Property (theft, robbery)
5. Offenses Against Morality (adultery, indecent acts)

Criminal Responsibility:
- Age of criminal responsibility: 12 years
- Mental capacity required
- Intent (mens rea) and act (actus reus)`,
    tier: 'basic'
  },
  {
    id: 'penal-defenses',
    title: 'Criminal Defenses and Exemptions',
    description: 'Legal defenses available to accused persons',
    pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
    content: `The Penal Code recognizes several defenses that can exempt or reduce liability:

Complete Defenses (No Liability):
1. Insanity - Mental disorder preventing understanding
2. Infancy - Below 12 years of age
3. Mistake of Fact - Honest and reasonable mistake
4. Accident - No criminal intent
5. Self-Defense - Reasonable force to defend person/property
6. Necessity - Act to prevent greater harm

Partial Defenses (Reduce Liability):
1. Provocation - Sudden passion reducing murder to manslaughter
2. Diminished Responsibility - Impaired mental state
3. Intoxication - Involuntary intoxication may negate intent

Justifications:
• Lawful authority (police, military duty)
• Parental discipline (reasonable chastisement)
• Consent (in limited circumstances)
• Legal right (e.g., arrest by citizen)

Burden of Proof:
- Prosecution must prove guilt beyond reasonable doubt
- Defense must raise evidence of defense
- Prosecution then must disprove defense

Important: Self-defense must be proportional. Excessive force is not justified.`,
    tier: 'standard'
  },
  {
    id: 'penal-procedure',
    title: 'Criminal Procedure and Rights of the Accused',
    description: 'Step-by-step criminal process from arrest to trial',
    pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
    content: `Criminal procedure governs how criminal cases are prosecuted:

Arrest and Detention:
1. Arrest with warrant (issued by court)
2. Arrest without warrant (for serious offenses or caught in the act)
3. Right to be informed of reasons for arrest
4. Right to remain silent
5. Right to legal representation
6. Detention limits: Must be brought before court within 24 hours

Investigation:
• Police gather evidence
• Interview witnesses
• Accused has right against self-incrimination
• Right to have lawyer present during questioning

Court Proceedings:
1. First Appearance (within 24 hours)
   - Charges read to accused
   - Plea taken (guilty/not guilty)
   - Bail application

2. Preliminary Hearing (for serious offenses)
   - Determine if sufficient evidence
   - Committal to High Court if needed

3. Trial
   - Prosecution presents case
   - Defense presents case
   - Examination and cross-examination of witnesses
   - Closing arguments
   - Judgment

Rights of the Accused:
• Presumption of innocence
• Right to fair and public hearing
• Right to legal representation (free if indigent for serious offenses)
• Right to call and examine witnesses
• Right to interpreter if needed
• Right to appeal conviction

Sentencing:
• Judge considers:
  - Severity of offense
  - Circumstances of commission
  - Character and antecedents of accused
  - Mitigating and aggravating factors
• Options: Fine, imprisonment, community service, suspended sentence

Appeals:
• Right to appeal conviction or sentence
• Must be filed within 30 days
• Appellate court can uphold, overturn, or modify

Practical Guidance:
1. If arrested, cooperate but do not answer substantive questions without lawyer
2. Request lawyer immediately
3. Document any mistreatment
4. Insist on being brought before court within 24 hours
5. Apply for bail if eligible
6. Gather witnesses and evidence for defense

Important: Legal aid available for serious criminal cases. Contact Legal Aid Board or NGO legal clinics.`,
    tier: 'premium'
  }
];

/**
 * Public Law topics
 */
export const publicLawTopics: LegalTopic[] = [
  {
    id: 'pub-intro-free',
    title: 'How Government Works',
    description: 'Understanding government powers and your role',
    pdfSource: 'public-law-study-guide.pdf',
    content: `Public law is about the relationship between government and you as a citizen.

The Government Has 3 Parts:
• President & Ministers (make decisions)
• Parliament (makes laws)
• Courts (apply laws)

Important Principle: Rule of Law
The government must follow the law, just like everyone else!

Your Power:
• You can vote for leaders
• You can challenge unfair government decisions in court
• You have rights that government must respect

Curious how to challenge government action? Upgrade to learn the process!`,
    tier: 'free'
  },
  {
    id: 'pub-intro',
    title: 'Introduction to Public Law',
    description: 'Government powers, structure, and citizen-state relations',
    pdfSource: 'public-law-study-guide.pdf',
    content: `Public law governs the relationship between the State and citizens.

Key Areas:
1. Constitutional Law - Structure and powers of government
2. Administrative Law - Actions of government agencies
3. Criminal Law - State prosecution of offenses

Principles of Public Law:
• Rule of law: Government must act within legal limits
• Separation of powers: Executive, Legislative, Judicial independence
• Checks and balances: Each branch limits others
• Accountability: Government answerable to people

South Sudan Government Structure:
• President (Head of State and Government)
• National Legislature (Bicameral: National Assembly & Council of States)
• Judiciary (Supreme Court, Court of Appeal, High Courts)
• State Governments (10 states with governors and assemblies)`,
    tier: 'basic'
  },
  {
    id: 'pub-admin',
    title: 'Administrative Law and Judicial Review',
    description: 'Challenging government decisions in court',
    pdfSource: 'public-law-study-guide.pdf',
    content: `Administrative law controls how government agencies exercise power.

Principles of Administrative Justice:
1. Legality - Agency must have legal authority
2. Procedural Fairness - Right to be heard
3. Reasonableness - Decisions must be rational
4. Proportionality - Action proportional to objective

Judicial Review:
Courts can review government decisions for:
• Illegality - Acting without legal authority
• Irrationality - Decision no reasonable authority would make
• Procedural Impropriety - Unfair process

Grounds for Judicial Review:
1. Ultra vires (beyond powers)
2. Breach of natural justice (audi alteram partem, nemo judex)
3. Error of law on face of record
4. Unreasonableness (Wednesbury principle)
5. Legitimate expectation violated
6. Bad faith or improper motive

Who Can Apply:
• Person with sufficient interest in the matter
• Public interest litigation (in limited cases)

Remedies:
• Certiorari (quashing order)
• Mandamus (order to perform duty)
• Prohibition (order to stop action)
• Declaration (statement of legal position)
• Injunction (stop or compel action)

Time Limits:
- Application must be filed promptly
- Usually within 3-6 months of decision
- Court may extend time in exceptional cases

Important: Judicial review challenges the process, not the merits of the decision.`,
    tier: 'standard'
  },
  {
    id: 'pub-practice',
    title: 'Public Law Practice: Step-by-Step Guide',
    description: 'Practical guide to challenging government action',
    pdfSource: 'public-law-study-guide.pdf',
    content: `Comprehensive guide to pursuing public law remedies:

Step 1: Assess Your Case
• Identify the government decision/action
• Determine if you have standing (sufficient interest)
• Check time limits
• Consider alternative remedies first

Step 2: Pre-Action Steps
• Write to the government body outlining concerns
• Request reconsideration or internal review
• Give reasonable time for response (14-30 days)
• Gather all relevant documents and evidence

Step 3: Prepare Application
Required Documents:
• Application notice (Form JR-1)
• Statement of grounds for review
• Affidavit in support (sworn statement of facts)
• Copies of impugned decision and relevant documents
• Legal authorities supporting your case

Grounds to Assert:
- Identify specific legal grounds (illegality, procedural unfairness, etc.)
- Cite relevant laws and cases
- Explain how decision violates those principles

Step 4: File Application
• File at High Court (Constitutional & Human Rights Division)
• Pay court fees (waiver available if indigent)
• Serve government body and other parties
• Request interim relief if urgent (stay of decision)

Step 5: Permission Stage (Leave)
• Court reviews if case has merit
• May be decided on papers or at hearing
• If refused, can appeal or renew

Step 6: Substantive Hearing
• Both sides present evidence
• Oral arguments on law
• Court examines lawfulness of decision

Step 7: Judgment and Remedies
If Successful:
• Quashing of decision
• Order for reconsideration
• Damages (in limited cases)
• Costs awarded

If Unsuccessful:
• Consider appeal to Court of Appeal
• Must file notice within 30 days

Practical Tips:
✓ Act quickly - time limits are strict
✓ Exhaust internal remedies first
✓ Keep detailed records of all interactions
✓ Seek legal advice early
✓ Consider public interest litigation if affecting wider community
✓ Media and advocacy can support legal challenge

Legal Aid and Support:
• Legal Aid Board for indigent persons
• Public interest law NGOs
• University legal clinics
• Pro bono lawyers

Cost Considerations:
• Court fees (waivable)
• Lawyer fees (legal aid available)
• Risk of paying government's costs if you lose
• Cost-benefit analysis essential

Common Cases:
• Unlawful arrest or detention
• Denial of license/permit
• Land allocation disputes
• Dismissal from public service
• Refusal of government services
• Unconstitutional legislation

Important: Public law remedies are discretionary. Court may refuse remedy even if decision was unlawful (e.g., if delay was excessive or no practical benefit).

Case Examples:

Example 1: Unlawful Dismissal
Public servant dismissed without hearing. Grounds: Breach of natural justice (right to be heard). Remedy: Mandamus ordering reinstatement or reconsideration.

Example 2: Denial of Business License
Government refuses license without giving reasons. Grounds: Illegality (failure to exercise discretion), procedural unfairness. Remedy: Certiorari quashing refusal, mandamus ordering reconsideration.

Example 3: Unconstitutional Regulation
Regulation restricts freedom of assembly. Grounds: Ultra vires (violates Constitution). Remedy: Declaration of invalidity, prohibition against enforcement.

Checklist for Judicial Review:
□ Identify decision and decision-maker
□ Determine standing
□ Check time limits
□ Exhaust alternative remedies
□ Draft grounds for review
□ Gather evidence (affidavit)
□ Prepare legal arguments
□ File application and serve parties
□ Attend permission hearing
□ Prepare for substantive hearing
□ Execute judgment if successful`,
    tier: 'premium'
  }
];

/**
 * Get all extracted modules organized by tier
 */
export function getAllModules(): ExtractedModule[] {
  return [
    {
      id: 'constitution',
      title: 'South Sudan Constitution',
      description: 'Fundamental law, rights, and government structure',
      topics: constitutionTopics,
      tier: 'basic'
    },
    {
      id: 'international-law',
      title: 'International Law Principles',
      description: 'Treaties, state responsibility, and global legal framework',
      topics: internationalLawTopics,
      tier: 'basic'
    },
    {
      id: 'criminal-law',
      title: 'Criminal Law & Penal Code',
      description: 'Offenses, defenses, and criminal procedure',
      topics: criminalLawTopics,
      tier: 'basic'
    },
    {
      id: 'public-law',
      title: 'Public Law & Administrative Justice',
      description: 'Government powers, judicial review, and citizen rights',
      topics: publicLawTopics,
      tier: 'basic'
    }
  ];
}

/**
 * Get modules accessible for a given subscription tier
 */
export function getModulesForTier(tier: 'free' | 'basic' | 'standard' | 'premium'): ExtractedModule[] {
  const allModules = getAllModules();
  
  // Map tier hierarchy
  const tierHierarchy: Record<string, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3
  };
  
  const userTierLevel = tierHierarchy[tier] || 0;
  
  return allModules.map(module => ({
    ...module,
    topics: module.topics.filter(topic => {
      const topicTierLevel = tierHierarchy[topic.tier] || 0;
      return topicTierLevel <= userTierLevel;
    })
  })).filter(module => module.topics.length > 0);
}

/**
 * Get a specific topic by ID
 */
export function getTopicById(topicId: string): LegalTopic | undefined {
  const allTopics = [
    ...constitutionTopics,
    ...internationalLawTopics,
    ...criminalLawTopics,
    ...publicLawTopics
  ];
  
  return allTopics.find(topic => topic.id === topicId);
}

/**
 * Check if a topic is accessible for a given tier
 */
export function isTopicAccessible(topicId: string, userTier: 'free' | 'basic' | 'standard' | 'premium'): boolean {
  const topic = getTopicById(topicId);
  if (!topic) return false;
  
  const tierHierarchy: Record<string, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3
  };
  
  const userTierLevel = tierHierarchy[userTier] || 0;
  const topicTierLevel = tierHierarchy[topic.tier] || 0;
  
  return topicTierLevel <= userTierLevel;
}

