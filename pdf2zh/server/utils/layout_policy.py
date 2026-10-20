"""Safe layout defaults shared by plugin and HTTP translation requests."""
from pathlib import Path
import pymupdf


def apply_layout_policy(input_path, config):
    if getattr(config, '_layout_checked_path', None)==str(input_path):
        return config._layout_checked_result
    notes=list(getattr(config, 'layout_notes', []))
    if any(getattr(config,name,False) for name in ['mono_cut','dual_cut','crop_compare']):
        config.mono_cut=config.dual_cut=config.crop_compare=False
        config.dual=True;config.no_dual=False
        notes.append('已使用整页双语对照，避免跨栏公式、图注被裁掉')
    native_pages=0;bitmap_pages=[];scan_pages=[]
    with pymupdf.open(input_path) as document:
        for index,page in enumerate(document):
            text=page.get_text().strip()
            images=page.get_image_info()
            large_scan=any(pymupdf.Rect(image['bbox']).get_area()/max(1,page.rect.get_area())>.85 for image in images)
            if len(text)>=80 and not large_scan:native_pages+=1
            if large_scan and len(text)<80:scan_pages.append(index+1)
            small=sum(1 for image in images if image.get('bpc',1)==1 and .1<image['bbox'][2]-image['bbox'][0]<=45 and .1<image['bbox'][3]-image['bbox'][1]<=30)
            if len(text)>=80 and small>=12:bitmap_pages.append(index+1)
        total=len(document)
    native=total>0 and native_pages==total
    if native:
        config.ocr=False;config.auto_ocr=False
        config.disable_rich_text_translate=False;config.enhance_compatibility=False
        notes.append('已按原生文字 PDF 处理，并保留行内公式与富文本')
    if bitmap_pages:
        if scan_pages:
            raise ValueError('文档同时含位图公式和无文字层的扫描页。请先将扫描页 OCR 为可检索文字，或按章节分卷后分别处理，以免公式错位或漏译。')
        notes.append('已检测到位图公式，将进行公式预处理及译后版面检查')
    config.layout_notes=list(dict.fromkeys(notes))
    config.layout_bitmap_pages=bitmap_pages
    result={'native':native,'bitmapPages':bitmap_pages,'notes':config.layout_notes}
    config._layout_checked_path=str(input_path);config._layout_checked_result=result
    return result
