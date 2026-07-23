import { useLanguage } from '../hooks/useLanguage'

export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
      <button
        type="button"
        className={`lang-toggle__btn${lang === 'en' ? ' is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-toggle__btn${lang === 'ms' ? ' is-active' : ''}`}
        onClick={() => setLang('ms')}
        aria-pressed={lang === 'ms'}
      >
        BM
      </button>
    </div>
  )
}
