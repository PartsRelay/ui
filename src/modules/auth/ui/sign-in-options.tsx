import { useTranslation } from 'react-i18next'
import { googleEnabled, type SignInFlow } from '@/modules/auth/core/sign-in'
import { GoogleLogin } from '@/modules/auth/ui/google-login'
import { MagicLinkForm } from '@/modules/auth/ui/magic-link-form'
import { useMagicLink } from '@/modules/auth/ui/hooks/use-magic-link'
import { useOneTap } from '@/modules/auth/ui/hooks/use-one-tap'
import { FieldSeparator } from '@/ui/components/ui/field'

export function SignInOptions({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  const magicLink = useMagicLink()
  useOneTap(flow.back)

  return (
    <div className="grid gap-6">
      {googleEnabled && <GoogleLogin flow={flow} />}
      {googleEnabled && magicLink && (
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          {t('login.or')}
        </FieldSeparator>
      )}
      {magicLink && <MagicLinkForm flow={flow} />}
    </div>
  )
}
