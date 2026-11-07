'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';
import { 
  Building2, Landmark, Users, Award, BookOpen, Scale, 
  FileText, Shield, Download, Phone, Mail, MapPin, Clock, 
  CheckCircle2, ExternalLink, Calendar, Search, Trophy, 
  Coffee, Laptop, UserCheck, ChevronRight, ChevronLeft, 
  AlertCircle, Stamp, HeartHandshake, Plus, Trash2, X, 
  Image as ImageIcon, Eye, Maximize2, Sparkles, Filter
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

export default function BarAssociationPage() {
  const { locale } = useLanguage();
  
  // Navigation & State
  const [activeTab, setActiveTab] = useState<
    'gallery' | 'current-members' | 'previous-members' | 'office-bearers' | 
    'history' | 'constitution' | 'judges' | 'downloads'
  >('gallery');

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
    photo_url: ''
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
          photo_url: ''
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

  // Admin Handler: Add Photo
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

  // Bar Association Downloads
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

--------------------------------------------------------------------------------
PARTICULARS OF APPLICANT ADVOCATE:
1. Full Name of Advocate: ____________________________________________________
2. Father's / Husband's Name: ________________________________________________
3. Bar Council of Rajasthan Enrolment No: R / ______ / ________
4. Alwar Bar Association Registration No: ALW / ______ / ________
5. Permanent Residential Address: ____________________________________________
6. Chamber / Office Address at Alwar: ________________________________________
7. Contact Mobile No: ____________________ Email: ___________________________
8. Blood Group: ______ Emergency Contact Person: _____________________________

DECLARATION & VERIFICATION:
I hereby solemnly declare that I am an enrolled practicing advocate on the live roll 
of the Bar Council of Rajasthan and actively practicing at District & Sessions Court, 
Alwar. All details submitted herein are true and correct.

Date: ____________________
Place: Alwar (Rajasthan)

Signature of Advocate: ________________________
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xl font-serif font-bold text-3xl border border-amber-400/40">
                अ
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30">
                  Apex District Bar Association • Matsya Region (Est. 1948)
                </span>
                <h1 className="font-serif font-extrabold text-2xl sm:text-4xl text-white mt-1 leading-tight">
                  जिला एवं सत्र बार एसोसिएशन, अलवर
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-light mt-0.5">
                  District & Sessions Bar Association, Alwar — न्याय, गरिमा, विधिक स्वावलंबन एवं 1,100+ अधिवक्ताओं की शीर्ष संस्था
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 text-slate-200 space-y-0.5 text-right sm:text-left">
                <div className="text-[10px] text-amber-300 uppercase font-semibold">बार कार्यालय हेल्पलाइन:</div>
                <div className="font-mono font-bold text-white flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>0144-2334455 / 2334456</span>
                </div>
              </div>

              {/* Admin Privileges Badge */}
              {isAdmin ? (
                <div className="bg-amber-500 text-slate-950 px-3 py-2 rounded-xl font-bold flex items-center space-x-1 shadow">
                  <Sparkles className="w-4 h-4" />
                  <span>एडमिन मोड सक्रिय (Admin Mode)</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                  <span>ℹ️ सदस्य/फोटो जोड़ने हेतु Admin लॉगिन आवश्यक</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (All 8 Options) */}
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
              <span>फोटो गैलरी एवं स्लाइडर</span>
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
              <span>वर्तमान सदस्य सूची ({currentMembers.length})</span>
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
              <span>पूर्व सदस्य एवं कार्यकारिणी</span>
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
              <span>कार्यकारिणी संदेश</span>
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
              <span>अलवर बार का इतिहास</span>
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
              <span>संविधान एवं नियमावली</span>
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
              <span>न्यायिक अधिकारी रोस्टर</span>
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
              <span>डाउनलोड केंद्र (8)</span>
            </button>

          </div>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-2 border border-emerald-400/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {downloadSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-blue-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-2">
          <Download className="w-4 h-4 text-blue-300" />
          <span>डाउनलोड प्रारंभ: {downloadSuccess}</span>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* ========================================================================= */}
        {/* TAB 1: IMAGE SLIDER & PHOTO GALLERY */}
        {/* ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-10">
            
            {/* 1.1 HERO IMAGE SLIDER (Interactive Carousel) */}
            {sliderImages.length > 0 && (
              <div 
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 group h-[260px] sm:h-[400px] lg:h-[480px]"
                onMouseEnter={() => setIsSlidePaused(true)}
                onMouseLeave={() => setIsSlidePaused(false)}
              >
                {/* Slides */}
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
                    
                    {/* Gradient Overlay & Captions */}
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

                {/* Left & Right Controls */}
                <button
                  onClick={() => setCurrentSlide(prev => (prev - 1 + sliderImages.length) % sliderImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentSlide(prev => (prev + 1) % sliderImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition border border-white/20"
                  title="Next Slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Bottom Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
                  {sliderImages.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentSlide(dotIdx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dotIdx === currentSlide ? 'w-8 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 1.2 CATEGORIZED PHOTO GALLERY GRID */}
            <div className="space-y-6">
              
              {/* Gallery Header & Admin Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-200 gap-4">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 flex items-center space-x-2">
                    <ImageIcon className="w-6 h-6 text-amber-600" />
                    <span>अलवर बार एसोसिएशन फोटो गैलरी (Photo Gallery)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    शपथ ग्रहण समारोह, राष्ट्रीय लोक अदालत, लॉयर्स प्रीमियर लीग (APL), विधिक कार्यशालाएं एवं ऐतिहासिक परिसर
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin ? (
                    <button
                      onClick={() => setAddPhotoModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ नई फोटो जोड़ें (Upload Photo)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setAddPhotoModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                      title="एडमिन के रूप में फोटो जोड़ने का विकल्प"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ फोटो जोड़ें (Admin)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Gallery Filter Categories */}
              <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
                {[
                  { id: 'all', label: 'सभी फोटो (All)' },
                  { id: 'ceremony', label: 'शपथ ग्रहण व सभाएं' },
                  { id: 'events', label: 'विधिक कार्यशाला व सेमिनार' },
                  { id: 'sports', label: 'लॉयर्स प्रीमियर लीग (APL)' },
                  { id: 'campus', label: 'कोर्ट परिसर व धरोहर' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setGalleryCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                      galleryCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
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

                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-md border border-white/20">
                        {photo.category}
                      </span>

                      {photo.is_slider && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow">
                          Slider
                        </span>
                      )}

                      <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4" />
                      </div>
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
        {/* TAB 2: CURRENT BAR MEMBERS LIST (2024–2026) */}
        {/* ========================================================================= */}
        {activeTab === 'current-members' && (
          <div className="space-y-6">
            
            {/* Header & Search Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live Roll • Tenure 2024–2026
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                    वर्तमान बार सदस्य एवं कार्यकारिणी सूची (Current Bar Members)
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर जिला एवं सत्र बार एसोसिएशन के सक्रिय सदस्य, पदाधिकारी एवं चैंबर संपर्क सूची
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setNewMemberForm(prev => ({ ...prev, is_current: true, tenure: '2024–2026' }));
                      setAddMemberModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ नया सदस्य जोड़ें (Add Member)</span>
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
                    placeholder="नाम, सनद नंबर (R/2268/2009), सदस्यता नंबर अथवा मोबाइल नंबर से खोजें..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                <div>
                  <select
                    value={selectedWing}
                    onChange={e => setSelectedWing(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white"
                  >
                    <option value="all">सभी विंग्स (All Wings)</option>
                    <option value="civil">Civil Wing</option>
                    <option value="criminal">Criminal Wing</option>
                    <option value="revenue">Revenue Courts</option>
                    <option value="women">Women Advocates</option>
                    <option value="young">Young Lawyers</option>
                    <option value="commercial">Commercial & Banking</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Current Members Grid Cards */}
            {membersLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                अधिवक्ता सदस्य लोड किए जा रहे हैं...
              </div>
            ) : filteredCurrentMembers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p>कोई सदस्य नहीं मिला। अपनी सर्च अथवा विंग फिल्टर बदलें।</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCurrentMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 font-serif font-bold text-lg flex items-center justify-center shrink-0 shadow">
                            {member.name.split(' ').slice(-1)[0][0] || 'अ'}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 block max-w-fit mb-0.5">
                              {member.role_title}
                            </span>
                            <h4 className="font-serif font-bold text-sm text-slate-900">
                              {member.name}
                            </h4>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          Live
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">सनद / एनरोलमेंट:</span>
                          <span className="font-bold text-amber-900">{member.enrolment_no}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">बार सदस्यता सं.:</span>
                          <span className="text-slate-800">{member.membership_no}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">विंग / विशेषज्ञता:</span>
                          <span className="text-slate-800 font-sans">{member.wing}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        {member.chamber && (
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{member.chamber}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">{member.tenure}</span>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>हटाएं</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PREVIOUS BAR MEMBERS & EXECUTIVE ARCHIVES */}
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
                    पूर्व बार सदस्य एवं पूर्व कार्यकारिणी नामावली
                  </h3>
                  <p className="text-xs text-slate-500">
                    अलवर जिला बार एसोसिएशन के विगत कार्यकालों (2022–2024, 2020–2022, 2018–2020) के निर्वाचित पदाधिकारी व सदस्य
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
                  <span>+ पूर्व सदस्य जोड़ें (Add Archive)</span>
                </button>
              </div>

              {/* Tenure Selection Filter */}
              <div className="flex items-center space-x-2 overflow-x-auto text-xs pt-1">
                <span className="text-slate-400 font-semibold shrink-0">कार्यकाल चुनें:</span>
                {[
                  { id: 'all', label: 'समस्त पूर्व कार्यकाल' },
                  { id: '2022–2024', label: '2022–2024 (अध्यक्ष श्री आर.के. शर्मा)' },
                  { id: '2020–2022', label: '2020–2022 (अध्यक्ष श्री बी.बी. यादव)' },
                  { id: '2018–2020', label: '2018–2020 (अध्यक्ष श्री एस.एन. माथुर)' }
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

            {/* Previous Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPrevMembers.map(member => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-950 text-purple-300 font-serif font-bold text-lg flex items-center justify-center shrink-0 shadow">
                          {member.name.split(' ').slice(-1)[0][0] || 'अ'}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200 block max-w-fit mb-0.5">
                            {member.role_title}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-slate-900">
                            {member.name}
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold">
                        {member.tenure}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">सनद / एनरोलमेंट:</span>
                        <span className="font-bold text-slate-900">{member.enrolment_no}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">वकालत अनुभव:</span>
                        <span className="text-slate-800 font-sans">{member.standing_years || '20+'} वर्ष</span>
                      </div>
                      {member.chamber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px]">चैंबर पता:</span>
                          <span className="text-slate-800 font-sans truncate max-w-[150px]">{member.chamber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">Archive Record</span>
                      <button
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OFFICE BEARERS & MESSAGES (Executive Desk) */}
        {/* ========================================================================= */}
        {activeTab === 'office-bearers' && (
          <div className="space-y-10">
            {/* President & Secretary Message Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* President Message */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-serif font-bold text-2xl shadow shrink-0">
                    अ.सै
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      President Message • अध्यक्षीय संदेश
                    </span>
                    <h2 className="font-serif font-bold text-lg text-slate-900 mt-1">
                      Advocate Anil Sain
                    </h2>
                    <p className="text-xs text-slate-500">
                      अध्यक्ष, जिला एवं सत्र बार एसोसिएशन, अलवर
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2 border-t pt-3 border-slate-100">
                  <p>
                    "प्रिय विद्वान अधिवक्ता साथियों, अलवर बार एसोसिएशन का इतिहास न्याय, निष्ठा और विधिक गरिमा का अनुपम प्रतीक है। हमारा संकल्प है कि युवा अधिवक्ताओं को मजबूत संबल, सीनियर साथियों को सम्मान, और न्यायालय परिसर में आधुनिक ई-लाइब्रेरी, वातानुकूलित चैंबर्स व पारदर्शी कल्याण योजनाओं का लाभ मिले।"
                  </p>
                  <p className="font-medium text-amber-900">
                    "अधिवक्ता सुरक्षा कानून (Advocate Protection Act) का कड़ाई से क्रियान्वयन और 18 तहसीलों के बार संघों का आपसी समन्वय हमारी सर्वोच्च प्राथमिकता है।"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>चैंबर नं. 12, सिविल विंग, अलवर</span>
                  <span className="font-mono text-amber-800 font-semibold">फोन: 0144-2334455</span>
                </div>
              </div>

              {/* General Secretary Message */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-serif font-bold text-2xl shadow shrink-0">
                    म.मी
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      General Secretary Message • महासचिव संदेश
                    </span>
                    <h2 className="font-serif font-bold text-lg text-slate-900 mt-1">
                      Advocate Mukesh Kumar Meena
                    </h2>
                    <p className="text-xs text-slate-500">
                      महासचिव, जिला एवं सत्र बार एसोसिएशन, अलवर
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2 border-t pt-3 border-slate-100">
                  <p>
                    "अलवर बार एसोसिएशन के सभी सम्मानित सदस्यों के दैनिक विधिक कार्यों को सुगम बनाने हेतु यह डिजिटल पोर्टल व हेल्पलाइन समर्पित है। कॉज लिस्ट, ई-फाइलिंग, नए आपराधिक कानूनों (BNS/BNSS) की कार्यशालाएं, और बार रूम सुविधाओं का निरंतर उन्नयन किया जा रहा है।"
                  </p>
                  <p className="font-medium text-blue-900">
                    "किसी भी साथी को विधिक, प्रशासनिक अथवा कल्याण कोष संबंधी समस्या हो, बार कार्यालय सदैव आपके सहयोग के लिए तत्पर है।"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>चैंबर नं. 18, मुख्य विंग, अलवर</span>
                  <span className="font-mono text-blue-800 font-semibold">फोन: 0144-2334457</span>
                </div>
              </div>

            </div>

            {/* Quick Link to Current Member List */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-amber-400 font-bold block">1,100+ पंजीकृत अधिवक्ता सूची</span>
                <span className="text-slate-300">वर्तमान 2024-2026 कार्यकारिणी एवं सभी सम्मानित सदस्यों का विवरण देखें</span>
              </div>
              <button
                onClick={() => setActiveTab('current-members')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                सदस्य सूची देखें →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ALWAR BAR HISTORY (History & Heritage) */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 text-xs text-slate-700 leading-relaxed">
            <div className="border-b pb-4 border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Heritage & Legacy of Matsya Region
              </span>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-2">
                अलवर जिला एवं सत्र बार एसोसिएशन का गौरवशाली इतिहास
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                1948 मत्स्य संघ काल से लेकर आधुनिक ई-कोर्ट युग तक न्याय और जनसेवा की अनूठी 75+ वर्षों की गाथा
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  1. 1948 में मत्स्य संघ एवं जिला न्यायपालिका का गठन
                </h3>
                <p>
                  18 मार्च 1948 को जब अलवर, भरतपुर, धौलपुर और करौली रियासतों को मिलाकर ऐतिहासिक <strong>मत्स्य संघ (Matsya Union)</strong> का गठन हुआ, तब अलवर को विधिक और प्रशासनिक केंद्र के रूप में मान्यता प्राप्त हुई। इसी ऐतिहासिक पृष्ठभूमि में अलवर जिला एवं सत्र न्यायालय की विधिवत स्थापना हुई और अलवर बार एसोसिएशन का जन्म हुआ।
                </p>

                <h3 className="font-serif font-bold text-base text-slate-900 pt-3 border-t border-slate-100">
                  2. 18 अधीनस्थ बार संघों का मातृ संगठन (Apex Bar of 18 Tehsils)
                </h3>
                <p>
                  अलवर बार एसोसिएशन जिले की समस्त 18 उपखंडीय एवं तहसील बार एसोसिएशनों (बहरोड़, तिजारा, किशनगढ़ बास, राजगढ़, लक्ष्मणगढ़, कठूमर, बानसूर, थानागाजी, रामगढ़, खैरथल आदि) का संरक्षक एवं शीर्ष मातृ संगठन है।
                </p>
              </div>

              <div className="bg-legal-navy text-white p-5 rounded-2xl shadow-md space-y-3">
                <h4 className="font-serif font-bold text-sm text-amber-300">ऐतिहासिक प्रमुख तथ्य</h4>
                <ul className="space-y-2 text-[11px] text-slate-300">
                  <li>• स्थापना वर्ष: <strong>1948 (मत्स्य संघ काल)</strong></li>
                  <li>• पंजीकृत सदस्य संख्या: <strong>1,100+ नियमित अधिवक्ता</strong></li>
                  <li>• संबद्ध तहसील बार संघ: <strong>18 उपखंडीय न्यायालय</strong></li>
                  <li>• बार भवन: <strong>कोर्ट कैंपस, स्टेशन रोड, अलवर</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CONSTITUTION & BY-LAWS */}
        {/* ========================================================================= */}
        {activeTab === 'constitution' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Statutory Constitution & By-Laws
                </span>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  बार एसोसिएशन अलवर का संविधान एवं उप-नियम
                </h2>
              </div>
              <button
                onClick={() => handleDownloadFile(barDownloads.find(d => d.id === 'alwar-bar-constitution-pdf')!)}
                className="px-4 py-2 bg-legal-navy text-amber-300 font-bold rounded-xl text-xs transition"
              >
                संविधान PDF डाउनलोड
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">1. सदस्यता पात्रता एवं श्रेणियां</span>
                <p className="text-[11px] text-slate-600">साधारण, आजीवन (Life Member) एवं मानद सदस्यता के नियम।</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900">2. 'एक बार - एक वोट' नीति (One Bar One Vote)</span>
                <p className="text-[11px] text-slate-600">सुप्रीम कोर्ट निर्देशानुसार निष्पक्ष एवं पारदर्शी चुनाव संहिता।</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: JUDICIAL OFFICERS ROSTER */}
        {/* ========================================================================= */}
        {activeTab === 'judges' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b pb-4 border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Judgeship Roster • Alwar Courts
              </span>
              <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                अलवर न्यायक्षेत्र के पीठासीन न्यायिक अधिकारी
              </h2>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { court: 'District & Sessions Judge', room: 'Court Room No. 1', officer: 'Hon’ble District & Sessions Judge' },
                { court: 'Special Court (POCSO Act Cases No. 1)', room: 'Court Room No. 2', officer: 'Special Judge, POCSO Act' },
                { court: 'Family Court No. 1', room: 'Court Room No. 4', officer: 'Principal Judge, Family Court' },
                { court: 'Motor Accident Claims Tribunal (MACT)', room: 'Court Room No. 6', officer: 'Judge, MACT Alwar' },
                { court: 'Chief Judicial Magistrate (CJM)', room: 'Court Room No. 11', officer: 'CJM Alwar' }
              ].map((j, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{j.court}</span>
                    <span className="text-slate-500">{j.officer}</span>
                  </div>
                  <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    {j.room}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: DOWNLOADS HUB (8 Forms) */}
        {/* ========================================================================= */}
        {activeTab === 'downloads' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Prescribed Downloads
                </span>
                <h2 className="font-serif font-bold text-2xl text-slate-900 mt-1">
                  अलवर बार एसोसिएशन डाउनलोड केंद्र
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                8 प्रपत्र उपलब्ध
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {barDownloads.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {doc.category}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      {doc.titleHi}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {doc.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{doc.fileSize}</span>
                    <button
                      onClick={() => handleDownloadFile(doc)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>डाउनलोड</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LIGHTBOX MODAL (Full Screen Photo View) */}
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
      {/* MODAL 2: ADMIN ADD MEMBER MODAL */}
      {/* ========================================================================= */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 text-slate-900 shadow-2xl space-y-5 border border-slate-200">
            
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
                    अलवर बार एसोसिएशन अधिकृत डायरेक्टरी प्रविष्टि
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
      {/* MODAL 3: ADMIN ADD PHOTO MODAL */}
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

    </div>
  );
}
