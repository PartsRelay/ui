import { toast } from 'sonner'
import type { Message } from '@/core/message'
import { i18n } from '@/i18n'

export type NoticeType = 'success' | 'danger' | 'info' | 'warning'

const show = {
  success: toast.success,
  danger: toast.error,
  info: toast.info,
  warning: toast.warning,
}

export function notify(type: NoticeType, ...message: Message) {
  const [key] = message

  return show[type](i18n.t(...message), { id: key })
}
