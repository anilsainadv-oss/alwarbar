'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Building2, Landmark, Users, Award, BookOpen, Scale, 
  FileText, Shield, Download, Phone, Mail, MapPin, Clock, 
  CheckCircle2, ExternalLink, Calendar, Search, Trophy, 
  Coffee, Laptop, UserCheck, ChevronRight, ChevronLeft, 
  AlertCircle, Stamp, HeartHandshake, Plus, Trash2, X, 
  Image as ImageIcon, Eye, Maximize2, Sparkles, Filter, 
  Camera, Upload, LayoutGrid, List, Check, Bell, Gavel
} from 'lucide-react';

interface BarMember {
  id: string;
  name: string;
  enrolment_no: string;
  membership_no: string;
  role_title: string;
  tenure: string;
  is_current: boolean;
  wing: string;
  phone: string;
  email: string;
  chamber: string;
  standing_years?: string;
  photo_url?: string;
  created_at?: string;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  event_date: string;
  is_slider: boolean;
  created_at?: string;
}

interface AlwarCourtJudgment {
  id: string;
  courtNameHi: string;
  courtNameEn: string;
  caseTitle: string;
  caseNo: string;
  bench: string;
  decisionDate: string;
  category: 'sessions' | 'pocso' | 'family' | 'mact' | 'high_court';
  lawAct: string;
  summaryHi: string;
  summaryEn: string;
  significanceHi: string;
  significanceEn: string;
}

interface AlwarCourtNotice {
  id: string;
  titleHi: string;
  titleEn: string;
  issuingAuthorityHi: string;
  issuingAuthorityEn: string;
  date: string;
  eventDate?: string;
  category: 'court' | 'bar' | 'dlsa';
  badgeHi: string;
  badgeEn: string;
  contentHi: string;
  contentEn: string;
}

const ALWAR_COURT_JUDGMENTS: AlwarCourtJudgment[] = [
  {
    id: 'alw-jdg-01',
    courtNameHi: 'जिला एवं सत्र न्यायालय, अलवर',
    courtNameEn: 'District & Sessions Court, Alwar',
    caseTitle: 'State of Rajasthan v. Mukesh & Ors.',
    caseNo: 'Sessions Case No. 84/2025',
    bench: 'Special Bench • District & Sessions Judge, Alwar',
    decisionDate: '28 Oct 2026',
    category: 'sessions',
    lawAct: 'Section 480 BNSS (Regular Bail)',
    summaryHi: 'धारा 480 BNSS (पूर्व धारा 439 CrPC) के अंतर्गत नियमित जमानत: पुलिस डायरी तलब करने हेतु अनावश्यक लंबा समय न दिया जाए; सात कार्यदिवसों के भीतर जमानत याचिका पर गुण-दोष के आधार पर अंतिम निस्तारण अनिवार्य। अनावश्यक न्यायिक अभिरक्षा व्यक्तिगत स्वतंत्रता का हनन है।',
    summaryEn: 'Directing trial courts and police investigators that case diary must be produced within 7 days; prolonged judicial custody without chargesheet is impermissible.',
    significanceHi: 'अलवर सत्र न्यायालय में जमानत याचिकाओं के त्वरित निस्तारण हेतु ऐतिहासिक निर्देश।',
    significanceEn: 'Key procedural guideline for criminal defense practitioners in Alwar Sessions Division.'
  },
  {
    id: 'alw-jdg-02',
    courtNameHi: 'विशेष न्यायालय (पॉक्सो एक्ट प्रकरण) सं. 1, अलवर',
    courtNameEn: 'Special Court (POCSO Act Cases) No. 1, Alwar',
    caseTitle: 'State v. Rameshwar',
    caseNo: 'Special POCSO Case No. 112/2025',
    bench: 'Special Judge, POCSO Act Cases, Alwar',
    decisionDate: '15 Oct 2026',
    category: 'pocso',
    lawAct: 'Section 35 POCSO Act & Indian Evidence Act',
    summaryHi: 'संवेदनशील बाल गवाहों के बयान चाइल्ड-फ्रेंडली रूम में बिना किसी भय के रिकॉर्ड किए जाएं और अभियुक्त का बचाव पक्ष से आमना-सामना स्क्रीन/पर्दे के माध्यम से कराया जाए। जिरह (Cross-examination) एक ही बैठक में पूर्ण की जाए।',
    summaryEn: 'Child victim deposition must be recorded in child-friendly environment behind one-way screen to ensure unbiased, non-retraumatizing testimony in single sitting.',
    significanceHi: 'पॉक्सो न्यायालय अलवर में बाल गवाह संरक्षण नियमों का कड़ाई से अनुपालन।',
    significanceEn: 'POCSO child protection precedent for trial practitioners in Rajasthan.'
  },
  {
    id: 'alw-jdg-03',
    courtNameHi: 'पारिवारिक न्यायालय सं. 1, अलवर',
    courtNameEn: 'Family Court No. 1, Alwar',
    caseTitle: 'Sunita Devi v. Devendra Kumar',
    caseNo: 'Matrimonial Case No. 240/2025',
    bench: 'Judge, Family Court No. 1, Alwar',
    decisionDate: '04 Oct 2026',
    category: 'family',
    lawAct: 'Section 144 BNSS (Maintenance)',
    summaryHi: 'पारिवारिक न्यायालय अलवर: पति द्वारा वास्तविक आय छिपाने की स्थिति में उसके बैंक खाते व जीवनशैली के आधार पर 60 दिवस के भीतर ₹15,000 मासिक अंतरिम भरण-पोषण राशि स्वीकृत। भरण-पोषण में विलंब न्याय से वंचित करने जैसा है।',
    summaryEn: 'Interim maintenance granted within statutory 60 days based on lifestyle and banking transactions when income is concealed by the respondent husband.',
    significanceHi: 'वैवाहिक विवादों में अंतरिम भरण-पोषण के त्वरित आदेश का महत्वपूर्ण दृष्टांत।',
    significanceEn: 'Family law precedent on interim financial support timelines.'
  },
  {
    id: 'alw-jdg-04',
    courtNameHi: 'मोटर दुर्घटना दावा अधिकरण (MACT), अलवर',
    courtNameEn: 'Motor Accident Claims Tribunal (MACT), Alwar',
    caseTitle: 'Geeta Devi & Ors. v. National Insurance Co. Ltd.',
    caseNo: 'MACT Claim No. 38/2025',
    bench: 'Presiding Officer, MACT Alwar',
    decisionDate: '22 Sep 2026',
    category: 'mact',
    lawAct: 'Section 166 Motor Vehicles Act',
    summaryHi: 'मृतक की काल्पनिक आय में 40% भविष्य की संभावना (Future Prospects) जोड़कर ₹24,80,000 का मुआवजा सीधे आश्रितों के बैंक खातों में डीबीटी/पीएफएमएस द्वारा 30 दिन में जमा करने का आदेश। किसी भी बिचौलिए का हस्तक्षेप शून्य घोषित।',
    summaryEn: 'MACT award of ₹24.80 Lakhs with 40% future prospects, directed to be credited electronically via PFMS directly to claimant accounts without intermediaries.',
    significanceHi: 'मुआवजा राशि का सीधा डिजिटल बैंक ट्रांसफर, बिचौलियों से पूर्ण मुक्ति।',
    significanceEn: 'Direct digital disbursement protocol for accidental claim compensation.'
  },
  {
    id: 'alw-jdg-05',
    courtNameHi: 'राजस्थान उच्च न्यायालय, जयपुर पीठ (अलवर न्यायक्षेत्र नजीर)',
    courtNameEn: 'Rajasthan High Court, Jaipur Bench (Alwar Jurisdiction)',
    caseTitle: 'Bhanwar Lal & Ors. v. State of Rajasthan',
    caseNo: '2024 (3) WLC (Raj) 489',
    bench: 'Division Bench, Rajasthan High Court',
    decisionDate: '18 Sep 2024',
    category: 'high_court',
    lawAct: 'Section 480 & 482 BNSS',
    summaryHi: 'धारा 480 व 482 BNSS में समवर्ती क्षेत्राधिकार होने के बावजूद स्थापित न्यायिक अनुशासन के तहत पक्षकार को पहले सत्र न्यायालय अलवर के समक्ष ही जमानत प्रार्थना पत्र प्रस्तुत करना होगा; सीधे उच्च न्यायालय आने पर विशेष असाधारण परिस्थितियों का सिद्ध होना अनिवार्य।',
    summaryEn: 'Litigants must first approach the District & Sessions Court Alwar before invoking High Court jurisdiction under BNSS bail provisions.',
    significanceHi: 'अलवर न्यायक्षेत्र के लिए बाध्यकारी अपीलीय नजीर।',
    significanceEn: 'Binding appellate jurisdictional ruling for subordinate courts in Rajasthan.'
  }
];

const ALWAR_COURT_NOTICES: AlwarCourtNotice[] = [
  {
    id: 'alw-not-01',
    titleHi: 'राष्ट्रीय लोक अदालत (National Lok Adalat) आयोजन — 14 दिसंबर 2026',
    titleEn: 'National Lok Adalat — 14 December 2026',
    issuingAuthorityHi: 'जिला विधिक सेवा प्राधिकरण (DLSA), अलवर',
    issuingAuthorityEn: 'District Legal Services Authority (DLSA), Alwar',
    date: '05 Nov 2026',
    eventDate: '14 Dec 2026',
    category: 'dlsa',
    badgeHi: 'लोक अदालत',
    badgeEn: 'Lok Adalat',
    contentHi: 'अलवर जिला मुख्यालय एवं अधीनस्थ 18 उपखंडीय न्यायालयों में वर्ष 2026 की अंतिम राष्ट्रीय लोक अदालत का आयोजन। चेक बाउंस (Sec 138), मोटर दावा, बैंक रिकवरी, पारिवारिक विवाद एवं शमनीय दांडिक मामलों के राजीनामे हेतु विशेष पीठों का गठन। पक्षकार अपने प्रकरण प्री-काउंसलिंग हेतु तुरंत प्रस्तुत करें।',
    contentEn: 'Organization of final National Lok Adalat 2026 across Alwar headquarters and 18 sub-divisional courts for amicable dispute resolution.'
  },
  {
    id: 'alw-not-02',
    titleHi: 'अलवर जिला बार एसोसिएशन आम सभा बैठक (General Body Meeting)',
    titleEn: 'Alwar Bar Association General Body Meeting',
    issuingAuthorityHi: 'बार एसोसिएशन अलवर (अध्यक्ष: एड. अनिल सैन)',
    issuingAuthorityEn: 'Bar Association Alwar (President: Adv. Anil Sain)',
    date: '06 Nov 2026',
    eventDate: '12 Nov 2026',
    category: 'bar',
    badgeHi: 'बार बैठक',
    badgeEn: 'Bar Meeting',
    contentHi: 'अलवर बार रूम में दोपहर 1:30 बजे आम सभा की विशेष बैठक आयोजित की जाएगी। मुख्य एजेंडा: नए अधिवक्ता चैंबर्स निर्माण, ई-लाइब्रेरी वाई-फाई विस्तार, वेलफेयर टिकट ऑडिट रिपोर्ट एवं युवा अधिवक्ताओं के लिए विधिक कार्यशाला। समस्त सदस्य सादर आमंत्रित हैं।',
    contentEn: 'Special general body meeting of Alwar Bar members at Bar Room regarding new chamber allocations, e-library upgrades, and welfare audit.'
  },
  {
    id: 'alw-not-03',
    titleHi: 'शीतकालीन अवकाशकालीन न्यायिक रोस्टर (Winter Vacation Court Roster)',
    titleEn: 'Winter Vacation Court Roster Notification',
    issuingAuthorityHi: 'कार्यालय जिला एवं सत्र न्यायाधीश, अलवर',
    issuingAuthorityEn: 'Office of the District & Sessions Judge, Alwar',
    date: '01 Nov 2026',
    category: 'court',
    badgeHi: 'कोर्ट रोस्टर',
    badgeEn: 'Court Roster',
    contentHi: 'न्यायालय शीतकालीन अवकाश के दौरान अत्यावश्यक दीवानी एवं दांडिक प्रकरणों, रिमांड व जमानत प्रार्थना पत्रों की सुनवाई हेतु नामित विशेष अवकाशकालीन न्यायाधीशों का साप्ताहिक रोस्टर जारी। संबंधित अधिवक्ता अवकाशकालीन कोर्ट में आवश्यक आवेदन प्रस्तुत कर सकते हैं।',
    contentEn: 'Official designation of vacation bench judicial officers for urgent remands, bails, and injunction applications during judicial recess.'
  },
  {
    id: 'alw-not-04',
    titleHi: 'अधिवक्ता वाहन पार्किंग स्टीकर 2026-27 वितरण',
    titleEn: 'Advocate Vehicle Parking Sticker 2026-27 Distribution',
    issuingAuthorityHi: 'सुरक्षा एवं परिवहन समिति, बार एसोसिएशन अलवर',
    issuingAuthorityEn: 'Bar Security & Transport Committee, Alwar',
    date: '28 Oct 2026',
    category: 'bar',
    badgeHi: 'सुरक्षा व पार्किंग',
    badgeEn: 'Parking & Security',
    contentHi: 'कोर्ट परिसर में अनधिकृत वाहनों के प्रवेश को नियंत्रित करने हेतु बार सदस्यों के दोपहिया व चौपहिया वाहनों के लिए नए बारकोड युक्त स्टीकर बार कार्यालय से सनद व वाहन आरसी दिखाकर निःशुल्क प्राप्त करें। बिना स्टीकर वाहन कोर्ट परिसर में प्रवेश वर्जित रहेगा।',
    contentEn: 'Collection of high-security barcoded vehicle stickers for advocates to ensure designated entry in District Court parking zones.'
  },
  {
    id: 'alw-not-05',
    titleHi: 'BCR 5-वर्षीय COP नवीनीकरण सहायता डेस्क',
    titleEn: 'BCR 5-Year COP Verification Helpdesk',
    issuingAuthorityHi: 'बार काउंसिल ऑफ राजस्थान सम्पर्क प्रकोष्ठ, अलवर',
    issuingAuthorityEn: 'BCR Liaison Cell, Alwar Bar Room',
    date: '22 Oct 2026',
    category: 'dlsa',
    badgeHi: 'COP नवीनीकरण',
    badgeEn: 'COP Renewal',
    contentHi: 'सर्टिफिकेट ऑफ प्रैक्टिस (COP) के 5-वर्षीय अनिवार्य नवीनीकरण हेतु अलवर बार रूम में विशेष सहायता शिविर। समस्त आवश्यक प्रपत्र (Form A/B), कल्याण कोष नो-ड्यूज एवं ऑनलाइन सहायता उपलब्ध कराई जा रही है।',
    contentEn: 'Dedicated assistance desk for mandatory 5-year Certificate of Practice (COP) renewal and welfare fund clearance.'
  }
];

export default function BarAssociationPage() {
  const { locale } = useLanguage();
  
  // Navigation & State (Default: 'gallery' for Bar Events, Slider, Alwar Court Info & Judgments)
  const [activeTab, setActiveTab] = useState<
    'gallery' | 'current-members' | 'previous-members' | 'office-bearers' | 
    'history' | 'constitution' | 'judges' | 'downloads'
  >('gallery');

  const [selectedJudgment, setSelectedJudgment] = useState<AlwarCourtJudgment | null>(null);
  const [judgmentFilter, setJudgmentFilter] = useState<'all' | 'sessions' | 'pocso' | 'family' | 'mact' | 'high_court'>('all');
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'court' | 'bar' | 'dlsa'>('all');

  // Auth User
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isAdmin = currentUser?.role === 'public_admin';

  // Members State
  const [currentMembers, setCurrentMembers] = useState<BarMember[]>([]);
  const [previousMembers, setPreviousMembers] = useState<BarMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedPrevTenure, setSelectedPrevTenure] = useState('all');
  const [memberViewMode, setMemberViewMode] = useState<'cards' | 'table'>('cards');

  // Member Photo Modals & Lightbox
  const [lightboxMember, setLightboxMember] = useState<BarMember | null>(null);
  const [editPhotoMember, setEditPhotoMember] = useState<BarMember | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMemberFileInputRef = useRef<HTMLInputElement>(null);

  // Gallery State
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [sliderImages, setSliderImages] = useState<GalleryItem[]>([]);
  const [galleryCategory, setGalleryCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);

  // Admin Modals State
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [addPhotoModalOpen, setAddPhotoModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // New Member Form Data
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    enrolment_no: '',
    membership_no: '',
    role_title: 'सदस्य (Member)',
    tenure: '2024–2026',
    is_current: true,
    wing: 'Civil Wing',
    phone: '',
    email: '',
    chamber: '',
    standing_years: '',
    photo_url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80'
  });

  // New Photo Form Data
  const [newPhotoForm, setNewPhotoForm] = useState({
    title: '',
    description: '',
    category: 'events',
    image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    event_date: new Date().toISOString().split('T')[0],
    is_slider: true
  });

  // 1. Fetch Auth User
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  // 2. Fetch Members
  const loadMembers = () => {
    setMembersLoading(true);
    fetch('/api/bar-association/members')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCurrentMembers(data.currentMembers || []);
          setPreviousMembers(data.previousMembers || []);
        }
      })
      .catch(console.error)
      .finally(() => setMembersLoading(false));
  };

  // 3. Fetch Gallery
  const loadGallery = () => {
    fetch('/api/bar-association/gallery')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGallery(data.gallery || []);
          setSliderImages(data.sliderImages || []);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadMembers();
    loadGallery();
  }, []);

  // Auto-advance image slider
  useEffect(() => {
    if (sliderImages.length === 0 || isSlidePaused) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length, isSlidePaused]);

  // Upload Photo File Handler (Server Storage)
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/bar-association/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      } else {
        alert(data.error || 'फोटो अपलोड करने में त्रुटि हुई।');
        return null;
      }
    } catch (err: any) {
      alert('Upload Error: ' + err.message);
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Admin Handler: Save Member Photo Update
  const handleSaveMemberPhoto = async () => {
    if (!editPhotoMember || !editingPhotoUrl) return;

    try {
      const res = await fetch('/api/bar-association/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPhotoMember.id,
          photo_url: editingPhotoUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`सदस्य '${editPhotoMember.name}' की फोटो सफलतापूर्वक अपडेट की गई!`);
        setTimeout(() => setActionSuccess(null), 4000);
        setEditPhotoMember(null);
        setEditingPhotoUrl('');
        loadMembers();
      } else {
        alert(data.error || 'फोटो अपडेट करने में त्रुटि।');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Admin Handler: Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.enrolment_no) {
      alert('कृपया अधिवक्ता का नाम एवं सनद नंबर भरें!');
      return;
    }

    try {
      const res = await fetch('/api/bar-association/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberForm)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`अधिवक्ता सदस्य '${newMemberForm.name}' सफलतापूर्वक जोड़ा गया!`);
        setTimeout(() => setActionSuccess(null), 4000);
        setAddMemberModalOpen(false);
        setNewMemberForm({
          name: '',
          enrolment_no: '',
          membership_no: '',
          role_title: 'सदस्य (Member)',
          tenure: '2024–2026',
          is_current: true,
          wing: 'Civil Wing',
          phone: '',
          email: '',
          chamber: '',
          standing_years: '',
          photo_url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80'
        });
        loadMembers();
      } else {
        alert(data.error || 'सदस्य जोड़ने में त्रुटि हुई।');
      }
    } catch (err: any) {
      alert('Network Error: ' + err.message);
    }
  };

  // Admin Handler: Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`क्या आप सदस्य '${name}' को हटाना चाहते हैं?`)) return;
    try {
      const res = await fetch(`/api/bar-association/members?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`सदस्य '${name}' को हटाया गया।`);
        setTimeout(() => setActionSuccess(null), 4000);
        loadMembers();
      } else {
        alert(data.error || 'हटाने में त्रुटि।');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Admin Handler: Add Gallery Photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoForm.title || !newPhotoForm.image_url) {
      alert('कृपया फोटो का शीर्षक एवं इमेज यूआरएल भरें!');
      return;
    }

    try {
      const res = await fetch('/api/bar-association/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhotoForm)
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`नई फोटो '${newPhotoForm.title}' सफलतापूर्वक गैलरी में जोड़ी गई!`);
        setTimeout(() => setActionSuccess(null), 4000);
        setAddPhotoModalOpen(false);
        setNewPhotoForm({
          title: '',
          description: '',
          category: 'events',
          image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
          event_date: new Date().toISOString().split('T')[0],
          is_slider: true
        });
        loadGallery();
      } else {
        alert(data.error || 'फोटो जोड़ने में त्रुटि हुई।');
      }
    } catch (err: any) {
      alert('Network Error: ' + err.message);
    }
  };

  // Admin Handler: Delete Photo
  const handleDeletePhoto = async (id: string, title: string) => {
    if (!confirm(`क्या आप फोटो '${title}' को गैलरी से हटाना चाहते हैं?`)) return;
    try {
      const res = await fetch(`/api/bar-association/gallery?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`फोटो हटाई गई।`);
        setTimeout(() => setActionSuccess(null), 4000);
        loadGallery();
      } else {
        alert(data.error || 'हटाने में त्रुटि।');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Filter Current Members
  const filteredCurrentMembers = currentMembers.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.enrolment_no.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.membership_no.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role_title.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.phone && m.phone.includes(memberSearch));
    const matchesWing = selectedWing === 'all' || (m.wing && m.wing.toLowerCase().includes(selectedWing.toLowerCase()));
    return matchesSearch && matchesWing;
  });

  // Filter Previous Members
  const filteredPrevMembers = previousMembers.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.enrolment_no.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role_title.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesTenure = selectedPrevTenure === 'all' || m.tenure === selectedPrevTenure;
    return matchesSearch && matchesTenure;
  });

  // Filter Gallery
  const filteredGallery = gallery.filter(item => {
    if (galleryCategory === 'all') return true;
    return item.category === galleryCategory;
  });

  // Prescribed Forms
  const barDownloads = [
    {
      id: 'alwar-bar-membership-form',
      titleEn: 'Bar Association Membership Application Form',
      titleHi: 'अलवर जिला बार एसोसिएशन नवीन सदस्यता आवेदन प्रपत्र',
      category: 'Membership',
      fileSize: '245 KB (PDF/DOCX)',
      description: 'Prescribed statutory form for newly enrolled advocates to apply for ordinary or life membership of District & Sessions Bar Association Alwar.',
      fileName: 'Alwar_Bar_Membership_Application_Form_2026.docx'
    },
    {
      id: 'alwar-bar-standard-vakalatnama',
      titleEn: 'Standard Alwar Bar Vakalatnama Form',
      titleHi: 'अलवर जिला एवं सत्र न्यायालय अधिकृत वकालतनामा प्रपत्र',
      category: 'Court Form',
      fileSize: '180 KB (Bilingual Format)',
      description: 'Standard court-accepted Vakalatnama with welfare stamp docket, advocate registration details, and client declaration.',
      fileName: 'Alwar_District_Court_Standard_Vakalatnama_Bilingual.docx'
    },
    {
      id: 'alwar-bar-vehicle-sticker',
      titleEn: 'Advocate Vehicle Parking Sticker Application Form',
      titleHi: 'अधिवक्ता वाहन पार्किंग स्टीकर आवेदन प्रपत्र',
      category: 'Parking & Security',
      fileSize: '150 KB (PDF/DOCX)',
      description: 'Official application for high-security barcode vehicle sticker for authorized entry into District Court parking zones.',
      fileName: 'Alwar_Bar_Vehicle_Sticker_Application.docx'
    },
    {
      id: 'alwar-bar-chamber-allotment',
      titleEn: 'Chamber Allotment & Transfer Form',
      titleHi: 'अधिवक्ता चैंबर आवंटन एवं हस्तांतरण आवेदन प्रपत्र',
      category: 'Chamber Committee',
      fileSize: '210 KB (PDF/DOCX)',
      description: 'Application for allocation of chamber cubicle in the Civil or Criminal Wings under Bar Chamber Allotment Rules.',
      fileName: 'Alwar_Bar_Chamber_Allocation_Rules_Form.docx'
    },
    {
      id: 'alwar-bar-no-dues-certificate',
      titleEn: 'Bar Association No-Dues Application Form',
      titleHi: 'बार एसोसिएशन अदेयता प्रमाण पत्र (No-Dues) आवेदन',
      category: 'Clearance',
      fileSize: '120 KB (PDF/DOCX)',
      description: 'Clearance certificate required for judicial service examinations (RJS/ADJ), notary appointments, or inter-bar transfer.',
      fileName: 'Alwar_Bar_No_Dues_Clearance_Form.docx'
    },
    {
      id: 'alwar-bar-constitution-pdf',
      titleEn: 'Constitution & By-Laws of District Bar Association Alwar',
      titleHi: 'अलवर जिला बार एसोसिएशन संविधान एवं उप-नियम (पूरी नियमावली)',
      category: 'Constitution',
      fileSize: '540 KB (Full Text PDF)',
      description: 'Complete official Constitution, election rules, One Bar One Vote code, disciplinary proceedings, and general body procedures.',
      fileName: 'Alwar_Bar_Association_Constitution_Rules_Full.docx'
    },
    {
      id: 'alwar-bar-welfare-trust-nomination',
      titleEn: 'Bar Mutual Welfare Trust Nomination Form (Form C)',
      titleHi: 'अधिवक्ता कल्याण न्यास नॉमिनी घोषणा प्रपत्र (फॉर्म "सी")',
      category: 'Welfare',
      fileSize: '165 KB (PDF/DOCX)',
      description: 'Statutory declaration of nominee for death benefits and emergency medical ex-gratia assistance under Alwar Bar Trust.',
      fileName: 'Alwar_Bar_Welfare_Trust_Nomination_Form_C.docx'
    },
    {
      id: 'alwar-bar-annual-audit-report',
      titleEn: 'Annual Financial Audit Report & Balance Sheet',
      titleHi: 'बार एसोसिएशन वार्षिक ऑडिट रिपोर्ट एवं आय-व्यय विवरण',
      category: 'Accounts',
      fileSize: '410 KB (Audited Report)',
      description: 'Statutory chartered accountant audited financial statements, revenue from welfare tickets, library fund, and member fees.',
      fileName: 'Alwar_Bar_Annual_Audit_Report_Balance_Sheet.docx'
    }
  ];

  const handleDownloadFile = (doc: typeof barDownloads[0]) => {
    const content = `================================================================================
DISTRICT & SESSIONS BAR ASSOCIATION, ALWAR (RAJASTHAN)
Est. 1948 • Court Complex, Station Road, Alwar - 301001
Official Web Portal: http://localhost:3001/bar-association
================================================================================

DOCUMENT TITLE: ${doc.titleEn.toUpperCase()}
(${doc.titleHi})

CATEGORY: ${doc.category}
DATE GENERATED: ${new Date().toLocaleDateString('hi-IN')}

PRESCRIBED FORM INSTRUCTIONS:
${doc.description}

PARTICULARS OF APPLICANT ADVOCATE:
1. Full Name of Advocate: ____________________________________________________
2. Father's / Husband's Name: ________________________________________________
3. Bar Council of Rajasthan Enrolment No: R / ______ / ________
4. Alwar Bar Association Registration No: ALW / ______ / ________
5. Permanent Residential Address: ____________________________________________
6. Chamber / Office Address at Alwar: ________________________________________
7. Contact Mobile No: ____________________ Email: ___________________________
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(doc.titleHi);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* 1. HERO BRANDING & TOP BANNER */}
      <div className="bg-gradient-to-r from-legal-navyDark via-legal-navy to-legal-navyLight text-white py-10 px-4 border-b border-legal-gold/30">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xl font-serif font-bold text-3xl border border-amber-400/40 shrink-0">
                अ
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                  Apex District Bar Association • Matsya Region (Est. 1948)
                </span>
                <h1 className="font-serif font-extrabold text-2xl sm:text-4xl text-white mt-1 leading-tight">
                  {locale === 'hi' ? 'जिला एवं सत्र बार एसोसिएशन, अलवर' : 'District & Sessions Bar Association, Alwar'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-light mt-0.5">
                  {locale === 'hi' 
                    ? 'District & Sessions Bar Association, Alwar — न्याय, गरिमा, विधिक स्वावलंबन एवं 1,100+ अधिवक्ताओं की शीर्ष संस्था'
                    : 'District & Sessions Bar Association, Alwar — Apex statutory body upholding justice, dignity, and 1,100+ advocates'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 text-slate-200 space-y-0.5 text-right sm:text-left">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">
                  {locale === 'hi' ? 'बार कार्यालय हेल्पलाइन:' : 'Bar Helpline:'}
                </div>
                <div className="font-mono font-bold text-white flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>0144-2334455 / 2334456</span>
                </div>
              </div>

              {/* Admin Privileges Badge */}
              {isAdmin ? (
                <div className="bg-amber-500 text-slate-950 px-3 py-2 rounded-xl font-bold flex items-center space-x-1 shadow">
                  <Sparkles className="w-4 h-4" />
                  <span>{locale === 'hi' ? 'एडमिन मोड सक्रिय (Admin Mode)' : 'Admin Mode Active'}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span>{locale === 'hi' ? 'ℹ️ फोटो/सदस्य जोड़ने हेतु Bar Admin से लॉगिन करें' : 'ℹ️ Sign in as Bar Admin to add members & photos'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="bg-[#0b172a] text-white border-b border-slate-800 sticky top-14 z-40 shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs uppercase font-bold tracking-wider py-1.5 scrollbar-none">
            
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'gallery'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{locale === 'hi' ? 'बार इवेंट्स एवं स्लाइडर' : 'Bar Events & Slider'}</span>
            </button>

            <button
              onClick={() => setActiveTab('current-members')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'current-members'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {locale === 'hi' 
                  ? `वर्तमान सदस्य फोटो गैलरी (${currentMembers.length})` 
                  : `Current Members Gallery (${currentMembers.length})`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('previous-members')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'previous-members'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{locale === 'hi' ? 'पूर्व सदस्य एवं कार्यकारिणी' : 'Past Members & Archives'}</span>
            </button>

            <button
              onClick={() => setActiveTab('office-bearers')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'office-bearers'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{locale === 'hi' ? 'कार्यकारिणी संदेश' : 'Executive Messages'}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>{locale === 'hi' ? 'अलवर बार का इतिहास' : 'Alwar Bar History'}</span>
            </button>

            <button
              onClick={() => setActiveTab('constitution')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'constitution'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{locale === 'hi' ? 'संविधान एवं नियमावली' : 'Constitution & By-Laws'}</span>
            </button>

            <button
              onClick={() => setActiveTab('judges')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'judges'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{locale === 'hi' ? 'न्यायिक अधिकारी रोस्टर' : 'Judges Roster'}</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`px-3.5 py-2.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'downloads'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{locale === 'hi' ? 'डाउनलोड केंद्र (8)' : 'Downloads Hub (8)'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-2 border border-emerald-400/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {downloadSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-blue-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <Download className="w-4 h-4 text-blue-300 shrink-0" />
          <span>डाउनलोड प्रारंभ: {downloadSuccess}</span>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* ========================================================================= */}
        {/* TAB 1: CURRENT BAR MEMBERS PHOTO GALLERY (NEW MODERN DESIGN) */}
        {/* ========================================================================= */}
        {activeTab === 'current-members' && (
          <div className="space-y-6">
            
            {/* Header & Search Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live Roll Photo Gallery • Tenure 2024–2026
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 mt-1 flex items-center space-x-2">
                    <Users className="w-6 h-6 text-amber-600" />
                    <span>{locale === 'hi' ? 'वर्तमान बार सदस्य फोटो गैलरी (Current Bar Members)' : 'Current Bar Members Photo Gallery'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'hi' 
                      ? 'अलवर जिला एवं सत्र बार एसोसिएशन के समस्त सम्मानित सदस्यों की सचित्र फोटो गैलरी व पद विवरण'
                      : 'Pictorial directory and credentials of members of Alwar District & Sessions Bar Association'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
                    <button
                      onClick={() => setMemberViewMode('cards')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                        memberViewMode === 'cards'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={locale === 'hi' ? 'फोटो कार्ड ग्रिड व्यू' : 'Photo Card Grid View'}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">{locale === 'hi' ? 'फोटो ग्रिड' : 'Photo Grid'}</span>
                    </button>
                    <button
                      onClick={() => setMemberViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                        memberViewMode === 'table'
                          ? 'bg-white text-slate-900 shadow'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={locale === 'hi' ? 'सूचीबद्ध डायरेक्टरी व्यू' : 'List Directory View'}
                    >
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">{locale === 'hi' ? 'सूची' : 'List'}</span>
                    </button>
                  </div>

                  {/* Add Member Button */}
                  <button
                    onClick={() => {
                      setNewMemberForm(prev => ({ ...prev, is_current: true, tenure: '2024–2026' }));
                      setAddMemberModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'hi' ? '+ नया सदस्य जोड़ें' : '+ Add Member'}</span>
                  </button>
                </div>
              </div>

              {/* Search & Wing Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder={locale === 'hi' ? 'अधिवक्ता का नाम, सनद (R/2268/2009), सदस्यता नंबर अथवा मोबाइल नंबर से खोजें...' : 'Search by Advocate Name, Sanad (R/2268/2009), Membership No, or Mobile...'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <select
                    value={selectedWing}
                    onChange={e => setSelectedWing(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white"
                  >
                    <option value="all">{locale === 'hi' ? 'सभी विंग्स (All Wings)' : 'All Wings'}</option>
                    <option value="civil">Civil & Constitutional</option>
                    <option value="criminal">Criminal Wing</option>
                    <option value="revenue">Revenue Courts</option>
                    <option value="women">Women Advocates</option>
                    <option value="young">Young Lawyers</option>
                    <option value="commercial">Commercial & Banking</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MEMBER CARDS VIEW (NEW PHOTO GALLERY DESIGN) */}
            {membersLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                अधिवक्ता फोटो गैलरी लोड हो रही है...
              </div>
            ) : filteredCurrentMembers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p>कोई सदस्य नहीं मिला। अपनी सर्च अथवा विंग फिल्टर बदलें।</p>
              </div>
            ) : memberViewMode === 'cards' ? (
              /* NEW PHOTO GALLERY CARDS GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCurrentMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  >
                    {/* Top: Advocate Portrait Image Box */}
                    <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 p-6 text-center">
                          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-serif font-bold shadow-inner mb-2">
                            {member.name.split(' ').slice(-1)[0][0] || 'अ'}
                          </div>
                          <span className="text-xs text-slate-300 font-serif">{member.name}</span>
                          <span className="text-[10px] text-amber-400/80 mt-1">Alwar Bar Association</span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-start justify-between pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-700 text-white px-2.5 py-1 rounded-md shadow-md border border-amber-400/40">
                          {member.role_title}
                        </span>

                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded shadow flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Live</span>
                        </span>
                      </div>

                      {/* Bottom Gradient with Sanad Number */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 pt-6 flex items-end justify-between text-white">
                        <div className="font-mono text-xs text-amber-300 font-bold drop-shadow">
                          {member.enrolment_no}
                        </div>
                        <span className="text-[10px] text-slate-300 font-mono">
                          ID: {member.membership_no}
                        </span>
                      </div>

                      {/* Photo Hover Action Buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        {/* View Large Photo */}
                        <button
                          onClick={() => setLightboxMember(member)}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-950 rounded-lg text-xs font-bold shadow-lg transition flex items-center space-x-1"
                          title={locale === 'hi' ? 'फोटो बड़ा करके देखें' : 'View full size photo'}
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          <span>{locale === 'hi' ? 'फोटो देखें' : 'View Photo'}</span>
                        </button>

                        {/* Change Photo (Admin) */}
                        <button
                          onClick={() => {
                            setEditPhotoMember(member);
                            setEditingPhotoUrl(member.photo_url || '');
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-lg transition flex items-center space-x-1"
                          title={locale === 'hi' ? 'फोटो बदलें अथवा अपलोड करें' : 'Change or upload photo'}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{locale === 'hi' ? 'फोटो बदलें' : 'Change Photo'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Advocate Details & Bio */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-800 transition">
                            {member.name}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium block">
                            {member.wing}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                          {member.chamber && (
                            <div className="flex items-start space-x-1.5 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="truncate">{member.chamber}</span>
                            </div>
                          )}
                          {member.standing_years && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                              <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{locale === 'hi' ? `वकालत अनुभव: ${member.standing_years}+ वर्ष` : `Experience: ${member.standing_years}+ yrs`}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact & Actions Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {member.phone && (
                            <a
                              href={`tel:${member.phone.split('/')[0].trim()}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 rounded-lg text-[11px] font-mono text-slate-700 transition flex items-center space-x-1"
                              title={locale === 'hi' ? 'फोन करें' : 'Call'}
                            >
                              <Phone className="w-3 h-3 text-amber-600" />
                              <span>{member.phone.split('/')[0].trim()}</span>
                            </a>
                          )}
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              title={locale === 'hi' ? 'ईमेल भेजें' : 'Send Email'}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="text-red-600 hover:text-red-800 text-[11px] font-semibold flex items-center space-x-1"
                            title={locale === 'hi' ? 'सदस्य हटाएं' : 'Delete Member'}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{locale === 'hi' ? 'हटाएं' : 'Delete'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE / DIRECTORY VIEW */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">{locale === 'hi' ? 'फोटो व नाम' : 'Photo & Name'}</th>
                        <th className="px-4 py-3.5">{locale === 'hi' ? 'पद / पदनाम' : 'Role / Designation'}</th>
                        <th className="px-4 py-3.5">{locale === 'hi' ? 'सनद / एनरोलमेंट' : 'Sanad / Enrolment'}</th>
                        <th className="px-4 py-3.5">{locale === 'hi' ? 'विंग / कार्यक्षेत्र' : 'Wing / Practice'}</th>
                        <th className="px-4 py-3.5">{locale === 'hi' ? 'चैंबर' : 'Chamber'}</th>
                        <th className="px-4 py-3.5">{locale === 'hi' ? 'मोबाइल' : 'Mobile'}</th>
                        <th className="px-4 py-3.5 text-right">{locale === 'hi' ? 'फोटो विकल्प' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCurrentMembers.map(member => (
                        <tr key={member.id} className="hover:bg-amber-50/40 transition">
                          <td className="px-5 py-3 flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer border border-slate-200 shadow-sm"
                              onClick={() => setLightboxMember(member)}
                            >
                              {member.photo_url ? (
                                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover object-top" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-amber-400 text-sm">
                                  {member.name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-serif font-bold text-slate-900">{member.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{member.membership_no}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-900">
                            {member.role_title}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">
                            {member.enrolment_no}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[11px]">
                            {member.wing}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-[11px]">
                            {member.chamber || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">
                            {member.phone || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setLightboxMember(member)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                                title={locale === 'hi' ? 'फोटो देखें' : 'View Photo'}
                              >
                                {locale === 'hi' ? 'देखें' : 'View'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditPhotoMember(member);
                                  setEditingPhotoUrl(member.photo_url || '');
                                }}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[11px] font-bold"
                                title={locale === 'hi' ? 'फोटो बदलें' : 'Change Photo'}
                              >
                                {locale === 'hi' ? 'बदलें' : 'Change'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BAR EVENTS SLIDER & PHOTO GALLERY */}
        {/* ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-10">
            {/* HERO IMAGE SLIDER */}
            {sliderImages.length > 0 && (
              <div 
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 group h-[260px] sm:h-[400px] lg:h-[480px]"
                onMouseEnter={() => setIsSlidePaused(true)}
                onMouseLeave={() => setIsSlidePaused(false)}
              >
                {sliderImages.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover brightness-[0.75]"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-mono">
                            {slide.category.toUpperCase()}
                          </span>
                          <span className="text-xs text-amber-300 font-mono flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>दिनांक: {slide.event_date}</span>
                          </span>
                        </div>

                        <h2 className="font-serif font-bold text-lg sm:text-3xl text-white drop-shadow-md leading-tight">
                          {slide.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow font-light">
                          {slide.description}
                        </p>
                      </div>

                      <div className="pt-3 flex items-center justify-between">
                        <button
                          onClick={() => setLightboxImage(slide)}
                          className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition text-white border border-white/20"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>फुल स्क्रीन देखें (View Full Screen)</span>
                        </button>

                        <span className="text-xs font-mono text-slate-300">
                          {idx + 1} / {sliderImages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentSlide(prev => (prev + 1) % sliderImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* 1. Alwar Court Highlights Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {locale === 'hi' ? 'स्थापना वर्ष' : 'Established'}
                  </div>
                  <div className="font-serif font-bold text-sm text-slate-900">
                    1948 (Matsya)
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {locale === 'hi' ? 'पंजीकृत सदस्य' : 'Bar Members'}
                  </div>
                  <div className="font-serif font-bold text-sm text-slate-900">
                    1,100+ Advocates
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {locale === 'hi' ? 'सक्रिय अदालतें' : 'Judgeship Courts'}
                  </div>
                  <div className="font-serif font-bold text-sm text-slate-900">
                    42 Courts
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {locale === 'hi' ? 'संबद्ध उपखंड बार' : 'Tehsil Bars'}
                  </div>
                  <div className="font-serif font-bold text-sm text-slate-900">
                    18 Bars
                  </div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 col-span-2 sm:col-span-1">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    {locale === 'hi' ? 'बार हेल्पलाइन' : 'Helpline'}
                  </div>
                  <div className="font-mono font-bold text-xs text-slate-900">
                    0144-2334455
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ALWAR DISTRICT COURT COMPLEX & VITAL INFORMATION */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-slate-200 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {locale === 'hi' ? 'अलवर न्यायक्षेत्र आधिकारिक विवरण' : 'Alwar Judgeship Official Info'}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1 flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>{locale === 'hi' ? 'अलवर जिला कोर्ट परिसर एवं आवश्यक विधिक जानकारी' : 'Alwar District Court Complex & Information'}</span>
                  </h3>
                </div>
                <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{locale === 'hi' ? 'कोर्ट परिसर, स्टेशन रोड, अलवर - 301001' : 'Court Complex, Station Road, Alwar - 301001'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Timings */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-400 transition">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {locale === 'hi' ? 'कोर्ट समय एवं फाइलिंग काउंटर' : 'Court Timings & Filing'}
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>{locale === 'hi' ? 'न्यायिक कार्य:' : 'Court Sittings:'}</span>
                        <strong className="text-slate-900">10:00 AM – 5:00 PM</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>{locale === 'hi' ? 'वाद प्रस्तुतीकरण:' : 'Filing Counter:'}</span>
                        <strong className="text-slate-900">10:30 AM – 3:30 PM</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>{locale === 'hi' ? 'नकल शाखा (CD):' : 'Copying Section:'}</span>
                        <strong className="text-slate-900">10:30 AM – 4:00 PM</strong>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span>{locale === 'hi' ? 'लंच इंटरवल:' : 'Lunch Interval:'}</span>
                        <strong className="text-amber-800">1:00 PM – 1:30 PM</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] bg-slate-50 p-2 rounded-lg text-slate-500 font-medium">
                    {locale === 'hi' ? 'ℹ️ 1st, 3rd, 5th शनिवार कार्य दिवस (2nd व 4th अवकाश)' : 'ℹ️ 1st, 3rd, 5th Saturday working days'}
                  </div>
                </div>

                {/* Card 2: Campus Infrastructure */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-400 transition">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {locale === 'hi' ? 'कोर्ट परिसर संरचना व विंग्स' : 'Campus Layout & Wings'}
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'मुख्य भवन:' : 'Main Wing:'}</strong> {locale === 'hi' ? 'डीजे कोर्ट, एडीजे 1-5, सीजेएम, एसीजेएम 1-4' : 'DJ Court, ADJ 1-5, CJM, ACJM 1-4'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'विशिष्ट न्यायालय:' : 'Special Courts:'}</strong> {locale === 'hi' ? 'पॉक्सो कोर्ट 1-2, SC/ST कोर्ट, NDPS' : 'POCSO 1-2, SC/ST Court, NDPS'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'अधिकरण:' : 'Tribunals:'}</strong> {locale === 'hi' ? 'पारिवारिक कोर्ट 1-2, MACT, कमर्शियल' : 'Family Courts 1-2, MACT, Commercial'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] bg-slate-50 p-2 rounded-lg text-slate-500 font-medium">
                    {locale === 'hi' ? '🏛️ कुल 42 सक्रिय कोर्ट्स (अलवर न्यायक्षेत्र)' : '🏛️ 42 Active Courts in Alwar Judgeship'}
                  </div>
                </div>

                {/* Card 3: e-Courts & Digital Services */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-400 transition">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {locale === 'hi' ? 'ई-कोर्ट्स व डिजिटल सेवाएं' : 'e-Courts & Digital Services'}
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'ई-फाइलिंग 3.0:' : 'e-Filing 3.0:'}</strong> {locale === 'hi' ? '24x7 ऑनलाइन केस एवं जमानत याचिका फाइलिंग' : '24x7 online case and bail filing'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'डिजिटल नकल (CD):' : 'Digital Copies:'}</strong> {locale === 'hi' ? 'सर्टिफाइड कॉपी ऑनलाइन ट्रैकिंग व प्राप्ति' : 'Online certified copy delivery'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'ई-सेवा केंद्र:' : 'e-Sewa Kendra:'}</strong> {locale === 'hi' ? 'कोर्ट मुख्य द्वार पर एडवोकेट सहायता काउंटर' : 'Assistance counter at main court gate'}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href="https://services.ecourts.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg font-semibold flex items-center justify-between transition"
                  >
                    <span>{locale === 'hi' ? 'ई-कोर्ट्स पोर्टल खोलें ↗' : 'e-Courts Official Portal ↗'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Card 4: Legal Aid & Amenities */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-400 transition">
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {locale === 'hi' ? 'विधिक सहायता व बार सुविधाएं' : 'Legal Aid & Bar Amenities'}
                    </h4>
                    <div className="text-xs space-y-1.5 text-slate-600 pt-1">
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'DLSA अलवर:' : 'DLSA Alwar:'}</strong> {locale === 'hi' ? 'एडीआर भवन, निःशुल्क कानूनी सलाह व सहायता' : 'ADR Building, Free legal aid'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'स्थायी लोक अदालत:' : 'Permanent Lok Adalat:'}</strong> {locale === 'hi' ? 'जनोपयोगी सेवाओं के विवादों का त्वरित निपटारा' : 'Public utility disputes'}</span>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>{locale === 'hi' ? 'सेंट्रल लॉ लाइब्रेरी:' : 'Central Law Library:'}</strong> {locale === 'hi' ? 'AIR, SCC, RLR व ई-लाइब्रेरी कंप्यूटर' : 'AIR, SCC, RLR & Online Legal Portals'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] bg-slate-50 p-2 rounded-lg text-slate-500 font-medium">
                    {locale === 'hi' ? '☕ बार कैंटीन, एसी बार रूम व महिला अधिवक्ता कक्ष' : '☕ Bar Canteen, AC Bar Room & Women Bar Room'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. LATEST ALWAR COURT JUDGMENTS & ORDERS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-slate-200 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {locale === 'hi' ? 'नवीनतम न्यायिक निर्णय बैंक' : 'Latest Court Precedent Bank'}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1 flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-amber-600" />
                    <span>{locale === 'hi' ? 'अलवर न्यायालयों के नवीनतम निर्णय व आदेश' : 'Latest Judgments of Alwar Courts'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locale === 'hi' 
                      ? 'जिला एवं सत्र न्यायालय, पॉक्सो, पारिवारिक कोर्ट, MACT अलवर व राजस्थान उच्च न्यायालय की प्रमुख नजीरें'
                      : 'Recent landmark rulings from Sessions, POCSO, Family, MACT Alwar & High Court'}
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                  {[
                    { id: 'all', labelHi: 'सभी (5)', labelEn: 'All (5)' },
                    { id: 'sessions', labelHi: 'सत्र न्यायालय', labelEn: 'Sessions' },
                    { id: 'pocso', labelHi: 'पॉक्सो कोर्ट', labelEn: 'POCSO' },
                    { id: 'family', labelHi: 'पारिवारिक कोर्ट', labelEn: 'Family' },
                    { id: 'mact', labelHi: 'MACT', labelEn: 'MACT' },
                    { id: 'high_court', labelHi: 'उच्च न्यायालय', labelEn: 'High Court' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setJudgmentFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                        judgmentFilter === f.id
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {locale === 'hi' ? f.labelHi : f.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judgments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ALWAR_COURT_JUDGMENTS
                  .filter(j => judgmentFilter === 'all' || j.category === judgmentFilter)
                  .map(judgment => (
                    <div
                      key={judgment.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-lg transition flex flex-col justify-between group space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {locale === 'hi' ? judgment.courtNameHi : judgment.courtNameEn}
                          </span>
                          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold shrink-0">
                            {judgment.decisionDate}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm text-slate-900 group-hover:text-amber-800 transition leading-snug">
                          {judgment.caseTitle}
                        </h4>
                        
                        <div className="text-[11px] font-mono text-slate-500 font-semibold">
                          {judgment.caseNo}
                        </div>

                        <div className="text-[11px] bg-amber-500/10 text-amber-900 font-semibold px-2 py-1 rounded border border-amber-500/20">
                          ⚖️ {judgment.lawAct}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                          {locale === 'hi' ? judgment.summaryHi : judgment.summaryEn}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {locale === 'hi' ? 'सत्यापित आदेश' : 'Verified Order'}
                        </span>
                        <button
                          onClick={() => setSelectedJudgment(judgment)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                        >
                          <span>{locale === 'hi' ? 'विवरण देखें' : 'View Ruling'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 4. LATEST ALWAR COURT & BAR NOTICES, CIRCULARS & NEWS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-slate-200 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {locale === 'hi' ? 'ताजा परिपत्र एवं सूचना बोर्ड' : 'Court & Bar Notice Board'}
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-1 flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <span>{locale === 'hi' ? 'अलवर कोर्ट एवं बार की नवीनतम सूचनाएं व परिपत्र' : 'Latest Alwar Court & Bar Notices'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locale === 'hi'
                      ? 'जिला एवं सत्र न्यायाधीश कार्यालय, बार एसोसिएशन अलवर एवं विधिक सेवा प्राधिकरण द्वारा जारी अधिकृत सूचनाएं'
                      : 'Official notifications issued by District Judge Alwar, Bar Association & DLSA'}
                  </p>
                </div>

                {/* Notice Filter */}
                <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
                  {[
                    { id: 'all', labelHi: 'सभी (5)', labelEn: 'All (5)' },
                    { id: 'court', labelHi: 'कोर्ट रोस्टर', labelEn: 'Court' },
                    { id: 'bar', labelHi: 'बार बैठक व सूचना', labelEn: 'Bar' },
                    { id: 'dlsa', labelHi: 'लोक अदालत व शिविर', labelEn: 'DLSA / Camps' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setNoticeFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                        noticeFilter === f.id
                          ? 'bg-emerald-700 text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {locale === 'hi' ? f.labelHi : f.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notices List Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ALWAR_COURT_NOTICES
                  .filter(n => noticeFilter === 'all' || n.category === noticeFilter)
                  .map(notice => (
                    <div
                      key={notice.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-sm space-y-3 transition flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md font-mono">
                            {locale === 'hi' ? notice.badgeHi : notice.badgeEn}
                          </span>
                          <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>{notice.date}</span>
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-sm text-slate-900 leading-snug">
                          {locale === 'hi' ? notice.titleHi : notice.titleEn}
                        </h4>

                        <div className="text-[11px] text-amber-900 font-semibold flex items-center space-x-1">
                          <Landmark className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{locale === 'hi' ? notice.issuingAuthorityHi : notice.issuingAuthorityEn}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {locale === 'hi' ? notice.contentHi : notice.contentEn}
                        </p>
                      </div>

                      {notice.eventDate && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span>{locale === 'hi' ? 'नियत तिथि / आयोजन:' : 'Scheduled Date:'}</span>
                          <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">
                            {notice.eventDate}
                          </strong>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* 5. Photo Gallery Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-200 gap-4">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 flex items-center space-x-2">
                    <ImageIcon className="w-6 h-6 text-amber-600" />
                    <span>अलवर बार एसोसिएशन फोटो गैलरी</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    शपथ ग्रहण समारोह, राष्ट्रीय लोक अदालत, लॉयर्स प्रीमियर लीग (APL), विधिक कार्यशालाएं एवं ऐतिहासिक परिसर
                  </p>
                </div>

                <button
                  onClick={() => setAddPhotoModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नई फोटो जोड़ें (Upload Photo)</span>
                </button>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map(photo => (
                  <div
                    key={photo.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col justify-between"
                  >
                    <div 
                      className="relative h-52 overflow-hidden cursor-pointer"
                      onClick={() => setLightboxImage(photo)}
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          <span>{photo.event_date}</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-slate-900 group-hover:text-amber-700 transition leading-snug">
                          {photo.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400 font-mono">ID: {photo.id}</span>
                          <button
                            onClick={() => handleDeletePhoto(photo.id, photo.title)}
                            className="text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>हटाएं</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PREVIOUS BAR MEMBERS (ARCHIVES) */}
        {/* ========================================================================= */}
        {activeTab === 'previous-members' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Historical Archives • पूर्व कार्यकारिणी
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                    {locale === 'hi' ? 'पूर्व बार सदस्य एवं पूर्व कार्यकारिणी नामावली' : 'Past Members & Executive Council Archives'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'hi' 
                      ? 'अलवर जिला बार एसोसिएशन के विगत कार्यकालों (2022–2024, 2020–2022, 2018–2020) के निर्वाचित पदाधिकारी व सदस्य'
                      : 'Elected office bearers and members of previous tenures (2022–2024, 2020–2022, 2018–2020) of Alwar District Bar Association'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewMemberForm(prev => ({ ...prev, is_current: false, tenure: '2022–2024' }));
                    setAddMemberModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{locale === 'hi' ? '+ पूर्व सदस्य जोड़ें (Archive)' : '+ Add Past Member'}</span>
                </button>
              </div>

              {/* Tenure Selection */}
              <div className="flex items-center space-x-2 overflow-x-auto text-xs pt-1">
                <span className="text-slate-400 font-semibold shrink-0">
                  {locale === 'hi' ? 'कार्यकाल चुनें:' : 'Select Tenure:'}
                </span>
                {[
                  { id: 'all', label: locale === 'hi' ? 'समस्त पूर्व कार्यकाल' : 'All Past Tenures' },
                  { id: '2022–2024', label: '2022–2024 (R.K. Sharma)' },
                  { id: '2020–2022', label: '2020–2022 (B.B. Yadav)' },
                  { id: '2018–2020', label: '2018–2020 (S.N. Mathur)' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedPrevTenure(t.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                      selectedPrevTenure === t.id
                        ? 'bg-purple-700 text-white font-bold shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Previous Members Grid with Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrevMembers.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative h-60 w-full bg-slate-900 overflow-hidden">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-950 text-purple-300 font-bold text-2xl font-serif">
                        {member.name[0]}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-purple-800 text-white px-2.5 py-1 rounded shadow">
                      {member.role_title}
                    </span>
                    <span className="absolute top-3 right-3 text-[10px] font-mono bg-black/60 text-purple-200 px-2 py-0.5 rounded backdrop-blur-sm">
                      {member.tenure}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-serif font-bold text-sm text-slate-900">{member.name}</h4>
                    <div className="text-[11px] text-slate-500 font-mono">सनद: {member.enrolment_no}</div>
                    {member.chamber && <div className="text-[11px] text-slate-600 truncate">{member.chamber}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OFFICE BEARERS & MESSAGES */}
        {/* ========================================================================= */}
        {activeTab === 'office-bearers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold flex items-center justify-center font-serif text-xl shadow">
                    अ.सै
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                      President Message
                    </span>
                    <h3 className="font-serif font-bold text-lg text-slate-900">Advocate Anil Sain</h3>
                    <p className="text-xs text-slate-500">अध्यक्ष, जिला एवं सत्र बार एसोसिएशन, अलवर</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed border-t pt-3">
                  "अलवर बार एसोसिएशन का इतिहास न्याय, निष्ठा और विधिक गरिमा का अनुपम प्रतीक है। युवा अधिवक्ताओं को मजबूत संबल, सीनियर साथियों को सम्मान, और न्यायालय परिसर में आधुनिक ई-लाइब्रेरी, वातानुकूलित चैंबर्स व पारदर्शी कल्याण योजनाओं का लाभ मिले।"
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center font-serif text-xl shadow">
                    म.मी
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                      General Secretary Message
                    </span>
                    <h3 className="font-serif font-bold text-lg text-slate-900">Advocate Mukesh Kumar Meena</h3>
                    <p className="text-xs text-slate-500">महासचिव, जिला एवं सत्र बार एसोसिएशन, अलवर</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed border-t pt-3">
                  "अलवर बार एसोसिएशन के सभी सम्मानित सदस्यों के दैनिक विधिक कार्यों को सुगम बनाने हेतु यह डिजिटल पोर्टल व हेल्पलाइन समर्पित है। बार रूम सुविधाओं का निरंतर उन्नयन किया जा रहा है।"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: HISTORY (1948 Matsya Union) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              अलवर जिला एवं सत्र बार एसोसिएशन का गौरवशाली इतिहास
            </h2>
            <p>
              18 मार्च 1948 को जब ऐतिहासिक <strong>मत्स्य संघ (Matsya Union)</strong> का गठन हुआ, तब अलवर को विधिक और प्रशासनिक केंद्र के रूप में मान्यता प्राप्त हुई। इसी ऐतिहासिक पृष्ठभूमि में अलवर जिला एवं सत्र न्यायालय और अलवर बार एसोसिएशन की विधिवत स्थापना हुई।
            </p>
            <p>
              अलवर बार एसोसिएशन जिले की समस्त 18 उपखंडीय एवं तहसील बार एसोसिएशनों (बहरोड़, तिजारा, किशनगढ़ बास, राजगढ़, लक्ष्मणगढ़, कठूमर, बानसूर आदि) का शीर्ष मातृ संगठन है।
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONSTITUTION */}
        {/* ========================================================================= */}
        {activeTab === 'constitution' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              बार एसोसिएशन अलवर का संविधान एवं उप-नियम
            </h2>
            <p>
              'एक बार - एक वोट' (One Bar One Vote) नीति, सदस्यता के नियम, चुनाव संहिता एवं अनुशासन समिति के प्रावधान।
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: JUDGES ROSTER */}
        {/* ========================================================================= */}
        {activeTab === 'judges' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              अलवर न्यायक्षेत्र के पीठासीन न्यायिक अधिकारी
            </h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <div><strong>District & Sessions Judge</strong> <span className="text-slate-500 block">District & Sessions Court, Alwar</span></div>
                <span className="font-mono text-amber-800 font-bold">Court Room No. 1</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <div><strong>Special Judge, POCSO Act Cases</strong> <span className="text-slate-500 block">Special Court POCSO No. 1</span></div>
                <span className="font-mono text-amber-800 font-bold">Court Room No. 2</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <div><strong>Judge, Family Court No. 1</strong> <span className="text-slate-500 block">Family Court, Alwar</span></div>
                <span className="font-mono text-amber-800 font-bold">Court Room No. 4</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <div><strong>Chief Judicial Magistrate (CJM)</strong> <span className="text-slate-500 block">CJM Court, Alwar</span></div>
                <span className="font-mono text-amber-800 font-bold">Court Room No. 11</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: DOWNLOADS */}
        {/* ========================================================================= */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <h2 className="font-serif font-bold text-2xl text-slate-900">
                {locale === 'hi' ? 'अलवर बार एसोसिएशन डाउनलोड केंद्र' : 'Alwar Bar Association Downloads Hub'}
              </h2>
              <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {locale === 'hi' ? '8 प्रपत्र उपलब्ध' : '8 Prescribed Forms'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {barDownloads.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{doc.category}</span>
                    <h4 className="font-serif font-bold text-sm text-slate-900 mt-1">{locale === 'hi' ? doc.titleHi : doc.titleEn}</h4>
                    <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{doc.fileSize}</span>
                    <button
                      onClick={() => handleDownloadFile(doc)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{locale === 'hi' ? 'डाउनलोड' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADVOCATE PORTRAIT LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {lightboxMember && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl relative text-white space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setLightboxMember(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* High-Res Portrait Container */}
            <div className="h-96 w-full bg-slate-900 overflow-hidden relative">
              {lightboxMember.photo_url ? (
                <img
                  src={lightboxMember.photo_url}
                  alt={lightboxMember.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-5xl font-serif text-amber-400">
                  {lightboxMember.name[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded shadow">
                  {lightboxMember.role_title}
                </span>
                <h3 className="font-serif font-bold text-2xl text-white mt-1">
                  {lightboxMember.name}
                </h3>
                <div className="text-xs font-mono text-amber-300">
                  {lightboxMember.enrolment_no} • {lightboxMember.membership_no}
                </div>
              </div>
            </div>

            {/* Advocate Full Info in Lightbox */}
            <div className="p-6 pt-0 space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">विंग / क्षेत्राधिकार:</span>
                  <span className="font-bold text-white font-sans">{lightboxMember.wing}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">कार्यकाल:</span>
                  <span className="font-bold text-amber-400">{lightboxMember.tenure}</span>
                </div>
              </div>

              {lightboxMember.chamber && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{lightboxMember.chamber}</span>
                </div>
              )}

              {lightboxMember.phone && (
                <div className="flex items-center space-x-2 font-mono">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lightboxMember.phone}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  जिला एवं सत्र बार एसोसिएशन, अलवर
                </span>
                <button
                  onClick={() => {
                    setEditPhotoMember(lightboxMember);
                    setEditingPhotoUrl(lightboxMember.photo_url || '');
                    setLightboxMember(null);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>फोटो बदलें</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADMIN EDIT/CHANGE MEMBER PHOTO MODAL */}
      {/* ========================================================================= */}
      {editPhotoMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-5 border border-slate-200">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    अधिवक्ता फोटो अपडेट करें (Update Member Photo)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editPhotoMember.name} ({editPhotoMember.enrolment_no})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditPhotoMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview & Options */}
            <div className="space-y-4 text-xs">
              
              {/* Preview Box */}
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-300 shadow">
                  {editingPhotoUrl ? (
                    <img src={editingPhotoUrl} alt="Preview" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                      No Photo
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block text-sm">{editPhotoMember.name}</span>
                  <span className="text-slate-500 block text-[11px]">{editPhotoMember.role_title}</span>
                  <span className="text-emerald-700 font-mono text-[10px] block font-semibold">
                    {editingPhotoUrl ? '✓ फोटो चयनित' : 'कृपया फोटो अपलोड करें अथवा लिंक डालें'}
                  </span>
                </div>
              </div>

              {/* Option A: Upload from Computer */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>विकल्प 1: अपने कंप्यूटर / फोन से फोटो अपलोड करें</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  काले कोट व टाई/बैंड में पासपोर्ट या पोर्ट्रेट फोटो (JPG, PNG, WebP)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImageFile(file);
                      if (url) setEditingPhotoUrl(url);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-semibold text-xs transition shadow-sm flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isUploadingPhoto ? 'अपलोड हो रहा है...' : 'डिवाइस से फोटो चुनें...'}</span>
                </button>
              </div>

              {/* Option B: Enter Direct Web Image URL */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  विकल्प 2: अथवा वेब इमेज लिंक (Photo URL) दर्ज करें:
                </label>
                <input
                  type="url"
                  value={editingPhotoUrl}
                  onChange={e => setEditingPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... या /uploads/..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                />

                {/* Demo Presets Shortcuts */}
                <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                  <span className="text-slate-400">डेमो फोटो प्रीसेट:</span>
                  <button
                    type="button"
                    onClick={() => setEditingPhotoUrl('https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80')}
                    className="text-blue-700 hover:underline"
                  >
                    [पोर्ट्रेट 1]
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80')}
                    className="text-blue-700 hover:underline"
                  >
                    [पोर्ट्रेट 2]
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPhotoUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80')}
                    className="text-blue-700 hover:underline"
                  >
                    [महिला वकील]
                  </button>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditPhotoMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  disabled={!editingPhotoUrl}
                  onClick={handleSaveMemberPhoto}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs shadow transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>फोटो सेव करें (Save Photo)</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GALLERY EVENT LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative text-white space-y-4">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-[320px] sm:h-[480px] w-full bg-black flex items-center justify-center overflow-hidden">
              <img
                src={lightboxImage.image_url}
                alt={lightboxImage.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-6 pt-0 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-amber-400">
                <span className="uppercase font-bold tracking-wider">{lightboxImage.category}</span>
                <span>•</span>
                <span>{lightboxImage.event_date}</span>
              </div>
              <h3 className="font-serif font-bold text-xl text-white">
                {lightboxImage.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lightboxImage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADMIN ADD MEMBER MODAL (WITH DIRECT PHOTO UPLOAD & PRESETS) */}
      {/* ========================================================================= */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 text-slate-900 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {newMemberForm.is_current ? 'वर्तमान बार सदस्य जोड़ें' : 'पूर्व बार सदस्य जोड़ें (Archive)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर बार एसोसिएशन अधिकृत डायरेक्टरी प्रविष्टि एवं फोटो अपलोड
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              
              {/* Photo Input & Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">सदस्य की फोटो (Advocate Photo)</span>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shrink-0">
                    {newMemberForm.photo_url ? (
                      <img src={newMemberForm.photo_url} alt="Preview" className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={addMemberFileInputRef}
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImageFile(file);
                          if (url) setNewMemberForm({ ...newMemberForm, photo_url: url });
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => addMemberFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isUploadingPhoto ? 'अपलोड हो रहा है...' : 'डिवाइस से फोटो चुनें'}</span>
                    </button>
                    
                    <input
                      type="url"
                      value={newMemberForm.photo_url}
                      onChange={e => setNewMemberForm({ ...newMemberForm, photo_url: e.target.value })}
                      placeholder="अथवा फोटो URL डालें..."
                      className="w-full px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">अधिवक्ता का पूरा नाम *</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={e => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="Advocate Anil Sain"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">सनद / एनरोलमेंट नंबर *</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.enrolment_no}
                    onChange={e => setNewMemberForm({ ...newMemberForm, enrolment_no: e.target.value })}
                    placeholder="R/2268/2009"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">पद / पदनाम (Role Title) *</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.role_title}
                    onChange={e => setNewMemberForm({ ...newMemberForm, role_title: e.target.value })}
                    placeholder="अध्यक्ष / उपाध्यक्ष / सदस्य"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">कार्यकाल (Tenure)</label>
                  <input
                    type="text"
                    value={newMemberForm.tenure}
                    onChange={e => setNewMemberForm({ ...newMemberForm, tenure: e.target.value })}
                    placeholder="2024–2026 या 2022–2024"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">विंग / कार्यक्षेत्र</label>
                  <select
                    value={newMemberForm.wing}
                    onChange={e => setNewMemberForm({ ...newMemberForm, wing: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  >
                    <option value="Civil Wing">Civil Wing</option>
                    <option value="Criminal Wing">Criminal Wing</option>
                    <option value="Revenue Wing">Revenue Courts</option>
                    <option value="Women Advocates Wing">Women Advocates</option>
                    <option value="Young Lawyers Wing">Young Lawyers</option>
                    <option value="Senior Bar">Senior Bar</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">चैंबर / कोर्ट रूम पता</label>
                  <input
                    type="text"
                    value={newMemberForm.chamber}
                    onChange={e => setNewMemberForm({ ...newMemberForm, chamber: e.target.value })}
                    placeholder="Chamber No. 12, Civil Wing"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">मोबाइल नंबर</label>
                  <input
                    type="text"
                    value={newMemberForm.phone}
                    onChange={e => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="0144-2334455 / 9829012345"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">सदस्य प्रकार (Status)</label>
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={newMemberForm.is_current}
                        onChange={() => setNewMemberForm({ ...newMemberForm, is_current: true, tenure: '2024–2026' })}
                      />
                      <span>वर्तमान सदस्य</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newMemberForm.is_current}
                        onChange={() => setNewMemberForm({ ...newMemberForm, is_current: false, tenure: '2022–2024' })}
                      />
                      <span>पूर्व सदस्य</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow transition"
                >
                  सुरक्षित करें (Save Member)
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADMIN ADD PHOTO MODAL */}
      {/* ========================================================================= */}
      {addPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-5 border border-slate-200">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    नई फोटो अपलोड करें (Gallery / Slider)
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर बार एसोसिएशन की आधिकारिक फोटो गैलरी व इमेज स्लाइडर
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">फोटो का शीर्षक (Title) *</label>
                <input
                  type="text"
                  required
                  value={newPhotoForm.title}
                  onChange={e => setNewPhotoForm({ ...newPhotoForm, title: e.target.value })}
                  placeholder="उदा. कार्यकारिणी शपथ ग्रहण समारोह 2024"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">इमेज यूआरएल (Image URL) *</label>
                <input
                  type="url"
                  required
                  value={newPhotoForm.image_url}
                  onChange={e => setNewPhotoForm({ ...newPhotoForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-[11px]"
                />
                <div className="pt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-400">डेमो प्रीसेट:</span>
                  <button
                    type="button"
                    onClick={() => setNewPhotoForm({ ...newPhotoForm, image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80', category: 'ceremony' })}
                    className="text-blue-700 hover:underline"
                  >
                    [कोर्ट रूम]
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPhotoForm({ ...newPhotoForm, image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80', category: 'sports' })}
                    className="text-blue-700 hover:underline"
                  >
                    [क्रिकेट APL]
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPhotoForm({ ...newPhotoForm, image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', category: 'events' })}
                    className="text-blue-700 hover:underline"
                  >
                    [मीटिंग/सभा]
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">श्रेणी (Category)</label>
                  <select
                    value={newPhotoForm.category}
                    onChange={e => setNewPhotoForm({ ...newPhotoForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  >
                    <option value="ceremony">शपथ ग्रहण व सभाएं</option>
                    <option value="events">विधिक कार्यशाला व सेमिनार</option>
                    <option value="sports">लॉयर्स प्रीमियर लीग (APL)</option>
                    <option value="campus">कोर्ट परिसर व धरोहर</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">इवेंट दिनांक (Date)</label>
                  <input
                    type="date"
                    value={newPhotoForm.event_date}
                    onChange={e => setNewPhotoForm({ ...newPhotoForm, event_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">विवरण / कैप्शन (Description)</label>
                <textarea
                  rows={2}
                  value={newPhotoForm.description}
                  onChange={e => setNewPhotoForm({ ...newPhotoForm, description: e.target.value })}
                  placeholder="इवेंट अथवा फोटो का संक्षिप्त विवरण..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sliderCheck"
                  checked={newPhotoForm.is_slider}
                  onChange={e => setNewPhotoForm({ ...newPhotoForm, is_slider: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="sliderCheck" className="text-xs text-amber-950 font-medium cursor-pointer">
                  मुख्य इमेज स्लाइडर में भी शामिल करें (Feature in Top Hero Slider)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddPhotoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow transition"
                >
                  गैलरी में जोड़ें (Upload to Gallery)
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ALWAR COURT JUDGMENT DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedJudgment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between border-b pb-4 border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md font-mono">
                  {locale === 'hi' ? selectedJudgment.courtNameHi : selectedJudgment.courtNameEn}
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {selectedJudgment.caseTitle}
                </h3>
                <div className="text-xs font-mono text-slate-500 font-semibold">
                  {selectedJudgment.caseNo} • {selectedJudgment.decisionDate}
                </div>
              </div>

              <button
                onClick={() => setSelectedJudgment(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    {locale === 'hi' ? 'पीठ / न्यायाधीश:' : 'Judicial Bench:'}
                  </span>
                  <span className="text-slate-900 font-serif font-bold">{selectedJudgment.bench}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    {locale === 'hi' ? 'संबद्ध विधिक प्रावधान:' : 'Relevant Section:'}
                  </span>
                  <span className="text-amber-800 font-bold">{selectedJudgment.lawAct}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>{locale === 'hi' ? 'निर्णय का सार एवं न्यायिक निष्कर्ष:' : 'Summary & Judicial Findings:'}</span>
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed space-y-2">
                  <p>{locale === 'hi' ? selectedJudgment.summaryHi : selectedJudgment.summaryEn}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'hi' ? 'अलवर बार व अधिवक्ताओं हेतु विधिक महत्व:' : 'Significance for Alwar Practitioners:'}</span>
                </h4>
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-medium">
                  {locale === 'hi' ? selectedJudgment.significanceHi : selectedJudgment.significanceEn}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                अलवर जिला एवं सत्र न्यायालय नजीर बैंक
              </span>
              <button
                onClick={() => setSelectedJudgment(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
              >
                {locale === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
