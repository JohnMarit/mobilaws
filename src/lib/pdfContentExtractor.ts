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
   tier: 'free' | 'basic' | 'standard' | 'premium';
}

export interface ExtractedModule {
   id: string;
   title: string;
   description: string;
   topics: LegalTopic[];
   tier: 'free' | 'basic' | 'standard' | 'premium';
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
      id: 'const-supremacy',
      title: 'The Supremacy of the Constitution',
      description: 'Why the Constitution is the highest law of the land',
      pdfSource: 'south sudan laws.pdf',
      content: `The Constitution is the supreme law of South Sudan. This means:

What "Supreme Law" Means:
• All other laws must follow the Constitution
• If a law contradicts the Constitution, it is invalid
• Courts can strike down unconstitutional laws
• Government actions must comply with the Constitution

Hierarchy of Laws:
1. Constitution (highest)
2. Acts of Parliament
3. Presidential decrees
4. Regulations and bylaws
5. Customary law (where not conflicting)

Real-World Example:
If Parliament passes a law that violates your freedom of speech, courts can declare that law unconstitutional and invalid.

Key Principle: No one is above the Constitution - not the President, Parliament, or Courts.`,
      tier: 'free'
   },
   {
      id: 'const-sovereignty',
      title: 'Sovereignty and the People',
      description: 'Understanding that power belongs to the people',
      pdfSource: 'south sudan laws.pdf',
      content: `In South Sudan, sovereignty belongs to the people. But what does this mean?

Sovereignty Explained:
• Sovereignty = supreme power and authority
• In South Sudan, this power belongs to YOU and all citizens
• Government officials are servants of the people, not masters

How People Exercise Sovereignty:
1. Voting in Elections
   - Choose President, MPs, Governors
   - Vote in referendums on important issues

2. Through Representatives
   - Elected officials act on your behalf
   - They must answer to you

3. Participating in Democracy
   - Freedom to speak and criticize government
   - Right to peaceful assembly and protest
   - Right to petition government

Important Reminder:
Government gets its power FROM the people. Officials work FOR you, not the other way around.

Your Voice Matters:
Every citizen has equal say in how the country is governed, regardless of tribe, region, or wealth.`,
      tier: 'free'
   },
   {
      id: 'const-bill-of-rights',
      title: 'The Bill of Rights - Overview',
      description: 'Introduction to your fundamental rights and freedoms',
      pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
      content: `The Bill of Rights is Part Two of the Constitution. It protects your fundamental freedoms.

What is the Bill of Rights?
• A list of rights that belong to every person in South Sudan
• These rights cannot be taken away by government
• Courts protect these rights

Categories of Rights:

1. Personal Rights
   - Right to life
   - Human dignity
   - Personal liberty
   - Privacy

2. Political Rights
   - Right to vote
   - Freedom of expression
   - Freedom of assembly
   - Right to form political parties

3. Legal Rights
   - Fair trial
   - Presumption of innocence
   - Right to a lawyer
   - Protection from arbitrary arrest

4. Economic and Social Rights
   - Education
   - Health care
   - Work and fair wages
   - Property ownership

Who Has These Rights?
EVERYONE in South Sudan - citizens, residents, refugees, children, adults, men, women.

Can Rights Be Limited?
Yes, but only:
• When necessary for public safety or health
• When protecting rights of others
• As specifically allowed by Constitution
• Through proper legal process

Remember: These are YOUR rights. Know them, use them, protect them!`,
      tier: 'free'
   },
   {
      id: 'const-freedom-expression',
      title: 'Freedom of Expression and Assembly',
      description: 'Your right to speak freely and gather peacefully',
      pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
      content: `The Constitution protects your freedom to express yourself and gather with others.

Freedom of Expression Includes:
• Speaking your mind
• Writing and publishing
• Artistic expression
• Media and journalism
• Peaceful protest
• Criticizing government

What You Can Do:
✓ Express political opinions
✓ Criticize government policies
✓ Share ideas and information
✓ Practice journalism
✓ Create art, music, literature
✓ Use social media

Freedom of Assembly Means:
• Right to peaceful gatherings
• Right to protest and demonstrate
• Right to form associations
• Right to join organizations
• Right to attend public meetings

Peaceful Assembly Examples:
• Political rallies
• Community meetings
• Religious gatherings
• Cultural celebrations
• Protest marches
• Trade union meetings

Important Limits:
Your freedom ends where it:
• Incites violence
• Threatens national security
• Violates others' rights
• Spreads hate speech
• Causes public disorder

Peaceful vs. Violent:
✓ Peaceful: Allowed and protected
✗ Violent: Not protected, can be stopped

Your Rights in Practice:
• You can criticize the President or government
• You can organize peaceful protests
• You can form groups to advocate for change
• Police cannot stop peaceful assemblies without legal reason

Remember: These freedoms are the foundation of democracy!`,
      tier: 'free'
   },
   {
      id: 'const-life-dignity',
      title: 'Right to Life and Human Dignity',
      description: 'The most fundamental rights - life and dignity',
      pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
      content: `The right to life and human dignity are the most basic and important rights.

Right to Life:
• Every person has the right to life
• Government must protect your life
• No one can arbitrarily take your life
• Death penalty only for most serious crimes (if at all)

What This Means:
• Police cannot kill you without justification
• Government must provide security
• You have right to defend yourself
• State must investigate killings

Right to Human Dignity:
• Every person has inherent worth and value
• You must be treated with respect
• No one can degrade or humiliate you
• Your dignity cannot be taken away

Violations of Dignity Include:
✗ Torture
✗ Cruel, inhuman, or degrading treatment
✗ Slavery or forced labor
✗ Human trafficking
✗ Public humiliation
✗ Discrimination

Protection from Torture:
• Torture is absolutely prohibited
• No exceptions - even in emergencies
• Physical and psychological torture both banned
• Confessions obtained by torture are invalid

If Arrested:
You have the right to:
• Be treated humanely
• Not be tortured or beaten
• Humane detention conditions
• Medical care if needed
• Contact family and lawyer

Remember:
Your life and dignity are sacred. No government official, no matter how powerful, can violate these rights.

What to Do if Violated:
1. Document the violation
2. Seek medical attention if needed
3. Report to police (if safe)
4. Contact human rights organizations
5. Consider legal action`,
      tier: 'free'
   },
   {
      id: 'const-economic-social',
      title: 'Economic and Social Rights',
      description: 'Rights to education, health, work, and property',
      pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
      content: `The Constitution protects your economic and social rights - rights that help you live a good life.

Right to Education:
• Every child has right to free primary education
• Education should be accessible to all
• Parents can choose type of education
• Government must provide schools

What This Means:
• Primary school should be free
• No child denied education due to poverty
• Girls and boys have equal right to education
• Special needs children have right to education

Right to Health Care:
• Access to basic health services
• Emergency medical treatment
• Reproductive health care
• Protection from health hazards

Government's Duty:
• Provide health facilities
• Train health workers
• Ensure medicines available
• Prevent disease outbreaks

Right to Work:
• Right to choose your occupation
• Fair wages for work done
• Safe working conditions
• Form and join trade unions
• Strike for better conditions

Worker Protections:
• No forced labor
• No child labor (under 14 years)
• Equal pay for equal work
• Protection from unfair dismissal
• Maternity leave for women

Right to Property:
• Own property (land, houses, businesses)
• Inherit property
• Protection from unlawful seizure
• Fair compensation if government takes property

Property Rights Include:
• Buy and sell property
• Use property as you wish
• Pass property to children
• Rent or lease property

Important Notes:
• These rights are "progressive" - government implements gradually
• Depends on available resources
• But government must show progress
• Cannot go backwards

Your Rights in Action:
• Demand quality education for your children
• Seek health care at government facilities
• Report unsafe working conditions
• Protect your property from illegal seizure

Remember: These rights help ensure everyone can live with dignity and opportunity!`,
      tier: 'free'
   },
   {
      id: 'const-equality',
      title: 'Equality and Non-Discrimination',
      description: 'Everyone is equal before the law',
      pdfSource: 'Private Law Fundamental Rights and the Rule of Law.pdf',
      content: `The Constitution guarantees equality for all people in South Sudan.

Equality Before the Law:
• All persons are equal before the law
• Everyone entitled to equal protection
• No one is above the law
• Same rules apply to everyone

What Equality Means:
• Rich and poor treated equally
• Men and women have equal rights
• All tribes and ethnic groups equal
• All religions treated equally
• Government officials not special

Prohibited Discrimination:
You cannot be discriminated against based on:
• Race or ethnicity
• Tribe or clan
• Gender (male/female)
• Religion or belief
• Language
• Social or economic status
• Disability
• Place of birth
• Political opinion

Examples of Discrimination:
✗ Refusing job because of tribe
✗ Denying service because of religion
✗ Paying women less for same work
✗ Excluding people with disabilities
✗ Favoring one region over another

Gender Equality:
• Women and men have equal rights
• Equal access to education
• Equal employment opportunities
• Equal political participation
• Equal property rights
• Protection from gender-based violence

Special Measures:
• Affirmative action is allowed
• To help disadvantaged groups
• Temporary measures to achieve equality
• Examples: quotas for women in Parliament

Your Rights:
• Challenge discriminatory laws
• Report discrimination to authorities
• Seek legal remedies
• Join advocacy groups

What to Do if Discriminated Against:
1. Document the incident
2. Gather witnesses
3. Report to relevant authority
4. Consider legal action
5. Contact human rights groups

Remember: Equality is not just a principle - it's your constitutional right!`,
      tier: 'free'
   },
   {
      id: 'const-three-branches',
      title: 'The Three Branches of Government',
      description: 'Executive, Legislative, and Judicial branches explained',
      pdfSource: 'south sudan laws.pdf',
      content: `South Sudan's government is divided into three separate branches. This is called "separation of powers."

Why Three Branches?
• Prevents concentration of power
• Each branch checks the others
• Protects against dictatorship
• Ensures accountability

1. EXECUTIVE BRANCH (Makes Decisions)

Who:
• President (Head of State and Government)
• Vice Presidents
• Ministers (Cabinet)
• Civil servants

What They Do:
• Implement laws
• Run government departments
• Conduct foreign policy
• Command armed forces
• Propose new laws

Example:
President decides to build new hospitals, Ministers of Health make it happen.

2. LEGISLATIVE BRANCH (Makes Laws)

Who:
• National Legislature (Parliament)
  - National Assembly (lower house)
  - Council of States (upper house)
• Members of Parliament (MPs)

What They Do:
• Pass new laws
• Amend existing laws
• Approve national budget
• Oversee government
• Represent the people

Example:
Parliament debates and passes a new education law.

3. JUDICIAL BRANCH (Interprets Laws)

Who:
• Supreme Court (highest court)
• Court of Appeal
• High Courts
• County Courts
• Other specialized courts

What They Do:
• Interpret Constitution and laws
• Settle disputes
• Protect rights
• Review government actions
• Ensure justice

Example:
Court decides if a government action violates the Constitution.

How They Check Each Other:

Executive checks Legislature:
• President can veto laws
• Propose legislation

Legislature checks Executive:
• Approve or reject laws
• Control budget
• Impeach President

Judiciary checks Both:
• Declare laws unconstitutional
• Review government actions
• Protect individual rights

Legislature checks Judiciary:
• Approve judicial appointments
• Set court budgets

Why This Matters to You:
• No single person or group has all power
• Your rights are protected
• Government remains accountable
• Democracy is preserved

Remember: This system of checks and balances protects YOUR freedom!`,
      tier: 'free'
   },
   {
      id: 'const-how-laws-made',
      title: 'How Laws Are Made',
      description: 'The legislative process from bill to law',
      pdfSource: 'south sudan laws.pdf',
      content: `Ever wondered how a law is created? Here's the step-by-step process:

Step 1: IDEA FOR A LAW (Bill)
• Anyone can suggest a law
• Usually comes from:
  - Government ministers
  - Members of Parliament
  - Citizens (through MPs)
  - Civil society groups

Step 2: DRAFTING THE BILL
• Legal experts write the proposed law
• Must be clear and precise
• Checked for constitutionality
• Formatted properly

Step 3: FIRST READING
• Bill introduced in Parliament
• Title and purpose read aloud
• No debate yet
• MPs receive copies to study

Step 4: SECOND READING
• Main debate happens here
• MPs discuss:
  - Is this law needed?
  - Will it work?
  - What are the costs?
  - Who will it affect?
• Vote on general principles
• If rejected, bill dies

Step 5: COMMITTEE STAGE
• Specialized committee examines bill
• Goes through line by line
• Hears from experts
• Public can give input
• Amendments proposed
• Detailed scrutiny

Step 6: REPORT STAGE
• Committee reports back to Parliament
• Presents amendments
• Further debate and changes
• MPs vote on amendments

Step 7: THIRD READING
• Final debate
• No new amendments
• Vote on entire bill
• If passed, goes to other house (Council of States)

Step 8: OTHER HOUSE
• Same process repeated
• Can accept, amend, or reject
• If amended, goes back to first house
• Both houses must agree

Step 9: PRESIDENTIAL ASSENT
• President reviews the bill
• Can either:
  ✓ Sign it (becomes law)
  ✗ Veto it (send back to Parliament)
  ⏸ Do nothing (becomes law after 30 days)

Step 10: PUBLICATION
• Law published in official gazette
• Becomes effective on specified date
• Public can now access it

How Long Does It Take?
• Simple laws: Few months
• Complex laws: Can take years
• Urgent laws: Can be fast-tracked

Can Citizens Participate?
YES!
• Submit petitions to MPs
• Testify before committees
• Join public consultations
• Lobby your representatives
• Attend parliamentary sessions

Example: Education Law
1. Minister of Education proposes new education law
2. Bill drafted by legal team
3. Introduced in National Assembly
4. Debated - some MPs want changes
5. Education Committee reviews details
6. Amendments made (e.g., free primary school)
7. Final vote - passed!
8. Council of States reviews and passes
9. President signs
10. Published - now it's law!

Remember: Laws affect YOUR life. Stay informed and participate in the process!`,
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
      id: 'intl-treaties-basic',
      title: 'Understanding Treaties - The Basics',
      description: 'What are treaties and why do they matter?',
      pdfSource: 'book_1.pdf',
      content: `A treaty is like a contract between countries. Just as you might sign a contract when renting a house, countries sign treaties to make agreements with each other.

What Are Treaties?
• Written agreements between countries
• Legally binding (countries must follow them)
• Cover many topics: peace, trade, human rights, environment
• Can be between two countries (bilateral) or many countries (multilateral)

How Treaties Work:
1. Countries negotiate (discuss and agree on terms)
2. Countries sign (show they agree)
3. Countries ratify (officially accept - like Parliament approving)
4. Treaty enters into force (becomes active and binding)

Key Principle - Pacta Sunt Servanda:
This Latin phrase means "agreements must be kept." Once a country signs and ratifies a treaty, it MUST follow it in good faith.

South Sudan's Treaties:
When South Sudan became independent in 2011, it joined many important treaties:
• UN Charter (joining the United Nations)
• African Charter on Human and Peoples' Rights
• Geneva Conventions (protecting people during war)
• Convention on the Rights of the Child

Why Treaties Matter to YOU:
• Protect your human rights
• Ensure peace and security
• Enable trade and economic development
• Protect the environment
• Allow you to travel abroad

Real-World Example:
South Sudan signed the Convention on the Rights of the Child. This means the government MUST protect children's rights to education, health care, and protection from harm. If they don't, they're breaking international law.

Remember: Treaties aren't just for governments - they protect YOUR rights too!`,
      tier: 'free'
   },
   {
      id: 'intl-un-basics',
      title: 'The United Nations - Your Global Organization',
      description: 'Understanding the UN and how it keeps peace',
      pdfSource: 'book_1.pdf',
      content: `The United Nations (UN) is like a big meeting place where all countries come together to solve global problems.

What is the UN?
• International organization with 193 member countries
• Founded in 1945 after World War II
• Headquarters in New York City
• South Sudan joined on July 14, 2011

Main Goals of the UN:
1. Maintain peace and security
2. Protect human rights
3. Deliver humanitarian aid
4. Promote sustainable development
5. Uphold international law

The 6 Main Parts of the UN:

1. GENERAL ASSEMBLY
• All 193 countries have a seat
• Each country gets ONE vote (big or small, equal voice!)
• Discusses global issues
• Makes recommendations (but can't force countries)

2. SECURITY COUNCIL
• 15 members total
• 5 permanent members (USA, UK, France, Russia, China) with veto power
• 10 rotating members elected for 2 years
• Can authorize military action
• Maintains international peace

3. SECRETARIAT
• The UN's staff and administration
• Led by the Secretary-General
• Implements decisions
• Runs day-to-day operations

4. INTERNATIONAL COURT OF JUSTICE (ICJ)
• The UN's main court
• Located in The Hague, Netherlands
• Settles disputes between countries
• 15 judges from different countries

5. ECONOMIC AND SOCIAL COUNCIL
• Coordinates economic and social work
• Works with specialized agencies
• Promotes development and human rights

6. TRUSTEESHIP COUNCIL
• Helped territories become independent
• Largely inactive now (mission accomplished!)

How the UN Helps South Sudan:
• Peacekeeping missions (UNMISS)
• Humanitarian aid during conflicts
• Development programs
• Protection of civilians
• Support for democracy and governance

UN Specialized Agencies That Help You:
• WHO (World Health Organization) - fights diseases
• UNICEF - protects children
• UNESCO - promotes education and culture
• WFP (World Food Programme) - fights hunger
• UNHCR - protects refugees

Your Rights at the UN:
• Every country, including South Sudan, has equal voice
• UN protects human rights globally
• You can petition UN human rights bodies if your rights are violated

Real-World Example:
When conflict erupted in South Sudan in 2013, the UN Security Council authorized UNMISS (UN Mission in South Sudan) to protect civilians. UN peacekeepers helped save thousands of lives.

Remember: The UN exists to serve ALL people, including YOU!`,
      tier: 'free'
   },
   {
      id: 'intl-sovereignty-basics',
      title: 'State Sovereignty - What It Means',
      description: 'Understanding sovereignty and independence',
      pdfSource: 'book_1.pdf',
      content: `Sovereignty means a country is independent and makes its own decisions. No other country can tell it what to do.

What is Sovereignty?
• Supreme authority within a territory
• Right to govern yourself
• Independence from outside control
• Equality with all other countries

The Four Elements of a State:
For a country to exist in international law, it needs:
1. PERMANENT POPULATION
   • People who live there
   • Doesn't matter how many

2. DEFINED TERRITORY
   • Clear borders
   • Doesn't have to be perfect (border disputes happen)

3. GOVERNMENT
   • Effective control over territory
   • Ability to maintain order

4. CAPACITY TO ENTER RELATIONS
   • Ability to sign treaties
   • Ability to join international organizations
   • Independence from other states

South Sudan's Sovereignty:
• Gained independence July 9, 2011
• Recognized by 193 countries
• Joined UN on July 14, 2011
• Has all four elements of statehood

Rights of Sovereign States:
• Make own laws
• Control own territory
• Choose own government system
• Enter into treaties
• Join international organizations
• Defend themselves
• Manage own economy

Duties of Sovereign States:
• Respect other states' sovereignty
• Don't interfere in other countries' internal affairs
• Settle disputes peacefully
• Follow international law
• Respect human rights
• Fulfill treaty obligations

Sovereignty vs. International Law:
Countries are sovereign BUT they must still follow international law. Think of it like this:
• You're free to do what you want in your house (sovereignty)
• But you still must follow the law (international law)

Limits on Sovereignty:
Sovereignty is NOT absolute. Countries cannot:
• Commit genocide
• Use chemical weapons
• Invade other countries
• Violate fundamental human rights
• Break treaties they've signed

Recognition of States:
• Other countries decide whether to recognize a new state
• Recognition is political, not legal requirement
• South Sudan was quickly recognized by most countries
• Some disputed territories lack recognition (e.g., Somaliland)

Why Sovereignty Matters to YOU:
• Your government makes laws that affect you
• South Sudan controls its own resources
• Your rights are protected by South Sudanese law
• You're a citizen of a sovereign nation

Real-World Example:
When South Sudan became independent, it gained sovereignty. This means:
• Sudan cannot tell South Sudan what to do
• South Sudan controls its own oil resources
• South Sudan makes its own laws
• South Sudan has its own seat at the UN

Remember: Sovereignty means South Sudan is FREE and EQUAL to all other nations!`,
      tier: 'free'
   },
   {
      id: 'intl-human-rights-basics',
      title: 'International Human Rights - Your Global Protection',
      description: 'How international law protects your rights',
      pdfSource: 'book_1.pdf',
      content: `International human rights law protects EVERYONE, everywhere in the world. These are rights you have simply because you're human.

What Are Human Rights?
• Rights you have just for being human
• Cannot be taken away
• Apply to everyone equally
• Protected by international law

The Universal Declaration of Human Rights (UDHR):
• Adopted by UN in 1948
• Lists 30 fundamental rights
• Not a treaty, but very influential
• Foundation for all human rights law

Your Basic Rights Under International Law:

CIVIL AND POLITICAL RIGHTS:
• Right to life
• Freedom from torture
• Freedom from slavery
• Right to fair trial
• Freedom of speech
• Freedom of religion
• Right to vote
• Freedom of assembly

ECONOMIC, SOCIAL, AND CULTURAL RIGHTS:
• Right to education
• Right to health care
• Right to work
• Right to fair wages
• Right to food and water
• Right to housing
• Right to participate in culture

Key International Human Rights Treaties:

1. ICCPR (International Covenant on Civil and Political Rights)
   • Protects civil and political rights
   • South Sudan should ratify this

2. ICESCR (International Covenant on Economic, Social and Cultural Rights)
   • Protects economic and social rights
   • Progressive realization (governments work toward these)

3. Convention on the Rights of the Child
   • Protects children's rights
   • Nearly every country has ratified it

4. Convention Against Torture
   • Absolutely prohibits torture
   • No exceptions, ever

5. Convention on Elimination of Discrimination Against Women (CEDAW)
   • Protects women's rights
   • Promotes gender equality

African Charter on Human and Peoples' Rights:
• Regional human rights treaty for Africa
• South Sudan is a party
• Protects individual AND group rights
• Includes right to development

How International Human Rights Law Works:

1. Countries Sign Treaties
   • Agree to protect rights

2. Countries Report Progress
   • Submit reports to UN committees
   • Explain how they're protecting rights

3. Individuals Can Complain
   • If your rights are violated
   • Can petition international bodies
   • African Court on Human Rights
   • UN Human Rights Committee

4. International Pressure
   • Countries monitor each other
   • NGOs report violations
   • Media attention
   • Sanctions for serious violations

Your Rights in South Sudan:
South Sudan's Constitution protects many rights, AND South Sudan must follow international human rights law:
• Bill of Rights in Constitution
• African Charter obligations
• Customary international law

What If Your Rights Are Violated?

Domestic Remedies:
1. Go to South Sudan courts first
2. Constitutional Court for rights violations
3. Exhaust all local options

International Remedies:
1. African Commission on Human and Peoples' Rights
   • Can file complaint
   • Commission investigates
   • Makes recommendations

2. African Court on Human and Peoples' Rights
   • Can take cases to court
   • Binding decisions

3. UN Human Rights Council
   • Universal Periodic Review
   • Special Rapporteurs investigate
   • Public pressure

Real-World Examples:

Example 1: Right to Education
International law says children have right to free primary education. If South Sudan doesn't provide this, it's violating international law.

Example 2: Freedom from Torture
If police torture a suspect, they're violating:
• South Sudan Constitution
• Convention Against Torture
• African Charter
• Customary international law

Example 3: Women's Rights
If women are denied equal property rights, it violates CEDAW and the African Charter.

Why International Human Rights Matter:
• Extra protection beyond national law
• International community watches
• Pressure on governments
• Universal standards
• Protection even if national law fails

Remember: Your human rights are UNIVERSAL - they apply everywhere, always, for everyone!`,
      tier: 'free'
   },
   {
      id: 'intl-diplomatic-basics',
      title: 'Diplomats and Embassies - How Countries Talk',
      description: 'Understanding diplomatic relations and embassies',
      pdfSource: 'book_1.pdf',
      content: `Diplomats are like messengers between countries. They help countries communicate, negotiate, and maintain friendly relations.

What is Diplomacy?
• How countries communicate with each other
• Peaceful way to solve problems
• Building relationships between nations
• Negotiating treaties and agreements

Who Are Diplomats?
• Government officials representing their country abroad
• Work in embassies and consulates
• Protected by special rules (diplomatic immunity)
• Examples: Ambassadors, consuls, embassy staff

Embassies vs. Consulates:

EMBASSY:
• Located in capital city
• Represents country to government
• Led by Ambassador
• Handles political relations
• Example: South Sudan Embassy in Nairobi, Kenya

CONSULATE:
• Located in major cities (not capital)
• Helps citizens abroad
• Issues visas and passports
• Led by Consul
• Example: Consulate in Kampala, Uganda

What Diplomats Do:

1. REPRESENT THEIR COUNTRY
   • Speak for their government
   • Attend official events
   • Promote their country's interests

2. NEGOTIATE
   • Discuss treaties
   • Solve disputes
   • Make agreements

3. PROTECT CITIZENS
   • Help citizens in trouble abroad
   • Issue emergency passports
   • Visit citizens in jail
   • Provide assistance

4. REPORT INFORMATION
   • Tell their government what's happening
   • Analyze political situations
   • Provide advice

5. PROMOTE RELATIONS
   • Cultural exchanges
   • Trade promotion
   • Educational programs

Diplomatic Immunity - Special Protection:

Why Diplomats Need Protection:
• Can do their job without fear
• Cannot be arrested or prosecuted
• Ensures free communication
• Prevents host country from pressuring them

What Diplomatic Immunity Means:
• Cannot be arrested
• Cannot be prosecuted
• Cannot be sued (usually)
• Embassy buildings are inviolable (cannot be entered)
• Diplomatic bags cannot be opened
• Exempt from taxes

Limits on Immunity:
• Must respect laws of host country
• Cannot engage in business
• Cannot interfere in internal affairs
• Can be declared "persona non grata" (unwelcome) and expelled

Vienna Convention on Diplomatic Relations (1961):
• International treaty governing diplomacy
• Nearly every country follows it
• Protects diplomats worldwide
• South Sudan follows these rules

How Embassies Help YOU:

If You're Abroad:
• Lost passport? Embassy can issue new one
• Arrested? Embassy can visit you and help
• Natural disaster? Embassy can evacuate you
• Need legal help? Embassy can advise
• Medical emergency? Embassy can assist

If You're in South Sudan:
• Need visa to travel? Go to that country's embassy
• Want to study abroad? Embassy has information
• Business opportunities? Embassy can connect you

South Sudan's Diplomatic Missions:
South Sudan has embassies and consulates in:
• Kenya (Nairobi) - very important
• Uganda (Kampala)
• Ethiopia (Addis Ababa)
• Egypt (Cairo)
• USA (Washington DC)
• UK (London)
• And many more

Foreign Embassies in South Sudan:
Many countries have embassies in Juba:
• United States
• United Kingdom
• Kenya
• Uganda
• Ethiopia
• China
• And many more

Consular Services You Can Use:

FOR SOUTH SUDANESE ABROAD:
• Passport renewal
• Birth registration
• Notarization of documents
• Emergency assistance
• Voting in elections (sometimes)

FOR FOREIGNERS IN SOUTH SUDAN:
• Visa applications
• Passport services
• Assistance if in trouble
• Notarization

Real-World Examples:

Example 1: Emergency Evacuation
When fighting broke out in Juba in 2016, foreign embassies evacuated their citizens. The US Embassy helped American citizens leave safely.

Example 2: Consular Assistance
A South Sudanese student in Kenya loses their passport. They go to the South Sudan Embassy in Nairobi, which issues an emergency travel document.

Example 3: Diplomatic Negotiation
South Sudan and Sudan negotiate oil agreements. Diplomats from both countries meet to discuss terms and reach agreement.

Important Terms:

• Ambassador: Top diplomat, represents country
• Chargé d'Affaires: Temporary head when no ambassador
• Diplomatic Note: Official written communication
• Persona Non Grata: Unwelcome person, must leave
• Diplomatic Bag: Cannot be opened, for official documents
• Exequatur: Permission for consul to operate

Remember: Diplomats help countries work together peacefully. If you're ever in trouble abroad, your embassy is there to help!`,
      tier: 'free'
   },
   {
      id: 'intl-peacekeeping-basics',
      title: 'UN Peacekeeping - Protecting People',
      description: 'How the UN keeps peace around the world',
      pdfSource: 'book_1.pdf',
      content: `UN Peacekeeping missions help countries recover from conflict and build lasting peace.

What is UN Peacekeeping?
• UN sends soldiers and police to conflict zones
• Protect civilians
• Support peace agreements
• Help countries rebuild
• Prevent return to war

The Blue Helmets:
• UN peacekeepers wear blue helmets or berets
• Come from many different countries
• Serve under UN command
• Impartial (don't take sides)

How Peacekeeping Works:

1. SECURITY COUNCIL AUTHORIZES
   • Decides peacekeeping mission is needed
   • Passes resolution
   • Sets mandate (what peacekeepers can do)

2. COUNTRIES CONTRIBUTE TROOPS
   • Volunteer to send soldiers
   • Provide equipment
   • UN coordinates

3. PEACEKEEPERS DEPLOY
   • Arrive in conflict zone
   • Set up bases
   • Begin operations

4. MISSION ENDS
   • When peace is stable
   • Security Council decides
   • Peacekeepers withdraw

What Peacekeepers Do:

PROTECT CIVILIANS:
• Guard camps for displaced people
• Patrol dangerous areas
• Respond to threats
• Create safe zones

SUPPORT PEACE AGREEMENTS:
• Monitor ceasefires
• Verify disarmament
• Observe elections
• Support government institutions

PROVIDE SECURITY:
• Protect humanitarian workers
• Secure key infrastructure
• Deter violence
• Maintain order

BUILD CAPACITY:
• Train local police
• Support justice system
• Promote human rights
• Help rebuild institutions

UNMISS - UN Mission in South Sudan:

Established: July 2011 (right after independence)

Mandate:
• Protect civilians
• Monitor human rights
• Support peace process
• Create conditions for development

What UNMISS Does in South Sudan:
• Protects civilians in Protection of Civilians (PoC) sites
• Patrols to deter violence
• Investigates human rights violations
• Supports humanitarian access
• Monitors ceasefire agreements
• Helps build government capacity

PoC Sites (Protection of Civilians):
• UN bases where civilians seek shelter
• Thousands of people live there
• Protected by UN peacekeepers
• Provide basic services
• Temporary solution until peace returns

Peacekeeping Principles:

1. CONSENT OF PARTIES
   • Host country must agree
   • Peacekeepers invited, not invaders

2. IMPARTIALITY
   • Don't take sides
   • Treat all parties fairly
   • Support peace, not any faction

3. NON-USE OF FORCE EXCEPT IN SELF-DEFENSE
   • Use force only to defend themselves
   • Or to protect civilians under imminent threat
   • Not an army of occupation

Challenges Peacekeepers Face:
• Difficult terrain
• Limited resources
• Complex conflicts
• Attacks on peacekeepers
• Political obstacles
• Lack of cooperation

Success Stories:

LIBERIA:
• UN peacekeeping helped end civil war
• Supported elections
• Trained police and army
• Liberia now stable

SIERRA LEONE:
• Peacekeepers ended brutal civil war
• Disarmed fighters
• Supported reconciliation
• Country now at peace

How Peacekeeping Helps YOU:
• Protects civilians from violence
• Creates space for peace
• Supports humanitarian aid delivery
• Helps rebuild your country
• Gives hope for better future

Criticisms and Limitations:
• Cannot solve political problems
• Sometimes fail to protect civilians
• Expensive
• Depend on political will
• Not always effective

Real-World Examples in South Sudan:

Example 1: PoC Sites
When violence erupted in 2013, tens of thousands fled to UN bases. UNMISS opened its gates and protected civilians. Many lives were saved.

Example 2: Humanitarian Escorts
UNMISS escorts aid convoys to remote areas, protecting humanitarian workers so they can deliver food and medicine.

Example 3: Human Rights Monitoring
UNMISS investigates reports of human rights violations and reports to the world, creating pressure for accountability.

Other UN Peacekeeping Missions:
• MONUSCO (Democratic Republic of Congo)
• MINUSMA (Mali)
• UNIFIL (Lebanon)
• UNFICYP (Cyprus)
• Many more around the world

How to Support Peacekeeping:
• Respect peacekeepers
• Report security threats to them
• Cooperate with investigations
• Support peace process
• Demand accountability from all sides

Remember: Peacekeepers risk their lives to protect civilians and build peace. They're here to help!`,
      tier: 'free'
   },
   {
      id: 'intl-refugees-basics',
      title: 'Refugees and International Protection',
      description: 'Understanding refugee rights and protection',
      pdfSource: 'book_1.pdf',
      content: `A refugee is someone who flees their country because of persecution, war, or violence. International law protects refugees.

Who is a Refugee?

1951 Refugee Convention Definition:
A person who:
• Is outside their country of nationality
• Has well-founded fear of persecution
• Because of race, religion, nationality, political opinion, or membership in particular social group
• Cannot or will not return home

Persecution Means:
• Serious harm or threat to life
• Systematic discrimination
• Torture or cruel treatment
• Denial of basic rights
• Threat of death

Refugees vs. Other Displaced People:

REFUGEE:
• Crossed international border
• Fleeing persecution
• Protected by international law
• Cannot be forced to return

INTERNALLY DISPLACED PERSON (IDP):
• Fled home but still in own country
• Not crossed border
• Protected by national law
• Less international protection

ASYLUM SEEKER:
• Applied for refugee status
• Waiting for decision
• Should not be returned while waiting

MIGRANT:
• Moves for economic reasons
• Voluntary movement
• Not fleeing persecution
• Different legal status

South Sudan's Refugee Situation:

South Sudanese Refugees:
• Over 2 million South Sudanese are refugees
• Fled to Uganda, Kenya, Ethiopia, Sudan
• Fleeing conflict and violence
• One of world's largest refugee crises

Refugees IN South Sudan:
• South Sudan also hosts refugees
• From Sudan, DRC, Ethiopia
• Fleeing conflicts in their countries
• Protected by South Sudan law

Refugee Rights Under International Law:

1. NON-REFOULEMENT (Most Important!)
   • Cannot be returned to danger
   • Cannot be sent back to persecution
   • Absolute prohibition
   • No exceptions

2. RIGHT TO ASYLUM
   • Right to seek safety in another country
   • Country must consider application fairly
   • Cannot be turned away at border

3. FREEDOM FROM DISCRIMINATION
   • Same rights as other foreigners
   • Equal treatment
   • No discrimination

4. RIGHT TO WORK
   • Ability to earn living
   • Support themselves
   • Contribute to host country

5. ACCESS TO EDUCATION
   • Children must go to school
   • Same as nationals
   • No discrimination

6. ACCESS TO COURTS
   • Can sue and be sued
   • Legal protection
   • Access to justice

7. FREEDOM OF MOVEMENT
   • Can move within host country
   • May have some restrictions
   • Cannot be confined

8. TRAVEL DOCUMENTS
   • Refugee travel document
   • Can travel internationally
   • Return to host country

Duties of Refugees:
• Respect laws of host country
• Don't engage in subversive activities
• Register with authorities
• Cooperate with officials

How Refugee Status is Determined:

1. ARRIVAL
   • Person crosses border
   • Seeks asylum

2. REGISTRATION
   • Register with authorities
   • Provide information
   • Get temporary protection

3. INTERVIEW
   • Tell your story
   • Explain why you fled
   • Provide evidence

4. DECISION
   • Authorities decide if you're refugee
   • Based on 1951 Convention definition
   • Can appeal if rejected

5. RECOGNITION
   • Granted refugee status
   • Receive protection
   • Get refugee ID

UNHCR - UN Refugee Agency:
• Protects refugees worldwide
• Provides assistance
• Monitors refugee rights
• Helps with resettlement
• Advocates for refugees

Durable Solutions for Refugees:

1. VOLUNTARY REPATRIATION
   • Return home when safe
   • UNHCR assists
   • Must be voluntary
   • Conditions must improve

2. LOCAL INTEGRATION
   • Settle permanently in host country
   • Become citizen eventually
   • Integrate into society
   • Build new life

3. RESETTLEMENT
   • Move to third country
   • Permanent solution
   • For vulnerable refugees
   • Limited spaces available

Refugee Camps:
• Temporary settlements
• Provide shelter, food, water
• Schools and health clinics
• Protection
• Not ideal, but necessary

Examples of Refugee Camps Hosting South Sudanese:
• Kakuma (Kenya) - huge camp
• Bidibidi (Uganda) - one of world's largest
• Gambella (Ethiopia)
• Yida (Sudan)

Challenges Refugees Face:
• Trauma from violence
• Separation from family
• Loss of home and property
• Difficulty finding work
• Language barriers
• Discrimination
• Uncertain future

How YOU Can Help Refugees:

IN SOUTH SUDAN:
• Welcome refugees
• Don't discriminate
• Share resources
• Promote integration
• Support refugee rights

IF YOU'RE A REFUGEE:
• Know your rights
• Register with UNHCR
• Access services
• Send children to school
• Follow host country laws
• Seek legal help if needed

Real-World Examples:

Example 1: South Sudanese in Uganda
Over 1 million South Sudanese fled to Uganda. Uganda has progressive refugee policy - refugees can work, move freely, and access services.

Example 2: Non-Refoulement
A South Sudanese refugee in Kenya fears returning home due to tribal violence. Kenya cannot force them to return - that would violate non-refoulement.

Example 3: Sudanese Refugees in South Sudan
Despite its own crisis, South Sudan hosts refugees from Sudan's conflicts. They have right to protection and assistance.

Important Terms:
• Asylum: Protection given by country
• Refoulement: Forced return (prohibited!)
• Stateless: Person with no nationality
• Resettlement: Moving to third country
• Repatriation: Returning home

Remember: Refugees are people like you who had to flee danger. They deserve protection, dignity, and hope for the future!`,
      tier: 'free'
   },
   {
      id: 'intl-dispute-basics',
      title: 'Peaceful Settlement of Disputes',
      description: 'How countries solve disagreements without war',
      pdfSource: 'book_1.pdf',
      content: `International law requires countries to settle disputes peacefully. War should be the last resort, not the first option.

Why Peaceful Settlement Matters:
• Prevents war and violence
• Saves lives
• Protects economies
• Maintains international order
• Required by UN Charter

UN Charter Article 2(3):
"All Members shall settle their international disputes by peaceful means in such a manner that international peace and security, and justice, are not endangered."

Methods of Peaceful Dispute Settlement:

1. NEGOTIATION (Direct Talks)

What It Is:
• Countries talk directly to each other
• No third party involved
• Most common method
• Flexible and informal

How It Works:
• Diplomats meet
• Discuss the problem
• Propose solutions
• Reach agreement

Example:
South Sudan and Sudan negotiate oil transit fees. Their officials meet, discuss terms, and agree on price.

Advantages:
• Fast
• Confidential
• Flexible
• Countries control outcome

Disadvantages:
• Power imbalances
• May fail if positions too far apart
• No neutral party

2. MEDIATION (Third Party Helps)

What It Is:
• Neutral third party facilitates talks
• Mediator suggests solutions
• Parties decide whether to accept
• Non-binding

How It Works:
• Mediator meets with both sides
• Understands each position
• Proposes compromises
• Helps parties reach agreement

Example:
IGAD (Intergovernmental Authority on Development) mediated South Sudan peace talks. IGAD representatives helped parties negotiate.

Advantages:
• Neutral perspective
• Creative solutions
• Maintains relationships
• Flexible

Disadvantages:
• Depends on mediator's skill
• Parties may not accept suggestions
• Can be slow

3. CONCILIATION (Formal Investigation)

What It Is:
• Commission investigates dispute
• Produces report with recommendations
• More formal than mediation
• Non-binding

How It Works:
• Parties agree to conciliation
• Commission established
• Investigates facts
• Issues report with proposals
• Parties decide whether to accept

Advantages:
• Thorough investigation
• Expert analysis
• Formal process

Disadvantages:
• Time-consuming
• Expensive
• Recommendations not binding

4. ARBITRATION (Private Court)

What It Is:
• Parties choose arbitrators
• Arbitrators hear evidence
• Issue binding decision
• Like private court

How It Works:
• Parties agree to arbitration
• Select arbitrators
• Present cases
• Arbitrators decide
• Decision is binding

Example:
Eritrea and Ethiopia used arbitration to settle border dispute. Permanent Court of Arbitration issued binding decision.

Advantages:
• Binding decision
• Parties choose arbitrators
• Confidential
• Faster than court

Disadvantages:
• Expensive
• Less formal procedures
• Limited appeal options

5. JUDICIAL SETTLEMENT (International Court)

What It Is:
• International Court of Justice (ICJ)
• Hears cases between countries
• Issues binding judgments
• Most formal method

How It Works:
• Countries consent to ICJ jurisdiction
• File case
• Present arguments and evidence
• ICJ issues judgment
• Judgment is binding

Example:
Kenya and Somalia disputed maritime border. ICJ heard case and issued judgment defining border.

Advantages:
• Binding decision
• Prestigious court
• Clear legal reasoning
• Enforceable

Disadvantages:
• Slow (years)
• Expensive
• Requires consent
• Limited enforcement

The International Court of Justice (ICJ):

Location: The Hague, Netherlands
Judges: 15 judges from different countries
Cases: Only between countries (not individuals)
Jurisdiction: Only if countries consent

How Countries Can Consent:
• Special agreement for specific dispute
• Treaty provision
• Optional clause declaration
• Forum prorogatum (implied consent)

ICJ Judgments:
• Binding on parties
• Final (no appeal)
• Enforced by Security Council if needed

Regional Dispute Settlement:

African Union:
• African Court of Justice
• Mediation and conciliation
• Peace and Security Council

IGAD (East Africa):
• Mediation in regional conflicts
• Facilitated South Sudan peace talks

Use of Force - When is it Legal?

General Rule: PROHIBITED
UN Charter Article 2(4) prohibits threat or use of force

Exceptions:
1. SELF-DEFENSE (Article 51)
   • If attacked
   • Must be proportional
   • Must report to Security Council
   • Only until Security Council acts

2. SECURITY COUNCIL AUTHORIZATION
   • Chapter VII of UN Charter
   • Council determines threat to peace
   • Can authorize force

Everything Else is ILLEGAL!

South Sudan's Disputes:

Border Disputes with Sudan:
• Abyei area - disputed territory
• Oil-rich region
• Both claim it
• Negotiations ongoing
• Arbitration used for some issues

Oil Revenue Disputes:
• South Sudan's oil goes through Sudan
• Disputes over transit fees
• Negotiations and mediation used
• African Union involved

Internal Conflicts:
• Peace agreements
• Mediation by IGAD
• Monitoring mechanisms

Practical Steps for Peaceful Settlement:

Step 1: Identify the Dispute
• What's the disagreement?
• What are the facts?
• What does each side want?

Step 2: Choose a Method
• Negotiation first (usually)
• Mediation if negotiation fails
• Arbitration or court if needed

Step 3: Engage in Good Faith
• Be honest
• Be willing to compromise
• Respect the process

Step 4: Implement Agreement
• Follow through
• Monitor compliance
• Adjust if needed

Why This Matters to YOU:
• Peaceful settlement prevents war
• War destroys lives and economies
• Peaceful resolution allows development
• Your future depends on peace

Real-World Example:
Instead of fighting over Abyei, South Sudan and Sudan agreed to arbitration. The Permanent Court of Arbitration issued a decision defining the area. While not fully implemented, it prevented war.

Remember: Talking is ALWAYS better than fighting. International law provides many ways to solve disputes peacefully!`,
      tier: 'free'
   },
   {
      id: 'intl-organizations-basics',
      title: 'International Organizations - Working Together',
      description: 'Understanding regional and global organizations',
      pdfSource: 'book_1.pdf',
      content: `International organizations bring countries together to solve common problems. South Sudan is a member of many important organizations.

What Are International Organizations?
• Groups of countries working together
• Created by treaties
• Have specific purposes
• Examples: UN, African Union, World Bank

Why Countries Join:
• Solve problems together
• Share resources and knowledge
• Coordinate policies
• Promote peace and development
• Amplify their voice

Types of International Organizations:

UNIVERSAL ORGANIZATIONS:
• Open to all countries
• Global scope
• Example: United Nations

REGIONAL ORGANIZATIONS:
• Limited to specific region
• Address regional issues
• Example: African Union

SPECIALIZED ORGANIZATIONS:
• Focus on specific issue
• Technical expertise
• Example: World Health Organization

Key Organizations for South Sudan:

1. UNITED NATIONS (UN)

Joined: July 14, 2011
Membership: 193 countries

What It Does:
• Maintains peace and security
• Protects human rights
• Delivers humanitarian aid
• Promotes development
• Coordinates global action

Benefits for South Sudan:
• Peacekeeping mission (UNMISS)
• Humanitarian assistance
• Development programs
• International recognition
• Voice in global affairs

2. AFRICAN UNION (AU)

Joined: July 28, 2011 (at independence)
Membership: 55 African countries

What It Does:
• Promotes African unity
• Defends sovereignty
• Promotes peace and security
• Accelerates development
• Promotes democracy and human rights

Key Organs:
• Assembly (heads of state)
• Peace and Security Council
• African Commission on Human Rights
• African Court of Justice

Benefits for South Sudan:
• Regional support
• Conflict mediation
• Economic integration
• Collective voice

3. IGAD (Intergovernmental Authority on Development)

Membership: 8 East African countries
Members: Djibouti, Eritrea, Ethiopia, Kenya, Somalia, South Sudan, Sudan, Uganda

What It Does:
• Promotes regional cooperation
• Conflict prevention and resolution
• Economic development
• Food security
• Environmental protection

Benefits for South Sudan:
• Peace mediation
• Regional trade
• Drought response
• Infrastructure development

4. EAST AFRICAN COMMUNITY (EAC)

South Sudan Status: Observer (working toward full membership)
Members: Kenya, Tanzania, Uganda, Rwanda, Burundi, DRC

What It Does:
• Economic integration
• Common market
• Customs union
• Eventually political federation

Potential Benefits:
• Free trade
• Free movement
• Shared infrastructure
• Economic growth

5. WORLD BANK GROUP

What It Does:
• Provides loans for development
• Technical assistance
• Poverty reduction
• Infrastructure projects

Benefits for South Sudan:
• Funding for roads, schools, hospitals
• Economic advice
• Capacity building
• Development programs

6. INTERNATIONAL MONETARY FUND (IMF)

What It Does:
• Promotes monetary cooperation
• Financial stability
• International trade
• Economic growth

Benefits for South Sudan:
• Economic advice
• Financial assistance
• Capacity building
• Monetary policy support

7. WORLD HEALTH ORGANIZATION (WHO)

What It Does:
• Coordinates global health
• Sets health standards
• Responds to epidemics
• Promotes health systems

Benefits for South Sudan:
• Disease surveillance
• Vaccination programs
• Health emergency response
• Technical guidance

8. WORLD FOOD PROGRAMME (WFP)

What It Does:
• Fights hunger
• Provides food assistance
• Emergency response
• Nutrition programs

Benefits for South Sudan:
• Food aid during crises
• School feeding programs
• Nutrition support
• Livelihood programs

9. UNHCR (UN Refugee Agency)

What It Does:
• Protects refugees
• Provides assistance
• Seeks durable solutions
• Monitors refugee rights

Benefits for South Sudan:
• Assists South Sudanese refugees abroad
• Supports refugees in South Sudan
• Protection services
• Humanitarian aid

10. UNICEF (UN Children's Fund)

What It Does:
• Protects children's rights
• Provides humanitarian aid
• Promotes education and health
• Responds to emergencies

Benefits for South Sudan:
• Vaccination campaigns
• Education programs
• Child protection
• Nutrition support

How International Organizations Work:

DECISION-MAKING:
• Member states vote
• Some use consensus
• Some have weighted voting
• Security Council has veto power

FUNDING:
• Member contributions
• Assessed contributions (mandatory)
• Voluntary contributions
• Loans and grants

IMPLEMENTATION:
• Secretariat staff
• Country offices
• Partner organizations
• National governments

Legal Status:
• International legal personality
• Can sign treaties
• Can sue and be sued
• Privileges and immunities
• Inviolability of premises

Advantages of Membership:

POLITICAL:
• International recognition
• Voice in global affairs
• Diplomatic support
• Conflict mediation

ECONOMIC:
• Development assistance
• Trade opportunities
• Technical expertise
• Infrastructure funding

SOCIAL:
• Humanitarian aid
• Health programs
• Education support
• Human rights protection

Obligations of Membership:
• Pay membership fees
• Follow organization's rules
• Implement decisions
• Participate in good faith
• Respect other members

Challenges:
• Membership fees (expensive)
• Loss of some sovereignty
• Compliance requirements
• Bureaucracy
• Competing interests

Real-World Examples:

Example 1: UNMISS
UN Security Council authorized peacekeeping mission in South Sudan. UNMISS protects civilians and supports peace process.

Example 2: IGAD Mediation
When conflict erupted in 2013, IGAD mediated peace talks. Resulted in peace agreements and power-sharing arrangements.

Example 3: World Bank Projects
World Bank funds road construction in South Sudan, improving connectivity and trade.

Example 4: WHO Ebola Response
When Ebola threatened South Sudan, WHO coordinated response, preventing outbreak.

Why This Matters to YOU:
• Organizations provide aid and services
• Support peace and development
• Protect your rights
• Create opportunities
• Connect South Sudan to world

How to Engage:
• Learn about organizations
• Participate in programs
• Hold government accountable for commitments
• Support international cooperation

Remember: No country can solve all problems alone. International organizations help countries work together for common good!`,
      tier: 'free'
   },
   {
      id: 'intl-use-of-force-basics',
      title: 'Use of Force and Self-Defense',
      description: 'When can countries use military force?',
      pdfSource: 'book_1.pdf',
      content: `International law strictly limits when countries can use military force. The general rule is: force is PROHIBITED.

The General Rule: NO FORCE

UN Charter Article 2(4):
"All Members shall refrain in their international relations from the threat or use of force against the territorial integrity or political independence of any state."

This Means:
• Cannot invade other countries
• Cannot threaten to attack
• Cannot use force to take territory
• Cannot interfere militarily in other countries

Why This Rule Exists:
• Prevent wars
• Protect sovereignty
• Save lives
• Maintain international peace
• Promote peaceful settlement

Exceptions to the Rule:

Only TWO legal ways to use force:

1. SELF-DEFENSE (UN Charter Article 51)

When Allowed:
• If you are attacked
• "Armed attack" must occur
• Must be necessary and proportional
• Only until Security Council acts

Requirements:
• Immediate response
• Proportional force
• Report to Security Council
• Only defensive, not punitive

Individual Self-Defense:
• Country defends itself from attack
• Inherent right
• Doesn't need Security Council permission

Collective Self-Defense:
• Countries help each other
• Must be requested by victim
• Example: NATO members defend each other

What is "Armed Attack"?
• Actual military attack
• Invasion
• Bombardment
• Sending armed groups
• Substantial scale (not minor incidents)

Anticipatory Self-Defense (Controversial):
• Attacking before being attacked
• Very controversial
• Most lawyers say illegal
• Some argue allowed if attack imminent
• High threshold

Example of Legal Self-Defense:
If Sudan's army invades South Sudan, South Sudan can use force to defend itself. This is clear self-defense.

Example of Illegal "Self-Defense":
South Sudan cannot attack Sudan just because it fears Sudan might attack someday. That's not self-defense.

2. SECURITY COUNCIL AUTHORIZATION (Chapter VII)

When Allowed:
• Security Council determines "threat to peace"
• Passes resolution under Chapter VII
• Authorizes use of force
• Specific mandate

How It Works:
1. Security Council meets
2. Determines situation threatens peace
3. Tries non-military measures first (sanctions, etc.)
4. If those fail, authorizes force
5. Member states carry out action

Examples:
• Korean War (1950)
• Gulf War (1991)
• Libya intervention (2011)
• Various peacekeeping missions

Requirements:
• 9 of 15 Security Council votes
• No veto from permanent members (USA, UK, France, Russia, China)
• Clear mandate
• Specific authorization

What Force Can Be Used:
• Only what's authorized
• Must follow mandate
• Proportional
• Protect civilians
• Follow international humanitarian law

Humanitarian Intervention (Controversial):

The Question:
Can countries use force to stop atrocities (genocide, mass killings) without Security Council authorization?

Traditional View: NO
• Violates Article 2(4)
• No exception for humanitarian reasons
• Security Council must authorize

Emerging View: MAYBE
• Responsibility to Protect (R2P)
• If government kills its own people
• International community has responsibility
• But still controversial

South Sudan Context:
Some argued for intervention to stop atrocities in South Sudan. But without Security Council authorization, it would be illegal.

Responsibility to Protect (R2P):

Three Pillars:
1. State has responsibility to protect its population
2. International community helps states fulfill this
3. If state fails, international community must act

When R2P Applies:
• Genocide
• War crimes
• Ethnic cleansing
• Crimes against humanity

How to Act:
• Peaceful means first
• Security Council authorization for force
• Last resort only

Illegal Uses of Force:

AGGRESSION:
• Invasion
• Annexation
• Bombardment
• Blockade
• Sending armed groups
• Crime under international law

REPRISALS:
• Using force in response to non-military wrong
• Illegal
• Example: Attacking because of trade dispute

INTERVENTION:
• Interfering in another country's affairs
• Using force to change government
• Illegal

Consequences of Illegal Use of Force:

INTERNATIONAL:
• State responsibility
• Reparations
• Sanctions
• International condemnation

INDIVIDUAL:
• Crime of aggression
• War crimes
• International Criminal Court
• Personal criminal liability

International Humanitarian Law (Law of War):

Even When Force is Legal:
• Must follow rules of war
• Protect civilians
• Don't target civilian objects
• Treat prisoners humanely
• No torture
• No chemical/biological weapons

Geneva Conventions:
• Four treaties
• Protect victims of war
• Prisoners of war
• Wounded and sick
• Civilians
• South Sudan is party

War Crimes:
• Serious violations of humanitarian law
• Individual criminal responsibility
• International Criminal Court
• Examples: Targeting civilians, torture, using child soldiers

South Sudan's Situation:

Border Conflicts with Sudan:
• Tensions over Abyei
• Oil disputes
• Both must avoid use of force
• Peaceful settlement required

Internal Conflicts:
• Government vs. opposition
• Humanitarian law applies
• Protect civilians
• Avoid war crimes

UNMISS Mandate:
• Security Council authorized peacekeeping
• Protect civilians
• Use force if necessary
• Legal under Chapter VII

Real-World Examples:

Example 1: Illegal Aggression
Iraq invaded Kuwait in 1990. Clear aggression, illegal use of force. Security Council authorized force to liberate Kuwait.

Example 2: Legal Self-Defense
When terrorists attacked USA on 9/11, USA had right to self-defense against those responsible (Afghanistan harbored terrorists).

Example 3: Security Council Authorization
Security Council authorized intervention in Libya (2011) to protect civilians from government attacks.

Example 4: Controversial Intervention
NATO bombed Yugoslavia (1999) to stop ethnic cleansing in Kosovo. No Security Council authorization (Russia would veto). Controversial legality.

Why This Matters to YOU:
• Prevents wars that destroy lives
• Protects South Sudan's sovereignty
• Ensures conflicts resolved peacefully
• Holds aggressors accountable
• Protects civilians in conflict

Key Principles to Remember:
• Force is generally prohibited
• Self-defense is allowed if attacked
• Security Council can authorize force
• Humanitarian law always applies
• Peaceful settlement is required

Remember: The law aims to prevent war and protect human life. Force should be the absolute last resort!`,
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
      id: 'penal-elements-crime',
      title: 'Elements of a Crime - What Makes It Illegal?',
      description: 'Understanding actus reus and mens rea',
      pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
      content: `For most crimes, TWO things must happen together: the ACT and the INTENT.

The Two Elements:

1. ACTUS REUS (The Guilty Act)
• The physical action of the crime
• What you actually DID
• Must be voluntary (not forced or accidental)
• Can be an action OR a failure to act (when you have a duty)

Examples:
• Taking someone's property (theft)
• Hitting someone (assault)
• Failing to feed your child (neglect - omission)

2. MENS REA (The Guilty Mind)
• Your mental state
• What you INTENDED or KNEW
• Did you mean to do it?
• Did you know it was wrong?

Levels of Mens Rea:

INTENTION:
• You meant to do it
• You wanted the result
• Example: You punch someone intending to hurt them

KNOWLEDGE:
• You knew it would happen
• You were aware of the consequences
• Example: You know your friend will use your car to commit a crime

RECKLESSNESS:
• You knew there was a risk
• You did it anyway
• Example: Driving dangerously fast, knowing you might hit someone

NEGLIGENCE:
• You should have known better
• You failed to be careful
• Example: Leaving a loaded gun where children can reach it

Why Both Elements Matter:

If you have the ACT but not the INTENT, it might not be a crime:
• You accidentally bump into someone (no intent to hurt)
• You take someone's umbrella thinking it's yours (honest mistake)

If you have the INTENT but not the ACT, it's usually not a crime:
• You think about stealing but don't do it (thoughts alone aren't crimes)
• You plan a crime but never carry it out (though conspiracy can be a crime)

Exceptions - Strict Liability Crimes:
Some crimes don't need mens rea:
• Selling expired food
• Speeding
• Statutory rape (sex with minor)
• These are crimes even if you didn't intend harm

Causation - The Link:
Your act must CAUSE the result:
• You stab someone, they die from the wound (clear causation)
• You stab someone, they die in car crash on way to hospital (broken causation?)

Real-World Examples:

Example 1: Theft
• Actus Reus: You take someone's phone
• Mens Rea: You intended to permanently deprive them of it
• Both present = THEFT

Example 2: Not Theft
• You take someone's phone thinking it's yours
• Actus Reus: Yes (you took it)
• Mens Rea: No (honest mistake)
• Result: NOT theft (but you must return it when you realize)

Example 3: Murder vs. Manslaughter
• Murder: You intended to kill
• Manslaughter: You killed but didn't intend to (e.g., reckless driving)
• Same actus reus, different mens rea = different crimes

Age and Mental Capacity:

Children Under 12:
• Cannot form mens rea
• Cannot be criminally responsible
• Protected by law

Mental Illness:
• If you can't understand your actions
• Cannot form mens rea
• Defense of insanity

Intoxication:
• Voluntary intoxication usually NO defense
• You chose to drink/use drugs
• Involuntary intoxication (drugged without knowledge) IS a defense

Why This Matters to YOU:
• Protects you from being punished for accidents
• Ensures fair treatment
• Distinguishes serious crimes from minor ones
• Your intent matters in court

Remember: Criminal law punishes GUILTY ACTS done with GUILTY MINDS. Both must be present for most crimes!`,
      tier: 'free'
   },
   {
      id: 'penal-arrest-rights',
      title: 'Your Rights When Arrested',
      description: 'What police can and cannot do',
      pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
      content: `If you're arrested, you have RIGHTS. Police must respect them. Know your rights and use them!

What is an Arrest?
• Police take you into custody
• You're not free to leave
• You're suspected of a crime
• Can be with or without a warrant

Types of Arrest:

1. ARREST WITH WARRANT
• Judge issues written order
• Police show you the warrant
• Lists the crime you're accused of
• More formal process

2. ARREST WITHOUT WARRANT
• Police can arrest if:
  - You're caught committing a crime
  - Serious crime (murder, robbery, rape)
  - Reasonable suspicion you committed serious crime
  - You're about to commit a crime

YOUR RIGHTS WHEN ARRESTED:

1. RIGHT TO BE TOLD WHY
• Police MUST tell you why you're being arrested
• What crime you're suspected of
• In a language you understand
• Immediately upon arrest

2. RIGHT TO REMAIN SILENT
• You DON'T have to answer questions
• Except: Your name and address
• Anything you say CAN be used against you
• Silence cannot be used as evidence of guilt

What to Say:
"I want to remain silent until I have a lawyer."

3. RIGHT TO A LAWYER
• You can request a lawyer
• Immediately upon arrest
• Before answering any questions
• Police should allow you to contact one

If You Can't Afford a Lawyer:
• Request legal aid
• Court will provide one
• Don't answer questions until lawyer arrives

4. RIGHT TO BE BROUGHT BEFORE COURT QUICKLY
• Within 24 HOURS of arrest
• Court decides if detention continues
• Cannot be held indefinitely without seeing judge

5. RIGHT TO HUMANE TREATMENT
• No torture
• No cruel or degrading treatment
• No beatings
• Access to food, water, toilet
• Medical care if needed

6. RIGHT TO INFORM FAMILY
• Tell someone you've been arrested
• Police should allow you to contact family
• They need to know where you are

7. RIGHT TO PRESUMPTION OF INNOCENCE
• You are INNOCENT until proven guilty
• Burden of proof on prosecution
• They must prove you did it
• You don't have to prove you didn't

What Police CANNOT Do:

CANNOT Torture You:
• No beatings
• No threats
• No psychological torture
• Confessions obtained by torture are INVALID

CANNOT Search Without Reason:
• Need warrant or reasonable suspicion
• Cannot search your home without warrant (except emergencies)
• Cannot search your body without reason

CANNOT Detain You Forever:
• 24 hours maximum before court
• After that, judge decides
• Bail may be granted

CANNOT Deny You Food/Water:
• Basic necessities must be provided
• Medical care if sick or injured

What You SHOULD Do If Arrested:

1. STAY CALM
• Don't resist (even if arrest is wrong)
• Resisting can lead to more charges
• Don't argue or fight

2. ASK WHY
• "Why am I being arrested?"
• "What am I charged with?"
• Remember what they say

3. REMAIN SILENT
• Don't explain
• Don't make excuses
• Don't confess
• Wait for lawyer

4. REQUEST A LAWYER
• Say clearly: "I want a lawyer"
• Don't answer questions until lawyer arrives
• Lawyer will advise you

5. REMEMBER DETAILS
• Officer's name and badge number
• Time and place of arrest
• What was said
• Any witnesses
• Any injuries or mistreatment

6. DON'T SIGN ANYTHING
• Without lawyer's advice
• Don't sign confessions
• Don't sign statements
• Wait for legal advice

What Happens After Arrest:

STEP 1: Taken to Police Station
• Booked (recorded in register)
• Personal items taken (returned later)
• May be photographed and fingerprinted

STEP 2: Questioning (Optional for You)
• Police may ask questions
• You can refuse to answer
• Request lawyer first
• Don't be pressured

STEP 3: Detention or Release
• Police may detain you
• Or release you on bail
• Must bring you to court within 24 hours if detained

STEP 4: Court Appearance
• Within 24 hours
• Judge hears charges
• Decides on bail or further detention
• You can have lawyer present

Bail - What Is It?

• Money or guarantee to ensure you appear for trial
• You're released until trial
• Must return for court dates
• If you don't return, you lose bail money

When Bail is Granted:
• Less serious crimes
• Not a flight risk
• Not a danger to public
• Have ties to community

When Bail is Denied:
• Very serious crimes (murder, treason)
• Flight risk (might run away)
• Might interfere with witnesses
• Danger to public

Special Protections:

FOR CHILDREN (Under 18):
• Special procedures
• Parent/guardian must be informed
• Juvenile court system
• Rehabilitation focus, not punishment

FOR WOMEN:
• Female officers should search women
• Separate detention facilities
• Special protection if pregnant

Common Violations to Report:

• Torture or beatings
• Denial of food/water
• Held more than 24 hours without seeing judge
• Denied access to lawyer
• Forced to sign confession
• Sexual abuse

Where to Report:
• Court when you appear
• Human rights organizations
• Legal aid organizations
• Family members can file complaints

Real-World Examples:

Example 1: Proper Arrest
Police see you stealing a phone. They arrest you without warrant (caught in the act), tell you why, take you to station, allow you to call lawyer, bring you to court within 24 hours. LEGAL.

Example 2: Illegal Arrest
Police arrest you without telling you why, beat you to confess, hold you for 3 days without seeing judge. ILLEGAL - your rights were violated.

Example 3: Using Your Rights
Police arrest you for assault. You say: "I want to remain silent. I want a lawyer." You don't answer any questions. Lawyer arrives and advises you. You're brought to court within 24 hours. You used your rights CORRECTLY.

Important Reminders:

• Arrest does NOT mean you're guilty
• You have rights - USE THEM
• Silence is your right, not evidence of guilt
• Lawyer is your best protection
• Police must follow the law too

Remember: KNOW YOUR RIGHTS. USE YOUR RIGHTS. PROTECT YOUR RIGHTS!`,
      tier: 'free'
   },
   {
      id: 'penal-court-process',
      title: 'The Criminal Court Process - Step by Step',
      description: 'From arrest to verdict - how criminal trials work',
      pdfSource: 'Penal-Code-Act-South-Sudan-2008.pdf',
      content: `Understanding the criminal court process helps you know what to expect if you or someone you know faces criminal charges.

The Criminal Justice System:

WHO'S WHO IN COURT:

JUDGE:
• Presides over trial
• Ensures fair process
• Decides on law
• Sentences if guilty
• Impartial (doesn't take sides)

PROSECUTOR:
• Represents the State
• Tries to prove you're guilty
• Presents evidence against you
• Must prove guilt "beyond reasonable doubt"

DEFENSE LAWYER:
• Represents the accused (you)
• Protects your rights
• Challenges prosecution's evidence
• Presents your defense
• Argues for acquittal or lighter sentence

WITNESSES:
• People who saw or know something
• Give testimony under oath
• Can be for prosecution or defense

COURT CLERK:
• Records proceedings
• Manages court documents
• Assists judge

THE CRIMINAL PROCESS - STEP BY STEP:

STEP 1: ARREST
• Police arrest you
• Must tell you why
• Take you to police station
• You have right to remain silent
• Request a lawyer

STEP 2: POLICE STATION (Booking)
• Personal details recorded
• Charges explained
• May be questioned (you can refuse)
• Detained or released on police bail

STEP 3: FIRST COURT APPEARANCE (Within 24 Hours)
• Brought before magistrate/judge
• Charges read to you
• Asked if you understand
• Bail decision made
• Case adjourned for investigation

What Happens:
• Prosecutor presents charges
• You (or lawyer) can respond
• Judge decides: bail or remand in custody
• Next court date set

STEP 4: INVESTIGATION PERIOD
• Police gather more evidence
• Witnesses interviewed
• You may be questioned (with lawyer)
• Evidence collected
• Can take weeks or months

During This Time:
• You're either on bail (free but must return) or in custody
• Prepare your defense with lawyer
• Gather your own evidence
• Find witnesses

STEP 5: PRELIMINARY HEARING (For Serious Crimes)
• Magistrate decides if enough evidence
• Prosecution presents case summary
• Defense can challenge
• If sufficient evidence: case goes to trial
• If not: case dismissed

STEP 6: PLEA (Formal Charge)
• Charges formally read
• You enter plea:
  - GUILTY: Admit you did it → Go to sentencing
  - NOT GUILTY: Deny it → Go to trial

Important: Don't plead guilty without lawyer's advice!

STEP 7: TRIAL (If You Plead Not Guilty)

Opening Statements:
• Prosecutor outlines case
• Defense outlines defense
• Not evidence, just previews

Prosecution's Case:
• Prosecutor presents evidence
• Calls witnesses
• Shows physical evidence (weapons, stolen items, etc.)
• Each witness is examined

Cross-Examination:
• Your lawyer questions prosecution witnesses
• Challenges their testimony
• Points out inconsistencies
• Weakens prosecution's case

Defense's Case:
• Your lawyer presents your defense
• Calls your witnesses
• Presents your evidence
• You may testify (but don't have to)

Cross-Examination by Prosecution:
• Prosecutor questions your witnesses
• Challenges your evidence

Closing Arguments:
• Prosecutor summarizes why you're guilty
• Defense summarizes why you're not guilty
• Last chance to persuade judge

STEP 8: VERDICT
• Judge decides (or jury in some countries)
• Based on evidence presented
• Must be "beyond reasonable doubt"

Two Possible Outcomes:

GUILTY:
• Prosecution proved their case
• You're convicted
• Move to sentencing

NOT GUILTY (Acquittal):
• Prosecution didn't prove their case
• You're free to go
• Cannot be tried again for same crime (double jeopardy)

STEP 9: SENTENCING (If Found Guilty)
• Judge decides punishment
• Considers:
  - Seriousness of crime
  - Your criminal history
  - Mitigating factors (reasons for leniency)
  - Aggravating factors (reasons for harsher sentence)

Types of Sentences:
• Fine (pay money)
• Probation (supervised freedom)
• Community service
• Imprisonment
• Death penalty (for very serious crimes like murder)

STEP 10: APPEAL (If You Disagree with Verdict)
• You can appeal to higher court
• Must file within 30 days
• Appeal court reviews case
• Can:
  - Uphold conviction (you remain guilty)
  - Overturn conviction (you're freed)
  - Order new trial
  - Reduce sentence

BURDEN OF PROOF:

"Beyond Reasonable Doubt":
• Prosecution must prove you're guilty
• Very high standard
• Not "maybe" or "probably"
• Judge must be SURE
• Any reasonable doubt = not guilty

You DON'T Have to Prove Innocence:
• Presumed innocent
• Prosecution's job to prove guilt
• You can remain silent
• Silence is not evidence of guilt

YOUR RIGHTS DURING TRIAL:

1. RIGHT TO BE PRESENT
• Attend your own trial
• Hear all evidence
• Face your accusers

2. RIGHT TO LAWYER
• Legal representation
• Lawyer can speak for you
• Legal aid if you can't afford

3. RIGHT TO REMAIN SILENT
• Don't have to testify
• Cannot be forced to incriminate yourself
• Silence cannot be used against you

4. RIGHT TO CALL WITNESSES
• Present your own witnesses
• They must be allowed to testify
• Court can compel witnesses to attend

5. RIGHT TO CHALLENGE EVIDENCE
• Cross-examine prosecution witnesses
• Object to improper evidence
• Present counter-evidence

6. RIGHT TO FAIR TRIAL
• Impartial judge
• Public trial (usually)
• Reasonable time (not delayed forever)
• Proper procedures followed

7. RIGHT TO INTERPRETER
• If you don't speak the court language
• Free interpreter provided
• Must understand proceedings

TYPES OF CRIMINAL COURTS:

MAGISTRATE COURT:
• Less serious crimes
• Theft, assault, minor offenses
• Faster process
• Lower sentences

HIGH COURT:
• Serious crimes
• Murder, rape, robbery, treason
• Longer trials
• Harsher sentences including death penalty

COURT OF APPEAL:
• Reviews decisions from lower courts
• Doesn't retry case
• Reviews for legal errors
• Final decision (usually)

EVIDENCE IN COURT:

Types of Evidence:
• Testimony (what witnesses say)
• Physical evidence (weapons, stolen items)
• Documentary evidence (contracts, letters)
• Expert evidence (doctors, forensic experts)

Admissible vs. Inadmissible:
• Admissible: Can be used in court
• Inadmissible: Cannot be used
• Illegally obtained evidence may be inadmissible
• Hearsay (second-hand information) usually inadmissible

Real-World Examples:

Example 1: Theft Case
You're accused of stealing a phone. Process: Arrested → Court within 24 hours → Bail granted → Investigation → Trial → Prosecution shows CCTV, victim testifies → You testify you bought it → Judge decides based on evidence.

Example 2: Assault Case
Accused of hitting someone. Process: Arrested → Remanded in custody → Preliminary hearing → Trial → Victim testifies, shows injuries → You claim self-defense, call witnesses → Judge weighs evidence → Verdict.

Common Mistakes to Avoid:

• Talking to police without lawyer
• Pleading guilty without understanding consequences
• Missing court dates (warrant issued for arrest)
• Not preparing defense
• Not calling witnesses
• Lying in court (perjury is a crime)

Tips for Court:

• Dress respectfully
• Arrive early
• Be polite to judge ("Your Honor")
• Stand when judge enters/leaves
• Speak clearly when asked
• Tell the truth
• Listen to your lawyer
• Don't interrupt

Remember: The criminal process is designed to be FAIR. You have rights at every stage. Use them!`,
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
      tier: 'free'
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
      tier: 'free'
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
 * NOW EMPTY - All modules should come from tutor admin uploads
 */
export function getAllModules(): ExtractedModule[] {
   // Return empty array - all content should come from Firestore via tutor admin
   return [];
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

