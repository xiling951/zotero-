"""Run the current BabelDOC renderer without changing the legacy server environment."""
from pathlib import Path
import argparse
import sys
import tomllib
import tempfile
import json


def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('input_file')
    parser.add_argument('--config-file', required=True)
    parser.add_argument('--openai', action='store_true')
    parser.add_argument('--deepseek', action='store_true')
    parser.add_argument('--openaicompatible', action='store_true')
    parsed, remaining = parser.parse_known_args()
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(root / 'pdf2zh/layout-runtime'))
    config = tomllib.loads(Path(parsed.config_file).read_text(encoding='utf-8'))
    prefix='deepseek' if parsed.deepseek else 'openai_compatible' if parsed.openaicompatible else 'openai'
    section='openaicompatible_detail' if parsed.openaicompatible else prefix+'_detail'
    details = config[section]
    api_key = details.get(prefix+'_api_key', '')
    base_url = details.get(prefix+'_base_url', '') or ('https://api.deepseek.com/v1' if parsed.deepseek else '')
    if not api_key or not base_url:
        raise ValueError('OpenAI-compatible translation account is incomplete')
    from babeldoc.translator.translator import OpenAITranslator
    original_init = OpenAITranslator.__init__

    def initialize_translator(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        if self.model.lower().startswith('qwen'):
            self.extra_body['enable_thinking'] = False
        elif self.model.lower().startswith('deepseek'):
            self.extra_body['thinking'] = {'type': 'disabled'}

    OpenAITranslator.__init__ = initialize_translator
    import pymupdf
    from pdf_math_bitmap import candidate_pages, convert_math_bitmaps
    from pdf_layout_quality import small_bitmap_rects, check_layout
    source=Path(parsed.input_file)
    with tempfile.TemporaryDirectory(prefix='zotero-math-layout-',ignore_cleanup_errors=True) as temporary:
        with pymupdf.open(source) as document:
            has_bitmap_math=any(len(small_bitmap_rects(page))>=12 and len(page.get_text().strip())>=80 for page in document)
        preparation={'convertedGlyphs':0,'pageGlyphs':[]}
        prepared=source
        if has_bitmap_math:
            candidate=Path(temporary)/source.name
            # Only pages PyMuPDF flags are parsed again with pypdf.
            preparation=convert_math_bitmaps(source,candidate,pages=candidate_pages(source))
            if preparation['convertedGlyphs']:
                # Verify that moving masks into glyphs did not alter their appearance.
                import numpy as np
                from PIL import Image, ImageFilter
                with pymupdf.open(source) as original, pymupdf.open(candidate) as normalized:
                    for index,count in enumerate(preparation['pageGlyphs']):
                        if not count:continue
                        before=original[index].get_pixmap(alpha=False,annots=False)
                        after=normalized[index].get_pixmap(alpha=False,annots=False)
                        if (before.width,before.height)!=(after.width,after.height):raise ValueError('公式预处理改变了页面尺寸，已停止翻译。')
                        masks=[np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width,3).min(axis=2)<180 for pix in [before,after]]
                        a,b=masks
                        expanded=[np.asarray(Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0 for mask in masks]
                        difference=max(float((a&~expanded[1]).sum()),float((b&~expanded[0]).sum()))/max(1,int(a.sum()))
                        # Permit one raster pixel of font/mask antialiasing, while
                        # rejecting lost strokes, moved content and changed shapes.
                        if difference>.005:raise ValueError(f'第 {index+1} 页公式预处理外观差异过大，已停止翻译。')
                prepared=candidate
                for flag in ['--ocr-workaround','--auto-enable-ocr-workaround','--disable-rich-text-translate','--enhance-compatibility']:
                    if flag in remaining:remaining.remove(flag)
                remaining.extend(['--formular-font-pattern','MathBitmap|Math|Symbol|CMSY|CMMI|CMEX|CMR'])
        # Always create an internal mono PDF for auditing, even for dual-only output.
        if '--no-mono' in remaining:remaining.remove('--no-mono')
        # Credentials are passed only in process memory, never on the OS command line.
        sys.argv = ['babeldoc', '--files', str(prepared), '--openai',
                    '--openai-model', details[prefix+'_model'], '--openai-base-url', base_url,
                    '--openai-api-key', api_key, *remaining]
        from babeldoc.main import cli
        cli()
        output=Path(remaining[remaining.index('--output')+1]) if '--output' in remaining else Path.cwd()
        watermark=remaining[remaining.index('--watermark-output-mode')+1] if '--watermark-output-mode' in remaining else 'watermarked'
        language=remaining[remaining.index('--lang-out')+1] if '--lang-out' in remaining else 'zh'
        mono=output/f'{source.stem}{".no_watermark" if watermark=="no_watermark" else ""}.{language}.mono.pdf'
        expected=preparation['pageGlyphs'] or None
        with pymupdf.open(mono) as document:
            if expected and len(expected)!=len(document):expected=None
        report=check_layout(mono,expected)
        report['preparation']=preparation
        report_path=output/f'{source.stem}.layout-check.json'
        report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        if not report['passed']:
            pages=', '.join(str(row['page']) for row in report['pages'] if not row['passed'])
            raise ValueError(f'版面检查未通过：第 {pages} 页可能存在公式丢失、重叠或越界。文件不会自动作为成功译文导入。检查报告：{report_path}')
        print(f'版面检查通过；已保护 {preparation["convertedGlyphs"]} 个位图公式片段。')


if __name__ == '__main__':
    main()
