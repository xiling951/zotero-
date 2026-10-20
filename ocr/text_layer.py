"""Add an invisible OCR text layer to a scanned PDF (offline, CPU).

  python ocr/text_layer.py book.pdf                 # whole book -> book.ocr.pdf
  python ocr/text_layer.py book.pdf --pages 16-20   # partial layer, all pages kept
  Ctrl+C stops after the current page; run the same command again to continue.

Exit codes: 0 ready, 1 error, 2 failed pages or verification failed, 130 cancelled.
"""
from pathlib import Path
import argparse
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from core.pipeline import JobError, Options, run  # noqa: E402

STATUS = {'ocr': '已识别', 'ocr_no_text': '扫描页无可识别文字', 'skipped_native_text': '已有文字层，跳过',
          'skipped_existing_ocr': '已有隐藏文字层，跳过', 'skipped_blank': '空白页，跳过', 'failed': '失败'}


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8', errors='replace')
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('input', type=Path)
    parser.add_argument('-o', '--output', type=Path, help='default: <input>.ocr.pdf next to the input')
    parser.add_argument('--pages', default='', help='1-based PDF page ranges, e.g. 16-20,25 (default: all)')
    parser.add_argument('--dpi', type=int, default=200, choices=range(100, 601), metavar='100-600')
    parser.add_argument('--threads', type=int, default=0, help='CPU threads for OCR (default: all)')
    parser.add_argument('--work-dir', type=Path, help='checkpoint directory (default: <output>.work)')
    parser.add_argument('--restart', action='store_true', help='discard checkpoints made with other settings')
    args = parser.parse_args(argv)

    def progress(event):
        if event['event'] == 'loading_engine':
            print('正在加载 OCR 模型…', flush=True)
        elif event['event'] == 'page':
            note = '（沿用检查点）' if event['resumed'] else ''
            error = f"：{event['error']}" if event.get('error') else ''
            print(f"[{event['done']}/{event['total']}] 第 {event['page']} 页 {STATUS.get(event['status'], event['status'])}{note}{error}", flush=True)
        elif event['event'] == 'assembling':
            print('正在写入文字层…', flush=True)
        elif event['event'] == 'verifying':
            print('正在核对页面外观与文字位置…', flush=True)

    options = Options(pages=args.pages, dpi=args.dpi, threads=args.threads, work_dir=args.work_dir, restart=args.restart)
    try:
        report = run(args.input, args.output, options, progress=progress)
    except JobError as exc:
        print(f'错误：{exc}', file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print('\n已取消。已完成的页面已保存，再次运行相同命令即可继续。', file=sys.stderr)
        return 130
    print(report['message'])
    for warning in report['warnings']:
        print('注意：' + warning)
    if report.get('unplacedLines'):
        count = sum(len(lines) for lines in report['unplacedLines'].values())
        print(f'注意：{count} 行竖排或异常文字框未写入，见报告 unplacedLines。')
    if report.get('output'):
        print('输出：' + report['output'])
    print('报告：' + report['report'])
    return 0 if report['ready'] else 2


if __name__ == '__main__':
    sys.exit(main())
