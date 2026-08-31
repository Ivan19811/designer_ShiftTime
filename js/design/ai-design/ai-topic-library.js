// js/design/ai-design/ai-topic-library.js
// [AI-SITE-GENERATOR-2026][Етап 3.8]
// Тематична база для автономного AI Дизайну: 200 тем сайтів + 200 тем маркетплейсу.
// Це не генерація GPT. Це локальний каталог, на який AI Генератор сайту/сторінки буде спиратись
// для вибору theme preset, секцій, текстових підказок і майбутніх image packs.

export const AI_TOPIC_TYPES = Object.freeze([
  Object.freeze({ id: 'site', label: 'Сайти', description: 'Тематика звичайних сайтів, лендінгів, порталів і сторінок послуг.' }),
  Object.freeze({ id: 'marketplace', label: 'Маркетплейс / продажі', description: 'Тематика магазинів, каталогів, дропшипінгу і товарних сторінок.' })
]);

const SITE_TOPIC_LABELS = Object.freeze([
  "Самоврядування",
  "Державні послуги",
  "Політика",
  "Право",
  "Адвокатські послуги",
  "Нотаріус",
  "Освіта",
  "Дитячий садок",
  "Школа",
  "Ліцей / гімназія",
  "Університет",
  "Онлайн-курси",
  "Репетиторство",
  "Наука",
  "Лабораторія",
  "Медицина",
  "Стоматологія",
  "Психологія",
  "Реабілітація",
  "Ветеринарія",
  "Фармація",
  "Релігія",
  "Благодійність",
  "Волонтерство",
  "Культура",
  "Театр",
  "Музика",
  "Танці",
  "Музей",
  "Бібліотека",
  "Кіно",
  "Література",
  "Новини",
  "Блог",
  "Подкаст",
  "Форум / спільнота",
  "Туризм",
  "Готель",
  "Хостел",
  "Ресторан",
  "Кафе",
  "Пекарня",
  "Кейтеринг",
  "Доставка їжі",
  "Весілля",
  "Івент-агентство",
  "Фотограф",
  "Відеограф",
  "Дизайн-студія",
  "Веб-студія",
  "Маркетингова агенція",
  "SEO-агенція",
  "SMM-агенція",
  "IT-компанія",
  "SaaS-сервіс",
  "Стартап",
  "Кібербезпека",
  "Хмарні технології",
  "Штучний інтелект",
  "Робототехніка",
  "Електроніка",
  "Телекомунікації",
  "Фінанси",
  "Банк",
  "Страхування",
  "Криптовалюта",
  "Інвестиції",
  "Бухгалтерія",
  "Бізнес-консалтинг",
  "HR / рекрутинг",
  "Кар’єра / вакансії",
  "Коучинг",
  "Психотерапія",
  "Фітнес",
  "Йога",
  "Спорт",
  "Футбол",
  "Теніс",
  "Бойові мистецтва",
  "Біг / марафони",
  "Краса",
  "Косметологія",
  "Перукарня",
  "Барбершоп",
  "СПА / масаж",
  "Мода",
  "Одяг",
  "Взуття",
  "Ювелірні вироби",
  "Аксесуари",
  "Меблі",
  "Дизайн інтер’єру",
  "Архітектура",
  "Будівництво",
  "Ремонт",
  "Електромонтаж",
  "Сантехніка",
  "Ландшафтний дизайн",
  "Садівництво",
  "Агробізнес",
  "Фермерство",
  "Тваринництво",
  "Пасіка",
  "Рибальство",
  "Полювання",
  "Екологія",
  "Переробка відходів",
  "Відновлювана енергетика",
  "Сонячні електростанції",
  "Авто",
  "Автосервіс",
  "Автодетейлінг",
  "Автозапчастини",
  "Логістика",
  "Вантажоперевезення",
  "Таксі / трансфер",
  "Нерухомість",
  "Продаж нерухомості",
  "Оренда нерухомості",
  "Девелопмент",
  "Коворкінг",
  "Юридичний портал",
  "Медичний портал",
  "Освітній портал",
  "Кулінарія",
  "Рецепти",
  "Здорове харчування",
  "Дієтологія",
  "Материнство",
  "Батьківство / дитячий розвиток",
  "Домашні тварини",
  "Кінологія",
  "Клуб любителів котів",
  "Handmade",
  "Творча майстерня",
  "3D-друк",
  "Фото-студія",
  "Друкарня",
  "Поліграфія",
  "Виробництво",
  "Металообробка",
  "Деревообробка",
  "Текстильне виробництво",
  "Хімічна промисловість",
  "Освітлення",
  "Побутова техніка",
  "Розумний дім",
  "Охорона / безпека",
  "Відеоспостереження",
  "Пожежна безпека",
  "Ігри / геймдев",
  "Кіберспорт",
  "Стрімінг",
  "Соціальна мережа / ком’юніті",
  "Знайомства",
  "Психологічна підтримка",
  "Медитація",
  "Езотерика",
  "Астрологія",
  "Нумерологія",
  "Історія",
  "Краєзнавство",
  "Генеалогія",
  "Освітні подорожі",
  "Мовна школа",
  "Переклади",
  "Документообіг",
  "CRM / ERP-рішення",
  "Автоматизація бізнесу",
  "Платіжні сервіси",
  "Тендери / держзакупівлі",
  "Франчайзинг",
  "Дистрибуція",
  "Оптові продажі",
  "B2B-каталог",
  "Виробничий каталог",
  "Соціальні проєкти",
  "Громадська організація",
  "Фонд розвитку громади",
  "Медіа-видання",
  "Локальний портал міста",
  "Довідник / інформаційний портал",
  "Афіша подій",
  "Календар заходів",
  "Освітні матеріали",
  "Саморозвиток",
  "Бізнес-освіта",
  "Онлайн-школа професій",
  "Курси програмування",
  "Курси дизайну",
  "Курси водіння",
  "Медичний центр діагностики",
  "Клінінг",
  "Охоронна компанія",
  "Домашній сервіс / майстри",
  "Ремонт техніки",
  "Хімчистка / пральня",
  "Прокат обладнання",
  "Прокат авто",
  "Туроператор"
]);

const MARKETPLACE_TOPIC_LABELS = Object.freeze([
  "Годинники",
  "Смарт-годинники",
  "Телефони",
  "Планшети",
  "Ноутбуки",
  "Комп’ютери / ПК",
  "Монітори",
  "Телевізори",
  "Навушники",
  "Акустика",
  "Фотоапарати",
  "Відеокамери",
  "Ігрові консолі",
  "Відеоігри",
  "Комп’ютерні комплектуючі",
  "Мережеве обладнання",
  "Побутова техніка",
  "Кухонна техніка",
  "Холодильники",
  "Пральні машини",
  "Пилососи",
  "Кондиціонери",
  "Обігрівачі",
  "Освітлення",
  "Електротехніка",
  "Електроінструменти",
  "Ручний інструмент",
  "Генератори",
  "Стабілізатори / UPS",
  "Будматеріали",
  "Сантехніка",
  "Плитка",
  "Двері",
  "Вікна",
  "Фарби / лаки",
  "Меблі",
  "М’які меблі",
  "Кухні",
  "Спальні",
  "Офісні меблі",
  "Садові меблі",
  "Декор для дому",
  "Домашній текстиль",
  "Посуд",
  "Кухонне приладдя",
  "Товари для прибирання",
  "Товари для зберігання",
  "Товари для ванної",
  "Садовий інвентар",
  "Рослини",
  "Саджанці",
  "Насіння",
  "Добрива",
  "Теплиці",
  "Автополив",
  "Мангали",
  "Казани",
  "Сковороди",
  "Грилі",
  "Туристичне спорядження",
  "Наметове спорядження",
  "Рюкзаки",
  "Термоси",
  "Велосипеди",
  "Самокати",
  "Електросамокати",
  "Скейт / ролики",
  "Спортивний одяг",
  "Спортивне взуття",
  "Тренажери",
  "Фітнес-товари",
  "Рибальські товари",
  "Мисливські товари",
  "Тактичне спорядження",
  "Автотовари",
  "Шини / диски",
  "Автозапчастини",
  "Автоелектроніка",
  "Мотоцикли",
  "Мотозапчастини",
  "Велозапчастини",
  "Чоловічий одяг",
  "Жіночий одяг",
  "Дитячий одяг",
  "Верхній одяг",
  "Нижня білизна",
  "Чоловіче взуття",
  "Жіноче взуття",
  "Дитяче взуття",
  "Сумки",
  "Міські рюкзаки",
  "Гаманці",
  "Модні аксесуари",
  "Ювелірні вироби",
  "Біжутерія",
  "Окуляри",
  "Косметика",
  "Догляд за шкірою",
  "Догляд за волоссям",
  "Парфумерія",
  "Манікюрні товари",
  "Барбершоп-товари",
  "Медичні товари",
  "Ортопедичні товари",
  "Вітаміни / БАДи",
  "Товари для масажу",
  "Інтимні товари",
  "Книги",
  "Канцелярія",
  "Настільні ігри",
  "Іграшки",
  "Конструктори",
  "Радіокеровані моделі",
  "Дитячі коляски",
  "Автокрісла",
  "Товари для немовлят",
  "Шкільні товари",
  "Музичні інструменти",
  "Аудіообладнання",
  "DJ-обладнання",
  "Товари для творчості",
  "Handmade-вироби",
  "Товари для шиття",
  "Товари для в’язання",
  "Художні матеріали",
  "Колекціонування",
  "Антикваріат",
  "Монети",
  "Поштові марки",
  "Подарунки",
  "Святковий декор",
  "Квіти",
  "Товари для свят",
  "Весільні товари",
  "Офісна техніка",
  "Витратні матеріали для друку",
  "Принтери / МФУ",
  "Папір / поліграфія",
  "Бізнес-сувеніри",
  "Пакування",
  "Етикетки / стікери",
  "Товари для кав’ярні",
  "Кава",
  "Чай",
  "Солодощі",
  "Бакалія",
  "Спеції",
  "Органічні продукти",
  "Фермерські продукти",
  "Заморожені продукти",
  "Корм для собак",
  "Корм для котів",
  "Товари для домашніх тварин",
  "Акваріумістика",
  "Товари для птахів",
  "Товари для гризунів",
  "Клітки / вольєри",
  "Товари для безпеки",
  "Відеоспостереження",
  "Сигналізація",
  "Замки / фурнітура",
  "Пожежне обладнання",
  "Робочий одяг",
  "Спецвзуття",
  "Засоби захисту",
  "Лабораторне обладнання",
  "Медичне обладнання",
  "Ресторанне обладнання",
  "Холодильне обладнання",
  "Торгове обладнання",
  "Складське обладнання",
  "Промислове обладнання",
  "Сільгосптехніка",
  "Меблева фурнітура",
  "Товари для ремонту техніки",
  "Запчастини для побутової техніки",
  "Запчастини для телефонів",
  "Запчастини для ноутбуків",
  "Кабелі / перехідники",
  "Power bank / зарядні пристрої",
  "Розумний дім",
  "Смарт-датчики",
  "3D-принтери",
  "Витратні матеріали для 3D-друку",
  "Дрони",
  "Аксесуари для дронів",
  "Студійне освітлення",
  "Фотоаксесуари",
  "Товари для блогерів / стрімерів",
  "Українські сувеніри",
  "Еко-товари",
  "Zero waste товари",
  "Товари для сауни / бані",
  "Басейни та аксесуари",
  "Будівельне обладнання",
  "Товари для пляжу",
  "Зимові товари",
  "Новорічні товари",
  "Оптові мікс-лоти",
  "Дропшипінг-товари"
]);

const SITE_GROUPS = Object.freeze([
  Object.freeze({ id: 'public', label: 'Держава / право / громада', match: ['самоврядування','держав','політика','право','адвокат','нотаріус','тендер','закупів','громадська','фонд розвитку','соціальні проєкти'] }),
  Object.freeze({ id: 'education', label: 'Освіта / наука', match: ['освіта','садок','школа','ліцей','гімназія','університет','курси','репетитор','наука','лаборатор','мовна','програмування','дизайн','водіння','матеріали','саморозвиток'] }),
  Object.freeze({ id: 'health', label: 'Медицина / здоровʼя', match: ['медицин','стомат','психолог','реабілітац','ветерин','фармац','діагности','дієтолог','здорове','психотерап','підтримка'] }),
  Object.freeze({ id: 'culture', label: 'Культура / медіа', match: ['культура','театр','музика','танці','музей','бібліотека','кіно','література','новини','блог','подкаст','історія','краєзнавство','генеалогія','медіа','афіша','календар'] }),
  Object.freeze({ id: 'hospitality', label: 'HoReCa / туризм / події', match: ['туризм','готель','хостел','ресторан','кафе','пекарня','кейтеринг','доставка їжі','весілля','івент','туроператор','подорожі'] }),
  Object.freeze({ id: 'digital', label: 'IT / digital / автоматизація', match: ['веб','маркетинг','seo','smm','it-компанія','saas','стартап','кібер','хмар','штучний інтелект','робототех','телеком','crm','erp','автоматизація','платіжні'] }),
  Object.freeze({ id: 'finance', label: 'Фінанси / бізнес', match: ['фінанси','банк','страхування','крипто','інвестиції','бухгалтер','консалтинг','hr','кар’єра','коучинг','франчайзинг','дистрибуція','оптові','b2b','виробничий каталог'] }),
  Object.freeze({ id: 'sport_beauty', label: 'Спорт / краса / lifestyle', match: ['фітнес','йога','спорт','футбол','теніс','бойові','біг','краса','косметолог','перукар','барбершоп','спа','мода','одяг','взуття','ювелір','аксесуари','медитація'] }),
  Object.freeze({ id: 'build_home', label: 'Будинок / будівництво / нерухомість', match: ['меблі','інтер’єр','архітектура','будівництво','ремонт','електромонтаж','сантехніка','ландшафт','садівництво','нерухомість','девелопмент','клінінг','домашній сервіс','ремонт техніки','хімчистка','прокат'] }),
  Object.freeze({ id: 'agro_eco', label: 'Агро / природа / екологія', match: ['агробізнес','фермер','тваринництво','пасіка','рибальство','полювання','екологія','переробка','відновлювана','сонячні'] }),
  Object.freeze({ id: 'auto_logistics', label: 'Авто / логістика', match: ['авто','автосервіс','детейлінг','автозапчастини','логістика','вантаж','таксі'] }),
  Object.freeze({ id: 'production_security', label: 'Виробництво / безпека', match: ['виробництво','металообробка','деревообробка','текстиль','хімічна','освітлення','техніка','розумний дім','охорона','відеоспостереження','пожежна'] }),
  Object.freeze({ id: 'creative_social', label: 'Креатив / спільноти', match: ['handmade','майстерня','3d-друк','фото','друкарня','поліграфія','ігри','геймдев','кіберспорт','стрімінг','соціальна мережа','знайомства','езотерика','астрологія','нумерологія','переклади','документообіг'] })
]);

const MARKET_GROUPS = Object.freeze([
  Object.freeze({ id: 'electronics', label: 'Електроніка / гаджети', match: ['годинники','смарт','телефони','планшети','ноутбуки','комп’ютери','монітори','телевізори','навушники','акустика','фотоапарати','відеокамери','консолі','відеоігри','комплектуючі','мережеве','дрони','кабелі','power bank','3d-принтери','смарт-датчики'] }),
  Object.freeze({ id: 'home_build', label: 'Дім / ремонт / будівництво', match: ['побутова','кухонна','холодильники','пральні','пилососи','кондиціонери','обігрівачі','освітлення','електротехніка','інструменти','генератори','ups','будматеріали','сантехніка','плитка','двері','вікна','фарби','меблі','декор','текстиль','посуд','зберігання','ванної','будівельне'] }),
  Object.freeze({ id: 'garden_outdoor', label: 'Сад / природа / відпочинок', match: ['садовий','рослини','саджанці','насіння','добрива','теплиці','автополив','мангали','казани','сковороди','грилі','туристичне','наметове','рюкзаки','термоси','рибальські','мисливські','сауни','басейни','пляжу','зимові'] }),
  Object.freeze({ id: 'sport_auto', label: 'Спорт / авто / транспорт', match: ['велосипеди','самокати','електросамокати','скейт','спортивний','тренажери','фітнес','тактичне','автотовари','шини','автозапчастини','автоелектроніка','мото','велозапчастини'] }),
  Object.freeze({ id: 'fashion_beauty', label: 'Одяг / краса / аксесуари', match: ['одяг','білизна','взуття','сумки','рюкзаки','гаманці','модні','ювелір','біжутерія','окуляри','косметика','шкірою','волоссям','парфумерія','манікюрні','барбершоп'] }),
  Object.freeze({ id: 'kids_books_creative', label: 'Діти / книги / творчість', match: ['книги','канцелярія','настільні','іграшки','конструктори','радіокеровані','коляски','автокрісла','немовлят','шкільні','музичні','аудіообладнання','dj','творчості','handmade','шиття','в’язання','художні','колекціонування','антикваріат','монети','марки','подарунки','святковий','квіти','весільні'] }),
  Object.freeze({ id: 'food_business', label: 'Їжа / офіс / бізнес', match: ['офісна','друку','принтери','папір','сувеніри','пакування','етикетки','кав’ярні','кава','чай','солодощі','бакалія','спеції','органічні','фермерські','заморожені'] }),
  Object.freeze({ id: 'pets_security_industry', label: 'Тварини / безпека / обладнання', match: ['корм','тварин','акваріум','птахів','гризунів','клітки','безпеки','відеоспостереження','сигналізація','замки','пожежне','робочий','спецвзуття','захист','лабораторне','медичне обладнання','ресторанне','холодильне','торгове','складське','промислове','сільгосптехніка','фурнітура','запчастини'] }),
  Object.freeze({ id: 'eco_seasonal', label: 'Еко / сезонне / опт', match: ['українські сувеніри','еко','zero waste','новорічні','оптові','дропшипінг'] })
]);


const EDUCATION_PROFESSIONAL_SECTIONS = Object.freeze([
  Object.freeze({ type: 'hero', label: 'Hero / вступ і запис', recipeId: 'split', variantId: 'hero-split-visual', imageMode: 'visualBlock', purpose: 'перший екран для майбутніх учнів/студентів і батьків: чітка пропозиція, вступ/запис, довіра, швидкий CTA' }),
  Object.freeze({ type: 'services', label: 'Програми навчання', recipeId: 'cards', variantId: 'services-cards-3', imageMode: 'visualBlock', purpose: 'структурований каталог програм, курсів або напрямів навчання з короткими результатами після навчання' }),
  Object.freeze({ type: 'features', label: 'Чому обирають нас', recipeId: 'bento', variantId: 'features-bento-proof', imageMode: 'none', purpose: 'докази якості: методика, підтримка, результат, безпека, формат навчання, доступність' }),
  Object.freeze({ type: 'services', label: 'Викладачі та ментори', recipeId: 'cards', variantId: 'services-process-steps', imageMode: 'visualBlock', purpose: 'команда викладачів/менторів, експертність, кураторство та підтримка учнів' }),
  Object.freeze({ type: 'gallery', label: 'Життя школи / приклади', recipeId: 'bento', variantId: 'gallery-bento-showcase', imageMode: 'visualBlock', purpose: 'галерея навчального середовища: класи, заняття, події, роботи учнів, атмосфера закладу' }),
  Object.freeze({ type: 'cta', label: 'Запис на пробне заняття', recipeId: 'compact', variantId: 'cta-centered', imageMode: 'none', purpose: 'короткий admissions CTA: консультація, пробний урок, день відкритих дверей або заявка на вступ' }),
  Object.freeze({ type: 'faq', label: 'Питання батьків і студентів', recipeId: 'split', variantId: 'faq-split', imageMode: 'none', purpose: 'відповіді про вступ, оплату, формат навчання, документи, розклад і підтримку' }),
  Object.freeze({ type: 'contacts', label: 'Контакти / форма запису', recipeId: 'split', variantId: 'contacts-form-focus', imageMode: 'visualBlock', purpose: 'форма заявки, телефон, месенджери, адреса, години роботи, швидкий запис на консультацію' })
]);

function isProfessionalEducationLabel_(label) {
  const lower = String(label || '').toLowerCase();
  return ['освіта','садок','школа','ліцей','гімназія','університет','курси','репетитор','мовна школа','освітній портал','онлайн-курси','бізнес-освіта','онлайн-школа','курси програмування','курси дизайну','курси водіння'].some((token) => lower.includes(token));
}

function educationTextPack_(label) {
  return Object.freeze({
    heroTitles: Object.freeze([
      `${label}: навчання, яке веде до реального результату`,
      `Сучасний освітній простір для дітей, студентів і дорослих`,
      `Оберіть програму навчання і запишіться на консультацію`
    ]),
    subtitles: Object.freeze([
      'Професійна структура освітнього сайту: програми, вступ, викладачі, розклад, події, відгуки, FAQ і форма запису.',
      'Сторінка побудована навколо шляху користувача: знайти програму, перевірити довіру, поставити питання і залишити заявку.'
    ]),
    ctas: Object.freeze(['Записатися на консультацію','Переглянути програми','День відкритих дверей']),
    serviceLabels: Object.freeze(['Програми навчання','Викладачі','Розклад','Вступ','Події','Підтримка']),
    faq: Object.freeze(['Як записатися на консультацію?','Які програми доступні?','Чи є пробне заняття?','Як проходить оплата?','Які документи потрібні для вступу?'])
  });
}
const SECTION_PRESETS = Object.freeze({
  educationProfessional: EDUCATION_PROFESSIONAL_SECTIONS,
  siteDefault: Object.freeze([
    Object.freeze({ type: 'hero', recipeId: 'split', variantId: 'hero-split-visual', imageMode: 'visualBlock', purpose: 'перший екран і головна пропозиція теми' }),
    Object.freeze({ type: 'services', recipeId: 'cards', variantId: 'services-cards-3', imageMode: 'visualBlock', purpose: 'ключові послуги або напрямки' }),
    Object.freeze({ type: 'features', recipeId: 'bento', variantId: 'features-bento-proof', imageMode: 'none', purpose: 'переваги і докази довіри' }),
    Object.freeze({ type: 'gallery', recipeId: 'bento', variantId: 'gallery-bento-showcase', imageMode: 'visualBlock', purpose: 'візуальні приклади і портфоліо' }),
    Object.freeze({ type: 'faq', recipeId: 'auto', variantId: 'faq-split', imageMode: 'none', purpose: 'відповіді на заперечення' }),
    Object.freeze({ type: 'contacts', recipeId: 'split', variantId: 'contacts-form', imageMode: 'none', purpose: 'контакти і заявка' })
  ]),
  marketplaceDefault: Object.freeze([
    Object.freeze({ type: 'hero', recipeId: 'overlay', variantId: 'hero-overlay-focus', imageMode: 'sectionBackground', purpose: 'промо-перший екран і УТП магазину' }),
    Object.freeze({ type: 'services', recipeId: 'cards', variantId: 'services-compact-tiles', imageMode: 'visualBlock', purpose: 'категорії товарів' }),
    Object.freeze({ type: 'features', recipeId: 'bento', variantId: 'features-icons-cards', imageMode: 'none', purpose: 'доставка, оплата, гарантія, повернення' }),
    Object.freeze({ type: 'gallery', recipeId: 'bento', variantId: 'gallery-clean-grid', imageMode: 'visualBlock', purpose: 'товарна вітрина / популярні позиції' }),
    Object.freeze({ type: 'cta', recipeId: 'compactCta', variantId: 'cta-sticky-banner', imageMode: 'none', purpose: 'акція або швидке замовлення' }),
    Object.freeze({ type: 'contacts', recipeId: 'split', variantId: 'contacts-card', imageMode: 'none', purpose: 'контакти продавця / консультація' })
  ])
});

const THEME_BY_GROUP = Object.freeze({
  public: ['law-premium-navy-gold','business-consulting-blue'], education: ['education-academy-blue-gold','education-warm-indigo','theme-modern-clean'], health: ['medicine-clean-blue','theme-modern-clean'], culture: ['culture-deep-burgundy','theme-editorial-luxury'], hospitality: ['restaurant-warm-amber','travel-ocean-sun'], digital: ['theme-dark-tech','agency-electric-purple'], finance: ['finance-emerald-premium','business-consulting-blue'], sport_beauty: ['beauty-soft-rose','marketplace-sport-energy'], build_home: ['construction-graphite-orange','real-estate-sand-navy','landscape-eco-premium'], agro_eco: ['landscape-eco-premium','theme-premium-natural'], auto_logistics: ['auto-steel-red','business-consulting-blue'], production_security: ['construction-graphite-orange','theme-modern-clean'], creative_social: ['creative-photo-noir','agency-electric-purple'],
  electronics: ['marketplace-electronics-blue','theme-dark-tech'], home_build: ['marketplace-home-soft','construction-graphite-orange'], garden_outdoor: ['marketplace-outdoor-forest','landscape-eco-premium'], sport_auto: ['marketplace-sport-energy','auto-steel-red'], fashion_beauty: ['beauty-soft-rose','theme-editorial-luxury'], kids_books_creative: ['marketplace-books-paper','education-warm-indigo'], food_business: ['restaurant-warm-amber','marketplace-orange-deals'], pets_security_industry: ['marketplace-home-soft','business-consulting-blue'], eco_seasonal: ['marketplace-outdoor-forest','marketplace-orange-deals']
});

const STYLE_BY_GROUP = Object.freeze({
  public: 'premium', education: 'premium', health: 'modern', culture: 'editorial', hospitality: 'warm', digital: 'tech', finance: 'modern', sport_beauty: 'premium', build_home: 'premium', agro_eco: 'warm', auto_logistics: 'dark', production_security: 'modern', creative_social: 'editorial',
  electronics: 'tech', home_build: 'warm', garden_outdoor: 'warm', sport_auto: 'dark', fashion_beauty: 'premium', kids_books_creative: 'warm', food_business: 'warm', pets_security_industry: 'modern', eco_seasonal: 'warm'
});

const EXTRA_KEYWORDS = Object.freeze({
  marketplace: ['каталог','популярні товари','акції','доставка','оплата','гарантія'],
  services: ['послуги','переваги','етапи роботи','заявка']
});

function slugify_(value, fallback = 'topic') {
  const map = { а:'a', б:'b', в:'v', г:'h', ґ:'g', д:'d', е:'e', є:'ye', ж:'zh', з:'z', и:'y', і:'i', ї:'yi', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ю:'yu', я:'ya', ь:'' };
  const raw = String(value || '').toLowerCase().trim();
  const latin = raw.replace(/[а-яіїєґь]/g, (ch) => map[ch] ?? ch);
  const slug = latin.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return slug || fallback;
}

function findGroup_(label, groups, fallbackId) {
  const lower = String(label || '').toLowerCase();
  return groups.find((group) => (group.match || []).some((token) => lower.includes(String(token || '').toLowerCase()))) || groups.find((group) => group.id === fallbackId) || groups[0];
}

function textPack_(label, type) {
  const isMarket = type === 'marketplace';
  return Object.freeze({
    heroTitles: Object.freeze(isMarket ? [`${label} для щоденних покупок`, `Обирайте ${label} швидко і зручно`, `${label} з доставкою та гарантією`] : [`Сучасний сайт для напряму “${label}”`, `Рішення для теми “${label}”`, `${label}: довіра, структура і сильна презентація`]),
    subtitles: Object.freeze(isMarket ? ['Категорії, популярні товари, акції, переваги доставки та швидкий контакт з продавцем.', 'Готова структура магазину з промо-блоками, товарною вітриною і CTA.'] : ['Готова структура сторінки з hero, послугами, перевагами, прикладами, FAQ і контактами.', 'AI Дизайн підбирає композицію, тему, тексти і майбутні image packs для автономної генерації.']),
    ctas: Object.freeze(isMarket ? ['Перейти до каталогу','Замовити консультацію','Переглянути акції'] : ['Отримати консультацію','Дізнатись більше','Залишити заявку']),
    serviceLabels: Object.freeze(isMarket ? ['Категорії','Популярні товари','Новинки','Акції','Доставка','Гарантія'] : ['Послуги','Переваги','Процес роботи','Портфоліо','FAQ','Контакти']),
    faq: Object.freeze(isMarket ? ['Як оформити замовлення?','Які є способи доставки?','Чи є гарантія на товар?'] : ['Як почати співпрацю?','Скільки триває підготовка?','Що входить у послугу?'])
  });
}


function educationNavigation_() {
  return Object.freeze({
    header: Object.freeze(['Головна', 'Програми', 'Викладачі', 'Події', 'Відгуки', 'FAQ', 'Контакти']),
    sidebar: Object.freeze(['Всі програми', 'Для дітей', 'Для дорослих', 'Онлайн навчання', 'Пробне заняття', 'Вступ / запис']),
    quickActions: Object.freeze(['Записатися', 'Отримати консультацію', 'День відкритих дверей'])
  });
}

function imagePack_(slug, type) {
  const base = type === 'marketplace' ? `assets/system/ai-topics/marketplace/${slug}/images/` : `assets/system/ai-topics/sites/${slug}/images/`;
  return Object.freeze({
    basePath: base,
    planned: Object.freeze(type === 'marketplace' ? { hero: 5, categories: 5, product: 10, total: 20 } : { hero: 5, services: 5, gallery: 5, abstract: 3, cta: 2, total: 20 }),
    manifestPath: `${base}manifest.json`
  });
}

function makeTopic_(label, index, type) {
  const groups = type === 'marketplace' ? MARKET_GROUPS : SITE_GROUPS;
  const group = findGroup_(label, groups, type === 'marketplace' ? 'electronics' : 'business');
  const slug = slugify_(label, `${type}-${index + 1}`);
  const professionalEducation = type === 'site' && isProfessionalEducationLabel_(label);
  const presets = professionalEducation
    ? ['education-pro-campus-editorial', 'education-academy-blue-gold', 'education-warm-indigo', 'theme-modern-clean']
    : (THEME_BY_GROUP[group.id] || ['theme-modern-clean']);
  const style = professionalEducation ? 'premium' : (STYLE_BY_GROUP[group.id] || 'modern');
  const sections = professionalEducation
    ? SECTION_PRESETS.educationProfessional
    : (type === 'marketplace' ? SECTION_PRESETS.marketplaceDefault : SECTION_PRESETS.siteDefault);
  const pack = professionalEducation ? educationTextPack_(label) : textPack_(label, type);
  const keywords = professionalEducation
    ? [label.toLowerCase(), group.label.toLowerCase(), 'освіта', 'навчання', 'програми навчання', 'вступ', 'запис', 'викладачі', 'розклад', 'події', 'faq', 'форма заявки', 'admissions', 'programs', 'faculty']
    : [label.toLowerCase(), group.label.toLowerCase(), ...(type === 'marketplace' ? EXTRA_KEYWORDS.marketplace : EXTRA_KEYWORDS.services)];
  return Object.freeze({
    id: `${type}-${slug}`, slug, type, index: index + 1, label,
    groupId: group.id, groupLabel: group.label,
    recommendedThemePresetIds: Object.freeze(presets),
    recommendedDesignStyle: style,
    recommendedPageTypes: Object.freeze(type === 'marketplace' ? ['home','landing','services'] : ['home','landing','services','about']),
    navigation: professionalEducation ? educationNavigation_() : null,
    sectionCombos: Object.freeze({ home: sections, landing: sections, services: sections, about: sections, gallery: sections, contacts: sections }),
    textPack: pack,
    imagePack: imagePack_(slug, type),
    keywords: Object.freeze(keywords)
  });
}

export const AI_SITE_TOPICS = Object.freeze(SITE_TOPIC_LABELS.map((label, index) => makeTopic_(label, index, 'site')));
export const AI_MARKETPLACE_TOPICS = Object.freeze(MARKETPLACE_TOPIC_LABELS.map((label, index) => makeTopic_(label, index, 'marketplace')));

export function getAiTopicTypeOptions() { return AI_TOPIC_TYPES.map((item) => ({ ...item })); }
export function getAiTopicGroups(type = 'site') { return (type === 'marketplace' ? MARKET_GROUPS : SITE_GROUPS).map((item) => ({ id: item.id, label: item.label })); }
export function getAiTopicOptions(type = 'site') {
  const list = type === 'marketplace' ? AI_MARKETPLACE_TOPICS : AI_SITE_TOPICS;
  return list.map((item) => ({ id: item.id, index: item.index, label: item.label, groupId: item.groupId, groupLabel: item.groupLabel, recommendedDesignStyle: item.recommendedDesignStyle, recommendedThemePresetIds: [...item.recommendedThemePresetIds] }));
}
export function resolveAiTopic(type = 'site', id = '') {
  const list = type === 'marketplace' ? AI_MARKETPLACE_TOPICS : AI_SITE_TOPICS;
  return list.find((item) => item.id === id || item.slug === id) || list[0] || null;
}
export function getAiTopicStats() { return Object.freeze({ site: AI_SITE_TOPICS.length, marketplace: AI_MARKETPLACE_TOPICS.length, total: AI_SITE_TOPICS.length + AI_MARKETPLACE_TOPICS.length }); }
export function getAiTopicPrimaryThemePreset(topic) { return topic?.recommendedThemePresetIds?.[0] || 'theme-modern-clean'; }
export function getAiTopicSectionCombo(topic, pageType = 'home') {
  const items = topic?.sectionCombos?.[pageType] || topic?.sectionCombos?.home || [];
  return items.map((item, index) => ({
    id: `topic_${index + 1}_${item.type}_${item.variantId || 'auto'}`,
    enabled: item.enabled !== false, order: index, type: item.type || 'hero', label: item.label || '',
    recipeId: item.recipeId || 'auto', variantId: item.variantId || 'auto', imageMode: item.imageMode || 'auto', purpose: item.purpose || ''
  }));
}
export function buildAiTopicPagePrompt(topic, pageType = 'home') {
  if (!topic) return '';
  const pack = topic.textPack || {};
  const title = pack.heroTitles?.[0] || topic.label;
  const subtitle = pack.subtitles?.[0] || '';
  const ctas = (pack.ctas || []).join(', ');
  const imagePlanText = topic.type === 'marketplace'
    ? 'План зображень: 5 hero/promo банерів, 5 фото категорій/секцій, 10 фото товарів.'
    : 'План зображень: 5 hero-фонів, 5 фото послуг, 5 фото галереї/карток, 3 абстрактні фони, 2 CTA банери.';
  const educationNotes = topic.groupId === 'education'
    ? 'Професійний освітній UX: просте меню, програми/курси, вступ або запис, викладачі, події, відгуки/докази, FAQ, контакти, мобільність, доступність WCAG, чіткі CTA для батьків/студентів.'
    : '';
  const navigationNotes = topic.navigation
    ? `Меню: ${topic.navigation.header.join(' / ')}. Sidebar: ${topic.navigation.sidebar.join(' / ')}. Швидкі дії: ${topic.navigation.quickActions.join(' / ')}.`
    : '';
  return [
    `Тема: ${topic.label}.`, `Тип бази: ${topic.type === 'marketplace' ? 'маркетплейс / продажі' : 'сайт / послуги'}.`,
    `Група: ${topic.groupLabel}.`, `Рекомендована дизайн-тема: ${getAiTopicPrimaryThemePreset(topic)}.`,
    `Рекомендований стиль сторінки: ${topic.recommendedDesignStyle}.`, `Hero-ідея: ${title}.`, subtitle ? `Підзаголовок: ${subtitle}` : '', ctas ? `CTA: ${ctas}.` : '', educationNotes, navigationNotes, imagePlanText,
    'Сторінка має бути автономною, редагованою через st-section / st-row / st-block і сумісною з Theme Tokens.'
  ].filter(Boolean).join(' ');
}
export function buildAiTopicSummary(topic) {
  if (!topic) return '';
  const planned = topic.imagePack?.planned || {};
  return `${topic.label} · ${topic.groupLabel} · ${topic.recommendedDesignStyle} · images planned: ${planned.total || 20}`;
}
