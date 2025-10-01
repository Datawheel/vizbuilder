import { defaultTranslation } from "../dist/react.esm.js";

/** @type {Record<string, import("../dist/react").Translation>} */
export const translations = {
  en: {
        action_close: "Close",
        action_enlarge: "Enlarge",
        action_share: "Share",
        share_copied: "Link copied",
        action_fileissue: "Report an issue",
        action_retry: "Retry",
        aggregator: {
            average: "Average {{measure}}",
            max: "Max {{measure}}",
            min: "Min {{measure}}",
            sum: "{{measure}}"
        },
        chart_labels: {
            ci: "Confidence Interval",
            moe: "Margin of Error",
            source: "Source",
            collection: "Collection"
        },
        error: {
            "detail": "",
            "message": "Details: \"{{message}}\".",
            "title": "Error"
        },
        list: {
            join: ", ",
            suffix: "{{rest}}, and {{item}}",
            prefix: "{{list}}",
            n_more: "{{n}} more"
        },
        title: {
            main_on_period: "{{values}} by {{series}} in {{time_period}}",
            main_over_period: "{{values}} by {{series}}, {{time_scale}}",
            main: "{{values}} by {{series}}",
            measure_on_period: "{{values}} on {{time_period}}",
            measure_over_period: "{{values}}, {{time_scale}}",
            nonidealstate: "No results",
            series_members: "{{series}}",
            series: "{{series}}",
            time_range: "in {{from}}-{{to}}",
            total: "Total: {{value}}",
            scale_year: "Annualy",
            scale_quarter: "Quarterly",
            scale_month: "Monthly"
        },
        transient: {
            title_one_row: "The dataset has only one row and can't be used to generate charts.",
            title_loading: "Generating charts...",
            title_empty: "No results",
            description_empty: "The selected combination of parameters can't be used to generate a meaningful set of charts. Try changing some parameters (maybe applying some restriction in a column) and generating charts again."
        }    
  },  
  ar: {
    action_close: "إغلاق",
    action_enlarge: "تكبير",
    action_fileissue: "الإبلاغ عن مشكلة",
    action_retry: "إعادة المحاولة",
    action_share: "مشاركة",
    share_copied: "تم نسخ الرابط",
    aggregator: {
      average: "متوسط {{measure}}",
      max: "الحد الأقصى {{measure}}",
      min: "الحد الأدنى {{measure}}",
      sum: "{{measure}}",
    },
    chart_labels: {
      ci: "فترة الثقة",
      moe: "هامش الخطأ",
      source: "المصدر",
      collection: "المجموعة",
    },
    error: {
      detail: "",
      message: 'التفاصيل: "{{message}}".',
      title: "خطأ",
    },
    list: {
      join: "، ",
      suffix: "{{rest}}، و{{item}}",
      prefix: "{{list}}",
      n_more: "{{n}} more",
    },
    title: {
      main_on_period: "{{values}} حسب {{series}} في {{time_period}}",
      main_over_period: "{{values}} حسب {{series}} خلال {{time}}",
      main: "{{values}} حسب {{series}}",
      measure_on_period: "{{values}} في {{time_period}}",
      measure_over_period: "{{values}} خلال {{time}}",
      nonidealstate: "لا توجد نتائج",
      series_members: "{{series}} ({{members}})",
      series: "{{series}}",
      time_range: "في {{from}}-{{to}}",
      total: "المجموع: {{value}}",
    },
    transient: {
      title_one_row:
        "تحتوي مجموعة البيانات على صف واحد فقط ولا يمكن استخدامها لإنشاء رسوم بيانية.",
      title_loading: "جارٍ إنشاء الرسوم البيانية...",
      title_empty: "لا توجد نتائج",
      description_empty:
        "لا يمكن استخدام مجموعة المعايير المحددة لإنشاء مجموعة مفيدة من الرسوم البيانية. حاول تغيير بعض المعايير (ربما تطبيق بعض القيود في عمود) وإنشاء الرسوم البيانية مرة أخرى.",
    },
  },
};
