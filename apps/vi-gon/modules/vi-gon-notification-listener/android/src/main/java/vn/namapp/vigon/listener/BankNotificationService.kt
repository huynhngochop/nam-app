package vn.namapp.vigon.listener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Nhận thông báo của mọi app (khi người dùng đã cho phép), giữ lại thông báo có số tiền.
 *
 * - App đang chạy (JS đã đăng ký nghe): đẩy thẳng sự kiện "notification" sang JS.
 * - App đã tắt: xếp vào hàng chờ trên máy (PendingStore); lần mở app sau JS lấy ra bằng drainPending().
 *
 * Chỉ giữ thông báo trông giống biến động số dư để không lưu tin nhắn riêng tư khác.
 */
class BankNotificationService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    val n = sbn ?: return
    if (n.packageName == packageName) return
    if (n.isOngoing) return
    val notif = n.notification ?: return
    // Bỏ thông báo tóm tắt của nhóm (trùng nội dung với thông báo con).
    if (notif.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

    val extras = notif.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
    val big = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
    val text = (big ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()).orEmpty()
    val body = "$title $text".trim()
    if (body.isEmpty() || !MONEY.containsMatchIn(body)) return

    val store = PendingStore(applicationContext)
    val allowed = store.allowedApps()
    if (allowed.isNotEmpty() && n.packageName !in allowed) return

    // Cùng một thông báo được cập nhật nhiều lần (đổi thứ tự, hiện lại khi khởi động máy) → chỉ lấy một lần.
    val key = "${n.packageName}|${body.hashCode()}"
    synchronized(recent) {
      if (recent.contains(key)) return
      recent.add(key)
      if (recent.size > 64) recent.removeAt(0)
    }

    val item = PendingItem(n.packageName, title, text, n.postTime)
    val module = ViGonNotificationListenerModule.active
    if (module != null) module.emit(item) else store.push(item)
  }

  companion object {
    /** Số tiền kiểu ngân hàng: 1.234.000 / 1,234,000 / 120000VND / 50.000đ / +2tr. */
    private val MONEY = Regex(
      """(\d{1,3}([.,]\d{3})+|\d{4,})\s*(VND|VNĐ|đ|d\b)|[+\-]\s?\d{1,3}([.,]\d{3})+|(VND|VNĐ)\s*\d""",
      RegexOption.IGNORE_CASE,
    )
    private val recent = ArrayList<String>()
  }
}
