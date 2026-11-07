package vn.namapp.vigon.listener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class PendingItem(val packageName: String, val title: String, val text: String, val postedAt: Long) {
  fun toMap(): Map<String, Any> =
    mapOf("packageName" to packageName, "title" to title, "text" to text, "postedAt" to postedAt.toDouble())
}

/** Hàng chờ thông báo khi app đang tắt + danh sách app ngân hàng được đọc. Lưu trong SharedPreferences riêng. */
class PendingStore(context: Context) {
  private val prefs = context.getSharedPreferences("vigon_notification_listener", Context.MODE_PRIVATE)

  @Synchronized
  fun push(item: PendingItem) {
    val arr = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
    arr.put(
      JSONObject()
        .put("p", item.packageName)
        .put("t", item.title)
        .put("x", item.text)
        .put("a", item.postedAt),
    )
    // Giữ tối đa MAX mục mới nhất (nhiều ngày không mở app vẫn không phình bộ nhớ).
    val start = (arr.length() - MAX).coerceAtLeast(0)
    val kept = JSONArray()
    for (i in start until arr.length()) kept.put(arr.get(i))
    prefs.edit().putString(KEY_QUEUE, kept.toString()).apply()
  }

  @Synchronized
  fun drain(): List<PendingItem> {
    val arr = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
    prefs.edit().remove(KEY_QUEUE).apply()
    return (0 until arr.length()).map {
      val o = arr.getJSONObject(it)
      PendingItem(o.optString("p"), o.optString("t"), o.optString("x"), o.optLong("a"))
    }
  }

  fun allowedApps(): Set<String> = prefs.getStringSet(KEY_ALLOWED, emptySet()) ?: emptySet()

  fun setAllowedApps(list: List<String>) {
    prefs.edit().putStringSet(KEY_ALLOWED, list.toSet()).apply()
  }

  private companion object {
    const val KEY_QUEUE = "queue"
    const val KEY_ALLOWED = "allowed"
    const val MAX = 300
  }
}
