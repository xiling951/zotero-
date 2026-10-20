"""Conservative checks for lost bitmap math and formula/Chinese collisions."""
import math
import pymupdf


def small_bitmap_rects(page):
    return [pymupdf.Rect(image['bbox']) for image in page.get_image_info()
            if .1<image['bbox'][2]-image['bbox'][0]<=45
            and .1<image['bbox'][3]-image['bbox'][1]<=30
            and image.get('bpc',1)==1]


def check_layout(path, expected_glyphs=None):
    report={'passed':True,'pages':[],'scope':'bitmap formula preservation, detectable formula/Chinese overlap and page bounds; not a semantic proof'}
    with pymupdf.open(path) as doc:
        for index,page in enumerate(doc):
            formulas=[];chinese=[]
            for span in page.get_texttrace():
                if span.get('type')==3:continue
                for codepoint,glyph,origin,bbox in span['chars']:
                    if 0xE000<=codepoint<=0xF8FF and 'MathBitmap' in span['font']:
                        formulas.append(pymupdf.Rect(bbox))
                    elif 0x3400<=codepoint<=0x9FFF:
                        chinese.append(pymupdf.Rect(bbox))
            converted_count=len(formulas)
            if not formulas and chinese:formulas=small_bitmap_rects(page)
            grid={}
            for rect in chinese:
                for x in range(math.floor(rect.x0/24),math.floor(rect.x1/24)+1):
                    for y in range(math.floor(rect.y0/24),math.floor(rect.y1/24)+1):grid.setdefault((x,y),[]).append(rect)
            collisions=[];outside=0
            for rect in formulas:
                if not page.rect.contains(rect):outside+=1
                hits=[]
                for x in range(math.floor(rect.x0/24),math.floor(rect.x1/24)+1):
                    for y in range(math.floor(rect.y0/24),math.floor(rect.y1/24)+1):hits.extend(grid.get((x,y),[]))
                if any((rect&other).get_area()/max(.01,min(rect.get_area(),other.get_area()))>.35 for other in hits):collisions.append([round(v,2) for v in rect])
            expected=expected_glyphs[index] if expected_glyphs and index<len(expected_glyphs) else None
            missing=expected is not None and converted_count!=expected
            passed=not missing and len(collisions)<=1 and outside==0
            report['pages'].append({'page':index+1,'expectedGlyphs':expected,'retainedGlyphs':converted_count,'formulaFragments':len(formulas),'overlapFragments':len(collisions),'outsidePage':outside,'passed':passed,'examples':collisions[:6]})
            report['passed'] &= passed
    return report


if __name__=='__main__':
    import json,sys
    print(json.dumps(check_layout(sys.argv[1]),ensure_ascii=True))
