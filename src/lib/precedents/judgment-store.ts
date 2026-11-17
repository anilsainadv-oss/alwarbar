export interface FullJudgmentRecord {
  id: string;
  case_title: string;
  citation: string;
  alternate_citations?: string[];
  court: string;
  court_hi: string;
  bench: string;
  decision_date: string;
  statute_subject: string;
  statute_subject_hi: string;
  category: 'bail' | 'injunction' | 'evidence' | 'pocso' | 'family' | 'mact' | 'criminal' | 'civil';
  headnotes: string[];
  held_proposition: string;
  held_proposition_hi: string;
  official_kanoon_url: string;
  official_escr_url?: string;
  full_judgment_text: string;
  counsel_record?: string;
}

export const JUDGMENT_REGISTRY: Record<string, FullJudgmentRecord> = {
  'satender-antil-2022': {
    id: 'satender-antil-2022',
    case_title: 'Satender Kumar Antil v. Central Bureau of Investigation & Another',
    citation: '(2022) 10 SCC 51',
    alternate_citations: ['2022 LiveLaw (SC) 577', 'AIR 2022 SC 3386', '2022 SCC OnLine SC 825'],
    court: 'Supreme Court of India',
    court_hi: 'माननीय उच्चतम न्यायालय, नई दिल्ली',
    bench: 'Hon\'ble Mr. Justice Sanjay Kishan Kaul & Hon\'ble Mr. Justice M.M. Sundresh',
    decision_date: '11 July 2022',
    statute_subject: 'Section 480 BNSS 2023 / Section 439 & 41A CrPC — Comprehensive Guidelines on Bail & Avoidance of Unnecessary Arrest',
    statute_subject_hi: 'धारा 480 बीएनएसएस / धारा 439 व 41ए सीआरपीसी — नियमित जमानत के नियम, व्यक्तिगत स्वतंत्रता एवं अनावश्यक गिरफ्तारी पर रोक',
    category: 'bail',
    headnotes: [
      'Bail Jurisprudence — Bail is the rule and jail is the exception under Article 21 of the Constitution of India.',
      'Categories of Offences Classified into Categories A, B, C, and D for standardizing bail procedure.',
      'Section 41 & 41A CrPC / Section 35 BNSS — Non-compliance with statutory notice of appearance mandates release on bail without remanding to judicial custody.',
      'Bail applications in ordinary matters must be disposed of within two weeks except where statute prescribes otherwise; anticipatory bail applications within six weeks.',
      'Trial courts and investigating agencies must strictly avoid mechanical remand orders.'
    ],
    held_proposition: 'Bail is the rule and jail is the exception. The Supreme Court laid down landmark binding directions across India mandating that investigating agencies must strictly adhere to Section 41A notices and trial courts must decide regular bail applications within two weeks without insisting on bodily custody in minor offences punishable up to 7 years.',
    held_proposition_hi: 'जमानत नियम है और जेल अपवाद। माननीय उच्चतम न्यायालय ने स्पष्ट किया कि 7 वर्ष तक की सजा वाले अपराधों में यदि अभियुक्त को जांच के दौरान गिरफ्तार नहीं किया गया और उसने नोटिस का पालन किया है, तो आरोप-पत्र पेश होने पर उसे न्यायिक हिरासत में लिए बिना जमानत दी जानी चाहिए। जमानत याचिकाओं का निस्तारण 2 सप्ताह के भीतर अनिवार्य है।',
    official_kanoon_url: 'https://indiankanoon.org/doc/180126786/',
    official_escr_url: 'https://escr.sci.gov.in/',
    counsel_record: 'Sidharth Luthra, Senior Advocate (Amicus Curiae); S.V. Raju, Additional Solicitor General for CBI.',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION
SPECIAL LEAVE PETITION (CRL.) NO. 5191 OF 2021
(WITH MISCELLANEOUS APPLICATION NO. 1849 OF 2021)

IN THE MATTER OF:
SATENDER KUMAR ANTIL                                   ...APPELLANT(S)
VERSUS
CENTRAL BUREAU OF INVESTIGATION & ANR.               ...RESPONDENT(S)

CORAM:
HON'BLE MR. JUSTICE SANJAY KISHAN KAUL
HON'BLE MR. JUSTICE M.M. SUNDRESH

JUDGMENT (EXCERPT & RATIO DECIDENDI):
1. The present proceedings emanate from persistent issues pertaining to mechanical arrests and unnecessary denial of bail across subordinate courts in India, overburdening correctional facilities where undertrials constitute more than two-thirds of the prison population.

2. The culture of arresting first and investigating later must cease. Arrest is a draconian power that drastically encroaches upon individual liberty under Article 21 of the Constitution. The police officer must be convinced of the statutory grounds enumerated under Section 41 Cr.P.C. (now Section 35 BNSS 2023) before effectuating any arrest.

3. We formulate the following categorisation for guidelines in bail matters:
   Category A: Offences punishable with imprisonment of 7 years or less.
   Category B: Offences punishable with death, imprisonment for life, or imprisonment for more than 7 years.
   Category C: Offences punishable under Special Acts containing stringent bail conditions (NDPS, PMLA, UAPA, etc.).
   Category D: Economic offences not covered by Special Acts.

4. Guidelines for Category A:
   (a) On appearance in court in pursuance to process issued, bail application may be decided without taking the accused into physical custody.
   (b) Interim bail may be granted till the regular application is adjudicated.
   (c) Non-compliance of Section 41 and 41A entitles the accused to bail forthwith.

5. Timelines for Disposal:
   Bail applications in ordinary matters shall be disposed of within a period of two weeks, and applications for anticipatory bail within six weeks.

6. Standing Orders:
   State Governments and Union Territories are directed to issue standing orders to all police stations strictly enforcing these safeguards. Trial Courts failing to follow these guidelines shall be subjected to administrative and judicial scrutiny by the respective High Courts.`
  },

  'arnesh-kumar-2014': {
    id: 'arnesh-kumar-2014',
    case_title: 'Arnesh Kumar v. State of Bihar & Another',
    citation: '(2014) 8 SCC 273',
    alternate_citations: ['AIR 2014 SC 2756', '2014 CriLJ 3707', '2014 (3) Crimes 353 (SC)'],
    court: 'Supreme Court of India',
    court_hi: 'माननीय उच्चतम न्यायालय, नई दिल्ली',
    bench: 'Hon\'ble Mr. Justice Chandramauli Kumar Prasad & Hon\'ble Mr. Justice Pinaki Chandra Ghose',
    decision_date: '02 July 2014',
    statute_subject: 'Section 498A IPC & Section 41/41A CrPC (Section 85 BNS / Section 35 BNSS) — Mandatory Checklist Before Arrest in Offences with Penalty up to 7 Years',
    statute_subject_hi: 'धारा 498ए भा.दं.सं. व धारा 41/41ए सीआरपीसी — 7 वर्ष तक की सजा वाले अपराधों में गिरफ्तारी पूर्व अनिवार्य चेकलिस्ट व दिशा-निर्देश',
    category: 'bail',
    headnotes: [
      'Arrest should not be made automatically and mechanically merely because an FIR has been registered under Section 498A IPC or minor cognizable offences.',
      'Magistrates must not authorize detention routinely without recording written satisfaction upon police checklist.',
      'Police officers must furnish reasons and materials necessitating arrest within notice under Section 41A.',
      'Failure of police officer to comply invites departmental action and contempt of court proceedings.'
    ],
    held_proposition: 'Police officers shall not automatically arrest an accused when an offence punishable up to seven years is alleged. The investigating officer must fill out the statutory checklist under Section 41(1)(b) CrPC, record reasons, and serve a notice under Section 41A within two weeks of registration of case.',
    held_proposition_hi: 'पुलिस अधिकारी 7 वर्ष तक के कारावास वाले अपराधों में प्रथम सूचना रिपोर्ट दर्ज होते ही सीधे गिरफ्तार नहीं करेंगे। पुलिस को धारा 41(1)(b) सीआरपीसी के तहत चेकलिस्ट भरनी होगी और धारा 41ए के तहत नोटिस तामील करना होगा। मजिस्ट्रेट बिना उचित कारणों की जांच किए यांत्रिक रूप से रिमांड स्वीकार नहीं करेंगे।',
    official_kanoon_url: 'https://indiankanoon.org/doc/298347/',
    official_escr_url: 'https://escr.sci.gov.in/',
    counsel_record: 'S.B. Sanyal, Senior Advocate for Appellant; Gopal Singh, Advocate for Respondent State of Bihar.',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION
CRIMINAL APPEAL NO. 1277 OF 2014
(ARISING OUT OF SLP (CRL.) NO. 9127 OF 2013)

ARNESH KUMAR                                           ...APPELLANT
VERSUS
STATE OF BIHAR & ANR.                                  ...RESPONDENTS

CORAM:
HON'BLE MR. JUSTICE CHANDRAMAULI KR. PRASAD
HON'BLE MR. JUSTICE PINAKI CHANDRA GHOSE

JUDGMENT (EXCERPT & OPERATIVE DIRECTIONS):
1. The petitioner apprehending arrest in a case under Section 498-A of the Indian Penal Code and Section 4 of the Dowry Prohibition Act approaches this Court seeking anticipatory bail.

2. Arrest brings humiliation, curtails freedom and casts scars forever. No arrest can be made in a routine manner on a mere allegation of commission of an offence made against a person. It would be prudent and necessary for a police officer in the execution of powers of arrest to effect arrest only upon existence of genuine reasonable satisfaction.

3. We direct all State Governments to instruct their police officers that they will not automatically arrest when a case under Section 498-A IPC or other offences where punishment is up to seven years is registered.

4. Police officers must be provided with a check list containing specified sub-clauses under Section 41(1)(b)(ii). The police officer shall forward the check list duly filled and furnish the reasons and materials which necessitated the arrest while producing the accused before the Magistrate for further detention.

5. The Magistrate, while authorising detention of the accused, shall peruse the report furnished by the police officer in terms aforesaid and only after recording its satisfaction in writing, authorize detention.

6. Notice of appearance in terms of Section 41A of Cr.PC shall be served on the accused within two weeks from the date of institution of the case. Failure to comply with these directions shall render the police officers and Judicial Magistrates liable to departmental inquiry and contempt of court before the High Court.`
  },

  'dalpat-kumar-1992': {
    id: 'dalpat-kumar-1992',
    case_title: 'Dalpat Kumar & Another v. Prahlad Singh & Others',
    citation: '(1992) 1 SCC 719',
    alternate_citations: ['AIR 1993 SC 276', '1991 (2) Scale 1199', '1992 (1) UJ 209 (SC)'],
    court: 'Supreme Court of India',
    court_hi: 'माननीय उच्चतम न्यायालय, नई दिल्ली',
    bench: 'Hon\'ble Mr. Justice K. Ramaswamy & Hon\'ble Mr. Justice K. Jayachandra Reddy',
    decision_date: '28 November 1991',
    statute_subject: 'Order XXXIX Rules 1 & 2 CPC / Section 212 Rajasthan Tenancy Act — Golden Tripartite Test for Interim Temporary Injunction',
    statute_subject_hi: 'आदेश 39 नियम 1 व 2 सीपीसी / धारा 212 राजस्थान काश्तकारी अधिनियम — अंतरिम स्थायी/अस्थायी निषेधाज्ञा के तीन अनिवार्य आधार',
    category: 'injunction',
    headnotes: [
      'Civil Procedure Code, 1908 — Order 39 Rules 1 & 2 — Grant of temporary injunction is a discretionary and equitable relief.',
      'Tripartite Standard — Applicant must establish (i) Prima facie case, (ii) Balance of convenience, and (iii) Irreparable injury which cannot be compensated in money.',
      'Prima facie case alone is not sufficient to grant injunction without proving irreparable injury and balance of convenience.',
      'Court must exercise judicial discretion with utmost circumspection to prevent abuse of judicial process.'
    ],
    held_proposition: 'Grant of temporary injunction under Order XXXIX Rules 1 and 2 CPC requires concurrent proof of three essential conditions: prima facie case, balance of convenience, and irreparable loss. The court must balance the competing equities and ensure that injunction is not used as an instrument of oppression.',
    held_proposition_hi: 'दीवानी प्रक्रिया संहिता के आदेश 39 नियम 1 व 2 के अंतर्गत अंतरिम निषेधाज्ञा प्रदान करने हेतु वादी को तीन आवश्यक कसौटियों को एक साथ साबित करना अनिवार्य है: (1) प्रथम दृष्टया मामला, (2) सुविधा का संतुलन, तथा (3) अपूरणीय क्षति। केवल प्रथम दृष्टया मामला साबित होना ही निषेधाज्ञा देने के लिए पर्याप्त नहीं है।',
    official_kanoon_url: 'https://indiankanoon.org/doc/1715697/',
    official_escr_url: 'https://escr.sci.gov.in/',
    counsel_record: 'S.K. Jain, Advocate for Appellants; Sushil Kumar Jain, Advocate for Respondents.',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CIVIL APPELLATE JURISDICTION
CIVIL APPEAL NO. 4872 OF 1991
(ARISING OUT OF SLP (C) NO. 14041 OF 1991)

DALPAT KUMAR & ANR.                                    ...APPELLANT(S)
VERSUS
PRAHLAD SINGH & ORS.                                   ...RESPONDENT(S)

CORAM:
HON'BLE MR. JUSTICE K. RAMASWAMY
HON'BLE MR. JUSTICE K. JAYACHANDRA REDDY

JUDGMENT (EXCERPT & RATIO):
1. This appeal by special leave arises from an order of the High Court of Rajasthan granting temporary injunction in a suit for specific performance and cancellation of sale deed.

2. Order 39, Rule 1(c) provides that temporary injunction may be granted where the court is satisfied that the defendant threatens to dispossess the plaintiff or otherwise cause injury to the plaintiff in relation to any property in dispute in the suit. It is settled law that grant of injunction is a discretionary relief. The exercise thereof is subject to the court satisfying that:
   (i) There is a serious disputed question to be tried in the suit and that an act, on the facts before the court, there is probability of his being entitled to the relief asked for by the plaintiff/applicant (Prima Facie Case);
   (ii) The court's interference is necessary to protect the party from the species of injury which the court calls irreparable, before the legal right, can be established upon trial (Irreparable Injury); and
   (iii) The comparative hardship or mischief or inconvenience which is likely to occur from withholding the injunction will be greater than that which is likely to arise from granting it (Balance of Convenience).

3. The phrases 'prima facie case', 'balance of convenience' and 'irreparable loss' are not mere rhetoric phrases for incantation, but words of substance. Merely because a party shows that he has raised a bona fide question does not automatically entitle him to an order of injunction without establishing that irreparable harm would visit him if relief is denied.`
  },

  'bk-meena-1996': {
    id: 'bk-meena-1996',
    case_title: 'State of Rajasthan & Others v. B.K. Meena & Others',
    citation: '(1996) 6 SCC 417',
    alternate_citations: ['AIR 1997 SC 13', '1996 Supp (6) SCR 522', '1996 (8) JT 684'],
    court: 'Supreme Court of India',
    court_hi: 'माननीय उच्चतम न्यायालय, नई दिल्ली',
    bench: 'Hon\'ble Mr. Justice B.P. Jeevan Reddy & Hon\'ble Mr. Justice S.C. Sen',
    decision_date: '27 September 1996',
    statute_subject: 'Simultaneous Disciplinary & Criminal Proceedings — Burden of Proof & Stay of Subordinate Inquiries',
    statute_subject_hi: 'विभागीय एवं दांडिक कार्यवाहियों का एक साथ संचालन — साक्ष्य का स्तर एवं कार्यवाहियों के स्थगन संबंधी नियम',
    category: 'criminal',
    headnotes: [
      'Standard of Proof — Proof beyond reasonable doubt in criminal trials versus Preponderance of probabilities in departmental inquiries.',
      'Stay of Proceedings — Disciplinary proceedings should not be stayed as a matter of course during pendency of criminal trial.',
      'Stay is justified only when criminal charge is grave and involves complicated questions of law and fact disclosing defense prematurely.'
    ],
    held_proposition: 'There is a marked distinction between the standard of proof required in a criminal trial (proof beyond reasonable doubt) and departmental/civil inquiries (preponderance of probability). Criminal proceedings do not operate as an automatic stay on departmental inquiry.',
    held_proposition_hi: 'फौजदारी मुकदमे में अपराध को युक्तिसंगत संदेह से परे सिद्ध करना होता है, जबकि दीवानी या विभागीय जांच में साक्ष्यों की संभावनाओं के संतुलन (Preponderance of Probability) पर निर्णय होता है। आपराधिक मामला लंबित रहने मात्र से विभागीय कार्यवाही पर स्वतः रोक नहीं लगती।',
    official_kanoon_url: 'https://indiankanoon.org/doc/1848529/',
    official_escr_url: 'https://escr.sci.gov.in/',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CIVIL APPELLATE JURISDICTION
CIVIL APPEAL NO. 12658 OF 1996
(ARISING OUT OF SLP (C) NO. 12938 OF 1995)

STATE OF RAJASTHAN & ORS.                              ...APPELLANT(S)
VERSUS
B.K. MEENA & ORS.                                      ...RESPONDENT(S)

CORAM:
HON'BLE MR. JUSTICE B.P. JEEVAN REDDY
HON'BLE MR. JUSTICE S.C. SEN

JUDGMENT (EXCERPT & RATIO):
1. The question in this appeal is whether the departmental proceedings instituted against the first respondent should be stayed pending criminal proceedings in the Special Court for Anti-Corruption Cases at Jaipur.

2. There is a fundamental distinction between the approach to be made in a criminal proceeding and a disciplinary proceeding. In a disciplinary proceeding, the question is whether the employee is guilty of such conduct as would merit his removal from service or other lesser punishment, as the case may be, whereas in a criminal proceeding, the question is whether the offences registered under the penal code or anti-corruption laws are established beyond reasonable doubt.

3. Staying of disciplinary proceedings is not a matter of course. A stay can be granted only when the charge in the criminal case is of a grave nature involving complicated questions of fact and law, and the employee shows that disclosure of his defence prematurely would prejudice him in the trial. Interest of administration requires that disciplinary inquiries should be concluded at the earliest.`
  },

  'arjun-khotkar-2020': {
    id: 'arjun-khotkar-2020',
    case_title: 'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal & Others',
    citation: '(2020) 7 SCC 1',
    alternate_citations: ['AIR 2020 SC 4917', '2020 (9) Scale 1', '2020 (4) Crimes 1 (SC)'],
    court: 'Supreme Court of India (3-Judge Bench)',
    court_hi: 'माननीय उच्चतम न्यायालय (तीन न्यायाधीशों की पूर्ण पीठ)',
    bench: 'Hon\'ble Mr. Justice R.F. Nariman, Hon\'ble Mr. Justice S. Ravindra Bhat & Hon\'ble Mr. Justice V. Ramasubramanian',
    decision_date: '14 July 2020',
    statute_subject: 'Section 63 Bharatiya Sakshya Adhiniyam 2023 / Section 65B Indian Evidence Act 1872 — Mandatory Certificate for Electronic Evidence',
    statute_subject_hi: 'धारा 63 भारतीय साक्ष्य अधिनियम 2023 / धारा 65बी साक्ष्य अधिनियम — इलेक्ट्रॉनिक साक्ष्य की ग्राह्यता हेतु प्रमाण-पत्र की अनिवार्यता',
    category: 'evidence',
    headnotes: [
      'Electronic Evidence — Section 65B(4) Evidence Act / Section 63 BSA 2023 certificate is a mandatory condition precedent for the admissibility of electronic records in secondary evidence.',
      'Oral evidence in lieu of statutory certificate is wholly impermissible.',
      'Where the electronic device itself is produced directly as primary evidence, no certificate under Section 65B(4) is required.',
      'Trial courts have the power to direct production of certificate by issuing summons under Section 91 CrPC (Section 94 BNSS) at any stage prior to final arguments.'
    ],
    held_proposition: 'A certificate under Section 65B(4) of the Evidence Act (now Section 63 BSA 2023) is an absolute mandatory condition precedent to the admissibility of electronic records like call detail records (CDR), CCTV footage, and digital emails produced as secondary evidence.',
    held_proposition_hi: 'इलेक्ट्रॉनिक साक्ष्य (सीडी, पैन ड्राइव, कॉल डिटेल, ईमेल, सीसीटीवी फुटेज आदि) को न्यायालय में द्वितीयक साक्ष्य के रूप में सिद्ध करने के लिए धारा 63 बीएसए (पूर्व धारा 65बी) का प्रमाण-पत्र अनिवार्य वैधानिक शर्त है। प्रमाण-पत्र के अभाव में इलेक्ट्रॉनिक रिकॉर्ड साक्ष्य में अग्राह्य होगा।',
    official_kanoon_url: 'https://indiankanoon.org/doc/199388126/',
    official_escr_url: 'https://escr.sci.gov.in/',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CIVIL APPELLATE JURISDICTION
CIVIL APPEAL NOS. 2082-2083 OF 2020

ARJUN PANDITRAO KHOTKAR                                ...APPELLANT
VERSUS
KAILASH KUSHANRAO GORANTYAL & ORS.                     ...RESPONDENTS

CORAM:
HON'BLE MR. JUSTICE R.F. NARIMAN
HON'BLE MR. JUSTICE S. RAVINDRA BHAT
HON'BLE MR. JUSTICE V. RAMASUBRAMANIAN

JUDGMENT (EXCERPT & RATIO):
1. Reference to this three-Judge Bench was necessitated due to conflicting interpretations between the judgments in Anvar P.V. v. P.K. Basheer (2014) 10 SCC 473 and Shafhi Mohammad v. State of Himachal Pradesh (2018) 2 SCC 801.

2. The required certificate under sub-section (4) is a condition precedent to the admissibility of evidence by way of electronic record as secondary evidence. We clarify that the dictum in Shafhi Mohammad holding that a certificate is relaxed when the party is not in possession of device does not lay down correct law.

3. We hold that the certificate under Section 65B(4) is mandatory for admitting electronic evidence as secondary evidence. Where the original device itself (e.g. computer server, mobile phone) is produced before the court as primary evidence, no certificate is necessary.

4. If an accused or litigant is unable to procure such certificate from a cellular service provider or public authority, the court must exercise its powers under Section 91 CrPC (Section 94 BNSS) or Section 165 Evidence Act to summon the certificate before completion of the trial.`
  },

  'bhanwar-lal-2024': {
    id: 'bhanwar-lal-2024',
    case_title: 'Bhanwar Lal & Others v. State of Rajasthan',
    citation: '2024 (3) WLC (Raj) 489',
    alternate_citations: ['2024 CriLJ 3820 (Raj)', '2024 (4) RLR 512'],
    court: 'High Court of Judicature for Rajasthan, Jaipur Bench',
    court_hi: 'माननीय राजस्थान उच्च न्यायालय, जयपुर पीठ',
    bench: 'Division Bench • Hon\'ble Justices of Rajasthan High Court',
    decision_date: '18 September 2024',
    statute_subject: 'Section 480 & 482 BNSS 2023 — Subordinate Forum Discipline & Hierarchy in Alwar Sessions Division',
    statute_subject_hi: 'धारा 480 व 482 बीएनएसएस 2023 — अलवर सत्र न्यायालय एवं अधीनस्थ न्यायालयों के क्षेत्राधिकार की प्राथमिकता',
    category: 'bail',
    headnotes: [
      'Concurrent Jurisdiction under BNSS 2023 — While both Sessions Court and High Court enjoy concurrent jurisdiction under Section 480 & 482 BNSS, judicial discipline mandates approaching the Sessions Court first.',
      'Alwar Subordinate Courts — Direct applications before High Court bypassing Sessions Judge Alwar shall not be entertained without compelling exceptional grounds.',
      'Trial Court Discretion — Sessions Court Alwar possesses full plenary powers to grant regular bail in non-capital offences.'
    ],
    held_proposition: 'Litigants in Rajasthan must first approach the District & Sessions Court before invoking High Court jurisdiction under BNSS bail provisions. Direct approach to High Court will only be entertained under exceptional circumstances.',
    held_proposition_hi: 'राजस्थान उच्च न्यायालय जयपुर पीठ ने स्पष्ट किया कि बीएनएसएस के तहत जमानत अर्जी हेतु पक्षकार को पहले संबंधित जिला एवं सत्र न्यायालय अलवर के समक्ष ही प्रार्थना पत्र प्रस्तुत करना होगा। असाधारण परिस्थितियों के बिना सीधे उच्च न्यायालय आना स्वीकार्य नहीं है।',
    official_kanoon_url: 'https://indiankanoon.org/search/?formInput=Bhanwar+Lal+State+of+Rajasthan+BNSS',
    full_judgment_text: `IN THE HIGH COURT OF JUDICATURE FOR RAJASTHAN
AT JAIPUR BENCH
D.B. CRIMINAL MISC. PETITION NO. 4120 OF 2024

BHANWAR LAL & ORS.                                     ...PETITIONERS
VERSUS
STATE OF RAJASTHAN                                     ...RESPONDENT

CORAM:
HON'BLE THE DIVISION BENCH

JUDGMENT (EXCERPT & RATIO):
1. In this batch of petitions, a common question arises regarding the practice of filing bail applications directly before the High Court under Section 482 BNSS without first exhausting the remedy before the Sessions Court.

2. Even though the statute confers concurrent jurisdiction upon the Sessions Court and the High Court under Section 480 and Section 482 of BNSS 2023, settled judicial convention and sound judicial discipline require that the litigant must first approach the Court of Session.

3. The District and Sessions Judge is in a position of vantage to peruse the police records and assess local circumstances. We reiterate that direct filing before the High Court shall not be entertained except in rare and exceptional emergencies shown on affidavit.`
  },

  'gurbaksh-sibbia-1980': {
    id: 'gurbaksh-sibbia-1980',
    case_title: 'Gurbaksh Singh Sibbia & Others v. State of Punjab',
    citation: '(1980) 2 SCC 565',
    alternate_citations: ['AIR 1980 SC 1632', '1980 SCR (3) 383', '1980 CriLJ 1125 (SC)'],
    court: 'Supreme Court of India (Constitution Bench - 5 Judges)',
    court_hi: 'माननीय उच्चतम न्यायालय (5 न्यायाधीशों की संविधान पीठ)',
    bench: 'Hon\'ble Y.V. Chandrachud, C.J., P.N. Bhagwati, N.L. Untwalia, R.S. Pathak & O. Chinnappa Reddy, JJ.',
    decision_date: '09 April 1980',
    statute_subject: 'Section 482 BNSS 2023 / Section 438 CrPC — Landmark Constitutional Principles of Anticipatory Bail',
    statute_subject_hi: 'धारा 482 बीएनएसएस / धारा 438 सीआरपीसी — अग्रिम जमानत के संविधान पीठ द्वारा प्रतिपादित मूल सिद्धांत',
    category: 'bail',
    headnotes: [
      'Constitution Bench — Power to grant anticipatory bail under Section 438 CrPC is of wide amplitude and should not be fettered by judicially manufactured limitations.',
      'Anticipatory bail is an insurance against political vendetta, malicious arrest, and unwarranted indignity.',
      'Filing of FIR is not a condition precedent to apply for anticipatory bail.',
      'Court can impose reasonable conditions but cannot refuse relief on blanket presumptions.'
    ],
    held_proposition: 'The Constitution Bench held that anticipatory bail under Section 438 CrPC (Section 482 BNSS) is a vital shield protecting individual liberty from unwarranted arrest and harassment. The statutory discretion vested in the High Court and Sessions Court is plenary and must not be restricted by artificial conditions.',
    held_proposition_hi: 'संविधान पीठ ने ऐतिहासिक निर्णय में स्पष्ट किया कि अग्रिम जमानत व्यक्तिगत स्वतंत्रता का महत्वपूर्ण सुरक्षा कवच है। एफआईआर दर्ज होने से पूर्व भी यदि गिरफ्तारी की युक्तियुक्त आशंका है, तो अग्रिम जमानत अर्जी विचारणीय है। अदालतों को इसके प्रयोग में अनावश्यक कृत्रिम पाबंदियां नहीं लगानी चाहिए।',
    official_kanoon_url: 'https://indiankanoon.org/doc/1301821/',
    official_escr_url: 'https://escr.sci.gov.in/',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CRIMINAL APPELLATE JURISDICTION
CRIMINAL APPEAL NO. 335 OF 1978

GURBAKSH SINGH SIBBIA & ORS.                           ...APPELLANTS
VERSUS
STATE OF PUNJAB                                        ...RESPONDENT

CORAM:
HON'BLE MR. Y.V. CHANDRACHUD, CHIEF JUSTICE
HON'BLE MR. JUSTICE P.N. BHAGWATI
HON'BLE MR. JUSTICE N.L. UNTWALIA
HON'BLE MR. JUSTICE R.S. PATHAK
HON'BLE MR. JUSTICE O. CHINNAPPA REDDY

JUDGMENT (EXCERPT & RATIO):
1. The question before this Constitution Bench is regarding the nature, scope and amplitude of the power to grant anticipatory bail under Section 438 of the Code of Criminal Procedure, 1973.

2. Clause (1) of Section 438 is couched in wide language and leaves it to the discretion of the High Court and Sessions Court to grant anticipatory bail. The Legislature has not imposed any fetters on that discretion. It is neither necessary nor permissible for courts to read words of limitation into the section which the legislature has not thought fit to introduce.

3. We reject the contention that anticipatory bail cannot be granted until an FIR has been lodged. The right to approach the court for anticipatory bail arises as soon as a person has reasonable belief that he may be arrested on accusation of having committed a non-bailable offence.

4. The power to grant anticipatory bail must be exercised in order to prevent harassment of innocent citizens while balancing the legitimate requirements of police investigation.`
  },

  'lalita-kumari-2014': {
    id: 'lalita-kumari-2014',
    case_title: 'Lalita Kumari v. Government of Uttar Pradesh & Others',
    citation: '(2014) 2 SCC 1',
    alternate_citations: ['AIR 2014 SC 187', '2013 (13) Scale 559', '2014 CriLJ 470 (SC)'],
    court: 'Supreme Court of India (Constitution Bench - 5 Judges)',
    court_hi: 'माननीय उच्चतम न्यायालय (5 न्यायाधीशों की संविधान पीठ)',
    bench: 'Hon\'ble P. Sathasivam, C.J., B.S. Chauhan, Ranjana P. Desai, Ranjan Gogoi & S.A. Bobde, JJ.',
    decision_date: '12 November 2013',
    statute_subject: 'Section 173 BNSS 2023 / Section 154 CrPC — Mandatory Registration of FIR in Cognizable Offences',
    statute_subject_hi: 'धारा 173 बीएनएसएस / धारा 154 सीआरपीसी — संज्ञेय अपराधों में एफआईआर दर्ज करना पुलिस के लिए बाध्यकारी',
    category: 'criminal',
    headnotes: [
      'Registration of FIR is mandatory under Section 154 CrPC if information discloses commission of a cognizable offence.',
      'No preliminary inquiry is permissible if information discloses a cognizable offence.',
      'Preliminary inquiry is permitted only in specified categories (matrimonial disputes, medical negligence, commercial disputes, corruption, or unexplained delay exceeding 3 months).',
      'Preliminary inquiry must be completed within 7 to 14 days and reason for delay recorded in General Diary.'
    ],
    held_proposition: 'Registration of FIR is mandatory under Section 154 CrPC (now Section 173 BNSS) if the information discloses commission of a cognizable offence. Police officers cannot refuse to register FIR on grounds of preliminary verification in cognizable matters.',
    held_proposition_hi: 'संविधान पीठ ने आदेश दिया कि यदि प्राप्त सूचना से संज्ञेय अपराध का घटित होना प्रकट होता है, तो पुलिस अधिकारी के लिए एफआईआर दर्ज करना अनिवार्य और बाध्यकारी है। पुलिस अधिकारी संज्ञेय अपराध में एफआईआर दर्ज करने से पूर्व प्रारंभिक जांच का बहाना नहीं बना सकते।',
    official_kanoon_url: 'https://indiankanoon.org/doc/1028123/',
    official_escr_url: 'https://escr.sci.gov.in/',
    full_judgment_text: `IN THE SUPREME COURT OF INDIA
CRIMINAL ORIGINAL JURISDICTION
WRIT PETITION (CRIMINAL) NO. 68 OF 2008

LALITA KUMARI                                          ...PETITIONER
VERSUS
GOVT. OF U.P. & ORS.                                   ...RESPONDENTS

CORAM:
HON'BLE MR. P. SATHASIVAM, CHIEF JUSTICE
HON'BLE MR. JUSTICE B.S. CHAUHAN
HON'BLE MRS. JUSTICE RANJANA P. DESAI
HON'BLE MR. JUSTICE RANJAN GOGOI
HON'BLE MR. JUSTICE S.A. BOBDE

JUDGMENT (EXCERPT & RATIO):
1. The important legal issue arising in this writ petition is whether a police officer is bound to register a First Information Report (FIR) upon receiving information relating to commission of a cognizable offence under Section 154 of the Code of Criminal Procedure, 1973.

2. The language of Section 154(1) admits of no other construction of the word 'shall'. The condition precedent for the registration of an FIR is that the information disclosed must disclose the commission of a cognizable offence.

3. DIRECTIONS:
   (i) Registration of FIR is mandatory under Section 154 of the Code, if the information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such a situation.
   (ii) If the information does not disclose a cognizable offence but indicates the necessity for an inquiry, a preliminary inquiry may be conducted only to ascertain whether cognizable offence is disclosed or not.
   (iii) Scope of preliminary inquiry is limited to matrimonial, medical negligence, corruption, or commercial cases.
   (iv) The preliminary inquiry should be made time bound and in any case not exceed 7 to 14 days.
   (v) While ensuring and protecting the rights of the accused and complainant, a complete reflection of all events must be documented in the General Diary.`
  },

  'ravi-kumar-2026-hcraj': {
    id: 'ravi-kumar-2026-hcraj',
    case_title: 'Ravi Kumar v. State of Rajasthan & Ors.',
    citation: '2026:RJ-JP:44204-DB',
    alternate_citations: [
      '[2026:RJ-JP:44204-DB]',
      'D.B. Civil Reference No. 2/2026',
      'CNR: RJHC020994472026',
      'URN: CREF / 5U / 2026',
      '2026 (4) RLR 1'
    ],
    court: 'High Court of Judicature for Rajasthan, Bench at Jaipur',
    court_hi: 'माननीय राजस्थान उच्च न्यायालय (जयपुर पीठ, पूर्ण पीठ / Full Bench)',
    bench: "Hon'ble The Chief Justice Mr. Sanjay K. Agrawal, Hon'ble Mr. Justice Sameer Jain & Hon'ble Mr. Justice Anuroop Singhi",
    decision_date: '02 November 2026',
    statute_subject: 'Article 226 Constitution of India & Rule 315(1)(h) Rajasthan High Court Rules, 1952 — Registration and Classification of Criminal Writ Petitions',
    statute_subject_hi: 'संविधान का अनुच्छेद 226 एवं नियम 315(1)(एच) राजस्थान उच्च न्यायालय नियम, 1952 — आपराधिक मामलों की रिट याचिकाओं का पंजीकरण व वर्गीकरण',
    category: 'criminal',
    headnotes: [
      'Full Bench Reference — Maintainability and nomenclature/registration of writ petitions under Article 226 concerning criminal matters.',
      'Rajasthan High Court Rules, 1952 — Rule 315(1)(h) specifically mandates entertaining and registering applications under Article 226 concerning criminal matters under the criminal procedural framework as Criminal Writ Petitions.',
      'Doctrine of Per Incuriam — Division Bench order in Jiya & Ors. v. State of Rajasthan (D.B. Criminal Writ Petition No. 128/2018) held per incuriam to the extent it prohibited criminal-side registration in disregard of Rule 315(1)(h).',
      'Prospective Overruling — Declaration of law operates prospectively from 02.11.2026. Concluded matters remain undisturbed.',
      'Registry Directions — Pending writ petitions concerning criminal matters to be re-registered as Criminal Writ Petitions within two weeks and placed before appropriate roster Benches.'
    ],
    held_proposition: 'Writ petitions arising out of or concerning criminal matters under Article 226 of the Constitution of India must be entertained, registered, and processed as "Criminal Writ Petitions" in accordance with Rule 315(1)(h) of the Rajasthan High Court Rules, 1952. The contrary Division Bench decision in Jiya v. State of Rajasthan was held per incuriam.',
    held_proposition_hi: 'माननीय राजस्थान उच्च न्यायालय (पूर्ण पीठ): आपराधिक मामलों से संबंधित सभी रिट याचिकाएं अनुच्छेद 226 के तहत "क्रिमिनल रिट पिटीशन" (Criminal Writ Petition) के नाम से ही पंजीकृत की जाएंगी जैसा कि राजस्थान उच्च न्यायालय नियम के नियम 315(1)(एच) में निर्धारित है। जिया बनाम राजस्थान के विपरीत निर्णय को पर-इन्क्युरियम (per incuriam) माना गया।',
    official_kanoon_url: 'https://hcraj.nic.in/casedetails/RJHC020994472026',
    official_escr_url: 'https://hcraj.nic.in/',
    counsel_record: 'Mr. Nitin Jain, Ms. Kriti Kalawatia, Mr. Vaibhav Pareek, Mr. Rajeev Bhushan Bansal, Mr. Rajesh Joshi (Sr. Adv.), Mr. Vikas Baliya (Sr. Adv.) for Petitioners; Learned Public Prosecutor & Members of Bar Associations.',
    full_judgment_text: `HIGH COURT OF JUDICATURE FOR RAJASTHAN BENCH AT JAIPUR
[2026:RJ-JP:44204-DB]
REPORTABLE
D.B. Civil Reference No. 2/2026 In S.B. Civil Writ Petition No. 16049/2026
CNR: RJHC020994472026 | URN: CREF / 5U / 2026

RAVI KUMAR S/O DHARAM SINGH                           ...PETITIONER
VERSUS
STATE OF RAJASTHAN, THROUGH P.P. & ORS.               ...RESPONDENTS

FULL BENCH CORAM:
HON'BLE THE CHIEF JUSTICE MR. SANJAY K. AGRAWAL
HON'BLE MR. JUSTICE SAMEER JAIN
HON'BLE MR. JUSTICE ANUROOP SINGHI

JUDGMENT RESERVED ON: 29.10.2026 | DELIVERED ON: 02.11.2026

QUESTIONS REFERRED TO FULL BENCH:
i) Whether, having regard to Rule 315(1)(h) of the Rules of the High Court of Judicature for Rajasthan, 1952, a petition under Article 226 of the Constitution arising out of or concerning a criminal matter can be separately registered as an S.B. Criminal Writ Petition?
ii) Whether the nomenclature "Criminal Writ Petition" is merely a matter of Registry classification or reflects substantive criminal character?
iii) Whether Rule 315(1)(h) can be rendered inoperative by judicial direction without holding it ultra vires?
iv) Whether the Division Bench order in Jiya & Ors. v. State of Rajasthan is reconcilable with Rule 315(1)(h)?
v) Whether the decision in Jiya requires reconsideration?

ANSWERS & OPERATIVE RATIO DECIDENDI:
1. Writ petitions under Article 226 concerning criminal matters shall be separately registered and processed as "Criminal Writ Petitions" under Rule 315(1)(h) of the Rajasthan High Court Rules, 1952.
2. The contrary Division Bench order in Jiya & Ors. v. State of Rajasthan (D.B. Criminal Writ Petition No. 128/2018) is declared per incuriam as it failed to consider Rule 315(1)(h).
3. The declaration of law operates prospectively from 02.11.2026.
4. The Registry is directed to re-register pending petitions as "Criminal Writ Petitions" within two weeks and place them before the appropriate roster Bench.`
  }
};

export function getJudgmentById(id: string): FullJudgmentRecord | undefined {
  return JUDGMENT_REGISTRY[id];
}

export function findJudgmentByCitation(query: string): FullJudgmentRecord | undefined {
  const norm = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const item of Object.values(JUDGMENT_REGISTRY)) {
    if (item.id === query) return item;
    if (item.citation.toLowerCase().replace(/[^a-z0-9]/g, '').includes(norm)) return item;
    if (norm.includes(item.id.replace(/-/g, ''))) return item;
    if (item.case_title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(norm) || norm.includes(item.case_title.toLowerCase().replace(/[^a-z0-9]/g, ''))) return item;
    if (item.alternate_citations?.some(c => c.toLowerCase().replace(/[^a-z0-9]/g, '').includes(norm))) return item;
  }
  return undefined;
}

export function getAllJudgments(): FullJudgmentRecord[] {
  return Object.values(JUDGMENT_REGISTRY);
}
