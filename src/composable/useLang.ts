import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * 语言选择工具：site.copy 里的文案统一存成 { zh, en }，
 * 组件通过 pick() 取当前语言的那一份，避免每个组件各写一遍三元判断。
 */
export function useLang() {
  const { locale } = useI18n();

  const lang = computed<'zh' | 'en'>(() => (locale.value === 'zh' ? 'zh' : 'en'));

  function pick<T>(obj: Record<'zh' | 'en', T>): T {
    return obj[lang.value];
  }

  /** 把文案里的 {year} / {count} 之类占位符替换掉 */
  function fill(text: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      text,
    );
  }

  return { lang, pick, fill };
}
