from types import SimpleNamespace
from unittest.mock import patch
import unittest
import server


class SafeCompareTests(unittest.TestCase):
    def setUp(self):
        self.translator=server.PDFTranslator(SimpleNamespace(enable_venv=False))

    def test_old_crop_action_routes_to_intact_page_compare(self):
        for kind in ['origin','dual']:
            config=SimpleNamespace(dual_mode='TB')
            with patch.object(self.translator,'_execute_compare_job',return_value={'safe':True}) as compare:
                result=self.translator._execute_crop_compare_job(None,'paper.pdf',config,'pdf2zh_next',kind)
            self.assertEqual(result,{'safe':True})
            self.assertEqual(config.dual_mode,'LR')
            compare.assert_called_once()

    def test_already_cut_pages_cannot_be_presented_as_recovered_originals(self):
        with self.assertRaisesRegex(ValueError,'裁剪'):
            self.translator._execute_crop_compare_job(None,'cut.pdf',SimpleNamespace(),'pdf2zh_next','dual-cut')


if __name__=='__main__':unittest.main()
