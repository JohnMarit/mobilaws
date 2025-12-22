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
 * International Law topics from International Law Handbook (book_1.pdf)
 * Comprehensive university-level course content
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
    id: 'intl-un-charter',
    title: 'Chapter I: Charter of the United Nations',
    description: 'Foundational principles and structure of the UN Charter',
    pdfSource: 'book_1.pdf',
    content: `The Charter of the United Nations is the foundational treaty establishing the United Nations organization.

Key Principles of the UN Charter:
• Maintain international peace and security
• Develop friendly relations among nations
• Achieve international cooperation
• Be a center for harmonizing actions of nations

Main Organs:
1. General Assembly - All member states, deliberative body
2. Security Council - 15 members, maintains peace and security
3. Economic and Social Council - Coordinates economic and social work
4. Trusteeship Council - Supervised trust territories (now largely inactive)
5. International Court of Justice - Principal judicial organ
6. Secretariat - Administrative functions

Purposes of the United Nations:
1. To maintain international peace and security
2. To develop friendly relations among nations
3. To achieve international cooperation
4. To be a center for harmonizing actions of nations

Principles:
• Sovereign equality of all members
• Fulfill obligations in good faith
• Settle disputes by peaceful means
• Refrain from threat or use of force
• Assist UN in actions it takes
• Non-intervention in domestic jurisdiction (except enforcement measures)

South Sudan became a UN member state on 14 July 2011, accepting all obligations under the Charter.`,
    tier: 'premium'
  },
  {
    id: 'intl-icj-statute',
    title: 'Statute of the International Court of Justice',
    description: 'Structure, jurisdiction, and procedures of the ICJ',
    pdfSource: 'book_1.pdf',
    content: `The International Court of Justice (ICJ) is the principal judicial organ of the United Nations.

Composition:
• 15 judges elected by UN General Assembly and Security Council
• Judges serve 9-year terms
• No two judges from same nationality
• Represents main forms of civilization and principal legal systems

Jurisdiction:
1. Contentious Cases - Disputes between states
   • States must consent to jurisdiction
   • Optional clause declarations
   • Special agreements
   • Treaty-based jurisdiction

2. Advisory Opinions
   • Requested by UN organs or specialized agencies
   • Not binding but highly authoritative

Sources of Law Applied:
• International conventions
• International custom
• General principles of law
• Judicial decisions and teachings (subsidiary means)

Procedures:
• Written and oral proceedings
• Public hearings (unless otherwise decided)
• Judgment is final and binding on parties
• No appeal, but revision possible in exceptional circumstances

Enforcement:
• UN Security Council can enforce ICJ judgments
• States generally comply voluntarily

South Sudan can:
• Bring cases against other states (with consent)
• Be subject to cases brought by other states
• Request advisory opinions through UN organs`,
    tier: 'premium'
  },
  {
    id: 'intl-vienna-treaties',
    title: 'Chapter II: Vienna Convention on the Law of Treaties',
    description: 'Comprehensive rules governing treaty formation, interpretation, and termination',
    pdfSource: 'book_1.pdf',
    content: `The Vienna Convention on the Law of Treaties (1969) codifies customary international law on treaties.

Definition of Treaty:
A treaty is an international agreement concluded between States in written form and governed by international law.

Conclusion of Treaties:
1. Capacity to conclude treaties
   • Every state possesses capacity
   • Full powers required for representatives
   • Heads of state, heads of government, foreign ministers have full powers

2. Consent to be bound
   • Signature
   • Exchange of instruments
   • Ratification
   • Acceptance or approval
   • Accession

3. Reservations
   • State may formulate reservation unless:
     - Reservation prohibited by treaty
     - Treaty provides only specified reservations
     - Reservation incompatible with object and purpose

4. Entry into force
   • In accordance with treaty provisions
   • Or when consent established by all negotiating states

Observance of Treaties:
• Pacta sunt servanda: Every treaty in force is binding and must be performed in good faith
• Internal law cannot justify failure to perform

Application of Treaties:
• Binding on parties
• No retroactive effect unless otherwise intended
• Territorial scope as specified

Interpretation:
• Good faith
• Ordinary meaning in context
• Object and purpose
• Subsequent practice
• Preparatory work (travaux préparatoires) as supplementary means

Invalidity:
• Error (if fundamental)
• Fraud
• Corruption
• Coercion of representative
• Coercion of state by threat or use of force
• Conflict with peremptory norm (jus cogens)

Termination and Suspension:
• In accordance with treaty provisions
• By consent of all parties
• Material breach
• Supervening impossibility of performance
• Fundamental change of circumstances (rebus sic stantibus)
• Emergence of new peremptory norm

Consequences of Invalidity, Termination, or Suspension:
• Release from obligations
• No effect on rights, obligations, or situation created prior to termination
• Separation of treaty provisions`,
    tier: 'premium'
  },
  {
    id: 'intl-treaty-succession',
    title: 'Vienna Convention on Succession of States in Respect of Treaties',
    description: 'Rules when states merge, split, or gain independence',
    pdfSource: 'book_1.pdf',
    content: `This Convention governs what happens to treaties when states undergo succession (merger, separation, independence).

Types of Succession:
1. Newly Independent States
   • Clean slate principle: Not bound by predecessor's treaties
   • May notify succession to multilateral treaties
   • Bilateral treaties require consent of other party

2. Unification of States
   • Treaties of predecessor states continue in force
   • Limited to territory where treaty applied
   • May be terminated or modified by agreement

3. Separation of States
   • Treaties continue for each successor state
   • Unless parties agree otherwise or incompatible with object and purpose

4. Transfer of Territory
   • Treaties cease to apply to transferred territory
   • Unless otherwise agreed

South Sudan Context:
As a newly independent state (2011), South Sudan:
• Started with clean slate (not automatically bound by Sudan's treaties)
• Could choose to succeed to treaties beneficial to it
• Had to negotiate new bilateral treaties
• Could accede to multilateral treaties

Notification of Succession:
• Must be in writing
• Communicated to depositary or other parties
• Expresses intention to be bound

Effects:
• Succession takes effect on date indicated
• Or on date of receipt of notification
• Other parties may object within 12 months`,
    tier: 'premium'
  },
  {
    id: 'intl-subjects-states',
    title: 'Chapter III: Subjects of International Law - States',
    description: 'Statehood, recognition, rights and duties of states',
    pdfSource: 'book_1.pdf',
    content: `States are the primary subjects of international law.

Criteria for Statehood (Montevideo Convention):
1. Permanent population
2. Defined territory
3. Government
4. Capacity to enter into relations with other states

Rights of States:
• Sovereignty and independence
• Territorial integrity
• Jurisdiction over territory and nationals
• Equality with other states
• Right to self-defense
• Right to enter into treaties

Duties of States:
• Not to intervene in affairs of other states
• Not to foment civil strife in other states
• To respect human rights
• To fulfill treaty obligations in good faith
• To settle disputes peacefully
• To refrain from threat or use of force

State Recognition:
• Declaratory theory: State exists when criteria met (regardless of recognition)
• Constitutive theory: Recognition creates statehood
• Modern practice: Recognition is political act, not legal requirement

State Succession:
• Rights and obligations may pass to successor state
• Depends on type of succession (unification, separation, independence)
• Treaties, property, archives, debts, nationality issues

State Immunity:
• States generally immune from jurisdiction of other states' courts
• Exceptions: Commercial activities, torts in forum state
• UN Convention on Jurisdictional Immunities codifies rules

South Sudan:
• Met all criteria for statehood upon independence (2011)
• Recognized by UN and most states
• Succeeded to some treaties, started fresh with others
• Has full international legal personality`,
    tier: 'premium'
  },
  {
    id: 'intl-subjects-orgs',
    title: 'Subjects of International Law - International Organizations',
    description: 'Legal personality, privileges, and immunities of international organizations',
    pdfSource: 'book_1.pdf',
    content: `International organizations can have international legal personality.

Criteria for Legal Personality:
• Established by treaty
• Permanent organs
• Independent will
• Functions on international plane

Privileges and Immunities:
1. United Nations Convention on Privileges and Immunities
   • Immunity from legal process
   • Inviolability of premises, archives, documents
   • Freedom from taxation
   • Communications privileges
   • Representatives of members enjoy privileges

2. Specialized Agencies Convention
   • Similar immunities for UN specialized agencies
   • Examples: WHO, UNESCO, ILO, FAO, etc.

Scope of Immunities:
• Functional necessity: Immunities necessary for exercise of functions
• Not absolute: Can be waived
• Staff enjoy immunities for official acts
• Property and assets immune from legal process

Liability:
• Organizations can be held responsible for wrongful acts
• Can enter into contracts
• Can be party to disputes
• Can make claims for injury to staff or property

South Sudan's Relationship:
• Member of UN and specialized agencies
• Bound by obligations under their charters
• Entitled to participate in decision-making
• Must respect immunities of organizations and their staff`,
    tier: 'premium'
  },
  {
    id: 'intl-diplomatic-relations',
    title: 'Chapter IV: Vienna Convention on Diplomatic Relations',
    description: 'Rules governing diplomatic missions, immunities, and privileges',
    pdfSource: 'book_1.pdf',
    content: `The Vienna Convention on Diplomatic Relations (1961) codifies rules for diplomatic relations.

Establishment of Diplomatic Relations:
• By mutual consent
• No obligation to establish relations
• Can be done without agreement on level

Functions of Diplomatic Mission:
1. Representing sending state
2. Protecting interests of sending state and nationals
3. Negotiating with receiving state
4. Ascertaining conditions and developments
5. Promoting friendly relations
6. Developing economic, cultural, and scientific relations

Diplomatic Agents:
• Head of mission and members of diplomatic staff
• Must be acceptable to receiving state (agrément)
• Receiving state can declare persona non grata

Privileges and Immunities:

1. Inviolability of Mission
   • Premises inviolable
   • Receiving state cannot enter without consent
   • Special duty to protect premises
   • Archives and documents inviolable

2. Personal Inviolability
   • Cannot be arrested or detained
   • Receiving state must treat with respect
   • Take all appropriate steps to prevent attack

3. Immunity from Jurisdiction
   • Complete immunity from criminal jurisdiction
   • Immunity from civil and administrative jurisdiction (with exceptions):
     - Real property actions (unless held for mission)
     - Succession matters
     - Professional or commercial activities outside official functions

4. Inviolability of Residence and Property
   • Private residence inviolable
   • Papers, correspondence, property inviolable

5. Fiscal Privileges
   • Exempt from all dues and taxes (with exceptions)
   • Exempt from customs duties

6. Freedom of Movement
   • Freedom to travel within receiving state

Duties:
• Respect laws and regulations of receiving state
• Not interfere in internal affairs
• Use premises only for official purposes
• Not engage in professional or commercial activities

Termination:
• End of functions
• Notification by sending state
• Declaration of persona non grata
• Breaking of diplomatic relations
• Outbreak of war

South Sudan:
• Maintains diplomatic missions in various countries
• Hosts diplomatic missions in Juba
• Must respect immunities of foreign diplomats
• Its diplomats enjoy immunities abroad`,
    tier: 'premium'
  },
  {
    id: 'intl-consular-relations',
    title: 'Vienna Convention on Consular Relations',
    description: 'Consular functions, immunities, and protection of nationals',
    pdfSource: 'book_1.pdf',
    content: `The Vienna Convention on Consular Relations (1963) governs consular relations.

Consular Functions:
1. Protecting interests of sending state and nationals
2. Furthering commercial, economic, cultural, and scientific relations
3. Issuing passports and travel documents
4. Helping and assisting nationals
5. Acting as notary and civil registrar
6. Safeguarding interests of minors and incapacitated persons
7. Supervising and assisting vessels and aircraft
8. Other functions permitted by receiving state

Consular Officers:
• Head of consular post and consular officials
• Must be acceptable to receiving state (exequatur)
• Can be declared unacceptable

Privileges and Immunities (More Limited than Diplomatic):

1. Inviolability of Consular Premises
   • Premises inviolable (but can enter in case of fire or disaster)
   • Archives and documents inviolable

2. Personal Inviolability
   • Cannot be arrested or detained except for grave crimes
   • Must be treated with respect

3. Immunity from Jurisdiction
   • Immunity for official acts
   • Can be subject to civil jurisdiction for:
     - Contractual disputes (not official)
     - Third-party damage from vehicle/aircraft accident
     - Private immovable property
     - Succession matters
     - Professional or commercial activities

4. Fiscal Privileges
   • Exempt from taxes (with more exceptions than diplomats)
   • Exempt from customs duties on personal effects

5. Freedom of Movement and Communication
   • Freedom to communicate with nationals
   • Right to visit nationals in detention

Protection of Nationals:
• Right to communicate with nationals
• Right to visit detained nationals
• Right to arrange legal representation
• Notification of arrest or detention
• Assistance in legal proceedings

Termination:
• End of functions
• Withdrawal of exequatur
• Closure of consular post
• Breaking of consular relations

South Sudan:
• Operates consulates to assist South Sudanese nationals abroad
• Foreign consulates in South Sudan assist their nationals
• Important for protection of citizens traveling or living abroad`,
    tier: 'premium'
  },
  {
    id: 'intl-responsibility',
    title: 'Chapter V: International Responsibility of States',
    description: 'When states commit wrongful acts and consequences',
    pdfSource: 'book_1.pdf',
    content: `States are responsible for internationally wrongful acts.

Internationally Wrongful Act:
1. Conduct attributable to the state
2. Constitutes breach of international obligation

Attribution of Conduct:
• Conduct of state organs (legislative, executive, judicial)
• Conduct of persons exercising governmental authority
• Conduct directed or controlled by state
• Conduct of insurrectional movements (if successful)
• Conduct acknowledged and adopted by state

Breach of International Obligation:
• Occurs when state's conduct does not conform to obligation
• Can be by act or omission
• Must be in force at time of conduct
• Can be breach of treaty or customary law

Circumstances Precluding Wrongfulness:
1. Consent - Valid consent by injured state
2. Self-defense - Lawful measures of self-defense
3. Countermeasures - Lawful response to prior breach
4. Force majeure - Irresistible force or unforeseen event
5. Distress - Saving life in peril
6. Necessity - Safeguarding essential interest against grave and imminent peril

Consequences:
1. Cessation - Must cease wrongful act if continuing
2. Non-repetition - Offer assurances of non-repetition
3. Reparation - Must make full reparation

Forms of Reparation:
1. Restitution - Re-establish situation before breach
2. Compensation - Monetary payment for damage
3. Satisfaction - Acknowledgment, apology, or other appropriate satisfaction

Serious Breaches:
• Breach of peremptory norm (jus cogens)
• Widespread and systematic breach
• Special consequences:
  - Cooperation to end breach
  - No recognition of situation as lawful
  - No aid or assistance in maintaining situation

Invocation of Responsibility:
• Injured state can invoke responsibility
• States other than injured state can invoke if:
  - Obligation owed to international community as whole
  - Breach of peremptory norm

South Sudan:
• Bound by rules of state responsibility
• Can bring claims against other states
• Can be subject to claims for its wrongful acts
• Must provide reparation for breaches`,
    tier: 'premium'
  },
  {
    id: 'intl-dispute-settlement',
    title: 'Chapter VI: Peaceful Settlement of International Disputes',
    description: 'Methods for resolving disputes without use of force',
    pdfSource: 'book_1.pdf',
    content: `States must settle disputes by peaceful means (UN Charter obligation).

Methods of Settlement:

1. Negotiation
   • Direct discussions between parties
   • Most common method
   • Flexible and confidential
   • No third party involved

2. Mediation
   • Third party facilitates negotiations
   • Mediator suggests solutions
   • Non-binding
   • Parties retain control

3. Conciliation
   • Commission investigates and proposes settlement
   • More formal than mediation
   • Recommendations non-binding
   • UN Model Rules provide framework

4. Arbitration
   • Binding decision by arbitral tribunal
   • Parties choose arbitrators
   • Procedure agreed by parties
   • Permanent Court of Arbitration provides services
   • Model Rules on Arbitral Procedure available

5. Judicial Settlement
   • International Court of Justice (ICJ)
   • Binding judgments
   • Requires consent to jurisdiction
   • Can be through:
     - Special agreement (compromis)
     - Optional clause declaration
     - Treaty provision
     - Forum prorogatum (tacit consent)

6. Regional Mechanisms
   • African Court on Human and Peoples' Rights
   • Regional economic community courts
   • Specialized tribunals

Principles:
• Manila Declaration on Peaceful Settlement (1982)
• States should negotiate in good faith
• Should consider using multiple methods
• Should not allow disputes to endanger peace

Institutional Support:
• UN Secretary-General can offer good offices
• Security Council can recommend methods
• General Assembly can make recommendations
• Regional organizations can assist

South Sudan:
• Should use peaceful means for all disputes
• Can bring cases to ICJ (with consent)
• Can use regional mechanisms
• Can negotiate directly with other states
• Should avoid threat or use of force`,
    tier: 'premium'
  },
  {
    id: 'intl-peace-security',
    title: 'Chapter VII: International Peace and Security',
    description: 'UN Security Council, use of force, and maintaining peace',
    pdfSource: 'book_1.pdf',
    content: `Maintaining international peace and security is primary UN purpose.

UN Security Council:
• 15 members: 5 permanent (P5) + 10 elected
• Primary responsibility for peace and security
• Can make binding decisions
• Can authorize use of force
• Can impose sanctions

Prohibition of Use of Force:
• UN Charter Article 2(4): Prohibits threat or use of force
• Exception: Self-defense (Article 51)
• Exception: UN Security Council authorization

Self-Defense:
• Individual self-defense
• Collective self-defense
• Must be necessary and proportional
• Must report to Security Council
• Can be anticipatory if attack imminent

Security Council Actions:
1. Recommendations
2. Binding decisions
3. Sanctions (economic, travel, arms)
4. Authorization of use of force
5. Peacekeeping operations
6. Peace enforcement

Uniting for Peace Resolution:
• If Security Council deadlocked, General Assembly can act
• Emergency special sessions
• Can make recommendations for collective measures

Definition of Aggression:
• Use of armed force against sovereignty, territorial integrity, or political independence
• First use of force is prima facie evidence of aggression
• Includes: invasion, bombardment, blockade, attack on forces, violation of agreements

Friendly Relations Declaration:
• Principles of international law concerning friendly relations
• Sovereign equality
• Non-intervention
• Peaceful settlement
• Cooperation
• Equal rights and self-determination
• Good faith fulfillment of obligations

Prevention of Disputes:
• Early warning systems
• Preventive diplomacy
• Confidence-building measures
• Disarmament
• Development

South Sudan:
• Subject to Security Council decisions
• Must refrain from use of force
• Can exercise self-defense if attacked
• Can participate in peacekeeping
• Should settle disputes peacefully`,
    tier: 'premium'
  },
  {
    id: 'intl-human-rights',
    title: 'Chapter VIII: International Human Rights Law',
    description: 'Core human rights instruments and protection mechanisms',
    pdfSource: 'book_1.pdf',
    content: `International human rights law protects fundamental rights of all persons.

Core Instruments:

1. Universal Declaration of Human Rights (1948)
   • Not legally binding but authoritative
   • Foundation of international human rights law
   • Civil, political, economic, social, cultural rights

2. International Covenant on Civil and Political Rights (ICCPR)
   • Legally binding
   • Civil and political rights
   • Human Rights Committee monitors
   • Optional Protocol allows individual complaints

3. International Covenant on Economic, Social and Cultural Rights (ICESCR)
   • Legally binding
   • Economic, social, cultural rights
   • Progressive realization
   • Committee on Economic, Social and Cultural Rights monitors

4. Convention on Elimination of Racial Discrimination
   • Prohibits racial discrimination
   • Committee on Elimination of Racial Discrimination

5. Convention on Elimination of Discrimination Against Women (CEDAW)
   • Women's rights
   • CEDAW Committee monitors

6. Convention Against Torture
   • Prohibits torture absolutely
   • Committee Against Torture monitors
   • Optional Protocol establishes preventive visits

Implementation:
• State reporting
• Individual complaints (where applicable)
• Inquiry procedures
• Inter-state complaints
• Universal Periodic Review (UN Human Rights Council)

Regional Systems:
• African Charter on Human and Peoples' Rights
• African Commission on Human and Peoples' Rights
• African Court on Human and Peoples' Rights

Key Principles:
• Universality - Rights apply to all
• Indivisibility - All rights equally important
• Interdependence - Rights interconnected
• Non-discrimination
• State obligations: Respect, protect, fulfill

South Sudan:
• Party to core human rights treaties
• Must submit periodic reports
• Must implement rights domestically
• Can be subject to complaints
• Should cooperate with monitoring bodies`,
    tier: 'premium'
  },
  {
    id: 'intl-migration-refugees',
    title: 'Chapter IX: Movement of Persons and International Migration Law',
    description: 'Refugee law, statelessness, internally displaced persons, and migrant workers',
    pdfSource: 'book_1.pdf',
    content: `International law governs movement of persons across borders.

Refugees:
• 1951 Convention Relating to Status of Refugees
• 1967 Protocol
• Definition: Well-founded fear of persecution
• Grounds: Race, religion, nationality, political opinion, membership in particular social group
• Non-refoulement: Cannot return to country of persecution
• Rights: Work, education, movement, documentation
• UNHCR provides protection and assistance

Statelessness:
• 1954 Convention on Status of Stateless Persons
• 1961 Convention on Reduction of Statelessness
• Stateless person: Not recognized as national by any state
• Rights similar to refugees
• States should grant nationality to prevent statelessness

Internally Displaced Persons (IDPs):
• Guiding Principles on Internal Displacement
• Persons forced to flee but remain in own country
• Not covered by refugee law (no cross-border)
• Protection during displacement
• Right to return, resettlement, or local integration
• Special protection needs

Migrant Workers:
• International Convention on Protection of Rights of All Migrant Workers and Members of Their Families
• Rights of migrant workers and families
• Regular and irregular migrants
• Protection from exploitation
• Right to family unity
• Access to education, health

Key Principles:
• Human dignity
• Non-discrimination
• Family unity
• Best interests of child
• Protection from exploitation
• Right to seek asylum

South Sudan Context:
• Large numbers of refugees (from conflicts)
• Many IDPs (internal conflicts)
• South Sudanese refugees in neighboring countries
• Hosts refugees from other countries
• Must respect refugee and migrant rights
• Should prevent statelessness
• Should protect IDPs

Practical Application:
• Refugee status determination
• Asylum procedures
• Documentation
• Integration or return
• Protection from refoulement
• Access to services`,
    tier: 'premium'
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

