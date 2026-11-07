'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Building2, Shield, FileText, CheckCircle2, User, 
  Award, Download, ExternalLink, Search, Clock, 
  CreditCard, AlertCircle, X, ChevronRight, CheckSquare, 
  HelpCircle, ArrowRight, Stamp, Landmark, Phone, Mail, 
  UserCheck, ShieldCheck, FileSpreadsheet, Lock, ChevronUp
} from 'lucide-react';

interface BCRApplication {
  id: string;
  titleEn: string;
  titleHi: string;
  category: 'welfare' | 'certificate' | 'enrolment' | 'admin';
  fee: string;
  processingTime: string;
  descriptionEn: string;
  descriptionHi: string;
  eligibilityEn: string;
  eligibilityHi: string;
  documents: string[];
  pdfDownloadUrl?: string;
  bcrDirectUrl: string;
}

const BCR_APPLICATIONS: BCRApplication[] = [
  {
    id: 'bcr-rawf',
    titleEn: 'RAJASTHAN ADVOCATE WELFARE FUND',
    titleHi: 'राजस्थान अधिवक्ता कल्याण कोष',
    category: 'welfare',
    fee: '₹2,000 (वार्षिक) / लाइफ टाइम विकल्प',
    processingTime: '7 कार्यदिवस',
    descriptionEn: 'Statutory welfare fund membership providing financial security, death claim up to ₹10,00,000, and emergency medical ex-gratia up to ₹2,00,000.',
    descriptionHi: 'राजस्थान अधिवक्ता कल्याण कोष अधिनियम 1987 के तहत सांविधिक सदस्यता। ₹10,00,000 तक मृत्यु हितलाभ एवं ₹2,00,000 तक गंभीर बीमारी सहायता।',
    eligibilityEn: 'All advocates actively enrolled on the live roll of the Bar Council of Rajasthan practicing in District Courts.',
    eligibilityHi: 'बार काउंसिल ऑफ राजस्थान में नामांकित समस्त नियमित प्रैक्टिसिंग अधिवक्ता।',
    documents: [
      'नामांकन प्रमाण पत्र (Sanad Copy)',
      'अलवर बार एसोसिएशन सदस्यता निरंतरता प्रमाण पत्र',
      'नामांकन (Nominee) घोषणा प्रपत्र Form C',
      'बैंक पासबुक/कैंसल्ड चेक की प्रति'
    ],
    pdfDownloadUrl: '/downloads/bcr-alwar-rawf-dues-list.pdf',
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-renewal',
    titleEn: 'APPLICATION FOR RENEWAL',
    titleHi: 'नवीनीकरण के लिए आवेदन',
    category: 'enrolment',
    fee: '₹500 (Prescribed BCI Verification Fee)',
    processingTime: '15-21 कार्यदिवस',
    descriptionEn: 'Mandatory 5-year renewal of Certificate of Practice (COP) under Bar Council of India Certificate and Place of Practice (Verification) Rules.',
    descriptionHi: 'बार काउंसिल ऑफ इंडिया सत्यापन नियमों के तहत वकालत प्रमाण पत्र (COP) का 5-वर्षीय अनिवार्य नवीनीकरण।',
    eligibilityEn: 'Enrolled advocates who have completed 5 years of active practice since enrolment or previous renewal.',
    eligibilityHi: 'जिन अधिवक्ताओं के नामांकन अथवा पिछले नवीनीकरण को 5 वर्ष पूर्ण हो चुके हैं।',
    documents: [
      'पिछले 5 वर्षों के 5 वकालतनामे अथवा अदालती उपस्थिति आदेश',
      'अधिवक्ता पहचान पत्र की प्रति',
      'A.I.B.E. उत्तीर्ण प्रमाण पत्र (यदि 2010 के पश्चात नामांकित हैं)'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-id-card',
    titleEn: 'APPLICATION FOR IDENTITY CARD',
    titleHi: 'पहचान पत्र के लिए आवेदन',
    category: 'certificate',
    fee: '₹250 (नया / नवीनीकरण) | ₹500 (डुप्लीकेट)',
    processingTime: '10-14 कार्यदिवस',
    descriptionEn: 'Official high-security digital Identity Card issued by the Bar Council of Rajasthan for court entry and professional verification.',
    descriptionHi: 'कोर्ट परिसर में प्रवेश, बार रूम व सरकारी दफ्तरों में पहचान हेतु बार काउंसिल द्वारा जारी आधिकारिक डिजिटल आईडी कार्ड।',
    eligibilityEn: 'All advocates enrolled with Bar Council of Rajasthan with cleared welfare fund dues.',
    eligibilityHi: 'बार काउंसिल ऑफ राजस्थान के समस्त नियमित पंजीकृत सदस्य जिनका कल्याण कोष बकाया न हो।',
    documents: [
      'पासपोर्ट साइज फोटो (काले कोट व टाई/बैंड में)',
      'सनद की छायाप्रति',
      'वर्तमान निवास एवं चैंबर पते का प्रमाण'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-continuity',
    titleEn: 'APPLICATION FOR EXPERIENCE / CONTINUITY CERTIFICATE',
    titleHi: 'अनुभव / निरंतरता प्रमाण पत्र के लिए आवेदन',
    category: 'certificate',
    fee: '₹1,000 प्रति प्रमाण पत्र',
    processingTime: '5-7 कार्यदिवस',
    descriptionEn: 'Official standing and continuous practice certificate issued by the Secretary, Bar Council of Rajasthan for Judicial Services (RJS / ADJ), Public Prosecutor (APP), or Bank Empanelment.',
    descriptionHi: 'न्यायिक सेवा (RJS/ADJ), लोक अभियोजक (APP), अथवा बैंक व सरकारी उपक्रमों में पैनल अधिवक्ता हेतु आवश्यक अनुभव व निरंतर वकालत प्रमाण पत्र।',
    eligibilityEn: 'Advocates with continuous, uninterrupted practice on the live roll without any disciplinary proceedings.',
    eligibilityHi: 'बार काउंसिल के लाइव रोल पर निरंतर प्रैक्टिसिंग अधिवक्ता जिनके विरुद्ध कोई अनुशासनात्मक कार्यवाही लंबित न हो।',
    documents: [
      'अलवर जिला बार एसोसिएशन के अध्यक्ष/सचिव द्वारा सत्यापित निरंतरता प्रमाण पत्र',
      'कल्याण कोष अदेयता प्रमाण पत्र (No Dues Receipt)',
      'सनद की स्वप्रमाणित प्रति'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-notary-noc',
    titleEn: 'APPLICATION FOR NO OBJECTION CERTIFICATE FOR NOTARY PUBLIC',
    titleHi: 'नोटरी पब्लिक के लिए अनापत्ति प्रमाण पत्र के लिए आवेदन',
    category: 'certificate',
    fee: '₹1,500',
    processingTime: '10 कार्यदिवस',
    descriptionEn: 'Mandatory NOC issued by Bar Council for advocates applying for appointment as Central or State Government Notary Public under the Notaries Act, 1952.',
    descriptionHi: 'नोटरी अधिनियम 1952 के तहत केंद्र अथवा राजस्थान सरकार द्वारा नोटरी पब्लिक नियुक्त होने हेतु आवश्यक अनापत्ति प्रमाण पत्र (NOC)।',
    eligibilityEn: 'Advocate must have completed at least 10 years of continuous active legal practice (7 years for SC/ST/Women).',
    eligibilityHi: 'कम से कम 10 वर्ष की निरंतर नियमित वकालत (एससी/एसटी व महिला अधिवक्ताओं हेतु 7 वर्ष)।',
    documents: [
      '10 वर्ष की वकालत अनुभव का रिकॉर्ड',
      'जिला एवं सत्र न्यायाधीश का अनुशंसा पत्र',
      'बार काउंसिल अदेयता प्रमाण पत्र'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-suspension',
    titleEn: 'APPLICATION FOR VOLUNTARY SUSPENSION FROM PRACTICE',
    titleHi: 'वकालत से स्वैच्छिक निलंबन के लिए आवेदन',
    category: 'enrolment',
    fee: '₹500',
    processingTime: '7 कार्यदिवस',
    descriptionEn: 'Statutory application under Section 35 of the Advocates Act when joining government service, judicial post, corporate employment, or active business.',
    descriptionHi: 'अधिवक्ता अधिनियम की धारा 35 के तहत सरकारी नौकरी, न्यायिक सेवा अथवा व्यवसाय में प्रवेश पर वकालत का स्वैच्छिक निलंबन।',
    eligibilityEn: 'Enrolled advocate taking up employment or commercial office of profit.',
    eligibilityHi: 'कोई भी अधिवक्ता जो लाभ के पद, सरकारी सेवा अथवा व्यवसाय में प्रवेश कर रहा हो।',
    documents: [
      'नियुक्ति पत्र / चयन आदेश की प्रति',
      'मूल सनद एवं अधिवक्ता पहचान पत्र जमा करने का हलफनामा',
      'कल्याण कोष क्लीयरेंस'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-resumption',
    titleEn: 'APPLICATION FOR RESUMPTION OF PRACTICE',
    titleHi: 'वकालत की बहाली के लिए आवेदन',
    category: 'enrolment',
    fee: '₹1,000 + निर्धारित बहाल शुल्क',
    processingTime: '15 कार्यदिवस',
    descriptionEn: 'Application to resume active legal practice and re-activate license following retirement, resignation from service, or closure of business.',
    descriptionHi: 'सरकारी सेवा से सेवानिवृत्ति, त्यागपत्र अथवा व्यवसाय समाप्ति के उपरांत पुनः वकालत का लाइसेंस सक्रिय कराने हेतु आवेदन।',
    eligibilityEn: 'Advocates whose practice was suspended voluntarily and who have cleanly relieved from employment.',
    eligibilityHi: 'जिनका नामांकन स्वैच्छिक निलंबित था और सेवा से विधिवत कार्यमुक्त हो चुके हैं।',
    documents: [
      'सरकारी सेवा से सेवानिवृत्ति / कार्यमुक्ति आदेश',
      'सतर्कता अनापत्ति प्रमाण पत्र (Vigilance Clearance)',
      'पुनः वकालत प्रारंभ करने का शपथ पत्र'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-transfer-noc',
    titleEn: 'APPLICATION FOR NO OBJECTION CERTIFICATE FOR TRANSFER OF ENROLMENT',
    titleHi: 'नामांकन के हस्तांतरण हेतु अनापत्ति प्रमाण पत्र के लिए आवेदन',
    category: 'enrolment',
    fee: '₹2,500',
    processingTime: '21 कार्यदिवस',
    descriptionEn: 'Inter-state transfer NOC under Section 18 of the Advocates Act to transfer enrolment from Bar Council of Rajasthan to another State Bar Council (e.g. Delhi, Punjab & Haryana).',
    descriptionHi: 'अधिवक्ता अधिनियम की धारा 18 के अंतर्गत राजस्थान से अन्य राज्य की बार काउंसिल (जैसे दिल्ली बार काउंसिल) में नामांकन ट्रांसफर हेतु NOC।',
    eligibilityEn: 'Enrolled advocate permanently relocating practice to another state or High Court jurisdiction.',
    eligibilityHi: 'अन्य राज्य में नियमित प्रैक्टिस स्थानांतरित करने वाले अधिवक्ता।',
    documents: [
      'नए राज्य में निवास/चैंबर का प्रमाण पत्र',
      'बार काउंसिल ऑफ राजस्थान का अदेयता प्रमाण पत्र',
      'कोई आपराधिक अथवा कदाचार प्रकरण लंबित न होने का शपथ पत्र'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-name-change',
    titleEn: 'APPLICATION FOR CHANGE IN NAME / SURNAME',
    titleHi: 'नाम / उपनाम में परिवर्तन के लिए आवेदन',
    category: 'enrolment',
    fee: '₹1,000',
    processingTime: '10 कार्यदिवस',
    descriptionEn: 'Application to update official advocate roll following marriage, gazette name notification, or correction in surname.',
    descriptionHi: 'विवाह उपरांत महिला अधिवक्ताओं के उपनाम परिवर्तन अथवा सरकारी गजट अधिसूचना के आधार पर नाम संशोधन हेतु।',
    eligibilityEn: 'Any advocate with official legal notification of name change.',
    eligibilityHi: 'सरकारी गजट अथवा विवाह प्रमाण पत्र धारक पंजीकृत अधिवक्ता।',
    documents: [
      'राजस्थान राज्य राजपत्र (Government Gazette Notification)',
      'विवाह प्रमाण पत्र (यदि विवाह उपरांत उपनाम परिवर्तन है)',
      'मूल सनद एवं शपथ पत्र'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-nomination-change',
    titleEn: 'APPLICATION FOR CHANGE / CANCELLATION OF NOMINATION',
    titleHi: 'नॉमिनी के विवरण में परिवर्तन/रद्दीकरण के लिए आवेदन',
    category: 'welfare',
    fee: '₹200',
    processingTime: '5 कार्यदिवस',
    descriptionEn: 'Statutory form to change, update, or cancel nominee for Rajasthan Advocates Welfare Fund death benefits (Form C under Welfare Fund Rules).',
    descriptionHi: 'राजस्थान अधिवक्ता कल्याण कोष में मृत्यु सहायता हेतु अपने नामित (Nominee) परिजन का नाम बदलने अथवा संशोधित करने हेतु।',
    eligibilityEn: 'All active members of the Rajasthan Advocates Welfare Fund.',
    eligibilityHi: 'कल्याण कोष के समस्त सक्रिय अंशदाता अधिवक्ता।',
    documents: [
      'नया नामांकन प्रपत्र (Form C)',
      'नए नॉमिनी के आधार कार्ड व बैंक खाते का विवरण',
      'पुराने नॉमिनी से संबंध परिवर्तन का विवरण'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-duplicate-sanad',
    titleEn: 'APPLICATION FOR ORIGINAL / DUPLICATE ENROLMENT CERTIFICATE',
    titleHi: 'ओरिजिनल / डुप्लीकेट नामांकन प्रमाण पत्र के लिए आवेदन',
    category: 'certificate',
    fee: '₹1,500',
    processingTime: '15 कार्यदिवस',
    descriptionEn: 'Application for duplicate Sanad in the event of loss, theft, damage, or destruction of the original Enrolment Certificate.',
    descriptionHi: 'मूल सनद के गुम, नष्ट अथवा चोरी होने की स्थिति में पुलिस एफआईआर एवं समाचार पत्र विज्ञप्ति के आधार पर डुप्लीकेट सनद प्राप्त करना।',
    eligibilityEn: 'Any advocate who has lost or damaged their original certificate.',
    eligibilityHi: 'मूल सनद खो चुके अथवा क्षतिग्रस्त सनद वाले अधिवक्ता।',
    documents: [
      'पुलिस एफआईआर / लॉस्ट रिपोर्ट की प्रति',
      'दैनिक समाचार पत्र में सनद गुम होने की सार्वजनिक सूचना की मूल कतरन',
      'नोटरी द्वारा सत्यापित क्षतिपूर्ति बंधपत्र (Indemnity Bond)'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-clep',
    titleEn: 'APPLICATION FOR CONTINUING LEGAL EDUCATION PROGRAMME (SUMMER CAMP-2023)',
    titleHi: 'सतत विधि प्रशिक्षण कार्यक्रम हेतु आवेदन (ग्रीष्मकालीन शिविर - 2023)',
    category: 'admin',
    fee: 'निःशुल्क / नाममात्र पंजीकरण',
    processingTime: 'तात्कालिक स्वीकृति',
    descriptionEn: 'Registration for BCI & BCR specialized training programs on new criminal codes (BNS, BNSS, BSA 2023), cyber law, trial advocacy, and judicial continuing education.',
    descriptionHi: 'नए आपराधिक कानूनों (बीएनएस, बीएनएसएस व साक्ष्य अधिनियम), डिजिटल साक्ष्य व कोर्ट वकालत पर राज्य स्तरीय सतत विधि प्रशिक्षण शिविर।',
    eligibilityEn: 'Open to all enrolled advocates and young lawyers with special focus on 0-7 years practice.',
    eligibilityHi: 'समस्त अधिवक्ता साथी विशेषकर 7 वर्ष से कम प्रैक्टिस वाले युवा अधिवक्ता।',
    documents: [
      'बार काउंसिल पहचान पत्र',
      'अलवर बार एसोसिएशन सदस्यता रसीद'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-bci-welfare',
    titleEn: 'BAR COUNCIL OF INDIA ADVOCATE WELFARE FUND',
    titleHi: 'बार काउंसिल ऑफ इंडिया अधिवक्ता कल्याण कोष',
    category: 'welfare',
    fee: '₹1,000 (BCI Rule 40 Subscription)',
    processingTime: '15 कार्यदिवस',
    descriptionEn: 'National advocate welfare fund administered under Rule 40, Chapter II, Part VI of the Bar Council of India Rules providing pan-India advocate benefits.',
    descriptionHi: 'बार काउंसिल ऑफ इंडिया के नियम 40 के तहत अखिल भारतीय अधिवक्ता कल्याण कोष सदस्यता एवं सहायता।',
    eligibilityEn: 'Enrolled advocates in live legal practice.',
    eligibilityHi: 'अखिल भारतीय स्तर पर प्रैक्टिस करने वाले अधिवक्ता।',
    documents: [
      'BCI फॉर्म एवं शपथ पत्र',
      'बार काउंसिल ऑफ राजस्थान एनरोलमेंट कॉपी',
      'स्टेट बार अदेयता प्रमाण पत्र'
    ],
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  },
  {
    id: 'bcr-voters-list',
    titleEn: "FINAL VOTER'S LIST",
    titleHi: 'मतदाता सूची (बार काउंसिल ऑफ राजस्थान चुनाव)',
    category: 'admin',
    fee: 'निःशुल्क (पब्लिक व मतदाता खोज)',
    processingTime: 'तुरंत ऑनलाइन जांच',
    descriptionEn: 'Official final electoral roll published by the Special Committee / Returning Officer for elections to the Bar Council of Rajasthan.',
    descriptionHi: 'बार काउंसिल ऑफ राजस्थान के आम चुनावों हेतु अंतिम मतदाता सूची। अलवर जिले व 18 तहसीलों के वैध मतदाताओं की ऑनलाइन सूची।',
    eligibilityEn: 'All advocates with verified COP and no pending welfare fund dues as on the qualifying electoral cut-off date.',
    eligibilityHi: 'वे सभी अधिवक्ता जिन्होंने सीओपी का सत्यापन कराया हुआ है और जिनका कोई कल्याण कोष बकाया नहीं है।',
    documents: [
      'एनरोलमेंट नंबर द्वारा सीधा स्टेटस सर्च (उदा. R/1420/2012)',
      'वोटर सीरियल नंबर व बूथ विवरण'
    ],
    pdfDownloadUrl: '/downloads/bcr-alwar-rawf-dues-list.pdf',
    bcrDirectUrl: 'https://barcouncilofrajasthan.org/Advocate/Apl/'
  }
];

export default function BCRServicesPage() {
  const { locale } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applications' | 'personal' | 'documents' | 'claim' | 'aibe'>('applications');
  const [selectedApp, setSelectedApp] = useState<BCRApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'welfare' | 'certificate' | 'enrolment' | 'admin'>('all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // Filter applications
  const filteredApps = BCR_APPLICATIONS.filter(app => {
    const matchesSearch = 
      app.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.titleHi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || app.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      
      {/* Official Top Bar Branding */}
      <div className="bg-legal-navyDark border-b border-legal-gold/30 px-4 py-3">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl border border-amber-400/40 shadow-inner">
              राज
            </div>
            <div>
              <div className="text-sm sm:text-base font-serif font-bold text-white flex items-center space-x-2">
                <span>BAR COUNCIL OF RAJASTHAN</span>
                <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-400/30">
                  Advocate Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                बार काउंसिल ऑफ राजस्थान — ऑनलाइन अधिवक्ता सेवा एवं आवेदन पोर्टल (High Court Premises, Jodhpur)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <a
              href="https://barcouncilofrajasthan.org/Advocate/Apl/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center space-x-1.5 transition shadow"
            >
              <span>ऑफिशियल BCR पोर्टल खोलें</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/welfare?tab=dues"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg font-medium transition"
            >
              18 बार ड्यूज लिस्ट
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {authLoading ? (
        <div className="container mx-auto px-4 py-20 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          <span>अधिवक्ता क्रेडेंशियल्स सत्यापित किए जा रहे हैं...</span>
        </div>
      ) : !currentUser ? (
        /* If Not Logged In: Show Professional Advocate Login Required Screen */
        <div className="container mx-auto px-4 py-12 max-w-xl text-center">
          <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-amber-400/30">
              <Lock className="w-8 h-8" />
            </div>
            
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                अधिवक्ता सत्यापन आवश्यक (Advocate Authentication Required)
              </span>
              <h2 className="font-serif font-bold text-2xl text-white mt-3">
                बार काउंसिल ऑफ राजस्थान — अधिवक्ता सेवा पोर्टल
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                यह अनुभाग केवल राजस्थान बार काउंसिल (BCR) में पंजीकृत अधिवक्ताओं के आधिकारिक व गोपनीय कार्यों (जैसे: नवीनीकरण, पहचान पत्र, कल्याण कोष दावा, सनद आदि) के लिए आरक्षित है।
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 text-left text-xs space-y-2 text-slate-300">
              <span className="font-semibold text-amber-400 block mb-1">लॉगिन करने के बाद आप प्राप्त कर सकेंगे:</span>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>समस्त 14 आधिकारिक BCR ऑनलाइन आवेदन एवं प्रपत्र</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>व्यक्तिगत सनद, COP एवं कल्याण कोष स्थिति</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>दावा प्रपत्र (Claim Forms) एवं मतदाता सूची</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs transition shadow-md flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>अधिवक्ता लॉगिन करें (Sign In)</span>
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                मुख्य पृष्ठ पर लौटें
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* If Logged In: Full BCR Dashboard with Sub-Nav and Tabs */
        <>
          {/* BCR Sub-Navigation Bar (Matches the Official Screenshot) */}
          <div className="bg-[#0b172a] border-b border-slate-800 sticky top-14 z-40 shadow-md">
            <div className="container mx-auto px-4">
              <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto text-xs uppercase font-bold tracking-wider py-1 scrollbar-none">
                
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === 'personal'
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>PERSONAL INFORMATION</span>
                </button>

                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === 'documents'
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>DOCUMENTS</span>
                </button>

                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === 'applications'
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>APPLICATIONS (14 सेवाएं)</span>
                </button>

                <button
                  onClick={() => setActiveTab('claim')}
                  className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === 'claim'
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>CLAIM (कल्याण दावा)</span>
                </button>

                <button
                  onClick={() => setActiveTab('aibe')}
                  className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === 'aibe'
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 font-extrabold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>A.I.B.E. STATUS</span>
                </button>

              </div>
            </div>
          </div>

      <div className="container mx-auto px-4 py-8">

        {/* ======================================================== */}
        {/* TAB 1: APPLICATIONS (Matches the 14 Grid Cards in Image) */}
        {/* ======================================================== */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="आवेदन खोजें (Search 14 BCR Applications)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto text-xs">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  सभी (14)
                </button>
                <button
                  onClick={() => setCategoryFilter('welfare')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === 'welfare'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  कल्याण कोष
                </button>
                <button
                  onClick={() => setCategoryFilter('certificate')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === 'certificate'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  प्रमाण पत्र
                </button>
                <button
                  onClick={() => setCategoryFilter('enrolment')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    categoryFilter === 'enrolment'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  नामांकन व नवीनीकरण
                </button>
              </div>
            </div>

            {/* The 14 Applications Grid (Exact Look of the BCR Official Screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filteredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="bg-[#0b1c36] hover:bg-[#112952] border border-white/20 hover:border-amber-400/90 rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group min-h-[145px] relative"
                >
                  <h3 className="font-bold text-sm lg:text-[15px] tracking-wide text-white group-hover:text-amber-300 transition leading-snug">
                    {app.titleEn}
                  </h3>
                  <p className="text-xs lg:text-[13px] text-slate-200 group-hover:text-slate-100 transition mt-2 font-normal leading-relaxed">
                    ({app.titleHi})
                  </p>

                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5 text-[11px] text-amber-400 font-semibold">
                    <span>प्रपत्र व आवेदन देखें</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200/90 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <span>
                  <strong>अलवर जिला एवं सत्र न्यायालय व अधीनस्थ 18 बार संघ:</strong> सभी अधिवक्ता साथी उक्त 14 आवेदनों के प्रपत्र यहाँ से डाउनलोड कर सकते हैं अथवा सीधे BCR ऑनलाइन पोर्टल पर आवेदन कर सकते हैं।
                </span>
              </div>
              <a
                href="https://barcouncilofrajasthan.org/Advocate/Apl/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                BCR लॉगिन करें →
              </a>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PERSONAL INFORMATION */}
        {/* ======================================================== */}
        {activeTab === 'personal' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="font-serif font-bold text-xl text-white">
                  अधिवक्ता व्यक्तिगत विवरण (Advocate Personal Profile)
                </h2>
                <p className="text-xs text-slate-400">
                  बार काउंसिल ऑफ राजस्थान (BCR) एवं अलवर बार एसोसिएशन अधिकृत रिकॉर्ड
                </p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-1 rounded font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Live Roll</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">अधिवक्ता का पूरा नाम:</span>
                <span className="font-bold text-sm text-white">Advocate Anil Sain / राजेश शर्मा</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">सनद / एनरोलमेंट नंबर (Bar Enrolment No):</span>
                <span className="font-bold text-sm text-amber-400 font-mono">R/2268/2009 (Alwar Judgeship)</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">संबद्ध बार एसोसिएशन (Bar Association):</span>
                <span className="font-semibold text-slate-200">District & Sessions Bar Association, Alwar</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">कोर्ट परिसर व चैंबर पता:</span>
                <span className="font-semibold text-slate-200">Chamber No. 42, Civil Wing, District Court Alwar</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">कल्याण कोष सदस्यता स्थिति (RAWF Status):</span>
                <span className="font-bold text-emerald-400">आजीवन सदस्य (Life Time Member • Cleared)</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">वकालत अनुभव (Experience):</span>
                <span className="font-semibold text-slate-200">15+ वर्ष नियमित दीवानी एवं दांडिक वकालत</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApp(BCR_APPLICATIONS.find(a => a.id === 'bcr-continuity') || null)}
                className="px-4 py-2 bg-legal-navy hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold border border-amber-400/30 transition flex items-center space-x-1.5"
              >
                <span>अनुभव प्रमाण पत्र हेतु आवेदन करें →</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DOCUMENTS */}
        {/* ======================================================== */}
        {activeTab === 'documents' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 max-w-4xl mx-auto space-y-5 text-xs">
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-white">
                  अधिवक्ता आधिकारिक दस्तावेज़ (BCR Verified Documents)
                </h2>
                <p className="text-slate-400 text-[11px]">
                  बार काउंसिल एवं जिला न्यायालय अलवर द्वारा जारी मान्य प्रपत्र
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(BCR_APPLICATIONS.find(a => a.id === 'bcr-duplicate-sanad') || null)}
                className="text-amber-400 hover:underline font-medium text-[11px]"
              >
                + नई प्रतिलिपि / डुप्लीकेट का आवेदन
              </button>
            </div>

            <div className="space-y-3">
              {[
                { title: 'मूल नामांकन सनद (Original Sanad Certificate)', code: 'SANAD-BCR-R2268-2009', status: 'वेरिफाइड (Verified)', date: '2009' },
                { title: 'अधिवक्ता कल्याण कोष सदस्यता कार्ड (RAWF Stamp Passbook)', code: 'RAWF-ALW-LTM-0802', status: 'सक्रिय (Active LTM)', date: '2010' },
                { title: 'डिजिटल बार काउंसिल पहचान पत्र (Biometric Smart ID Card)', code: 'BCR-ID-9829012268', status: 'जारी (Issued)', date: '2024' },
                { title: 'वकालत प्रमाण पत्र (Certificate of Practice - COP)', code: 'COP-BCI-RAJ-2015', status: 'नवीनीकृत (Renewed)', date: '2025' }
              ].map((doc, idx) => (
                <div key={idx} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="font-semibold text-white">{doc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{doc.code} • जारी वर्ष: {doc.date}</div>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CLAIM (Welfare Fund Ex-Gratia & Death Claim) */}
        {/* ======================================================== */}
        {activeTab === 'claim' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 max-w-4xl mx-auto space-y-6 text-xs">
            <div className="border-b border-slate-700 pb-3">
              <h2 className="font-serif font-bold text-xl text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>राजस्थान अधिवक्ता कल्याण कोष दावा एवं सहायता (Claim Procedures)</span>
              </h2>
              <p className="text-slate-400 text-[11px]">
                ट्रस्टी कमेटी, राजस्थान अधिवक्ता कल्याण कोष, उच्च न्यायालय परिसर, जोधपुर
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-700 space-y-2">
                <div className="font-bold text-sm text-amber-300">
                  1. मृत्यु उपरांत एकमुश्त सहायता दावा (Demise Claim)
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px]">
                  वकालत के दौरान दुर्भाग्यपूर्ण देहावसान की स्थिति में नामांकित परिजनों को <strong>₹10,00,000 (दस लाख रुपये)</strong> तक की एकमुश्त वित्तीय सहायता।
                </div>
                <div className="text-[10px] text-slate-400">
                  आवश्यक: फॉर्म "D" + मृत्यु प्रमाण पत्र + बार एसोसिएशन निरंतरता प्रमाण पत्र।
                </div>
                <button
                  onClick={() => setSelectedApp(BCR_APPLICATIONS.find(a => a.id === 'bcr-rawf') || null)}
                  className="mt-2 text-amber-400 hover:underline font-semibold block"
                >
                  दावा प्रक्रिया व फॉर्म देखें →
                </button>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-700 space-y-2">
                <div className="font-bold text-sm text-emerald-300">
                  2. गंभीर बीमारी आपातकालीन अनुग्रह सहायता (Medical Ex-Gratia)
                </div>
                <div className="text-slate-300 leading-relaxed text-[11px]">
                  कैंसर, ओपन हार्ट सर्जरी, किडनी ट्रांसप्लांट या ब्रेन सर्जरी जैसी गंभीर बीमारी में तुरंत <strong>₹2,00,000</strong> तक का गैर-वापसी योग्य अनुदान।
                </div>
                <div className="text-[10px] text-slate-400">
                  आवश्यक: फॉर्म "B" + अस्पताल डिस्चार्ज समरी + डॉक्टर का डायग्नोसिस प्रमाण पत्र।
                </div>
                <Link
                  href="/welfare?tab=hospitals"
                  className="mt-2 text-emerald-400 hover:underline font-semibold block"
                >
                  अनुमोदित अस्पताल सूची देखें →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: A.I.B.E. STATUS */}
        {/* ======================================================== */}
        {activeTab === 'aibe' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 max-w-4xl mx-auto space-y-5 text-xs">
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-xl text-white">
                  अखिल भारतीय बार परीक्षा (All India Bar Examination - A.I.B.E.) स्थिति
                </h2>
                <p className="text-slate-400 text-[11px]">
                  Bar Council of India (BCI) Certificate of Practice Status
                </p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-1 rounded font-bold">
                QUALIFIED / EXEMPTED
              </span>
            </div>

            <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>आप भारत के समस्त न्यायालयों में वकालत हेतु पूर्णतः अधिकृत हैं।</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                बार काउंसिल ऑफ इंडिया के नियमों के अनुसार 2010 से पूर्व नामांकित अधिवक्ता AIBE परीक्षा से स्थायी छूट प्राप्त हैं तथा 2010 के पश्चात नामांकित अधिवक्ताओं का COP प्रमाण पत्र नियमित सत्यापित है।
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-4 text-[11px] text-slate-400">
                <span>BCI Verification: Passed</span>
                <span>•</span>
                <span>Jurisdiction: Pan-India Courts</span>
                <span>•</span>
                <a
                  href="https://allindiabarexamination.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <span>ऑफिशियल BCI पोर्टल</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
      </>
      )}

      {/* ======================================================== */}
      {/* MODAL: APPLICATION DETAIL & DOWNLOAD WORKFLOW */}
      {/* ======================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1f38] border border-amber-500/30 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  BCR Official Application
                </span>
                <h3 className="font-serif font-bold text-lg text-white mt-1">
                  {selectedApp.titleEn}
                </h3>
                <p className="text-xs text-amber-200">
                  {selectedApp.titleHi}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview */}
            <div className="text-xs space-y-3">
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">उद्देश्य व विवरण:</span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedApp.descriptionHi}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">सरकारी शुल्क (Fee):</span>
                  <span className="text-amber-400 font-bold">{selectedApp.fee}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">कार्यदिवस (Timeline):</span>
                  <span className="text-slate-200 font-bold">{selectedApp.processingTime}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">आवश्यक दस्तावेज़ (Checklist):</span>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  {selectedApp.documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                बार काउंसिल ऑफ राजस्थान, जोधपुर
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {selectedApp.pdfDownloadUrl && (
                  <a
                    href={selectedApp.pdfDownloadUrl}
                    download
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>प्रपत्र डाउनलोड</span>
                  </a>
                )}
                
                <a
                  href={selectedApp.bcrDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow"
                >
                  <span>BCR पोर्टल पर सीधे भरें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Scroll To Top Button (Matches BCR Official Yellow Floating Button) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-11 h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-2xl flex items-center justify-center transition hover:scale-105 z-40 border border-amber-300"
        title="Scroll to Top (ऊपर जाएं)"
      >
        <ChevronUp className="w-6 h-6 stroke-[2.5]" />
      </button>

    </div>
  );
}
