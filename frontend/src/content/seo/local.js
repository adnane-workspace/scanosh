import { loc, page } from './helpers.js';

const CTA = {
  ctaTitle: loc('Créer mon menu au Maroc', 'Create my menu in Morocco', 'أنشئ قائمتك في المغرب'),
  ctaBody: loc(
    'Scanosh est conçu pour les cafés, restaurants et snacks marocains : menu QR, dashboard, arabe et français.',
    'Scanosh is built for Moroccan cafes, restaurants and snacks: QR menu, dashboard, Arabic and French.',
    'صُمّم Scanosh لمقاهي ومطاعم ووجبات المغرب: قائمة QR، لوحة، عربية وفرنسية.',
  ),
};

function city({ slug, nameFr, nameEn, nameAr, sceneFr, sceneEn, sceneAr }) {
  return page({
    path: `/maroc/${slug}`,
    cluster: 'local',
    parent: '/maroc/menu-digital',
    related: ['/menu-digital', '/tarifs', '/contact'],
    title: loc(
      `Menu digital à ${nameFr} | Scanosh`,
      `Digital menu in ${nameEn} | Scanosh`,
      `قائمة رقمية في ${nameAr} | Scanosh`,
    ),
    description: loc(
      `Menu digital et QR code pour restaurants, cafés et snacks à ${nameFr}. Mettez à jour plats et prix avec Scanosh, sans réimprimer.`,
      `Digital menu and QR code for restaurants, cafes and snacks in ${nameEn}. Update dishes and prices with Scanosh, without reprinting.`,
      `قائمة رقمية ورمز QR للمطاعم والمقاهي والوجبات السريعة في ${nameAr}. حدّث الأطباق والأسعار مع Scanosh دون إعادة طباعة.`,
    ),
    h1: loc(
      `Menu digital pour restaurants et cafés à ${nameFr}`,
      `Digital menu for restaurants and cafes in ${nameEn}`,
      `قائمة رقمية للمطاعم والمقاهي في ${nameAr}`,
    ),
    answer: loc(
      `À ${nameFr}, cafés, restaurants et snacks ont besoin d’une carte lisible sur téléphone : photos, prix, ruptures. Scanosh publie un menu QR par établissement et un dashboard pour le modifier le jour même, sans nouvelle impression.`,
      `In ${nameEn}, cafes, restaurants and snacks need a phone-readable card: photos, prices, 86s. Scanosh publishes one QR menu per venue and a dashboard to edit it the same day, without a new print run.`,
      `في ${nameAr} تحتاج المقاهي والمطاعم والوجبات السريعة بطاقة مقروءة على الهاتف: صور، أسعار، نفاد. ينشر Scanosh قائمة QR لكل مؤسسة ولوحة لتعديلها في نفس اليوم بلا طبعة جديدة.`,
    ),
    sections: [
      {
        h2: loc(`La restauration à ${nameFr}`, `Food scene in ${nameEn}`, `مشهد الطعام في ${nameAr}`),
        body: loc(sceneFr, sceneEn, sceneAr),
      },
      {
        h2: loc('Ce que Scanosh apporte sur place', 'What Scanosh brings on the ground', 'ماذا يقدّم Scanosh في الميدان'),
        items: [
          loc('QR unique à poser sur les tables ou au comptoir', 'A single QR for tables or the counter', 'رمز واحد للطاولات أو المنضدة'),
          loc('Mise à jour des prix et du plat du jour', 'Updates for prices and the dish of the day', 'تحديث الأسعار وطبق اليوم'),
          loc('Interface gérant en français et en arabe', 'Manager UI in French and Arabic', 'واجهة مدير بالفرنسية والعربية'),
          loc('Menu public partageable (lien + QR)', 'Shareable public menu (link + QR)', 'قائمة عامة قابلة للمشاركة (رابط + QR)'),
        ],
      },
      {
        h2: loc('Comment démarrer', 'How to start', 'كيف تبدأ'),
        body: loc(
          `Créez votre café sur Scanosh, construisez la carte, générez le QR. Si vous êtes à ${nameFr}, une adresse et une photo de couverture aident les clients à reconnaître l’établissement sur le menu public.`,
          `Create your cafe on Scanosh, build the card, generate the QR. If you are in ${nameEn}, an address and cover photo help guests recognise the venue on the public menu.`,
          `أنشئ مقهاك على Scanosh، ابنِ البطاقة، أنشئ الرمز. إن كنت في ${nameAr} فالعنوان وصورة الغلاف يساعدان الضيوف على التعرّف في القائمة العامة.`,
        ),
      },
    ],
    faq: [
      {
        q: loc(`Scanosh est-il fait pour ${nameFr} ?`, `Is Scanosh built for ${nameEn}?`, `هل Scanosh مناسب لـ ${nameAr}؟`),
        a: loc(
          'Oui. Le produit vise les établissements marocains : simplicité, mobile, FR/AR, menu QR.',
          'Yes. The product targets Moroccan venues: simplicity, mobile, FR/AR, QR menu.',
          'نعم. المنتج يستهدف مؤسسات المغرب: بساطة، جوال، فرنسية/عربية، قائمة QR.',
        ),
      },
      {
        q: loc('Faut-il une application pour les clients ?', 'Do guests need an app?', 'هل يحتاج الضيوف تطبيقاً؟'),
        a: loc('Non. Un scan ouvre le menu dans le navigateur.', 'No. A scan opens the menu in the browser.', 'لا. المسح يفتح القائمة في المتصفح.'),
      },
    ],
    ...CTA,
  });
}

export const localPages = [
  page({
    path: '/maroc/menu-digital',
    cluster: 'local',
    children: ['/maroc/casablanca', '/maroc/rabat', '/maroc/marrakech', '/maroc/fes', '/maroc/tanger', '/maroc/agadir'],
    related: ['/menu-digital', '/menu-qr-code', '/tarifs'],
    title: loc('Menu digital Maroc | Scanosh', 'Digital menu Morocco | Scanosh', 'قائمة رقمية المغرب | Scanosh'),
    description: loc(
      'Menu digital et menu QR au Maroc pour cafés, restaurants et snacks. Dashboard Scanosh, arabe et français, sans réimprimer la carte.',
      'Digital and QR menus in Morocco for cafes, restaurants and snacks. Scanosh dashboard, Arabic and French, no card reprint.',
      'قائمة رقمية وقائمة QR في المغرب للمقاهي والمطاعم والوجبات السريعة. لوحة Scanosh، عربية وفرنسية، دون إعادة طباعة البطاقة.',
    ),
    h1: loc('Menu digital au Maroc', 'Digital menu in Morocco', 'القائمة الرقمية في المغرب'),
    answer: loc(
      'Scanosh est une solution de menu digital par QR code pour les cafés, restaurants et snacks au Maroc. Le gérant pilote plats, prix et photos depuis un dashboard ; le client scanne et lit la carte sur son téléphone, sans application.',
      'Scanosh is a QR digital-menu solution for cafes, restaurants and snacks in Morocco. Managers run dishes, prices and photos from a dashboard; guests scan and read the card on their phone, with no app.',
      'Scanosh حل قائمة رقمية برمز QR لمقاهي ومطاعم ووجبات المغرب. يدير المدير الأطباق والأسعار والصور من لوحة؛ يمسح الضيف ويقرأ البطاقة على هاتفه بلا تطبيق.',
    ),
    sections: [
      {
        h2: loc('Pourquoi le Maroc', 'Why Morocco', 'لماذا المغرب'),
        body: loc(
          'Cartes bilingues, terrasses, rush du ramadan, prix qui bougent : le papier fatigue vite. Un QR stable et un dashboard FR/AR collent au rythme des établissements marocains.',
          'Bilingual cards, terraces, Ramadan rush, moving prices: paper tires fast. A stable QR and a FR/AR dashboard match Moroccan venues.',
          'بطاقات ثنائية اللغة، تراسات، ذروة رمضان، أسعار تتحرك: الورق يتعب سريعاً. رمز ثابت ولوحة فرنسية/عربية تناسب إيقاع المؤسسات المغربية.',
        ),
      },
      {
        h2: loc('Villes', 'Cities', 'مدن'),
        body: loc(
          'Des pages locales précisent le contexte de Casablanca, Rabat, Marrakech, Fès, Tanger et Agadir. Chaque page relie le même produit à une scène de restauration différente — pas une copie vide.',
          'Local pages cover Casablanca, Rabat, Marrakech, Fès, Tangier and Agadir. Each ties the same product to a different food scene — not an empty copy.',
          'صفحات محلية تغطي الدار البيضاء والرباط ومراكش وفاس وطنجة وأكادير. كل صفحة تربط نفس المنتج بمشهد طعام مختلف — ليست نسخة فارغة.',
        ),
      },
    ],
    faq: [
      {
        q: loc('Le meilleur menu digital au Maroc ?', 'The best digital menu in Morocco?', 'أفضل قائمة رقمية في المغرب؟'),
        a: loc(
          'Le « meilleur » dépend de votre salle. Scanosh vise la simplicité : menu public + QR + dashboard, sans app client. Comparez à un PDF et à des outils plus lourds.',
          '“Best” depends on your room. Scanosh aims at simplicity: public menu + QR + dashboard, no guest app. Compare to a PDF and heavier tools.',
          '«الأفضل» يعتمد على قاعتك. Scanosh يهدف للبساطة: قائمة عامة + QR + لوحة، بلا تطبيق ضيف. قارن بـ PDF وبأدوات أثقل.',
        ),
      },
    ],
    ...CTA,
  }),
  city({
    slug: 'casablanca',
    nameFr: 'Casablanca',
    nameEn: 'Casablanca',
    nameAr: 'الدار البيضاء',
    sceneFr:
      'Casablanca mélange business lunch, corniche et snacks de quartier. Les cartes changent souvent (formules midi, poissons). Un menu QR Scanosh évite de réimprimer à chaque semaine comptable, utile entre Maarif, Gauthier, Ain Diab et les zones industrielles.',
    sceneEn:
      'Casablanca mixes business lunch, the corniche and neighbourhood snacks. Cards change often (lunch deals, fish). A Scanosh QR menu avoids reprinting every accounting week, useful between Maarif, Gauthier, Ain Diab and industrial zones.',
    sceneAr:
      'الدار البيضاء تمزج غداء الأعمال والكورنيش ووجبات الأحياء. البطاقات تتغيّر كثيراً (عروض الظهر، سمك). قائمة Scanosh تجنّب إعادة الطباعة كل أسبوع محاسبي، بين المعاريف وغوتيي وعين الدياب والمناطق الصناعية.',
  }),
  city({
    slug: 'rabat',
    nameFr: 'Rabat',
    nameEn: 'Rabat',
    nameAr: 'الرباط',
    sceneFr:
      'À Rabat, cafés d’Agdal, restaurants de l’océan et cantines administratives cohabitent. La clientèle lit le français et l’arabe. Scanosh permet une interface gérant dans les deux langues et un QR unique pour terrasses de l’Agdal ou tables de Hassan.',
    sceneEn:
      'In Rabat, Agdal cafes, ocean restaurants and office canteens coexist. Guests read French and Arabic. Scanosh offers a manager UI in both languages and one QR for Agdal terraces or Hassan tables.',
    sceneAr:
      'في الرباط تتعايش مقاهي أكدال ومطاعم المحيط ومطاعم الإدارات. الضيوف يقرأون الفرنسية والعربية. Scanosh يقدّم واجهة مدير باللغتين ورمزاً واحداً لتراسات أكدال أو طاولات حسان.',
  }),
  city({
    slug: 'marrakech',
    nameFr: 'Marrakech',
    nameEn: 'Marrakech',
    nameAr: 'مراكش',
    sceneFr:
      'Marrakech vit du tourisme et des riads : cartes en plusieurs langues, photos qui vendent le tajine. Un menu digital Scanosh se partage aussi par lien (WhatsApp, booking) en plus du QR en salle, utile pour les terrasses de la Médina et Guéliz.',
    sceneEn:
      'Marrakech lives on tourism and riads: multilingual cards, photos that sell the tajine. A Scanosh digital menu also shares as a link (WhatsApp, booking) besides the in-room QR — useful for Medina and Guéliz terraces.',
    sceneAr:
      'مراكش تعيش على السياحة والرياض: بطاقات متعددة اللغات، صور تبيع الطاجين. قائمة Scanosh تُشارك أيضاً كرابط (واتساب، حجز) إضافة إلى QR القاعة — مفيد لتراسات المدينة وجليز.',
  }),
  city({
    slug: 'fes',
    nameFr: 'Fès',
    nameEn: 'Fès',
    nameAr: 'فاس',
    sceneFr:
      'Fès allie médina dense et restaurants d’hôtel. Les visiteurs scannent volontiers ; les tables serrées rendent le papier encombrant. Un QR Scanosh + photos de plats locaux (pastilla, couscous) clarifie la carte sans allonger le service.',
    sceneEn:
      'Fès mixes a dense medina and hotel restaurants. Visitors scan readily; tight tables make paper bulky. A Scanosh QR plus photos of local dishes (pastilla, couscous) clarifies the card without slowing service.',
    sceneAr:
      'فاس تمزج مدينة كثيفة ومطاعم فنادق. الزوار يمسحون بسهولة؛ الطاولات الضيقة تجعل الورق ثقيلاً. رمز Scanosh وصور أطباق محلية (بسطيلة، كسكس) توضّح البطاقة دون إبطاء الخدمة.',
  }),
  city({
    slug: 'tanger',
    nameFr: 'Tanger',
    nameEn: 'Tangier',
    nameAr: 'طنجة',
    sceneFr:
      'Tanger : cafés du détroit, restaurants internationaux, snacks du centre. La clientèle mixte (locaux, Espagne, ferry). Un menu Scanosh en français et en arabe, plus un QR sur table, collent à cette ville de passage.',
    sceneEn:
      'Tangier: strait cafes, international restaurants, downtown snacks. Mixed guests (locals, Spain, ferry). A Scanosh menu in French and Arabic plus a table QR fit this transit city.',
    sceneAr:
      'طنجة: مقاهي المضيق، مطاعم دولية، وجبات وسط المدينة. ضيوف مختلطون (محليون، إسبانيا، عبارة). قائمة Scanosh بالفرنسية والعربية وQR على الطاولة تناسب مدينة العبور.',
  }),
  city({
    slug: 'agadir',
    nameFr: 'Agadir',
    nameEn: 'Agadir',
    nameAr: 'أكادير',
    sceneFr:
      'Agadir combine hôtellerie de plage, poisson grillé et cafés de ville. Les menus bilingues et les formules all-inclusive changent. Scanosh met à jour la carte du grill sans réimprimer les chevalets de bord de mer.',
    sceneEn:
      'Agadir mixes beach hotels, grilled fish and city cafes. Bilingual menus and all-inclusive deals change. Scanosh updates the grill card without reprinting seafront table tents.',
    sceneAr:
      'أكادير تمزج فنادق الشاطئ والسمك المشوي ومقاهي المدينة. القوائم الثنائية والعروض تتغيّر. Scanosh يحدّث بطاقة المشواة دون إعادة طباعة حوامل الكورنيش.',
  }),
];

export const extraPages = [
  page({
    path: '/tarifs',
    cluster: 'commercial',
    related: ['/menu-digital', '/contact', '/blog/prix-menu-digital'],
    title: loc('Tarifs menu digital | Scanosh', 'Digital menu pricing | Scanosh', 'أسعار القائمة الرقمية | Scanosh'),
    description: loc(
      'Tarifs Scanosh : commencez gratuitement, créez votre menu QR et votre dashboard. Sans réimprimer à chaque changement de prix.',
      'Scanosh pricing: start free, create your QR menu and dashboard. No reprint on every price change.',
      'أسعار Scanosh: ابدأ مجاناً، أنشئ قائمة QR ولوحتك. بلا إعادة طباعة عند كل تغيير سعر.',
    ),
    h1: loc('Tarifs Scanosh', 'Scanosh pricing', 'أسعار Scanosh'),
    answer: loc(
      'Vous pouvez créer un menu digital Scanosh et générer le QR dès l’inscription, sans carte bancaire obligatoire pour tester. L’objectif est de remplacer le coût de réimpression par une carte toujours juste.',
      'You can create a Scanosh digital menu and generate the QR from signup, with no mandatory card to test. The goal is to replace reprint cost with a card that stays accurate.',
      'يمكنك إنشاء قائمة Scanosh ورمز QR من التسجيل بلا بطاقة إلزامية للتجربة. الهدف استبدال تكلفة إعادة الطباعة ببطاقة تبقى صحيحة.',
    ),
    sections: [
      {
        h2: loc('Inclus pour démarrer', 'Included to start', 'مشمول للبدء'),
        items: [
          loc('Menu public (lien + QR)', 'Public menu (link + QR)', 'قائمة عامة (رابط + QR)'),
          loc('Dashboard : catégories, plats, photos, prix, disponibilité', 'Dashboard: categories, dishes, photos, prices, availability', 'لوحة: تصنيفات، أطباق، صور، أسعار، توفر'),
          loc('Interface français et arabe', 'French and Arabic UI', 'واجهة فرنسية وعربية'),
          loc('Mises à jour sans réimprimer le QR', 'Updates without reprinting the QR', 'تحديثات دون إعادة طباعة الرمز'),
        ],
      },
      {
        h2: loc('Ce que vous n’achetez pas', 'What you are not buying', 'ما لا تشتريه'),
        body: loc(
          'Pas d’application client à faire installer. Pas de caisse à remplacer. Scanosh digitalise le menu, il ne remplace pas votre POS.',
          'No guest app to force-install. No till to replace. Scanosh digitises the menu; it does not replace your POS.',
          'لا تطبيق ضيف يُفرض تثبيته. لا صندوق يُستبدل. Scanosh يرقمن القائمة ولا يستبدل نقطة البيع.',
        ),
      },
    ],
    faq: [
      {
        q: loc('Le menu digital est-il payant ?', 'Is the digital menu paid?', 'هل القائمة الرقمية مدفوعة؟'),
        a: loc('Vous commencez gratuitement. Les évolutions d’offre seront indiquées ici.', 'You start free. Offer changes will be listed here.', 'تبدأ مجاناً. تطورات العرض ستظهر هنا.'),
      },
    ],
    ...CTA,
  }),
  page({
    path: '/contact',
    cluster: 'commercial',
    related: ['/tarifs', '/register', '/maroc/menu-digital'],
    title: loc('Contact Scanosh', 'Contact Scanosh', 'تواصل مع Scanosh'),
    description: loc(
      'Contactez Scanosh pour un menu digital QR : cafés, restaurants et snacks au Maroc.',
      'Contact Scanosh for a QR digital menu: cafes, restaurants and snacks in Morocco.',
      'تواصل مع Scanosh لقائمة رقمية QR: مقاهٍ ومطاعم ووجبات سريعة في المغرب.',
    ),
    h1: loc('Contact', 'Contact', 'تواصل'),
    answer: loc(
      'Pour ouvrir un menu, le chemin le plus rapide est l’inscription. Pour une question produit, un partenariat (imprimeur, agence, consultant restaurant) ou un café déjà en ligne, utilisez le formulaire ou le lien de contact.',
      'To open a menu, the fastest path is signup. For a product question, a partnership (printer, agency, restaurant consultant) or a cafe already live, use the form or the contact link.',
      'لفتح قائمة، أسرع طريق هو التسجيل. لسؤال عن المنتج أو شراكة (مطبعة، وكالة، مستشار مطاعم) أو مقهى قائم، استخدم النموذج أو رابط التواصل.',
    ),
    sections: [
      {
        h2: loc('Partenaires', 'Partners', 'شركاء'),
        body: loc(
          'Agences web, imprimeurs de chevalets QR, photographes culinaires : Scanosh peut s’intégrer à votre offre. Décrivez le besoin dans le message.',
          'Web agencies, QR table-tent printers, food photographers: Scanosh can sit in your offer. Describe the need in the message.',
          'وكالات ويب، مطابع حوامل QR، مصورو طعام: يمكن إدماج Scanosh في عرضكم. صِف الحاجة في الرسالة.',
        ),
      },
    ],
    faq: [
      {
        q: loc('Support gérant ?', 'Manager support?', 'دعم المدير؟'),
        a: loc('Connectez-vous à votre espace : la plupart des changements (plats, QR) se font dans le dashboard.', 'Sign in to your space: most changes (dishes, QR) happen in the dashboard.', 'ادخل إلى فضائك: معظم التغييرات (أطباق، QR) تتم في اللوحة.'),
      },
    ],
    ctaTitle: loc('Créer un compte', 'Create an account', 'أنشئ حساباً'),
    ctaBody: loc('Inscription en quelques minutes.', 'Signup in a few minutes.', 'تسجيل في دقائق.'),
  }),
  page({
    path: '/confidentialite',
    cluster: 'legal',
    related: ['/contact', '/tarifs'],
    title: loc(
      'Politique de confidentialité | Scanosh',
      'Privacy policy | Scanosh',
      'سياسة الخصوصية | Scanosh',
    ),
    description: loc(
      'Comment Scanosh traite vos données : compte, menu, photos, OCR et sous-traitants. Contact : contact@scanosh.com.',
      'How Scanosh handles your data: account, menu, photos, OCR and processors. Contact: contact@scanosh.com.',
      'كيف يعالج Scanosh بياناتك: الحساب، القائمة، الصور، OCR والمعالجون. التواصل: contact@scanosh.com.',
    ),
    h1: loc('Politique de confidentialité', 'Privacy policy', 'سياسة الخصوصية'),
    answer: loc(
      'Dernière mise à jour : 16 septembre 2026. Cette notice décrit les données traitées par Scanosh pour fournir le menu digital QR. Elle s’adresse aux gérants qui créent un compte. Ce n’est pas un avis juridique personnalisé.',
      'Last update: 16 September 2026. This notice describes the data Scanosh processes to provide the QR digital menu. It is for managers who create an account. It is not personalised legal advice.',
      'آخر تحديث: 16 سبتمبر 2026. توضّح هذه الصفحة البيانات التي يعالجها Scanosh لتقديم القائمة الرقمية QR. وهي موجّهة للمديرين الذين ينشئون حساباً. ليست استشارة قانونية شخصية.',
    ),
    sections: [
      {
        h2: loc('Responsable', 'Controller', 'المسؤول'),
        body: loc(
          'Scanosh est édité par Adnane EL MENOUAR. Pour toute question relative aux données : contact@scanosh.com.',
          'Scanosh is published by Adnane EL MENOUAR. For data questions: contact@scanosh.com.',
          'يُصدر Scanosh عدنان المنور. لأي سؤال عن البيانات: contact@scanosh.com.',
        ),
      },
      {
        h2: loc('Données collectées', 'Data we collect', 'البيانات المجمّعة'),
        items: [
          loc(
            'Compte : nom, email, mot de passe stocké sous forme hachée, codes de vérification email.',
            'Account: name, email, hashed password, email verification codes.',
            'الحساب: الاسم، البريد، كلمة المرور المخزّنة مشفّرة بالتجزئة، رموز تأكيد البريد.',
          ),
          loc(
            'Établissement : nom, slug, description, adresse, téléphone, coordonnées GPS si vous les saisissez, logo et visuels de couverture.',
            'Venue: name, slug, description, address, phone, GPS if you enter them, logo and cover images.',
            'المؤسسة: الاسم، الرابط، الوصف، العنوان، الهاتف، الإحداثيات إن أدخلتها، الشعار وصور الغلاف.',
          ),
          loc(
            'Menu : catégories, plats, prix, photos, réglages d’affichage du menu public.',
            'Menu: categories, dishes, prices, photos, public-menu display settings.',
            'القائمة: التصنيفات، الأطباق، الأسعار، الصور، إعدادات عرض القائمة العامة.',
          ),
          loc(
            'Journal d’activité côté plateforme (connexions, modifications) pour le support et la sécurité.',
            'Platform activity logs (sign-ins, edits) for support and security.',
            'سجل نشاط المنصة (دخول، تعديلات) للدعم والأمان.',
          ),
        ],
      },
      {
        h2: loc('Photo et intelligence artificielle', 'Photo and AI', 'الصورة والذكاء الاصطناعي'),
        body: loc(
          'Si vous utilisez « Remplir avec l’IA », la photo du menu papier est envoyée à un service d’OCR puis à un modèle de langage (NVIDIA) pour proposer plats, prix et sections. Des images de plats peuvent être générées ou cherchées pour illustrer la carte. Rien n’est publié sur le menu public tant que vous ne validez pas. La photo sert à construire votre menu, pas à de la publicité.',
          'If you use “Fill with AI”, the paper-menu photo is sent to an OCR service then to a language model (NVIDIA) to propose dishes, prices and sections. Dish images may be generated or searched to illustrate the card. Nothing is published on the public menu until you confirm. The photo is used to build your menu, not for advertising.',
          'إذا استخدمت «التعبئة بالذكاء الاصطناعي»، تُرسل صورة القائمة الورقية إلى خدمة OCR ثم إلى نموذج لغوي (NVIDIA) لاقتراح الأطباق والأسعار والأقسام. قد تُنشأ أو تُبحث صور للأطباق. لا يُنشر شيء في القائمة العامة قبل تأكيدك. الصورة لبناء قائمتك لا للإعلان.',
        ),
      },
      {
        h2: loc('Menu public', 'Public menu', 'القائمة العامة'),
        body: loc(
          'Le menu que vous publiez (nom de l’établissement, plats, photos, prix) est accessible à toute personne qui ouvre le lien ou scanne le QR. Ne mettez pas de données personnelles de clients dans les descriptions de plats.',
          'The menu you publish (venue name, dishes, photos, prices) is available to anyone who opens the link or scans the QR. Do not put guest personal data in dish descriptions.',
          'القائمة التي تنشرها (اسم المؤسسة، الأطباق، الصور، الأسعار) متاحة لمن يفتح الرابط أو يمسح الرمز. لا تضع بيانات شخصية للزبائن في وصف الأطباق.',
        ),
      },
      {
        h2: loc('Hébergeurs et sous-traitants', 'Hosts and processors', 'المستضيفون والمعالجون'),
        items: [
          loc('Vercel : hébergement de l’application et de l’API.', 'Vercel: hosting of the app and API.', 'Vercel: استضافة التطبيق وواجهة البرمجة.'),
          loc('Neon : base de données PostgreSQL.', 'Neon: PostgreSQL database.', 'Neon: قاعدة بيانات PostgreSQL.'),
          loc('Cloudinary : stockage et diffusion des images.', 'Cloudinary: image storage and delivery.', 'Cloudinary: تخزين الصور وعرضها.'),
          loc('Resend : envoi des emails (code, mot de passe).', 'Resend: sending emails (code, password).', 'Resend: إرسال البريد (الرمز، كلمة المرور).'),
          loc('NVIDIA : OCR, structuration du menu et génération d’images si vous lancez ces fonctions.', 'NVIDIA: OCR, menu structuring and image generation when you run those features.', 'NVIDIA: OCR وهيكلة القائمة وتوليد الصور عند تشغيل هذه الميزات.'),
        ],
      },
      {
        h2: loc('Transferts', 'Transfers', 'النقل'),
        body: loc(
          'Ces prestataires peuvent traiter des données hors du Maroc, dans l’Union européenne ou aux États-Unis, uniquement pour faire fonctionner Scanosh.',
          'These providers may process data outside Morocco, in the EU or the United States, solely to operate Scanosh.',
          'قد يعالج هؤلاء المقدّمون بيانات خارج المغرب، في الاتحاد الأوروبي أو الولايات المتحدة، لتشغيل Scanosh فقط.',
        ),
      },
      {
        h2: loc('Durée de conservation', 'Retention', 'مدة الاحتفاظ'),
        body: loc(
          'Les données du compte et du menu sont conservées tant que le compte est actif. Les codes email expirent rapidement. Après suppression du compte ou de l’établissement, les données correspondantes sont retirées de la base, sous réserve de sauvegardes techniques limitées dans le temps.',
          'Account and menu data are kept while the account is active. Email codes expire quickly. After the account or venue is deleted, matching data is removed from the database, subject to short-lived technical backups.',
          'تُحفظ بيانات الحساب والقائمة طالما الحساب نشط. رموز البريد تنتهي بسرعة. بعد حذف الحساب أو المؤسسة تُزال البيانات من القاعدة، مع نسخ احتياطية تقنية محدودة المدة.',
        ),
      },
      {
        h2: loc('Vos droits', 'Your rights', 'حقوقك'),
        body: loc(
          'Vous pouvez consulter et corriger la plupart des informations dans le dashboard. Pour une copie, une correction que vous ne pouvez pas faire seul, ou une suppression du compte : contact@scanosh.com. Scanosh n’utilise pas de cookies publicitaires ni d’outil d’analytics tierce. La session gérant est stockée localement dans votre navigateur.',
          'You can view and edit most information in the dashboard. For a copy, a correction you cannot make yourself, or account deletion: contact@scanosh.com. Scanosh does not use advertising cookies or a third-party analytics tool. The manager session is stored locally in your browser.',
          'يمكنك عرض وتصحيح معظم المعلومات من اللوحة. لنسخة أو تصحيح لا يمكنك إجراؤه وحدك أو حذف الحساب: contact@scanosh.com. لا يستخدم Scanosh كوكيز إعلانية ولا أداة تحليلات لطرف ثالث. جلسة المدير تُحفظ محلياً في المتصفح.',
        ),
      },
      {
        h2: loc('Ce que nous ne faisons pas', 'What we do not do', 'ما لا نفعله'),
        items: [
          loc('Nous ne vendons pas vos données.', 'We do not sell your data.', 'لا نبيع بياناتك.'),
          loc('Nous ne créons pas de compte pour les clients qui scannent le QR.', 'We do not create accounts for guests who scan the QR.', 'لا ننشئ حسابات لضيوف يمسحون الرمز.'),
          loc('Scanosh n’est pas une caisse et n’enregistre pas les commandes des clients.', 'Scanosh is not a till and does not record guest orders.', 'Scanosh ليس صندوقاً ولا يسجّل طلبات الزبائن.'),
        ],
      },
    ],
    faq: [
      {
        q: loc('Les clients doivent-ils accepter cette politique ?', 'Do guests need to accept this policy?', 'هل يجب على الضيوف قبول هذه السياسة؟'),
        a: loc(
          'Non. Elle concerne le gérant qui ouvre un compte. Le client ouvre seulement le menu public.',
          'No. It applies to the manager who opens an account. The guest only opens the public menu.',
          'لا. تخص المدير الذي يفتح حساباً. الضيف يفتح القائمة العامة فقط.',
        ),
      },
      {
        q: loc('Puis-je tout supprimer ?', 'Can I delete everything?', 'هل يمكنني حذف كل شيء؟'),
        a: loc(
          'Oui. Écrivez à contact@scanosh.com : nous supprimons le compte et le menu associé.',
          'Yes. Email contact@scanosh.com: we delete the account and associated menu.',
          'نعم. راسل contact@scanosh.com: نحذف الحساب والقائمة المرتبطة.',
        ),
      },
    ],
    ctaTitle: loc('Une question sur vos données ?', 'A question about your data?', 'سؤال عن بياناتك؟'),
    ctaBody: loc(
      'Écrivez à contact@scanosh.com ou utilisez la page contact.',
      'Write to contact@scanosh.com or use the contact page.',
      'راسل contact@scanosh.com أو استخدم صفحة التواصل.',
    ),
  }),
];
