"""Portable synthetic regressions: no user papers or personal filesystem paths."""
from pathlib import Path
from types import SimpleNamespace
import sys
import io
import tempfile
import unittest
import pymupdf
from pypdf import PdfReader,PdfWriter
from pypdf.generic import ContentStream,DictionaryObject,NameObject,NumberObject,BooleanObject,FloatObject,ArrayObject

ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools'))
from pdf_math_bitmap import convert_math_bitmaps
from pdf_layout_quality import check_layout
from utils.layout_policy import apply_layout_policy


def fixture(path,collision=False):
    document=pymupdf.open()
    page=document.new_page(width=612,height=792)
    page.insert_text((40,40),('Native body text for formula preservation testing. '*2+'\n')*3,fontsize=8)
    page.insert_text((40,200),'测试中文正文位置与公式的重叠',fontname='china-s',fontsize=12)
    reader=PdfReader(io.BytesIO(document.tobytes()))
    writer=PdfWriter();writer.clone_document_from_reader(reader)
    page=writer.pages[0]
    stream=ContentStream(page.get_contents(),writer)
    settings=DictionaryObject({NameObject('/W'):NumberObject(8),NameObject('/H'):NumberObject(8),NameObject('/BPC'):NumberObject(1),NameObject('/IM'):BooleanObject(True)})
    for index in range(12):
        values=[10,0,0,10,40+index*16,592 if collision else 400]
        stream.operations.extend([([],b'q'),(ArrayObject([FloatObject(x) for x in values]),b'cm'),({'settings':settings,'data':b'\xff'*8},b'INLINE IMAGE'),([],b'Q')])
    page[NameObject('/Contents')]=writer._add_object(stream)
    with path.open('wb') as output:writer.write(output)
    document.close()


class LayoutSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source=Path(self.temp.name)/'synthetic.pdf'
        fixture(self.source)

    def test_bitmap_formulas_survive_normalization(self):
        target=Path(self.temp.name)/'normalized.pdf'
        report=convert_math_bitmaps(self.source,target)
        self.assertEqual(report['convertedGlyphs'],12)
        result=check_layout(target,[12])
        self.assertTrue(result['passed'],result)

    def test_missing_or_duplicated_formula_counts_fail(self):
        target=Path(self.temp.name)/'normalized.pdf'
        convert_math_bitmaps(self.source,target)
        self.assertFalse(check_layout(target,[13])['passed'])
        self.assertFalse(check_layout(target,[11])['passed'])

    def test_visible_formula_chinese_collision_is_rejected(self):
        fixture(self.source,collision=True)
        result=check_layout(self.source)
        self.assertFalse(result['passed'],result)
        self.assertGreater(result['pages'][0]['overlapFragments'],1)

    def test_native_pdf_disables_unsafe_ocr_and_fixed_cropping(self):
        config=SimpleNamespace(mono_cut=False,dual_cut=True,crop_compare=True,dual=False,no_dual=True,ocr=True,auto_ocr=True,disable_rich_text_translate=True,enhance_compatibility=True)
        result=apply_layout_policy(self.source,config)
        self.assertEqual(result['bitmapPages'],[1])
        self.assertFalse(config.ocr)
        self.assertFalse(config.disable_rich_text_translate)
        self.assertFalse(config.crop_compare)
        self.assertFalse(config.dual_cut)
        self.assertTrue(config.dual)


if __name__=='__main__':unittest.main()
