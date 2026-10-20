"""Expose legacy inline bitmap math as movable Type3 formula glyphs.

The glyph paints the original bit mask, preserving the formula appearance.
No OCR, symbol substitution or rewriting of mathematical content is involved.
"""
from pathlib import Path
import math
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, ByteStringObject, ContentStream,
    DecodedStreamObject, DictionaryObject, FloatObject, NameObject, NumberObject)


def numbers(values):
    return ArrayObject([FloatObject(value) for value in values])


def compose(left, right):
    a,b,c,d,e,f=left; g,h,i,j,k,l=right
    return (a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f)


def candidate_pages(source, minimum=12):
    """Indexes of pages that can hold convertible bitmap math, found with PyMuPDF.

    Counts every small 1-bit image (inline or XObject, inside text or not, in
    either orientation), a superset of the masks convert_math_bitmaps rewrites,
    so skipping the other pages never changes its result. This avoids parsing
    every content stream and extracting text with pypdf on long textbooks.
    """
    import pymupdf
    pages=set()
    with pymupdf.open(source) as document:
        for index,page in enumerate(document):
            count=0
            for image in page.get_image_info():
                x0,y0,x1,y1=image['bbox']
                if image.get('bpc',1)==1 and max(x1-x0,y1-y0)<=46:count+=1
            if count>=minimum:pages.add(index)
    return pages


def convert_math_bitmaps(source, destination, pages=None):
    """pages: optional set of page indexes to inspect (see candidate_pages)."""
    reader=PdfReader(source); writer=PdfWriter();writer.clone_document_from_reader(reader)
    report={'pages':len(writer.pages),'convertedGlyphs':0,'pageGlyphs':[]}
    for page_index,page in enumerate(writer.pages):
        if pages is not None and page_index not in pages:
            report['pageGlyphs'].append(0);continue
        stream=ContentStream(page.get_contents(),writer)
        matrix=(1,0,0,1,0,0);stack=[];inside_text=False;candidates=[]
        # Full scans have no trustworthy native body text to anchor glyphs to.
        if len((page.extract_text() or '').strip())<80:
            report['pageGlyphs'].append(0);continue
        for index,(operands,operator) in enumerate(stream.operations):
            if operator==b'q':stack.append(matrix)
            elif operator==b'Q':matrix=stack.pop() if stack else (1,0,0,1,0,0)
            elif operator==b'cm':matrix=compose(matrix,tuple(float(v) for v in operands))
            elif operator==b'BT':inside_text=True
            elif operator==b'ET':inside_text=False
            elif operator==b'INLINE IMAGE' and not inside_text:
                settings=operands['settings']
                mask=settings.get('/IM',settings.get('/ImageMask',False))
                width=math.hypot(matrix[0],matrix[1]);height=math.hypot(matrix[2],matrix[3])
                if bool(mask) and .1<width<=45 and .1<height<=30 and abs(matrix[1])<1e-6 and abs(matrix[2])<1e-6 and matrix[0]>0 and matrix[3]>0:
                    candidates.append((index,operands,matrix))
        if len(candidates)<12:
            report['pageGlyphs'].append(0);continue
        resources=DictionaryObject(dict(page['/Resources'].get_object()))
        fonts=DictionaryObject(dict(resources.get('/Font',DictionaryObject()).get_object()))
        resources[NameObject('/Font')]=fonts;page[NameObject('/Resources')]=resources
        for offset in range(0,len(candidates),240):
            batch=candidates[offset:offset+240]
            alias=NameObject(f'/MathBitmapP{page_index}G{offset//240}')
            charprocs=DictionaryObject();differences=ArrayObject([NumberObject(0)])
            mapping=[]
            ratios=[]
            for code,(index,image,image_matrix) in enumerate(batch):
                ratio=image_matrix[0]/image_matrix[3];ratios.append(ratio)
                glyph_name=NameObject(f'/m{code}');differences.append(glyph_name)
                glyph=ContentStream(None,writer)
                glyph.operations=[(numbers([ratio,0,0,0,ratio,1]),b'd1'),([],b'q'),(numbers([ratio,0,0,1,0,0]),b'cm'),(image,b'INLINE IMAGE'),([],b'Q')]
                charprocs[glyph_name]=writer._add_object(glyph)
                mapping.append(f'<{code:02X}> <{0xE000+code:04X}>')
            cmap=DecodedStreamObject()
            header='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Local) /Ordering (Formula) /Supplement 0 >> def\n/CMapName /MathBitmap def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n'
            chunks=[]
            for first in range(0,len(mapping),100):
                rows=mapping[first:first+100];chunks.append(str(len(rows))+' beginbfchar\n'+'\n'.join(rows)+'\nendbfchar\n')
            cmap.set_data((header+''.join(chunks)+'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n').encode('ascii'))
            font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type3'),
                NameObject('/Name'):alias,NameObject('/BaseFont'):NameObject('/MathBitmap'),
                NameObject('/FontBBox'):numbers([0,0,max(ratios),1]),NameObject('/FontMatrix'):numbers([1,0,0,1,0,0]),
                NameObject('/CharProcs'):charprocs,NameObject('/Encoding'):DictionaryObject({NameObject('/Type'):NameObject('/Encoding'),NameObject('/Differences'):differences}),
                NameObject('/FirstChar'):NumberObject(0),NameObject('/LastChar'):NumberObject(len(batch)-1),
                NameObject('/Widths'):numbers(ratios),NameObject('/ToUnicode'):writer._add_object(cmap),
                NameObject('/Resources'):DictionaryObject({key:value for key,value in resources.items() if key!='/Font'})})
            fonts[alias]=writer._add_object(font)
        # Replace in one pass so operation indexes cannot shift.
        replacement={}
        for ordinal,(index,image,image_matrix) in enumerate(candidates):
            alias=NameObject(f'/MathBitmapP{page_index}G{ordinal//240}');code=ordinal%240
            a,b,c,d,e,f=image_matrix
            inverse=[1/a,0,0,1/d,-e/a,-f/d]
            replacement[index]=[([],b'q'),(numbers(inverse),b'cm'),([],b'BT'),([alias,FloatObject(d)],b'Tf'),(numbers([0]),b'Tc'),
                (numbers([0]),b'Tw'),(numbers([100]),b'Tz'),(numbers([0]),b'Ts'),
                (numbers([1,0,0,1,e,f]),b'Tm'),([ByteStringObject(bytes([code]))],b'Tj'),([],b'ET'),([],b'Q')]
        # Retain writer-owned operands for non-image operations and references.
        restored=stream.operations
        stream.operations=[operation for index,operation in enumerate(restored) for operation in replacement.get(index,[operation])]
        page[NameObject('/Contents')]=writer._add_object(stream)
        report['pageGlyphs'].append(len(candidates));report['convertedGlyphs']+=len(candidates)
    Path(destination).parent.mkdir(parents=True,exist_ok=True)
    with open(destination,'wb') as output:writer.write(output)
    return report


if __name__=='__main__':
    import json,sys
    print(json.dumps(convert_math_bitmaps(sys.argv[1],sys.argv[2])))
