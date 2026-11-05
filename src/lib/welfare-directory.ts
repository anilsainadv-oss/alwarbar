export interface EmpanelledHospital {
  id: string;
  name_en: string;
  name_hi: string;
  city: 'Alwar' | 'Bhiwadi' | 'Behror' | 'Neemrana' | 'Jaipur';
  address: string;
  phone: string;
  tpa_desk_phone?: string;
  specialties: string[];
  type: 'Government' | 'Private Multi-Speciality' | 'Cancer / Super-Speciality';
  cashless_status: 'Active Cashless' | 'Reimbursement Approved';
}

export interface ClaimProcedureGuide {
  id: string;
  title_en: string;
  title_hi: string;
  timeline: string;
  target_benefit: string;
  form_code: string;
  form_download_url: string;
  steps: Array<{ step_no: number; title: string; description: string }>;
  checklist: string[];
  nodal_submission: string;
}

export interface CourtStampRule {
  court_name: string;
  court_name_hi: string;
  rawf_stamp_amount: string;
  court_fee_amount: string;
  bar_stamp_amount: string;
  total_standard_cost: string;
  notes: string;
}

export interface WelfareFaq {
  question_en: string;
  question_hi: string;
  answer_en: string;
  answer_hi: string;
  category: 'tax' | 'eligibility' | 'nominee' | 'process' | 'transfer';
}

export const EMPANELLED_HOSPITALS: EmpanelledHospital[] = [
  {
    id: 'hosp-001',
    name_en: 'Rajiv Gandhi General Hospital & Medical College',
    name_hi: 'राजीव गांधी सामान्य चिकित्सालय एवं मेडिकल कॉलेज, अलवर',
    city: 'Alwar',
    address: 'Hospital Road, Alwar - 301001',
    phone: '0144-2332211',
    tpa_desk_phone: '0144-2332215',
    specialties: ['General Medicine', 'ICU & Trauma', 'Orthopedics', 'Cardiology', 'Pediatrics'],
    type: 'Government',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-002',
    name_en: 'Solanki Hospital & Heart Care Centre',
    name_hi: 'सोलंकी हॉस्पिटल एवं हार्ट केयर सेंटर, अलवर',
    city: 'Alwar',
    address: 'Near Old Bus Stand, Manu Marg, Alwar - 301001',
    phone: '0144-2700344',
    tpa_desk_phone: '9829012345',
    specialties: ['Interventional Cardiology', 'Cath Lab', 'Cardiac ICU', 'Critical Care'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-003',
    name_en: 'Mittal Hospital & Research Institute',
    name_hi: 'मित्तल हॉस्पिटल एवं रिसर्च सेंटर, अलवर',
    city: 'Alwar',
    address: 'Scheme No. 2, Basant Vihar, Alwar - 301001',
    phone: '0144-2345678',
    tpa_desk_phone: '9414055678',
    specialties: ['Nephrology & Dialysis', 'Neurology', 'Gastroenterology', 'General Surgery'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-004',
    name_en: 'Apex Super Speciality Hospital',
    name_hi: 'एपेक्स सुपर स्पेशलिटी हॉस्पिटल, भिवाड़ी',
    city: 'Bhiwadi',
    address: 'Sector 3, RIICO Industrial Area, Bhiwadi, Alwar - 301019',
    phone: '01493-220055',
    tpa_desk_phone: '01493-220056',
    specialties: ['Trauma Surgery', 'Orthopedics', 'Joint Replacement', 'Pulmonology'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-005',
    name_en: 'Kailash Hospital & Neuro Institute',
    name_hi: 'कैलाश हॉस्पिटल, बहरोड़',
    city: 'Behror',
    address: 'Old National Highway 8, Behror, Alwar - 301701',
    phone: '01494-222400',
    tpa_desk_phone: '9829233400',
    specialties: ['Emergency Trauma', 'Neuro Surgery', 'ICU Support', 'Radiology'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-006',
    name_en: 'Star Multispeciality Hospital',
    name_hi: 'स्टार मल्टीस्पेशलिटी हॉस्पिटल, नीमराना',
    city: 'Neemrana',
    address: 'Japanese Zone Link Road, Neemrana, Alwar - 301705',
    phone: '01494-246111',
    tpa_desk_phone: '9784011222',
    specialties: ['General Medicine', 'Accident & Emergency', 'Dialysis', 'OBGYN'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-007',
    name_en: 'Narayana Multispeciality Hospital',
    name_hi: 'नारायण मल्टीस्पेशलिटी हॉस्पिटल, जयपुर',
    city: 'Jaipur',
    address: 'Sector 28, Kumbha Marg, Pratap Nagar, Jaipur - 302033',
    phone: '0141-7122222',
    tpa_desk_phone: '0141-7122299',
    specialties: ['Cardiac Sciences', 'Organ Transplant', 'Oncology', 'Neurology', 'Nephrology'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-008',
    name_en: 'Fortis Escorts Hospital',
    name_hi: 'फोर्टिस एस्कॉर्ट्स हॉस्पिटल, जयपुर',
    city: 'Jaipur',
    address: 'Jawahar Lal Nehru Marg, Malviya Nagar, Jaipur - 302017',
    phone: '0141-2547000',
    tpa_desk_phone: '0141-2547050',
    specialties: ['Heart Transplants', 'Cardiothoracic Surgery', 'Advanced Orthopedics', 'Urology'],
    type: 'Private Multi-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-009',
    name_en: 'Bhagwan Mahaveer Cancer Hospital & Research Centre',
    name_hi: 'भगवान महावीर कैंसर हॉस्पिटल एवं रिसर्च सेंटर, जयपुर',
    city: 'Jaipur',
    address: 'JLN Marg, Bajaj Nagar, Jaipur - 302015',
    phone: '0141-2700107',
    tpa_desk_phone: '0141-2700108',
    specialties: ['Surgical Oncology', 'Radiation Therapy', 'Medical Chemotherapy', 'Bone Marrow'],
    type: 'Cancer / Super-Speciality',
    cashless_status: 'Active Cashless'
  },
  {
    id: 'hosp-010',
    name_en: 'SMS Medical College & Associated Hospitals',
    name_hi: 'सवाई मानसिंह (SMS) मेडिकल कॉलेज एवं अस्पताल, जयपुर',
    city: 'Jaipur',
    address: 'Jawahar Lal Nehru Marg, Jaipur - 302004',
    phone: '0141-2560291',
    tpa_desk_phone: '0141-2560292',
    specialties: ['Apex Super-Speciality', 'Cardio-Thoracic', 'Neurosurgery', 'Organ Transplants'],
    type: 'Government',
    cashless_status: 'Active Cashless'
  }
];

export const CLAIM_PROCEDURE_GUIDES: ClaimProcedureGuide[] = [
  {
    id: 'guide-death',
    title_en: 'Demise / Death Compassionate Claim Procedure',
    title_hi: 'अधिवक्ता मृत्यु दावा / आश्रित सहायता प्राप्त करने की प्रक्रिया',
    timeline: 'Submit within 90 days of demise; Disbursed via RTGS within 45 days of meeting',
    target_benefit: 'Up to ₹10,00,000 to ₹15,00,000 (Based on Schedule Slabs)',
    form_code: 'Form 11 (RAWF)',
    form_download_url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=11.pdf',
    steps: [
      {
        step_no: 1,
        title: 'Immediate Intimation & Bar Continuity Certificate',
        description: 'Inform District & Sessions Bar Association Alwar and obtain active practice continuity certificate signed by the President/Secretary.'
      },
      {
        step_no: 2,
        title: 'Download & Fill Form 11',
        description: 'Fill Form 11 with deceased advocate’s enrolment number, date of demise, nominee bank details, and IFSC code.'
      },
      {
        step_no: 3,
        title: 'Attestation by Senior Advocates',
        description: 'Get claim declaration verified by three senior practicing advocates of Alwar Bar certifying continuous legal practice.'
      },
      {
        step_no: 4,
        title: 'Dispatch to Trustee Committee, Jodhpur',
        description: 'Forward the dossier via registered post or Bar counter to Secretary, Trustee Committee, High Court Building, Jodhpur.'
      }
    ],
    checklist: [
      'Original Municipal Death Certificate issued by Registrar of Births & Deaths',
      'Form 11 Prescribed Claim Petition duly filled & signed',
      'Original Sanad / Enrolment Certificate issued by Bar Council',
      'Nominee Aadhaar Card & Cancelled Cheque / Bank Passbook Copy',
      'Alwar Bar Association Active Practice Continuity Certificate',
      'Attestation signatures by 3 Senior Practicing Advocates'
    ],
    nodal_submission: 'Welfare Desk, District & Sessions Bar Association Alwar or High Court Building, Jodhpur'
  },
  {
    id: 'guide-medical',
    title_en: 'Critical Illness Emergency Compassionate Relief (Section 25)',
    title_hi: 'गंभीर बीमारी आपातकालीन अनुग्रह सहायता (धारा 25) प्रक्रिया',
    timeline: 'Immediate fast-track processing (within 14–21 days of receipt)',
    target_benefit: 'Up to ₹2,00,000 Ex-Gratia Grant',
    form_code: 'Form 12 (RAWF)',
    form_download_url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=12.pdf',
    steps: [
      {
        step_no: 1,
        title: 'Medical Diagnosis & Hospital Discharge',
        description: 'Obtain original discharge summary, diagnostic pathology/MRI reports, and treatment estimates for Cancer, Cardiac bypass, Kidney failure, or Brain surgery.'
      },
      {
        step_no: 2,
        title: 'Attending Specialist Physician Certificate',
        description: 'Have the treating specialist doctor sign and stamp the medical necessity certificate in Form 12.'
      },
      {
        step_no: 3,
        title: 'Endorsement by Alwar Bar Association',
        description: 'Submit to Alwar Bar Association Welfare Committee for immediate priority recommendation.'
      },
      {
        step_no: 4,
        title: 'Direct Transfer to Hospital / Advocate',
        description: 'Trustee Committee sanctions ex-gratia grant and transfers funds directly to hospital or advocate’s bank account.'
      }
    ],
    checklist: [
      'Form 12 Emergency Relief Application',
      'Hospital Original Discharge Card & Final Itemized Bills',
      'Attending Specialist Doctor Diagnosis Certificate',
      'Bar Council Sanad Card Copy',
      'Bank Account Proof (Cancelled Cheque) for DBT transfer'
    ],
    nodal_submission: 'Emergency Nodal Officer, RAWF Trustee Committee, Jodhpur'
  },
  {
    id: 'guide-retirement',
    title_en: 'Retirement & Cessation of Practice Claim (Section 17)',
    title_hi: 'वकालत समाप्ति / सेवानिवृत्ति दावा प्रक्रिया (धारा 17)',
    timeline: 'Processed in quarterly Trustee Committee meeting after roll publication',
    target_benefit: '₹1,75,000 to ₹15,00,000 (Based on Section 17 Schedule)',
    form_code: 'Section 17 Application',
    form_download_url: 'https://barcouncilofrajasthan.org/Advocate/',
    steps: [
      {
        step_no: 1,
        title: 'Voluntary Application for Cessation of Practice',
        description: 'Submit written declaration under Section 17 stating intention to retire and voluntarily surrender legal practice.'
      },
      {
        step_no: 2,
        title: 'Surrender of Original Sanad & Roll Removal',
        description: 'Surrender original Enrolment Certificate (Sanad) to the Bar Council of Rajasthan for gazette roll cessation.'
      },
      {
        step_no: 3,
        title: 'No-Dues Certificate from Alwar Bar',
        description: 'Obtain No-Dues and clear standing certificate from District & Sessions Bar Association, Alwar.'
      },
      {
        step_no: 4,
        title: 'Disbursement of Statutory Slab Amount',
        description: 'Trustee Committee computes years of practice and disburses the statutory slab amount directly via RTGS.'
      }
    ],
    checklist: [
      'Section 17 Cessation of Practice Claim Form',
      'Surrender of Original Enrolment Certificate (Sanad)',
      'Alwar Bar Association No-Dues & Clear Standing Certificate',
      'Affidavit of voluntary non-practice before any Court or Tribunal in India',
      'Cancelled Cheque with printed advocate name & Bank IFSC'
    ],
    nodal_submission: 'Secretary, Bar Council of Rajasthan, High Court Campus, Jodhpur'
  },
  {
    id: 'guide-stipend',
    title_en: 'Young Advocate Monthly Financial Stipend (First 3 Years)',
    title_hi: 'युवा अधिवक्ता मासिक वृत्ति (स्टाइपेंड) आवेदन प्रक्रिया',
    timeline: 'Quarterly sanction cycles (Next cycle: 30 November)',
    target_benefit: '₹5,000 / Month for 2 Years (Total ₹1,20,000)',
    form_code: 'RajSSO Online / Law Dept Form',
    form_download_url: 'https://law.rajasthan.gov.in',
    steps: [
      {
        step_no: 1,
        title: 'Eligibility Verification',
        description: 'Advocate must be below 30 years of age and within the first 3 years of enrollment with Bar Council of Rajasthan.'
      },
      {
        step_no: 2,
        title: 'Chamber Attachment Certificate',
        description: 'Obtain declaration of chamber attachment from a senior advocate of Alwar Bar with minimum 10 years of practice.'
      },
      {
        step_no: 3,
        title: 'Forwarding by District Judge Alwar',
        description: 'Forward the dossier through President, Alwar Bar Association to the District & Sessions Judge, Alwar for statutory endorsement.'
      },
      {
        step_no: 4,
        title: 'Monthly DBT via RajSSO Portal',
        description: 'Apply on RajSSO portal; stipend is directly transferred monthly into the young advocate’s savings account.'
      }
    ],
    checklist: [
      'Bar Council Sanad & Identity Card Copy',
      'Class 10 Certificate (Date of Birth proof under 30 yrs)',
      'Senior Advocate Chamber Attachment Undertaking',
      'District & Sessions Judge Alwar Recommendation',
      'Bank Passbook linked with Aadhaar / Jan Aadhaar'
    ],
    nodal_submission: 'Office of District & Sessions Judge, Alwar & Law Dept, Jaipur'
  },
  {
    id: 'guide-revival',
    title_en: 'Revival of Discontinued Welfare Membership (Form 28)',
    title_hi: 'रुकी हुई कल्याण कोष सदस्यता पुनर्जीवित कराने की प्रक्रिया',
    timeline: 'Sanctioned within 30 days of paying arrears',
    target_benefit: 'Re-activation of continuous years for death & retirement claims',
    form_code: 'Circular 28.doc',
    form_download_url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=Circular/28.doc',
    steps: [
      {
        step_no: 1,
        title: 'Check Outstanding Dues on BCR Portal',
        description: 'Visit the official RAWF Dues List system and compute the outstanding subscription for your gap years.'
      },
      {
        step_no: 2,
        title: 'Fill Form 28 (Revival Petition)',
        description: 'State valid grounds for non-payment during the hiatus and provide updated chamber address.'
      },
      {
        step_no: 3,
        title: 'Deposit Arrears with Statutory Penalty',
        description: 'Pay pending subscription arrears and late fee through Bank Demand Draft payable to "Rajasthan Advocates Welfare Fund, Jodhpur".'
      },
      {
        step_no: 4,
        title: 'Issuance of Good Standing Order',
        description: 'Trustee Committee issues revival certificate restoring continuity of membership.'
      }
    ],
    checklist: [
      'Form 28 Membership Revival Application',
      'Affidavit explaining grounds for non-deposit of dues',
      'Demand Draft / e-Payment receipt of arrears',
      'Alwar Bar Association current practice certificate'
    ],
    nodal_submission: 'Trustee Committee Office, Bar Council of Rajasthan, Jodhpur'
  }
];

export const COURT_STAMP_RULES: CourtStampRule[] = [
  {
    court_name: 'District & Sessions Court, Alwar (Civil & Criminal)',
    court_name_hi: 'जिला एवं सत्र न्यायालय, अलवर (दीवानी एवं फौजदारी)',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹5.00',
    bar_stamp_amount: '₹10.00',
    total_standard_cost: '₹155.00',
    notes: 'Mandatory on every Vakalatnama in trial suits, bail petitions, and criminal appeals.'
  },
  {
    court_name: 'CJM, ACJM & Judicial Magistrate Courts, Alwar',
    court_name_hi: 'मुख्य न्यायिक मजिस्ट्रेट (CJM) एवं अधीनस्थ अदालतें, अलवर',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹5.00',
    bar_stamp_amount: '₹10.00',
    total_standard_cost: '₹155.00',
    notes: 'Required for bail bonds, appearance in police challans, and 138 NI Act trials.'
  },
  {
    court_name: 'Revenue Courts (Board of Revenue, SDO, ACM, Tehsildar)',
    court_name_hi: 'राजस्व न्यायालय (संभागीय आयुक्त, SDO, तहसीलदार, नायब तहसीलदार)',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹5.00',
    bar_stamp_amount: '₹10.00',
    total_standard_cost: '₹155.00',
    notes: 'Mandatory under Section 27 for mutation, tenancy partition, and revenue appeals.'
  },
  {
    court_name: 'Motor Accident Claims Tribunal (MACT) & Family Court, Alwar',
    court_name_hi: 'मोटर दुर्घटना दावा अधिकरण (MACT) एवं पारिवारिक न्यायालय, अलवर',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹5.00',
    bar_stamp_amount: '₹10.00',
    total_standard_cost: '₹155.00',
    notes: 'Affixed on original claim petition Vakalatnama and defense vakalatnamas.'
  },
  {
    court_name: 'Commercial Court & Labour Tribunal, Alwar / Bhiwadi',
    court_name_hi: 'वाणिज्यिक न्यायालय एवं श्रम न्यायालय, अलवर/भिवाड़ी',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹10.00',
    bar_stamp_amount: '₹10.00',
    total_standard_cost: '₹160.00',
    notes: 'Applies to commercial arbitration petitions, pre-institution mediation, and labor disputes.'
  },
  {
    court_name: 'High Court of Judicature for Rajasthan (Jaipur / Jodhpur Bench)',
    court_name_hi: 'माननीय राजस्थान उच्च न्यायालय (जयपुर एवं जोधपुर पीठ)',
    rawf_stamp_amount: '₹140.00',
    court_fee_amount: '₹10.00',
    bar_stamp_amount: '₹50.00',
    total_standard_cost: '₹200.00',
    notes: 'RAWF Stamp ₹140 + High Court Bar Association Welfare Stamp ₹50.'
  }
];

export const WELFARE_FAQS: WelfareFaq[] = [
  {
    question_en: 'Is the lump-sum retirement or death claim amount taxable under Income Tax?',
    question_hi: 'क्या सेवानिवृत्ति अथवा मृत्यु पर मिलने वाली कल्याण कोष की राशि पर इनकम टैक्स कटता है?',
    answer_en: 'No. Benefit payments disbursed under the statutory Rajasthan Advocates Welfare Fund Act, 1987 are strictly exempt from Income Tax deductions under Section 10(10D) / statutory welfare provisions. No TDS is deducted, and the entire amount is received tax-free.',
    answer_hi: 'नहीं। राजस्थान अधिवक्ता कल्याण निधि अधिनियम, 1987 के तहत मिलने वाली राशि पूर्णतः आयकर मुक्त है। इस पर कोई टीडीएस (TDS) नहीं कटता और 100% राशि सीधे खाते में प्राप्त होती है।',
    category: 'tax'
  },
  {
    question_en: 'What happens if an advocate transferred from another State Bar Council (e.g. Delhi or Punjab)?',
    question_hi: 'यदि कोई अधिवक्ता किसी अन्य राज्य बार कौंसिल से राजस्थान में ट्रांसफर हुआ है, तो क्या पुरानी प्रैक्टिस के वर्ष जुड़ते हैं?',
    answer_en: 'As per Bar Council of Rajasthan rules and Section 17, when an advocate formally transfers under Section 18 of the Advocates Act with transfer certificate, the continuous practice years can be considered provided the advocate deposits the requisite RAWF transfer entry fee and ensures unhampered subscription continuity.',
    answer_hi: 'अधिवक्ता अधिनियम की धारा 18 के तहत विधिवत ट्रांसफर कराने और आवश्यक कल्याण कोष ट्रांसफर शुल्क जमा करने पर निरंतरता के नियम अनुसार पूर्व सेवा वर्षों की गणना का लाभ प्राप्त किया जा सकता है।',
    category: 'transfer'
  },
  {
    question_en: 'Can an advocate update nominee beneficiary anytime after marriage or family changes?',
    question_hi: 'क्या विवाह अथवा परिवार में बदलाव के बाद नॉमिनी का नाम कभी भी बदला जा सकता है?',
    answer_en: 'Yes. An advocate can update or change their nominee anytime by submitting Form 3 (Application for Change/Cancellation of Nomination) along with the nominee’s Aadhaar, relationship certificate, and an affidavit through the Alwar Bar Association to the Trustee Committee Jodhpur.',
    answer_hi: 'हाँ। अधिवक्ता कभी भी प्रपत्र-3 (Form 3) भरकर, नॉमिनी का आधार कार्ड व शपथ-पत्र संलग्न करके अलवर बार के माध्यम से ट्रस्टी कमेटी को भेजकर अपना नॉमिनी बदल सकते हैं।',
    category: 'nominee'
  },
  {
    question_en: 'What is the mandatory minimum practice period to become eligible for retirement claim?',
    question_hi: 'सेवानिवृत्ति पर कल्याण कोष राशि पाने के लिए न्यूनतम कितने वर्ष की वकालत आवश्यक है?',
    answer_en: 'Under Section 17(1) of the RAWF Act, a minimum of 5 completed years of continuous membership and practice is required to qualify for slab benefits. For cessation prior to 5 years, only aggregate subscriptions paid are refunded with statutory interest.',
    answer_hi: 'अधिनियम की धारा 17(1) के तहत न्यूनतम 5 वर्ष की निरंतर वकालत एवं सदस्यता अनिवार्य है। 5 वर्ष से कम होने पर केवल जमा किया गया अंशदान ब्याज सहित वापस दिया जाता है।',
    category: 'eligibility'
  },
  {
    question_en: 'How does an advocate obtain the Cashless Mediclaim E-Card?',
    question_hi: 'अधिवक्ता कैशलेस मेडिक्लेम ई-कार्ड कैसे प्राप्त कर सकते हैं?',
    answer_en: 'Advocates enrolled under the annual Group Mediclaim Scheme can download their digital e-Card directly from the BCR mobile portal or insurance TPA portal by verifying their BCR Enrollment Number and date of birth. Physical cards can also be collected from Alwar Bar Association Office Counter No. 1.',
    answer_hi: 'ग्रुप मेडिक्लेम में नामांकित अधिवक्ता अपनी सनद संख्या और जन्मतिथि दर्ज करके डिजिटल ई-कार्ड ऑनलाइन डाउनलोड कर सकते हैं या अलवर बार कार्यालय से प्राप्त कर सकते हैं।',
    category: 'process'
  },
  {
    question_en: 'What is the consequence of filing a Vakalatnama without the mandatory ₹140 Welfare Stamp?',
    question_hi: 'वकालतनामे पर ₹140 का कल्याण कोष स्टाम्प न लगाने का क्या परिणाम होता है?',
    answer_en: 'Under Section 27 of the RAWF Act, any Vakalatnama without the prescribed stamp is defective in law. Registry/Munsarim marks a formal objection, and repeated default severely impairs the advocate’s active standing and future claim sanctions.',
    answer_hi: 'धारा 27 के तहत बिना स्टाम्प प्रस्तुत वकालतनामा विधिक रूप से त्रुटिपूर्ण होता है। मुन्सरिम द्वारा आपत्ति लगाई जाती है और ऐसा बार-बार होने पर अधिवक्ता की कल्याण कोष सदस्यता व क्लेम पात्रता प्रभावित होती है।',
    category: 'eligibility'
  }
];
