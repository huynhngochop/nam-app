package vn.namapp.vigon.listener

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Module JS "ViGonNotificationListener" — khớp hợp đồng trong apps/vi-gon/src/listener.ts:
 *   isPermissionGranted(): Promise<boolean>
 *   openPermissionSettings(): void
 *   drainPending(): Array<{ packageName, title, text, postedAt }>   — thông báo đến lúc app đang tắt
 *   setAllowedApps(list: string[]): void                            — chỉ đọc các app này (rỗng = mọi app)
 *   sự kiện 'notification'
 */
class ViGonNotificationListenerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  fun emit(item: PendingItem) {
    sendEvent("notification", item.toMap())
  }

  override fun definition() = ModuleDefinition {
    Name("ViGonNotificationListener")

    Events("notification")

    // JS bắt đầu nghe → nhận thẳng; JS ngừng (app tắt / tải lại) → service xếp vào hàng chờ.
    OnStartObserving { active = this@ViGonNotificationListenerModule }
    OnStopObserving { if (active === this@ViGonNotificationListenerModule) active = null }
    OnDestroy { if (active === this@ViGonNotificationListenerModule) active = null }

    AsyncFunction("isPermissionGranted") {
      val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty()
      val me = ComponentName(context, BankNotificationService::class.java)
      enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
    }

    Function("openPermissionSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("drainPending") {
      PendingStore(context).drain().map { it.toMap() }
    }

    Function("setAllowedApps") { list: List<String> ->
      PendingStore(context).setAllowedApps(list)
    }
  }

  companion object {
    @Volatile
    var active: ViGonNotificationListenerModule? = null
  }
}
