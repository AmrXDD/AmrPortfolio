import { SITE } from "@/lib/constants";
import type { LegalDoc } from "../legal-doc";

/*
 * Privacy Policy. Every statement here describes what the code actually does
 * (src/proxy.ts, src/app/api/contact/route.ts, supabase/setup.sql). If you add
 * analytics, a newsletter, a new processor, or change retention, update this.
 */

export const UPDATED = { en: "16 October 2026", ar: "16 أكتوبر 2026" };

const phone = "+20 150 771 0012";

export const PRIVACY: { en: LegalDoc; ar: LegalDoc } = {
  en: {
    title: "Privacy Policy",
    intro: [
      `This policy explains what personal data ${SITE.brand} collects through ${SITE.url.replace("https://", "")} (the "Site"), why, who it is shared with, how long it is kept, and the rights you have over it.`,
      `${SITE.brand} is the trading name of Amr Hassan, an independent web developer and designer based in Salmiya, Kuwait ("I", "me"). I am the controller of the personal data described here.`,
    ],
    sections: [
      {
        h: "The short version",
        body: [
          {
            list: [
              "I only collect what you type into the contact form, plus the technical data every website receives.",
              "No analytics, no advertising trackers, no tracking pixels, no data sold or shared for marketing.",
              "Your inquiry is kept for 24 months, then deleted.",
              `You can ask me to see, correct or delete your data at any time: ${SITE.email}.`,
            ],
          },
        ],
      },
      {
        h: "1. What I collect",
        body: [
          "Information you give me through the contact form:",
          {
            list: [
              "your name and email address;",
              "the service you're asking about, your budget bracket, and your message;",
              "the language the Site was shown in, and the date and time you ticked the consent box.",
            ],
          },
          "Information you give me if you contact me directly by email or WhatsApp: whatever you choose to send, together with your email address or phone number.",
          "Information collected automatically:",
          {
            list: [
              "Country (approximate location) derived from your IP address by my hosting provider. It is used once, on each request, to choose the Site's language and currency, and is not stored by me.",
              "Standard server logs kept by my hosting provider (IP address, browser type, pages requested, time), used to deliver the Site and keep it secure.",
            ],
          },
          "I do not collect payment details, government IDs, or any special category data through the Site. Please don't include sensitive information in your message.",
        ],
      },
      {
        h: "2. Why I use it, and the legal basis",
        body: [
          {
            list: [
              "To reply to your inquiry and discuss a possible project. Basis: your consent (the box you tick on the form) and steps taken at your request before entering into a contract.",
              "To send you one automatic email confirming your inquiry arrived. Basis: the same.",
              "To show the Site in your language and currency. Basis: legitimate interest in presenting the Site usefully; no profile is built and nothing is stored beyond your preference cookie.",
              "To keep the Site and its admin area secure (e.g. limiting repeated failed logins). Basis: legitimate interest in security.",
              "To meet legal, tax and accounting duties if you become a client. Basis: legal obligation.",
            ],
          },
          "You can withdraw consent at any time by emailing me. This doesn't affect anything done before you withdrew it.",
        ],
      },
      {
        h: "3. Who I share it with",
        body: [
          "I don't sell or rent personal data. I share it only with the service providers that run the Site, each acting on my instructions:",
          {
            list: [
              "Supabase, Inc. stores contact form submissions in a database.",
              "Resend, Inc. delivers the confirmation email to you and the notification email to me.",
              "Vercel, Inc. hosts the Site and provides the country lookup and server logs described above.",
              "WhatsApp (Meta Platforms) handles any conversation you choose to start on WhatsApp, under its own privacy policy.",
            ],
          },
          "I may also disclose data if required by law, or to protect my rights in a dispute.",
        ],
      },
      {
        h: "4. International transfers",
        body: [
          "These providers may process data on servers outside your country, including in the United States and the European Union. Where required, transfers rely on the providers' data processing terms and the safeguards built into them (such as standard contractual clauses).",
        ],
      },
      {
        h: "5. How long I keep it",
        body: [
          {
            list: [
              "Contact form inquiries: 24 months from submission, then deleted from the database.",
              "Inquiry emails in my inbox: up to 24 months, unless we start working together.",
              "If you become a client: proposals, contracts and invoices are kept for as long as tax and accounting law requires.",
              "Security logs of login attempts (admin area only): 30 days.",
              "Your language and currency cookies: 1 year, or until you clear them.",
            ],
          },
        ],
      },
      {
        h: "6. Cookies and local storage",
        body: [
          "The Site uses only strictly necessary and preference storage. There are no analytics or advertising cookies, so no cookie banner is needed to opt out of them.",
          {
            list: [
              "lang (cookie, 1 year): remembers Arabic or English.",
              "currency (cookie, 1 year): remembers which currency to show budgets in.",
              "theme (local storage): remembers dark or light mode.",
              "amr_admin (cookie, 7 days, admin area only): keeps the site owner signed in. Visitors never receive it.",
            ],
          },
          "Fonts, images and 3D models are served from the Site itself; your browser doesn't contact Google Fonts or other third parties to load them.",
        ],
      },
      {
        h: "7. Security",
        body: [
          "Data travels over HTTPS. The database can only be reached by the Site's server using a secret key; public access is blocked at the database level. Admin passwords are stored only as bcrypt hashes, and repeated failed logins are locked out. No system is perfectly secure, but I take reasonable steps to protect your data and will notify you and the relevant authority of a breach where the law requires it.",
        ],
      },
      {
        h: "8. Your rights",
        body: [
          "Depending on where you live (for example under Kuwait's Data Privacy Protection Regulation, Egypt's Personal Data Protection Law No. 151 of 2020, or the EU/UK GDPR), you may have the right to:",
          {
            list: [
              "access the personal data I hold about you and get a copy;",
              "have it corrected or completed;",
              "have it deleted;",
              "object to or restrict how it is used;",
              "receive it in a portable format;",
              "withdraw consent at any time.",
            ],
          },
          `To use any of these, email ${SITE.email}. I'll reply within 30 days and may need to confirm your identity first. You also have the right to complain to your local data protection authority.`,
        ],
      },
      {
        h: "9. Children",
        body: [
          "The Site is a business service and isn't directed at anyone under 18. I don't knowingly collect data from children; if you believe a child has sent me data, contact me and I'll delete it.",
        ],
      },
      {
        h: "10. Changes",
        body: [
          "If this policy changes, the new version will be posted here with a new date. Significant changes affecting data I already hold will be communicated directly where possible.",
        ],
      },
      {
        h: "11. Contact",
        body: [`Amr Hassan, trading as ${SITE.brand}, Salmiya, Kuwait.`, `Email: ${SITE.email}`, `WhatsApp: ${phone}`],
      },
    ],
  },

  ar: {
    title: "سياسة الخصوصية",
    intro: [
      `توضّح هذه السياسة البيانات الشخصية التي يجمعها ${SITE.brand} عبر موقع ${SITE.url.replace("https://", "")} ("الموقع")، وسبب جمعها، ومع من تُشارَك، ومدة الاحتفاظ بها، وحقوقك عليها.`,
      `${SITE.brand} هو الاسم التجاري لعمرو حسن، مطوّر ومصمّم مواقع مستقل مقيم في السالمية، الكويت ("أنا"). وأنا المسؤول عن معالجة البيانات الشخصية الموضّحة هنا.`,
    ],
    sections: [
      {
        h: "باختصار",
        body: [
          {
            list: [
              "أجمع فقط ما تكتبه في نموذج التواصل، إضافةً إلى البيانات التقنية التي يتلقّاها أي موقع.",
              "لا أدوات تحليل، ولا متتبّعات إعلانية، ولا بكسلات تتبّع، ولا بيع أو مشاركة للبيانات لأغراض تسويقية.",
              "يُحتفظ باستفسارك لمدة 24 شهرًا ثم يُحذف.",
              `يمكنك في أي وقت أن تطلب الاطلاع على بياناتك أو تصحيحها أو حذفها: ${SITE.email}.`,
            ],
          },
        ],
      },
      {
        h: "1. ما الذي أجمعه",
        body: [
          "المعلومات التي تقدّمها عبر نموذج التواصل:",
          {
            list: [
              "اسمك وبريدك الإلكتروني؛",
              "الخدمة التي تسأل عنها، وفئة ميزانيتك، ورسالتك؛",
              "اللغة التي ظهر بها الموقع، وتاريخ ووقت موافقتك على سياسة الخصوصية.",
            ],
          },
          "المعلومات التي تقدّمها عند تواصلك المباشر عبر البريد الإلكتروني أو واتساب: ما تختار إرساله، مع بريدك الإلكتروني أو رقم هاتفك.",
          "المعلومات التي تُجمع تلقائيًا:",
          {
            list: [
              "الدولة (موقع تقريبي) المستنتجة من عنوان IP الخاص بك لدى مزوّد الاستضافة. تُستخدم مرة واحدة مع كل طلب لاختيار لغة الموقع وعملته، ولا أحتفظ بها.",
              "سجلّات الخادم المعتادة لدى مزوّد الاستضافة (عنوان IP، ونوع المتصفح، والصفحات المطلوبة، والوقت)، وتُستخدم لتشغيل الموقع وحمايته.",
            ],
          },
          "لا أجمع عبر الموقع بيانات دفع أو وثائق هوية أو أي بيانات حساسة. يُرجى عدم تضمين معلومات حساسة في رسالتك.",
        ],
      },
      {
        h: "2. لماذا أستخدمها، والأساس القانوني",
        body: [
          {
            list: [
              "للرد على استفسارك ومناقشة مشروع محتمل. الأساس: موافقتك (المربع الذي تحدّده في النموذج) والخطوات المتّخذة بناءً على طلبك قبل إبرام عقد.",
              "لإرسال رسالة تلقائية واحدة تؤكّد وصول استفسارك. الأساس: ما سبق نفسه.",
              "لعرض الموقع بلغتك وعملتك. الأساس: مصلحة مشروعة في عرض الموقع بشكل مفيد؛ لا يُبنى ملف تعريفي، ولا يُحفظ شيء سوى ملف تعريف الارتباط الخاص بتفضيلك.",
              "لحماية الموقع ولوحة الإدارة (مثل تقييد محاولات الدخول الفاشلة المتكرّرة). الأساس: مصلحة مشروعة في الأمان.",
              "للوفاء بالالتزامات القانونية والضريبية والمحاسبية إن أصبحت عميلًا. الأساس: التزام قانوني.",
            ],
          },
          "يمكنك سحب موافقتك في أي وقت بمراسلتي عبر البريد الإلكتروني، ولا يؤثّر ذلك على ما تمّ قبل سحبها.",
        ],
      },
      {
        h: "3. مع من أشاركها",
        body: [
          "لا أبيع البيانات الشخصية ولا أؤجّرها. أشاركها فقط مع مزوّدي الخدمات الذين يشغّلون الموقع، ويعمل كلٌّ منهم وفق تعليماتي:",
          {
            list: [
              "Supabase, Inc. تخزّن طلبات نموذج التواصل في قاعدة بيانات.",
              "Resend, Inc. توصل رسالة التأكيد إليك ورسالة الإشعار إليّ.",
              "Vercel, Inc. تستضيف الموقع وتوفّر تحديد الدولة وسجلّات الخادم الموضّحة أعلاه.",
              "واتساب (Meta Platforms) يتولّى أي محادثة تختار بدأها عبر واتساب، وفق سياسة الخصوصية الخاصة به.",
            ],
          },
          "قد أفصح عن البيانات أيضًا إذا اقتضى القانون ذلك، أو لحماية حقوقي في حال نشوء نزاع.",
        ],
      },
      {
        h: "4. نقل البيانات خارج بلدك",
        body: [
          "قد يعالج هؤلاء المزوّدون البيانات على خوادم خارج بلدك، بما في ذلك الولايات المتحدة والاتحاد الأوروبي. وحيثما يلزم، يستند هذا النقل إلى شروط معالجة البيانات لدى المزوّدين والضمانات المضمّنة فيها (مثل البنود التعاقدية القياسية).",
        ],
      },
      {
        h: "5. مدة الاحتفاظ",
        body: [
          {
            list: [
              "استفسارات نموذج التواصل: 24 شهرًا من تاريخ الإرسال، ثم تُحذف من قاعدة البيانات.",
              "رسائل الاستفسار في بريدي: حتى 24 شهرًا، ما لم نبدأ العمل معًا.",
              "إن أصبحت عميلًا: يُحتفظ بالعروض والعقود والفواتير للمدة التي تفرضها قوانين الضرائب والمحاسبة.",
              "سجلّات محاولات الدخول (لوحة الإدارة فقط): 30 يومًا.",
              "ملفات تعريف الارتباط الخاصة باللغة والعملة: سنة واحدة، أو حتى تحذفها.",
            ],
          },
        ],
      },
      {
        h: "6. ملفات تعريف الارتباط والتخزين المحلي",
        body: [
          "يستخدم الموقع فقط التخزين الضروري وتخزين التفضيلات. لا توجد ملفات تعريف ارتباط للتحليلات أو الإعلانات، لذا لا حاجة إلى شريط موافقة لرفضها.",
          {
            list: [
              "lang (ملف تعريف ارتباط، سنة): يتذكّر العربية أو الإنجليزية.",
              "currency (ملف تعريف ارتباط، سنة): يتذكّر العملة التي تُعرض بها الميزانيات.",
              "theme (تخزين محلي): يتذكّر الوضع الداكن أو الفاتح.",
              "amr_admin (ملف تعريف ارتباط، 7 أيام، لوحة الإدارة فقط): يُبقي مالك الموقع مسجّلًا للدخول. لا يتلقّاه الزوّار أبدًا.",
            ],
          },
          "تُقدَّم الخطوط والصور والنماذج ثلاثية الأبعاد من الموقع نفسه؛ ولا يتّصل متصفحك بخطوط Google أو أي طرف ثالث لتحميلها.",
        ],
      },
      {
        h: "7. الأمان",
        body: [
          "تنتقل البيانات عبر HTTPS. لا يمكن الوصول إلى قاعدة البيانات إلا من خادم الموقع باستخدام مفتاح سرّي، والوصول العام محظور على مستوى قاعدة البيانات نفسها. تُخزَّن كلمات مرور الإدارة كتجزئات bcrypt فقط، وتُقفل محاولات الدخول الفاشلة المتكرّرة. لا يوجد نظام آمن تمامًا، لكنني أتّخذ خطوات معقولة لحماية بياناتك، وسأُخطرك والجهة المختصة بأي اختراق متى اقتضى القانون ذلك.",
        ],
      },
      {
        h: "8. حقوقك",
        body: [
          "بحسب مكان إقامتك (مثل لائحة حماية خصوصية البيانات في الكويت، أو قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020، أو اللائحة العامة لحماية البيانات في الاتحاد الأوروبي والمملكة المتحدة)، قد يحق لك:",
          {
            list: [
              "الاطلاع على بياناتك الشخصية التي أحتفظ بها والحصول على نسخة منها؛",
              "تصحيحها أو استكمالها؛",
              "حذفها؛",
              "الاعتراض على استخدامها أو تقييده؛",
              "الحصول عليها بصيغة قابلة للنقل؛",
              "سحب موافقتك في أي وقت.",
            ],
          },
          `لممارسة أيٍّ من هذه الحقوق، راسلني على ${SITE.email}. سأرد خلال 30 يومًا، وقد أحتاج إلى التحقق من هويتك أولًا. ويحق لك أيضًا تقديم شكوى إلى الجهة المختصة بحماية البيانات في بلدك.`,
        ],
      },
      {
        h: "9. الأطفال",
        body: [
          "الموقع خدمة موجّهة للأعمال وليس موجّهًا لمن هم دون 18 عامًا. لا أجمع بيانات الأطفال عن علم؛ وإن كنت تعتقد أن طفلًا أرسل إليّ بيانات، تواصل معي وسأحذفها.",
        ],
      },
      {
        h: "10. التعديلات",
        body: [
          "إذا تغيّرت هذه السياسة، ستُنشر النسخة الجديدة هنا بتاريخ جديد. وسأبلغك مباشرةً بالتغييرات الجوهرية التي تمس بيانات أحتفظ بها، متى أمكن ذلك.",
        ],
      },
      {
        h: "11. التواصل",
        body: [`عمرو حسن، باسم ${SITE.brand} التجاري، السالمية، الكويت.`, `البريد الإلكتروني: ${SITE.email}`, `واتساب: ${phone}`],
      },
    ],
  },
};
