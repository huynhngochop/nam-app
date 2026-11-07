package vn.namapp.hendep.ocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Module JS "HenDepTextRecognition":
 *   recognize(uri: string): Promise<string>  — chữ trên ảnh, mỗi hàng của bảng giá một dòng.
 *
 * ML Kit (chữ Latin, có tiếng Việt) chạy trên máy, ảnh không gửi đi đâu.
 * Bảng giá hay chia 2 cột (tên … giá): ML Kit trả tên và giá thành khối riêng, nên ghép lại theo vị trí:
 * các dòng cùng độ cao trên ảnh là một hàng, đọc từ trái sang phải.
 */
class HenDepTextRecognitionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HenDepTextRecognition")

    AsyncFunction("recognize") { uri: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val image = try {
        InputImage.fromFilePath(context, Uri.parse(uri))
      } catch (e: Exception) {
        promise.reject("ERR_IMAGE", "Không mở được ảnh", e)
        return@AsyncFunction
      }
      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      recognizer.process(image)
        .addOnSuccessListener { result ->
          promise.resolve(rows(result))
          recognizer.close()
        }
        .addOnFailureListener { e ->
          // Lần đầu dùng khi Play services chưa tải xong mô hình cũng rơi vào đây.
          promise.reject("ERR_OCR", e.message ?: "Không đọc được chữ", e)
          recognizer.close()
        }
    }
  }

  private data class Line(val text: String, val left: Int, val cy: Float, val h: Int)

  private fun rows(result: Text): String {
    val lines = result.textBlocks.flatMap { b ->
      b.lines.mapNotNull { l ->
        val box = l.boundingBox ?: return@mapNotNull null
        Line(l.text, box.left, box.exactCenterY(), box.height())
      }
    }
    if (lines.isEmpty()) return result.text
    val rows = mutableListOf<MutableList<Line>>()
    for (l in lines.sortedBy { it.cy }) {
      val row = rows.lastOrNull()
      // Cùng hàng nếu tâm lệch nhau dưới 60% chiều cao chữ.
      if (row != null && kotlin.math.abs(row.last().cy - l.cy) < 0.6f * maxOf(l.h, row.last().h)) row.add(l)
      else rows.add(mutableListOf(l))
    }
    return rows.joinToString("\n") { r -> r.sortedBy { it.left }.joinToString(" ") { it.text } }
  }
}
