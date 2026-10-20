"""OCR engine adapter. The pipeline only needs ``recognize(image)``."""
from dataclasses import dataclass
from importlib import metadata
from pathlib import Path
import hashlib


@dataclass(frozen=True)
class OcrLine:
    """One recognized line: quad = top-left, top-right, bottom-right,
    bottom-left corners in image pixels."""
    quad: tuple
    text: str
    score: float


class RapidOcrEngine:
    """RapidOCR on ONNX Runtime (CPU). Models ship inside the wheel, so
    recognition never downloads anything."""

    name = 'rapidocr_onnxruntime'

    def __init__(self, threads=None):
        from rapidocr_onnxruntime import RapidOCR
        import rapidocr_onnxruntime
        options = {'max_side_len': 4000}  # do not shrink 300 DPI pages
        if threads:
            options.update(intra_op_num_threads=threads, inter_op_num_threads=1)
        self._ocr = RapidOCR(**options)
        self.version = metadata.version('rapidocr_onnxruntime')
        models = Path(rapidocr_onnxruntime.__file__).parent / 'models'
        self.models = {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                       for path in sorted(models.glob('*.onnx'))}

    @property
    def identity(self):
        return {'engine': self.name, 'version': self.version, 'models': self.models}

    def recognize(self, image):
        result, _ = self._ocr(image)
        lines = []
        for quad, text, score in result or []:
            text = (text or '').strip()
            if text:
                lines.append(OcrLine(tuple((float(x), float(y)) for x, y in quad), text, float(score)))
        return lines
