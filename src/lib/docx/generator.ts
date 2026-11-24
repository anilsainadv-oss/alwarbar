import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip
} from 'docx';

export interface LegalDraftDocxParams {
  draftType: string;
  title: string;
  courtName?: string;
  caseNumber?: string;
  petitioner?: string;
  respondent?: string;
  contentText: string;
  language?: 'en' | 'hi';
  advocateName?: string;
  enrollmentNo?: string;
  chamberAddress?: string;
}

/**
 * Generates an authentic, fully standard Microsoft Word (.docx) OpenXML package.
 * Produces valid PK ZIP headers (0x50 0x4B 0x03 0x04) with professional court pleading formatting:
 *  - 1.25" left filing margin (for court binding), 1" top, right, bottom
 *  - Formal court header and cause title
 *  - Numbered legal grounds
 *  - Distinct prayer clause
 *  - Formal advocate signature and verification blocks
 */
export async function generateLegalWordDocument(params: LegalDraftDocxParams): Promise<Buffer> {
  const {
    draftType,
    title,
    courtName = 'IN THE COURT OF DISTRICT & SESSIONS JUDGE, ALWAR (RAJ.)',
    caseNumber = '_____ / 2026',
    petitioner = 'Applicant / Petitioner',
    respondent = 'Respondent / State of Rajasthan',
    contentText,
    language = 'en',
    advocateName = 'Advocate for Applicant',
    enrollmentNo = 'R/_____/_____',
    chamberAddress = 'District Court Complex, Alwar (Rajasthan)'
  } = params;

  const isHindi = language === 'hi';
  const children: Paragraph[] = [];

  // 1. COURT HEADER (Centered, Bold, 14pt)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: courtName.toUpperCase(),
          bold: true,
          size: 28, // 14pt
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        })
      ]
    })
  );

  // 2. CASE / PETITION NUMBER
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `${isHindi ? 'प्रकरण / प्रार्थना पत्र संख्या:' : 'Pleading / Application No.:'} ${caseNumber}`,
          bold: true,
          size: 24, // 12pt
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        })
      ]
    })
  );

  // 3. CAUSE TITLE (Parties)
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: petitioner,
          bold: true,
          size: 24,
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        }),
        new TextRun({
          text: `   ...${isHindi ? 'प्रार्थी / अभियुक्त' : 'Applicant / Petitioner'}`,
          italics: true,
          size: 22
        })
      ]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: isHindi ? 'बनाम (VERSUS)' : 'VERSUS',
          bold: true,
          size: 24,
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        })
      ]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: respondent,
          bold: true,
          size: 24,
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        }),
        new TextRun({
          text: `   ...${isHindi ? 'विपक्षी / राज्य' : 'Respondent / State'}`,
          italics: true,
          size: 22
        })
      ]
    })
  );

  // 4. MAIN TITLE / SUBJECT (Bold, Centered, Underlined)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 300 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          underline: {},
          size: 26, // 13pt
          font: isHindi ? 'Nirmala UI' : 'Times New Roman'
        })
      ]
    })
  );

  // 5. BODY PARAGRAPHS
  // Split content text into paragraphs
  const rawParagraphs = contentText.split('\n');
  let inPrayer = false;

  for (const rawLine of rawParagraphs) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect Prayer clause
    if (line.toUpperCase().includes('PRAYER:') || line.includes('प्रार्थना:') || line.toUpperCase().includes('PRAYER')) {
      inPrayer = true;
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 300, after: 120 },
          children: [
            new TextRun({
              text: isHindi ? 'प्रार्थना (PRAYER):' : 'PRAYER:',
              bold: true,
              underline: {},
              size: 24,
              font: isHindi ? 'Nirmala UI' : 'Times New Roman'
            })
          ]
        })
      );
      continue;
    }

    // Numbered grounds or normal lines
    const isNumbered = /^[0-9]+[.)]/.test(line);

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: isNumbered ? { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.3) } : undefined,
        spacing: { after: 140, line: 360 }, // 1.5 line spacing (360 twips)
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
            font: isHindi ? 'Nirmala UI' : 'Times New Roman',
            bold: inPrayer && (line.toLowerCase().includes('prayed that') || line.includes('प्रार्थना है'))
          })
        ]
      })
    );
  }

  // 6. DATE AND PLACE
  children.push(
    new Paragraph({
      spacing: { before: 300, after: 60 },
      children: [
        new TextRun({
          text: `${isHindi ? 'दिनांक:' : 'Date:'} ${new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')}`,
          bold: true,
          size: 22
        })
      ]
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `${isHindi ? 'स्थान:' : 'Place:'} Alwar (Rajasthan)`,
          bold: true,
          size: 22
        })
      ]
    })
  );

  // 7. ADVOCATE SIGNATURE BLOCK (Right aligned)
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200, after: 40 },
      children: [
        new TextRun({
          text: isHindi ? 'प्रार्थी मार्फत अधिवक्ता' : 'Advocate for Applicant / Petitioner',
          bold: true,
          size: 24
        })
      ]
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `[${advocateName}]`,
          size: 22
        })
      ]
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `${isHindi ? 'सनद संख्या:' : 'Bar Enrollment:'} ${enrollmentNo}`,
          size: 20,
          italics: true
        })
      ]
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: chamberAddress,
          size: 20
        })
      ]
    })
  );

  // 8. VERIFICATION CLAUSE (For affidavits / formal court pleadings)
  if (draftType === 'affidavit' || draftType === 'written_statement' || contentText.toLowerCase().includes('verification')) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: isHindi ? 'सत्यापन (VERIFICATION)' : 'VERIFICATION',
            bold: true,
            underline: {},
            size: 24
          })
        ]
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: isHindi
              ? `मैं शपथपूर्वक सत्यापित करता/करती हूँ कि उपरोक्त प्रार्थना पत्र/शपथ पत्र की सभी कंडिकाएं मेरे निजी ज्ञान एवं विधिक परामर्श के अनुसार सत्य व सही हैं, इसमें कोई तथ्य छुपाया नहीं गया है। ईश्वर मेरी मदद करे।`
              : `I, the deponent above-named, do hereby solemnly verify and declare that the contents of the above paragraphs are true and correct to the best of my knowledge, legal information, and belief, and nothing material has been concealed therefrom. So help me God.`,
            size: 22,
            italics: true
          })
        ]
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: isHindi ? 'शपथग्रहीता (Deponent)' : 'DEPONENT',
            bold: true,
            size: 24
          })
        ]
      })
    );
  }

  // BUILD THE DOCUMENT OBJECT
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.0),
              right: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.25) // Left court binding margin
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'DISTRICT COURT COMPLEX, ALWAR — PLEADING DOSSIER',
                    size: 16,
                    color: '888888'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '666666'
                  })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
