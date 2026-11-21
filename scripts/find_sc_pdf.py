import pypdf
import os

pdf_path = 'C:/Users/Pranika/.gemini/antigravity/brain/4feaaed2-cdd0-4ce6-b924-97a8ef54bebe/.user_uploaded/media_1795094720207_bdc3d4d1.pdf'

# If that is not the SC PDF, let's find the SC PDF in scratch
import glob
pdfs = glob.glob('C:/Users/Pranika/.gemini/antigravity/brain/4feaaed2-cdd0-4ce6-b924-97a8ef54bebe/**/CRL-A*.pdf', recursive=True)
if not pdfs:
    # Let's download from R2 using python
    pass
print("Found PDFs:", pdfs)
