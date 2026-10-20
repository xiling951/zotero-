pdf2zh-startup-begin = Addon is loading
pdf2zh-startup-finish = Addon is ready

pdf2zh-prefs-title = PDF2zh

pdf2zh-prefs-menu-translate = Translate PDF
pdf2zh-prefs-menu-cut = Cut PDF
pdf2zh-prefs-menu-crop-compare = Bilingual PDF(After Cropping)
pdf2zh-prefs-menu-compare = Bilingual PDF

pdf2zh-operation-progress-title = PDF2zh
pdf2zh-operation-progress-processing = Preparing request...
pdf2zh-operation-progress-submitting = Submitting “{ $fileName }”...
pdf2zh-operation-progress-accepted = Submitted. { $action } “{ $fileName }” now
pdf2zh-operation-progress-running = { $action } “{ $fileName }”{ $suffix }
pdf2zh-operation-progress-importing = Server finished. Importing attachments for “{ $fileName }”...
pdf2zh-operation-progress-file-done = Imported “{ $fileName }”
pdf2zh-operation-progress-file-failed = “{ $fileName }” failed: { $message }
pdf2zh-operation-progress-waiting = Waiting to process “{ $fileName }”
pdf2zh-operation-progress-summary = Processing { $done }/{ $total } file(s)
pdf2zh-operation-action-translate = Translating
pdf2zh-operation-action-crop = Cropping
pdf2zh-operation-action-compare = Building bilingual PDF
pdf2zh-operation-action-crop-compare = Building cropped bilingual PDF
pdf2zh-operation-batch-progress = { $current }/{ $total }: { $text }
pdf2zh-operation-error-translate = “Translate PDF” only accepts an original PDF. Select the original attachment or its parent item.
pdf2zh-operation-error-crop = This file cannot be cropped again. Select an original, mono, or dual attachment.
pdf2zh-operation-error-compare = This file cannot be used for Bilingual Compare. Select an original or dual attachment.
pdf2zh-operation-error-crop-compare = This file cannot be used for Cropped Bilingual Compare. Select an original, dual, or dual-cut attachment.
pdf2zh-operation-error-crop-compare-terminal = This PDF is already a Cropped Bilingual Compare result. Select the original or a dual attachment instead.
pdf2zh-operation-error-compare-terminal = This PDF is already a Bilingual Compare result. Select the original or a dual attachment instead.

pdf2zh-operation-error-no-selection = Select an item or PDF attachment first.
pdf2zh-operation-error-unknown = Unknown error
pdf2zh-operation-error-prefix = Error: { $message }
pdf2zh-operation-error-single-file = Failed to process { $fileName }: { $message }
pdf2zh-operation-batch-started = Started { $count } file(s). Please wait.
pdf2zh-operation-batch-completed =
    { $kind ->
        [failed] Failed. { $failed } file(s) failed
        [mixed] Finished. Succeeded: { $succeeded }, failed: { $failed }
       *[success] All done. Succeeded: { $succeeded }
    }
pdf2zh-operation-error-no-files = The server did not return any files to import.
pdf2zh-operation-error-completed-no-files = The task completed, but the Server returned no files.
pdf2zh-operation-error-partial-attachments = Imported only { $attached }/{ $total } attachment(s): { $message }
