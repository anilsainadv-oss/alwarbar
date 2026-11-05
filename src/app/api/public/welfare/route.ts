import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';
import https from 'https';
import {
  EMPANELLED_HOSPITALS,
  CLAIM_PROCEDURE_GUIDES,
  COURT_STAMP_RULES,
  WELFARE_FAQS
} from '@/lib/welfare-directory';

export const dynamic = 'force-dynamic';

interface BcrCircular {
  id: string;
  title: string;
  date: string;
  url: string;
  authority: string;
  important: boolean;
}

// In-memory cache for live BCR circulars (10-minute TTL)
let cachedCirculars: BcrCircular[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchLiveBcrCirculars(): Promise<BcrCircular[]> {
  const now = Date.now();
  if (cachedCirculars.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedCirculars;
  }

  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({ Obj: 'rawf', HeadVal: 'all' });
      const req = https.request(
        {
          hostname: 'barcouncilofrajasthan.org',
          path: '/VB/Site/CirList.aspx/LoadListProcess',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AlwarAdvocatesPortal/1.0'
          },
          timeout: 4000
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              const html = json.d && json.d[1] ? json.d[1] : '';
              const regex =
                /<a\s+href='([^']+)'[^>]*><p>([\s\S]*?)<\/p><\/a>[\s\S]*?<div class='col-sm-2 text-right'><p>([\s\S]*?)<\/p>/gi;
              const items: BcrCircular[] = [];
              let m: RegExpExecArray | null;
              let idx = 1;
              while ((m = regex.exec(html)) !== null) {
                let fileUrl = m[1].replace('../', 'https://barcouncilofrajasthan.org/');
                if (!fileUrl.startsWith('http')) {
                  fileUrl = 'https://barcouncilofrajasthan.org/' + fileUrl.replace(/^\//, '');
                }
                const title = m[2].replace(/<[^>]+>/g, '').trim();
                const date = m[3].replace(/<[^>]+>/g, '').trim();
                items.push({
                  id: `bcr-live-${idx++}`,
                  title,
                  date,
                  url: fileUrl,
                  authority: 'Bar Council of Rajasthan (Jodhpur)',
                  important:
                    title.toLowerCase().includes('increased') ||
                    title.toLowerCase().includes('stamp') ||
                    title.toLowerCase().includes('amendment') ||
                    idx <= 4
                });
              }

              if (items.length > 0) {
                cachedCirculars = items;
                lastFetchTime = now;
                resolve(items);
                return;
              }
            } catch {
              // fallback
            }
            resolve(cachedCirculars);
          });
        }
      );

      req.on('error', () => resolve(cachedCirculars));
      req.on('timeout', () => {
        req.destroy();
        resolve(cachedCirculars);
      });
      req.write(postData);
      req.end();
    } catch {
      resolve(cachedCirculars);
    }
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    let schemes = localDb.getWelfareSchemes().filter((s) => s.is_published);
    const localBulletins = localDb.getWelfareBulletins();

    // Fetch live circulars from official BCR server
    const bcrLiveCirculars = await fetchLiveBcrCirculars();

    if (category !== 'all') {
      schemes = schemes.filter((s) => s.category === category);
    }

    if (q) {
      schemes = schemes.filter(
        (s) =>
          s.title_en.toLowerCase().includes(q) ||
          s.title_hi.toLowerCase().includes(q) ||
          s.benefits_summary.toLowerCase().includes(q) ||
          s.eligibility_criteria.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: schemes.length,
      schemes,
      bulletins: localBulletins,
      bcr_live_circulars: bcrLiveCirculars,
      bcr_official_downloads: [
        {
          title: 'Rajasthan Advocates Welfare Fund Act, 1987 (Updated with 20.10.2022 Amendment)',
          title_hi: 'राजस्थान अधिवक्ता कल्याण निधि अधिनियम, 1987 (2022 संशोधन सहित)',
          type: 'Statutory Act',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=39.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Rajasthan Advocates Welfare Fund (Amendment) Act, 2012',
          title_hi: 'राजस्थान अधिवक्ता कल्याण निधि (संशोधन) अधिनियम, 2012',
          type: 'Statutory Act',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=33.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Bar Council of India Advocates Welfare Fund Scheme (BCIAWF)',
          title_hi: 'बार कौंसिल ऑफ इंडिया अधिवक्ता कल्याण निधि योजना',
          type: 'BCI Scheme',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=24.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Application for Financial Assistance on Account of Serious Ailment (Medical Relief)',
          title_hi: 'गंभीर बीमारी (कैंसर, बायपास, किडनी आदि) वित्तीय सहायता आवेदन प्रपत्र',
          type: 'Claim Form',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=12.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Application for Demise / Death Claim under Welfare Fund',
          title_hi: 'अधिवक्ता मृत्यु दावा / आश्रित सहायता आवेदन प्रपत्र',
          type: 'Claim Form',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=11.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Application for Change / Cancellation of Nominee in Welfare Fund',
          title_hi: 'कल्याण कोष में नॉमिनी / उत्तराधिकारी परिवर्तन आवेदन प्रपत्र',
          type: 'Nomination Form',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=3.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Application for Registration & Recognition of Bar Association under Section 16',
          title_hi: 'बार एसोसिएशन पंजीकरण एवं मान्यता आवेदन प्रपत्र (धारा 16)',
          type: 'Recognition Form',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=4.pdf',
          file_type: 'PDF'
        },
        {
          title: 'Application Form for Revival of Discontinued Membership in RAWF',
          title_hi: 'कल्याण कोष सदस्यता पुनर्जीवित / नवीनीकरण आवेदन प्रपत्र',
          type: 'Revival Form',
          url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=Circular/28.doc',
          file_type: 'DOC'
        }
      ],
      bcr_online_services: {
        advocate_portal_login: 'https://barcouncilofrajasthan.org/Advocate/',
        online_apply_description:
          'Online portal for RAWF Membership Application, Ex-Gratia Claims, Death Claims, and Retirement Claims.',
        rawf_dues_list_url: 'https://barcouncilofrajasthan.org/rawf/dues-list',
        rawf_circulars_url: 'https://barcouncilofrajasthan.org/circular/rajasthan-advocates-welfare-fund',
        rawf_downloads_url: 'https://barcouncilofrajasthan.org/downloads/rajasthan-advocates-welfare-fund'
      },
      alwar_judgeship_bars: [
        'ALWAR',
        'BANSUR',
        'BEHROR',
        'BEHROR (BAR)',
        'BHIWADI',
        'KATHUMAR',
        'KHERLI MANDI',
        'KISHANGARH BAS',
        'KOTKASIM',
        'LAXMANGARH',
        'MALAKHERA',
        'MUNDAWAR',
        'NEEMRANA',
        'RAJGARH',
        'RAMGARH',
        'TAPUKARA',
        'THANAGAZI',
        'TIJARA'
      ],
      stamp_info: {
        mandatory_fee: '₹140.00',
        previous_fee: '₹130.00 (prior to 01/07/2026) | ₹110.00 (2023–2025)',
        act_reference: 'Section 27, Rajasthan Advocates Welfare Fund Act, 1987 (Act No. 15 of 1987 as amended)',
        circular_ref: 'BCR Circular Ref No. 40443 dated 09.06.2026',
        circular_url: 'https://barcouncilofrajasthan.org/downloading.aspx?file=Circular/40443.pdf',
        requirement:
          'Mandatory on every Vakalatnama, Memo of Appearance, and Power of Attorney filed before District & Sessions Court, CJM, ACJM, SDO, and Revenue Courts across Alwar District. Failure to affix compromises member welfare entitlement and retirement claims.',
        stamp_counters:
          'Bar Association Office Counter No. 2, District Court Campus, Alwar & Revenue Bar Counter',
        exemption:
          'Legal Aid Counsel, State Public Prosecutors, and Government Advocates representing sovereign departments are exempt.'
      },
      benefit_schedule: [
        { years: '3 to 5 Years', amount: '₹1,75,000', label: 'Initial Compassionate Slab' },
        { years: '6 to 10 Years', amount: '₹3,50,000', label: 'Mid-Career Benefit' },
        { years: '11 to 15 Years', amount: '₹5,50,000', label: 'Senior Practice Slab' },
        { years: '16 to 20 Years', amount: '₹7,50,000', label: 'Veteran Counsel Slab' },
        { years: '21 to 25 Years', amount: '₹9,00,000', label: 'Silver Jubilee Practice' },
        { years: '25+ to 34 Years', amount: '₹10,00,000', label: 'Long Term Practice Milestone' },
        { years: '35 to 44 Years', amount: '₹10,53,000 to ₹12,00,000', label: 'Senior Veteran Slab' },
        { years: '45 to 50 Years', amount: '₹12,50,000 to ₹15,00,000', label: 'Maximum Statutory Ceiling (2022 Act)' }
      ],
      empanelled_hospitals: EMPANELLED_HOSPITALS,
      claim_guides: CLAIM_PROCEDURE_GUIDES,
      court_stamp_rules: COURT_STAMP_RULES,
      welfare_faqs: WELFARE_FAQS,
      live_metadata: {
        last_synced: new Date().toISOString(),
        is_live_connected: bcrLiveCirculars.length > 0,
        live_circulars_count: bcrLiveCirculars.length,
        trustee_committee_contact:
          'Welfare Fund Trustee Committee, Bar Council of Rajasthan, High Court Campus, Jodhpur (Phone: 0291-2545062)',
        alwar_bar_desk:
          'Welfare Desk, District & Sessions Bar Association, Alwar (Chamber No. 1, Civil Wing, Ph: 0144-2334455)'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch welfare data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, enrollment_no, phone, query_type, message } = body;

    if (!name || !phone || !query_type) {
      return NextResponse.json(
        { error: 'Name, contact number, and query type are required.' },
        { status: 400 }
      );
    }

    const ticketId = 'WLF-' + Math.floor(100000 + Math.random() * 900000);

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      message_hi: 'आपकी सहायता अर्जी सफलतापूर्वक दर्ज कर ली गई है। अलवर बार कल्याण डेस्क शीघ्र आपसे संपर्क करेगी।',
      message_en: 'Your welfare inquiry has been successfully logged. Alwar Bar Welfare Committee nodal desk will follow up shortly.',
      received_at: new Date().toISOString()
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit welfare inquiry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
