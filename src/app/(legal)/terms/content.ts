import { SITE } from "@/lib/constants";
import type { LegalDoc } from "../legal-doc";

/*
 * Terms of Use for the Site. Project work itself is governed by the written
 * proposal + contract produced in /admin, not by these terms.
 */

export const UPDATED = { en: "16 October 2026", ar: "16 أكتوبر 2026" };

export const TERMS: { en: LegalDoc; ar: LegalDoc } = {
  en: {
    title: "Terms of Use",
    intro: [
      `These terms govern your use of ${SITE.url.replace("https://", "")} (the "Site"), operated by Amr Hassan, trading as ${SITE.brand}, Salmiya, Kuwait ("I", "me"). By using the Site you agree to them. If you don't agree, please don't use the Site.`,
    ],
    sections: [
      {
        h: "1. What the Site is",
        body: [
          "The Site is a portfolio and a way to contact me about web development, web design and consultation, and brand identity design. Using it, or sending an inquiry, doesn't create a client relationship or any obligation for either of us.",
        ],
      },
      {
        h: "2. Project work is agreed in writing",
        body: [
          "Any project is governed only by a written proposal and contract that we both accept. That agreement sets the scope, price, payment schedule, timeline, ownership of deliverables and warranties. If it conflicts with anything on the Site, the agreement wins.",
          "Statements on the Site about my approach, availability or what I aim for (including the commitments described on the home page) describe how I work; they are not contractual guarantees unless they are written into your agreement.",
        ],
      },
      {
        h: "3. Prices, budgets and currencies",
        body: [
          "Budget brackets on the contact form are there to help you describe your project. They are not quotes or offers. Amounts are shown in a currency chosen from your approximate location (you can switch to any other) and converted from US dollars at a daily reference rate, then rounded, so they are approximate. The price of a project is only what is stated in a written proposal.",
        ],
      },
      {
        h: "4. Portfolio content and intellectual property",
        body: [
          `The Site's design, code, text, graphics, animations and the ${SITE.brand} name and logo belong to me or are used under licence. You may view and share links to the Site, but you may not copy, reproduce or reuse its design, code or content without written permission.`,
          "Client names, logos, screenshots and trademarks shown in case studies belong to their respective owners and are shown to describe work I carried out. Their appearance doesn't mean those owners endorse anything beyond that work.",
          "The 3D device models are third-party works used under the Creative Commons Attribution 4.0 licence, credited in the footer.",
        ],
      },
      {
        h: "5. Testimonials and results",
        body: [
          "Testimonials reflect the individual experience of the people who gave them. Past projects are examples of my work, not a promise that your project will achieve the same results.",
        ],
      },
      {
        h: "6. Acceptable use",
        body: [
          "You agree not to:",
          {
            list: [
              "attempt to access the admin area or any part of the Site you aren't authorised to use;",
              "interfere with the Site's security or operation, or overload it (including automated scraping or form spam);",
              "submit false, unlawful, abusive or infringing content through the contact form;",
              "use the Site in any way that breaks the law.",
            ],
          },
        ],
      },
      {
        h: "7. Links to other sites",
        body: [
          "The Site links to client websites, WhatsApp and other services I don't control. I'm not responsible for their content, availability or privacy practices.",
        ],
      },
      {
        h: "8. No warranty",
        body: [
          'The Site is provided "as is" and "as available". I try to keep it accurate and working, but I don\'t guarantee that it will be uninterrupted, error free, or that its content is complete or up to date. The Site uses heavy 3D and audio features that may not work on every device or browser.',
        ],
      },
      {
        h: "9. Limitation of liability",
        body: [
          "To the fullest extent the law allows, I'm not liable for any indirect, incidental, special or consequential loss, or for loss of profit, data or goodwill, arising from your use of, or inability to use, the Site. Nothing in these terms limits liability that can't be limited by law, such as liability for fraud or for death or personal injury caused by negligence.",
        ],
      },
      {
        h: "10. Privacy",
        body: ["How I handle personal data is explained in the Privacy Policy, which forms part of these terms."],
      },
      {
        h: "11. Changes to these terms",
        body: [
          "I may update these terms from time to time. The version posted here, with its date, is the one that applies to your use of the Site at that time.",
        ],
      },
      {
        h: "12. Governing law",
        body: [
          "These terms are governed by the laws of the State of Kuwait, and the courts of Kuwait have jurisdiction over any dispute about them. If you are a consumer, this doesn't take away any protection you have under the mandatory law of the country where you live.",
          "If any part of these terms is found unenforceable, the rest stays in effect.",
        ],
      },
      {
        h: "13. Contact",
        body: [`Questions about these terms: ${SITE.email}`],
      },
    ],
  },

  ar: {
    title: "شروط الاستخدام",
    intro: [
      `تحكم هذه الشروط استخدامك لموقع ${SITE.url.replace("https://", "")} ("الموقع")، الذي يديره عمرو حسن باسم ${SITE.brand} التجاري، السالمية، الكويت ("أنا"). باستخدامك الموقع فإنك توافق عليها، وإن لم توافق يُرجى عدم استخدام الموقع.`,
    ],
    sections: [
      {
        h: "1. ما هو الموقع",
        body: [
          "الموقع ملف أعمال ووسيلة للتواصل معي بشأن تطوير المواقع، وتصميم المواقع والاستشارات، وتصميم الهوية البصرية. استخدامه أو إرسال استفسار عبره لا ينشئ علاقة عمل ولا أي التزام على أيٍّ منا.",
        ],
      },
      {
        h: "2. المشاريع تُتّفق عليها كتابيًا",
        body: [
          "يخضع أي مشروع فقط لعرض وعقد مكتوبين يقبلهما الطرفان. يحدّد هذا الاتفاق النطاق والسعر وجدول الدفع والجدول الزمني وملكية المخرجات والضمانات. وإذا تعارض مع أي شيء على الموقع، يُقدَّم الاتفاق.",
          "ما يرد في الموقع عن أسلوب عملي أو توفّري أو ما أسعى إليه (بما في ذلك الالتزامات المذكورة في الصفحة الرئيسية) هو وصف لطريقة عملي، وليس ضمانات تعاقدية ما لم يُدرج في اتفاقك المكتوب.",
        ],
      },
      {
        h: "3. الأسعار والميزانيات والعملات",
        body: [
          "فئات الميزانية في نموذج التواصل وُضعت لمساعدتك على وصف مشروعك، وليست عروض أسعار أو إيجابًا. تُعرض المبالغ بعملة تُختار بحسب موقعك التقريبي (ويمكنك التبديل إلى أي عملة أخرى)، وتُحوَّل من الدولار الأمريكي بسعر صرف مرجعي يومي ثم تُقرَّب، لذا فهي تقريبية. سعر المشروع هو فقط ما يرد في عرض مكتوب.",
        ],
      },
      {
        h: "4. محتوى الأعمال والملكية الفكرية",
        body: [
          `تصميم الموقع وشيفرته ونصوصه ورسوماته وحركاته واسم ${SITE.brand} وشعاره مملوكة لي أو مستخدمة بترخيص. يمكنك تصفّح الموقع ومشاركة روابطه، لكن لا يجوز نسخ تصميمه أو شيفرته أو محتواه أو إعادة استخدامها دون إذن كتابي.`,
          "أسماء العملاء وشعاراتهم ولقطات مواقعهم وعلاماتهم التجارية الظاهرة في دراسات الحالة مملوكة لأصحابها، وتُعرض لوصف العمل الذي نفّذته. ولا يعني ظهورها أن أصحابها يؤيّدون أي شيء يتجاوز ذلك العمل.",
          "نماذج الأجهزة ثلاثية الأبعاد أعمال لأطراف ثالثة مستخدمة بموجب ترخيص المشاع الإبداعي (نسب المصنَّف 4.0)، وأصحابها مذكورون في تذييل الموقع.",
        ],
      },
      {
        h: "5. الشهادات والنتائج",
        body: [
          "تعكس الشهادات التجربة الفردية لأصحابها. والمشاريع السابقة أمثلة على عملي، وليست وعدًا بأن يحقّق مشروعك النتائج نفسها.",
        ],
      },
      {
        h: "6. الاستخدام المقبول",
        body: [
          "توافق على ألّا:",
          {
            list: [
              "تحاول الوصول إلى لوحة الإدارة أو أي جزء من الموقع غير مصرّح لك باستخدامه؛",
              "تتدخّل في أمان الموقع أو تشغيله أو تُثقل عليه (بما في ذلك الجمع الآلي للبيانات أو إغراق النموذج برسائل مزعجة)؛",
              "ترسل عبر نموذج التواصل محتوى كاذبًا أو غير قانوني أو مسيئًا أو منتهكًا لحقوق الغير؛",
              "تستخدم الموقع بأي طريقة تخالف القانون.",
            ],
          },
        ],
      },
      {
        h: "7. روابط لمواقع أخرى",
        body: [
          "يحتوي الموقع على روابط لمواقع العملاء وواتساب وخدمات أخرى لا أتحكّم بها، ولست مسؤولًا عن محتواها أو توفّرها أو ممارساتها في الخصوصية.",
        ],
      },
      {
        h: "8. إخلاء المسؤولية",
        body: [
          'يُقدَّم الموقع "كما هو" و"حسب توفّره". أحرص على أن يكون دقيقًا ويعمل جيدًا، لكنني لا أضمن أن يعمل دون انقطاع أو أخطاء، أو أن يكون محتواه كاملًا أو محدّثًا. ويستخدم الموقع مؤثرات ثلاثية الأبعاد وصوتية قد لا تعمل على كل الأجهزة والمتصفحات.',
        ],
      },
      {
        h: "9. حدود المسؤولية",
        body: [
          "إلى أقصى حدّ يسمح به القانون، لست مسؤولًا عن أي خسارة غير مباشرة أو عرضية أو خاصة أو تبعية، ولا عن خسارة الأرباح أو البيانات أو السمعة، الناشئة عن استخدامك الموقع أو تعذّر استخدامه. ولا يحدّ أي شيء في هذه الشروط من المسؤولية التي لا يجوز قانونًا تحديدها، مثل المسؤولية عن الاحتيال أو عن الوفاة أو الإصابة الشخصية الناتجة عن الإهمال.",
        ],
      },
      {
        h: "10. الخصوصية",
        body: ["توضّح سياسة الخصوصية كيفية تعاملي مع البيانات الشخصية، وهي جزء من هذه الشروط."],
      },
      {
        h: "11. تعديل الشروط",
        body: ["قد أحدّث هذه الشروط من وقت لآخر. والنسخة المنشورة هنا بتاريخها هي التي تسري على استخدامك للموقع في حينه."],
      },
      {
        h: "12. القانون الواجب التطبيق",
        body: [
          "تخضع هذه الشروط لقوانين دولة الكويت، وتختص محاكم الكويت بأي نزاع بشأنها. وإن كنت مستهلكًا، فلا يُسقط ذلك أي حماية تمنحك إياها القوانين الآمرة في بلد إقامتك.",
          "إذا ثبت أن أي جزء من هذه الشروط غير قابل للتنفيذ، يبقى الباقي ساريًا.",
        ],
      },
      {
        h: "13. التواصل",
        body: [`للاستفسار عن هذه الشروط: ${SITE.email}`],
      },
    ],
  },
};
