from types import SimpleNamespace
from unittest.mock import patch
import json
import threading
import unittest
import server
from utils.task_manager import TaskManager


class TaskEventStreamTests(unittest.TestCase):
    def setUp(self):
        self.manager = TaskManager()
        self.translator = server.PDFTranslator(SimpleNamespace(enable_venv=False))
        # The stream is a lazy generator, so the patches must outlive stream().
        for patcher in (patch.object(server, 'task_manager', self.manager), patch.object(server.time, 'sleep')):
            patcher.start()
            self.addCleanup(patcher.stop)

    def stream(self):
        with self.translator.app.test_request_context('/events'):
            return self.translator.events().response

    def test_only_changed_snapshots_are_pushed(self):
        chunks = self.stream()
        self.assertEqual(json.loads(next(chunks)[len('data: '):])['data'], [])
        self.manager.add_task('a', {'taskId': 'a', 'active': True, 'progress': 10})
        self.assertEqual(json.loads(next(chunks)[len('data: '):])['data'][0]['progress'], 10)
        # Unchanged state: no data frames, only a keep-alive comment after 15 ticks.
        self.assertEqual(next(chunks), ': keep-alive\n\n')
        self.manager.update_task('a', {'progress': 55})
        self.assertEqual(json.loads(next(chunks)[len('data: '):])['data'][0]['progress'], 55)

    def test_snapshots_are_detached_from_live_tasks(self):
        self.manager.add_task('a', {'taskId': 'a', 'progress': 1})
        snapshot = self.manager.get_active_tasks_list()
        self.manager.update_task('a', {'progress': 2, 'status': 'running'})
        self.assertEqual(snapshot, [{'taskId': 'a', 'progress': 1}])

    def test_serializing_while_workers_update_is_safe(self):
        self.manager.add_task('a', {'taskId': 'a'})
        stop = threading.Event()

        def churn():
            index = 0
            while not stop.is_set():
                index += 1
                self.manager.update_task('a', {f'field{index % 50}': index})

        worker = threading.Thread(target=churn)
        worker.start()
        try:
            for _ in range(2000):
                json.dumps(self.manager.get_active_tasks_list())
        finally:
            stop.set()
            worker.join()


if __name__ == '__main__':
    unittest.main()
