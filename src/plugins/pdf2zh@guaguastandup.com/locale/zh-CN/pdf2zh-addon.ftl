pdf2zh-startup-begin = 插件加载中
pdf2zh-startup-finish = 插件已就绪

pdf2zh-prefs-title = PDF2zh

pdf2zh-prefs-menu-translate = 翻译PDF
pdf2zh-prefs-menu-cut = 裁剪PDF
pdf2zh-prefs-menu-compare = 双语对照
pdf2zh-prefs-menu-crop-compare = 双语对照(裁剪后拼接)

pdf2zh-operation-progress-title = PDF2zh
pdf2zh-operation-progress-processing = 正在准备请求...
pdf2zh-operation-progress-submitting = 正在提交「{ $fileName }」...
pdf2zh-operation-progress-accepted = 已提交，正在{ $action }「{ $fileName }」
pdf2zh-operation-progress-running = 正在{ $action }「{ $fileName }」{ $suffix }
pdf2zh-operation-progress-importing = 服务器已完成，正在导入「{ $fileName }」的附件...
pdf2zh-operation-progress-file-done = 「{ $fileName }」已导入
pdf2zh-operation-progress-file-failed = 「{ $fileName }」失败：{ $message }
pdf2zh-operation-progress-waiting = 等待处理「{ $fileName }」
pdf2zh-operation-progress-summary = 正在处理 { $done }/{ $total } 个文件
pdf2zh-operation-action-translate = 翻译
pdf2zh-operation-action-crop = 裁剪
pdf2zh-operation-action-compare = 生成双语对照
pdf2zh-operation-action-crop-compare = 生成裁剪双语对照
pdf2zh-operation-batch-progress = 第 { $current }/{ $total } 个：{ $text }
pdf2zh-operation-error-translate = “翻译 PDF”只支持原始 PDF。请选择原文附件或论文条目。
pdf2zh-operation-error-crop = 当前文件不能再次裁剪。请选择原文、mono 或 dual 附件。
pdf2zh-operation-error-compare = 当前文件不能执行“双语对照”。请选择原文或 dual 附件。
pdf2zh-operation-error-crop-compare = 当前文件不能执行“双语对照（裁剪）”。请选择原文、dual 或 dual-cut 附件。
pdf2zh-operation-error-crop-compare-terminal = 该 PDF 已经是“双语对照（裁剪）”结果，无需再次处理。请选择原文或 dual 附件。
pdf2zh-operation-error-compare-terminal = 该 PDF 已经是“双语对照”结果，无需再次处理。请选择原文或 dual 附件。

pdf2zh-operation-error-no-selection = 请先选择一个条目或 PDF 附件。
pdf2zh-operation-error-unknown = 未知错误
pdf2zh-operation-error-prefix = 错误：{ $message }
pdf2zh-operation-error-single-file = 处理文件 { $fileName } 失败：{ $message }
pdf2zh-operation-batch-started = 已开始处理 { $count } 个文件，请稍候
pdf2zh-operation-batch-completed =
    { $kind ->
        [failed] 处理失败。失败 { $failed } 个
        [mixed] 处理结束。成功 { $succeeded } 个，失败 { $failed } 个
       *[success] 全部完成。成功 { $succeeded } 个
    }
pdf2zh-operation-error-no-files = 服务器未返回可导入的文件
pdf2zh-operation-error-completed-no-files = 任务已完成，但 Server 未返回任何文件
pdf2zh-operation-error-partial-attachments = 仅导入 { $attached }/{ $total } 个附件：{ $message }
