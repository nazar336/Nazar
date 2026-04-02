/* ============================================================
   LOLance Premium — app.js
   Full SPA: Auth + Dashboard + Tasks + Feed + Wallet +
             Chat + Support + Profile + Leaderboard
   ============================================================ */
'use strict';

(() => {

/* ── 1. CONSTANTS ───────────────────────────────────────────── */
const STORAGE_KEY = 'lolance_state_v5';
const API = {
  session:'api/session.php', login:'api/login.php', register:'api/register.php',
  verify:'api/verify.php', logout:'api/logout.php',
  profile:'api/profile.php', tasks:'api/tasks.php', wallet:'api/wallet.php',
  messages:'api/messages.php', leaderboard:'api/leaderboard.php', takeTask:'api/take-task.php',
  completeTask:'api/complete-task.php',
  cryptoDeposit:'api/crypto-deposit.php', cryptoWithdraw:'api/crypto-withdraw.php', coins:'api/coins.php',
  xp:'api/xp.php', chatRooms:'api/chat-rooms.php', support:'api/support.php'
};
const CATEGORIES = ['Design','Video','Copy','Social','Community','QA','Localization','Product','Development','Marketing'];

/* ── 2. i18n ────────────────────────────────────────────────── */
const i18n = {
  EN:{
    appName:'LOLance', appTag:'Premium Micro-Task Platform',
    dashboard:'Dashboard', tasks:'Tasks', createTask:'Create Task',
    feed:'Feed', wallet:'Wallet', chat:'Chat', support:'Support',
    profile:'Profile', leaderboard:'Leaderboard', logout:'Logout',
    login:'Login', register:'Register', welcomeBack:'Welcome back',
    balance:'Balance', earnings:'Earnings', spent:'Spent', pending:'Pending',
    completed:'Completed', active:'Active', level:'Level', streak:'Streak',
    deposit:'Buy with USDT', withdraw:'Spend Coins', transfer:'Tip Coins',
    publish:'Publish Task', searchTasks:'Search tasks…', all:'All',
    open:'Open', inProgress:'In Progress', cancel:'Cancel',
    takeTask:'Take Task', completeTask:'Complete', viewTask:'View',
    sendMessage:'Send', typeMessage:'Type a message…',
    createTicket:'Create Ticket', faq:'FAQ', tickets:'Tickets',
    saveProfile:'Save Profile', notifications:'Notifications',
    markRead:'Mark all read', noNotifications:'No notifications yet',
    required:'Please fill all required fields.',
    loginSuccess:'Welcome back!', registerSuccess:'Account created. You can log in.',
    logoutSuccess:'Logged out successfully.', profileSaved:'Profile saved!',
    taskCreated:'Task published!', taskTaken:'Task taken!', taskCompleted:'Task completed! Reward credited.',
    depositDone:'Crypto purchase successful.', withdrawDone:'Coins spent successfully.',
    transferDone:'Tip sent.', ticketDone:'Ticket created!',
    txDeposit:'Crypto purchase', txWithdraw:'Coin spending', txTransfer:'Tip to',
    invalidAmount:'Enter a valid amount greater than zero.',
    insufficient:'Insufficient balance.',
    noMessage:'Write something first.',
    yourPosition:'Your position', score:'Score', badges:'Badges',
    achievements:'Achievements', xpProgress:'Progress to next level',
    difficulty:'Difficulty', reward:'Reward', slots:'Slots', deadline:'Deadline',
    easy:'Easy', medium:'Medium', hard:'Hard', description:'Description',
    preview:'Live Preview', category:'Category',
    guestMode:'Guest Mode', createAccount:'Create Account',
    // Auth
    password:'Password', orText:'or', browseAsGuest:'Browse as Guest', noAccount:'No account?', haveAccount:'Already have an account?', fullName:'Full Name', minChars:'Min. 8 characters',
    earnOnTasks:'Earn on Micro-Tasks', authSubtitle:'Premium platform for freelancers and companies. Complete tasks, grow and earn.',
    quickEarnings:'Quick Earnings', quickEarningsDesc:'First money per hour',
    levelsAchievements:'Levels & Achievements', levelsAchievementsDesc:'Grow and set records',
    premiumFeatures:'Premium Features', premiumFeaturesDesc:'Full features unlocked',
    globalCommunity:'Global Community', globalCommunityDesc:'Collaborate worldwide',
    activeStat:'Active', paidOut:'On-chain Volume',
    // Verification
    verifyEmail:'Verify Your Email', codeSentTo:'We sent a 6-digit code to', solveCaptcha:'Solve Captcha', enterAnswer:'Enter answer', verifyCaptcha:'Verify', wrongAnswer:'Wrong answer', verificationCode:'Verification Code', showCode:'Show', hideCode:'Hide', enterCodeScreen:'Enter code from screen', sixDigits:'6 digits', confirmBtn:'Confirm', backToLogin:'Back to Login', verifySuccess:'Awesome! You\'re logged in 🎉', wrongCode:'Wrong code', invalidCode:'Enter a valid 6-digit code',
    // Dashboard
    guest:'Guest', welcomeGuestTitle:'Welcome to LOLance premium!', welcomeGuestDesc:'Browse tasks and features without limits. Sign up to start earning.', dashMotivation:'Today you are suspiciously ahead of schedule.', dashMotivationDesc:'Complete one more task to boost your streak, wallet, and rank.',
    dayStreak:'day streak', available:'available', totalEarned:'total earned', tasksDone:'tasks done', pts:'pts',
    quickActions:'Quick Actions', browseOpenTasks:'Browse Open Tasks →', publishNewTask:'+ Publish New Task', walletOverview:'Wallet Overview',
    trendingTasks:'Trending Tasks', miniLeaderboard:'Mini Leaderboard',
    // Tasks
    noTasksFound:'No tasks found', adjustFilters:'Try adjusting your filters.', cancelled:'Cancelled', byUser:'by',
    // Create task
    titleLabel:'Title', titlePlaceholder:'Bold, clear task name', descPlaceholder:'What exactly needs to be done?', selectOption:'Select…', previewTitlePh:'Task title will appear here…', previewDescPh:'Description preview…', noDeadline:'No deadline',
    // Feed
    noPosts:'No posts', mediaPreview:'Media preview', readMore:'Read more ↓', showLess:'Show less ↑', save:'Save', saved:'Saved',
    // Wallet
    txHistory:'Transaction History', type:'Type', amountCol:'Amount', whenCol:'When', recipientUsername:'Recipient username', confirm:'Confirm', guestWallet:'Wallet is available only for registered users.',
    // Chat
    conversations:'Conversations', online:'Online', lastSeen:'Last seen recently', selectConversation:'Select a conversation', guestChat:'Chat is available only for registered users.',
    chatReplyWallet1:'Check the Wallet tab for your current balance.', chatReplyWallet2:'Funds are updated after task completion.', chatReplyTask1:'Browse the Tasks page for open slots.', chatReplyTask2:'Deadlines are shown on each task card.', chatReplyReward1:'Rewards are credited automatically on task completion.', chatReplyReward2:'Your earnings history is in the Wallet section.', chatReplyLevel1:'Your level and XP are shown on the dashboard.', chatReplyLevel2:'Keep your streak active for bonus score points.', chatFallback1:'Got it, I\'ll get back to you soon.', chatFallback2:'Thanks for the message!', chatFallback3:'Noted. I\'ll check on that.',
    // Support
    subject:'Subject', subjectPlaceholder:'Describe your issue briefly', issueType:'Issue type', priorityLabel:'Priority', detailsLabel:'Details', detailsPlaceholder:'Provide additional context…', billing:'Billing', technical:'Technical', accountType:'Account', generalType:'General', normalPriority:'Normal', highPriority:'High', criticalPriority:'Critical', submitTicket:'Submit Ticket', noTicketsYet:'No tickets yet', createTicketHelp:'Create one above if you need help.', statusCol:'Status', createdCol:'Created', guestSupport:'Creating support tickets is available only for registered users.',
    // Profile
    settings:'Settings', languageLabel:'Language', animationsLabel:'Animations', animOn:'On ✓', animOff:'Off', readyToStartQ:'Ready to start?', readyToStartDesc:'Sign up to start earning and participate in tasks.', editProfileTitle:'Edit Profile', roleTitle:'Role / Title', rolePlaceholder:'Freelancer, Designer…', bioLabel:'Bio', bioPlaceholder:'Introduce yourself…', skillsLabel:'Skills', skillsPlaceholder:'Design, Video, Copy…', defaultRole:'Freelancer', browseWithout:'Browse without commitment', guestAccount:'Guest Account',
    // Leaderboard
    you:'You',
    // Landing
    earnTitle:'Earn', landingMicroTasks:'on Micro-Tasks', landingSubtitle:'Premium platform for freelancers and companies. Complete engaging tasks, grow and earn while connecting with a global community.', getStarted:'Get Started', signUpBtn:'Sign Up', usersStat:'Users', paidStat:'On-chain', ratingStat:'Rating', tasksStat:'Tasks',
    whyLolance:'Why LOLance?', skillGrowth:'Skill Growth', skillGrowthDesc:'Learn real-world skills working on projects from actual companies.', securePayments:'Secure Payments', securePaymentsDesc:'Protected transactions with transparent fees and secure escrow.', transparentRating:'Transparent Rating', transparentRatingDesc:'Build your reputation through quality work and achievements.', personalizedTasks:'Personalized Tasks', personalizedTasksDesc:'AI-matched tasks based on your skills and interests.',
    howItWorks:'How It Works', signUpStep:'Sign Up', signUpStepDesc:'Quick registration in 2 minutes', browseStep:'Browse Tasks', browseStepDesc:'Find interesting work', executeStep:'Execute', executeStepDesc:'Complete with quality', getPaidStep:'Get Paid', getPaidStepDesc:'Instant payment to wallet',
    readyToEarn:'Ready to Start Earning?', joinFreelancers:'Join thousands of freelancers already earning', signUpNow:'Sign Up Now',
    aboutLink:'About', contactLink:'Contact', privacyLink:'Privacy', termsLink:'Terms', allRights:'All rights reserved.',
    managementCard:'Management', rewardsCard:'Rewards', growthCard:'Growth', goalsCard:'Goals', rankingCard:'Ranking',
    // Time
    justNow:'just now', minsAgo:'m ago', hoursAgo:'h ago', daysAgo:'d ago', guestWelcome:'You\'re in guest mode 🎭',
    guestRegTask:'Sign up to take a task', guestRegCreate:'Sign up to create a task',
    notifTaskTaken:'Task taken!', notifTaskCompleted:'Completed', notifCredited:'credited.',
    // XP & Chat rooms
    chatRooms:'Chat Rooms', bronzeRoom:'Global', silverRoom:'Silver', goldRoom:'Gold', diamondRoom:'Diamond',
    pointsRequired:'level required', buyPass:'Buy 7-day Pass', passCost:'coins / 7 days',
    passActive:'Pass active until', lockRoom:'Locked', unlockRoom:'Unlock for',
    yourPoints:'Your XP', earnPoints:'Earn XP', buyPoints:'Buy XP with Coins',
    pointsBalance:'XP Balance', checkinTitle:'Daily Check-in', checkinBtn:'Check in (+10 XP)',
    checkinDone:'Already checked in today ✓', checkinStreak:'Check-in streak',
    visitBonus:'Daily visit bonus', pointsCalendar:'30-day Calendar',
    howEarnPts:'How to earn XP',
    earnTaskEasy:'+20 XP — Easy task', earnTaskMedium:'+35 XP — Medium task', earnTaskHard:'+50 XP — Hard task',
    earnCheckin:'+10 XP — Daily check-in', earnVisit:'+5 XP — Daily visit',
    earnBuyLabel:'100 XP = 50 coins',
    roomOnline:'online', noMsgsYet:'Be the first to write!', globalRoomDesc:'All users can chat here',
    withdrawCrypto:'Withdraw to Crypto', withdrawTitle:'Withdraw Coins to Crypto', withdrawCoins:'Amount (coins)', withdrawWallet:'Your wallet address', withdrawNetwork:'Network', withdrawFee:'Fee (5%)', withdrawNet:'You receive', withdrawConfirm:'Submit Withdrawal', withdrawSuccess:'Withdrawal request created!', withdrawCancel:'Cancel Withdrawal', withdrawCancelled:'Withdrawal cancelled. Coins refunded.', withdrawHistory:'Withdrawal History', withdrawPending:'You have a pending withdrawal', withdrawMin:'Min withdrawal: 500 coins', withdrawStatus:'Status', noWithdrawals:'No withdrawals yet',
  },
  UA:{
    appName:'LOLance', appTag:'Преміум платформа мікрозадач',
    dashboard:'Дашборд', tasks:'Задачі', createTask:'Нова задача',
    feed:'Стрічка', wallet:'Гаманець', chat:'Чат', support:'Підтримка',
    profile:'Профіль', leaderboard:'Рейтинг', logout:'Вийти',
    login:'Вхід', register:'Реєстрація', welcomeBack:'З поверненням',
    balance:'Баланс', earnings:'Заробіток', spent:'Витрати', pending:'Очікування',
    completed:'Завершено', active:'Активних', level:'Рівень', streak:'Серія',
    deposit:'Купити за USDT', withdraw:'Списати монети', transfer:'Чайові монетами',
    publish:'Опублікувати', searchTasks:'Пошук задач…', all:'Всі',
    open:'Відкриті', inProgress:'В роботі', cancel:'Скасувати',
    takeTask:'Взяти', completeTask:'Завершити', viewTask:'Переглянути',
    sendMessage:'Надіслати', typeMessage:'Напиши повідомлення…',
    createTicket:'Новий тікет', faq:'FAQ', tickets:'Тікети',
    saveProfile:'Зберегти', notifications:'Сповіщення',
    markRead:'Прочитати всі', noNotifications:'Сповіщень поки немає.',
    required:'Заповни всі обов\'язкові поля.',
    loginSuccess:'Вітаємо!', registerSuccess:'Акаунт створено. Можна увійти.',
    logoutSuccess:'Вийшов успішно.', profileSaved:'Профіль збережено!',
    taskCreated:'Задачу опубліковано!', taskTaken:'Задачу взято!', taskCompleted:'Задачу завершено! Нагороду нараховано.',
    depositDone:'Крипто-обмін успішний.', withdrawDone:'Списання монет успішне.',
    transferDone:'Чайові надіслано.', ticketDone:'Тікет створено!',
    txDeposit:'Крипто-обмін', txWithdraw:'Списання монет', txTransfer:'Чайові для',
    invalidAmount:'Введи суму більше нуля.',
    insufficient:'Недостатньо коштів.',
    noMessage:'Спочатку напиши щось.',
    yourPosition:'Твоя позиція', score:'Рахунок', badges:'Значки',
    achievements:'Досягнення', xpProgress:'Прогрес до наступного рівня',
    difficulty:'Складність', reward:'Нагорода', slots:'Слоти', deadline:'Дедлайн',
    easy:'Легко', medium:'Середньо', hard:'Важко', description:'Опис',
    preview:'Живий прев\'ю', category:'Категорія',
    guestMode:'Гостьовий режим', createAccount:'Створити акаунт',
    password:'Пароль', orText:'або', browseAsGuest:'Переглянути як гість', noAccount:'Немаєш акаунту?', haveAccount:'Вже маєш акаунт?', fullName:'Ім\'я', minChars:'Мін. 8 символів',
    earnOnTasks:'Заробляй на мікрозадачах', authSubtitle:'Преміум платформа для фрілансерів і компаній. Виконуй задачі, розвивайся та заробляй.',
    quickEarnings:'Швидкі заробітки', quickEarningsDesc:'Перші гроші за годину',
    levelsAchievements:'Рівні й досягнення', levelsAchievementsDesc:'Розвивайся та встановлюй рекорди',
    premiumFeatures:'Преміум можливості', premiumFeaturesDesc:'Розширені можливості без обмежень',
    globalCommunity:'Глобальна спільнота', globalCommunityDesc:'Робота з фрілансерами з усього світу',
    activeStat:'Активних', paidOut:'Крипто-обіг',
    verifyEmail:'Перевір свою пошту', codeSentTo:'Ми надіслали 6-значний код на', solveCaptcha:'Розв\'яжи капчу', enterAnswer:'Введи відповідь', verifyCaptcha:'Перевір', wrongAnswer:'Неправильна відповідь', verificationCode:'Верифікаційний код', showCode:'Показати', hideCode:'Сховати', enterCodeScreen:'Введи код з екрану', sixDigits:'6 цифр', confirmBtn:'Підтвердити', backToLogin:'Повернутися до входу', verifySuccess:'Вражаю! Ви авторизовані 🎉', wrongCode:'Невірний код', invalidCode:'Введіть коректний 6-значний код',
    guest:'Гість', welcomeGuestTitle:'Вітаємо на LOLance преміум!', welcomeGuestDesc:'Переглядайте задачі та функції без обмежень. Зареєструйтеся щоб розпочати заробляти.', dashMotivation:'Сьогодні ви попереду графіку.', dashMotivationDesc:'Виконайте ще одну задачу щоб підвищити серію, баланс і рейтинг.',
    dayStreak:'день серія', available:'доступно', totalEarned:'зароблено', tasksDone:'задач виконано', pts:'балів',
    quickActions:'Швидкі дії', browseOpenTasks:'Переглянути задачі →', publishNewTask:'+ Нова задача', walletOverview:'Огляд гаманця',
    trendingTasks:'Популярні задачі', miniLeaderboard:'Міні-рейтинг',
    noTasksFound:'Задач не знайдено', adjustFilters:'Спробуйте змінити фільтри.', cancelled:'Скасовано', byUser:'від',
    titleLabel:'Заголовок', titlePlaceholder:'Чіткий заголовок задачі', descPlaceholder:'Що саме потрібно зробити?', selectOption:'Обрати…', previewTitlePh:'Заголовок з\'явиться тут…', previewDescPh:'Попередній перегляд…', noDeadline:'Без дедлайну',
    noPosts:'Немає постів', mediaPreview:'Перегляд медіа', readMore:'Читати більше ↓', showLess:'Згорнути ↑', save:'Зберегти', saved:'Збережено',
    txHistory:'Історія транзакцій', type:'Тип', amountCol:'Сума', whenCol:'Коли', recipientUsername:'Username отримувача', confirm:'Підтвердити', guestWallet:'Гаманець доступний лише для зареєстрованих користувачів.',
    conversations:'Розмови', online:'Онлайн', lastSeen:'Був(-ла) нещодавно', selectConversation:'Оберіть розмову', guestChat:'Чат доступний лише для зареєстрованих користувачів.',
    chatReplyWallet1:'Перевірте вкладку Гаманець для поточного балансу.', chatReplyWallet2:'Кошти оновлюються після завершення задачі.', chatReplyTask1:'Перегляньте сторінку Задач для відкритих слотів.', chatReplyTask2:'Дедлайни вказані на кожній картці задачі.', chatReplyReward1:'Нагороди нараховуються автоматично після завершення.', chatReplyReward2:'Історія заробітку в розділі Гаманець.', chatReplyLevel1:'Рівень і XP показані на дашборді.', chatReplyLevel2:'Підтримуйте серію для бонусних балів.', chatFallback1:'Зрозуміло, я звернусь незабаром.', chatFallback2:'Дякую за повідомлення!', chatFallback3:'Зафіксовано. Перевірю.',
    subject:'Тема', subjectPlaceholder:'Коротко опишіть проблему', issueType:'Тип проблеми', priorityLabel:'Пріоритет', detailsLabel:'Деталі', detailsPlaceholder:'Надайте додатковий контекст…', billing:'Фінанси', technical:'Технічна', accountType:'Акаунт', generalType:'Загальна', normalPriority:'Звичайний', highPriority:'Високий', criticalPriority:'Критичний', submitTicket:'Надіслати тікет', noTicketsYet:'Тікетів поки немає', createTicketHelp:'Створіть тікет вище, якщо потрібна допомога.', statusCol:'Статус', createdCol:'Створено', guestSupport:'Створення тікетів доступне лише для зареєстрованих користувачів.',
    settings:'Налаштування', languageLabel:'Мова', animationsLabel:'Анімації', animOn:'Увімк ✓', animOff:'Вимк', readyToStartQ:'Готові почати?', readyToStartDesc:'Зареєструйтеся, щоб розпочати заробляти і брати участь у задачах.', editProfileTitle:'Редагування профілю', roleTitle:'Роль / Посада', rolePlaceholder:'Фрілансер, Дизайнер…', bioLabel:'Про себе', bioPlaceholder:'Розкажіть про себе…', skillsLabel:'Навички', skillsPlaceholder:'Дизайн, Відео, Текст…', defaultRole:'Фрілансер', browseWithout:'Переглядайте без зобов\'язань', guestAccount:'Гостьовий обліковий запис',
    you:'Ти',
    earnTitle:'Заробляй', landingMicroTasks:'на мікрозадачах', landingSubtitle:'Преміум платформа для фрілансерів і компаній. Виконуй цікаві задачі, розвивайся та заробляй у спільноті з усього світу.', getStarted:'Почати', signUpBtn:'Створити акаунт', usersStat:'Користувачів', paidStat:'Крипто-обіг', ratingStat:'Рейтинг', tasksStat:'Задач',
    whyLolance:'Чому LOLance?', skillGrowth:'Розвиток умінь', skillGrowthDesc:'Вивчайте нові навички, виконуючи реальні проекти від справжніх компаній.', securePayments:'Безпечні платежі', securePaymentsDesc:'Захищені транзакції та прозорі комісії. Ваші гроші в безпеці.', transparentRating:'Прозорий рейтинг', transparentRatingDesc:'Будуйте свою репутацію на платформі через якісну роботу.', personalizedTasks:'Персоналізовані задачі', personalizedTasksDesc:'Алгоритм підбирає задачі за вашими вміннями та інтересами.',
    howItWorks:'Як це працює', signUpStep:'Реєстрація', signUpStepDesc:'Простий вхід за 2 хвилини', browseStep:'Перегляд задач', browseStepDesc:'Знайдіть цікаву роботу', executeStep:'Виконайте', executeStepDesc:'Виконайте задачу якісно', getPaidStep:'Отримайте оплату', getPaidStepDesc:'Миттєво на ваш рахунок',
    readyToEarn:'Готові розпочати заробіток?', joinFreelancers:'Приєднайтеся до тисяч фрілансерів, які вже заробляють', signUpNow:'Створити акаунт',
    aboutLink:'Про нас', contactLink:'Контакти', privacyLink:'Політика', termsLink:'Умови', allRights:'Всі права захищені.',
    managementCard:'Управління', rewardsCard:'Премія', growthCard:'Ріст', goalsCard:'Цілі', rankingCard:'Рейтинг',
    justNow:'щойно', minsAgo:'хв тому', hoursAgo:'год тому', daysAgo:'д тому', guestWelcome:'Ви в гостьовому режимі 🎭',
    guestRegTask:'Зареєструйтеся, щоб взяти задачу', guestRegCreate:'Зареєструйтеся, щоб створити задачу',
    notifTaskTaken:'Задачу взято!', notifTaskCompleted:'Завершено', notifCredited:'нараховано.',
    chatRooms:'Чат-кімнати', bronzeRoom:'Загальний', silverRoom:'Срібло', goldRoom:'Золото', diamondRoom:'Діамант',
    pointsRequired:'рівень потрібен', buyPass:'Купити пас на 7 днів', passCost:'монет / 7 днів',
    passActive:'Пас активний до', lockRoom:'Заблоковано', unlockRoom:'Розблокувати за',
    yourPoints:'Твій XP', earnPoints:'Заробляй XP', buyPoints:'Купити XP за монети',
    pointsBalance:'Баланс XP', checkinTitle:'Щоденний чек-ін', checkinBtn:'Відмітитись (+10 XP)',
    checkinDone:'Вже відмічено сьогодні ✓', checkinStreak:'Серія чек-інів',
    visitBonus:'Бонус за відвідування', pointsCalendar:'Календар на 30 днів',
    howEarnPts:'Як заробляти XP',
    earnTaskEasy:'+20 XP — Легка задача', earnTaskMedium:'+35 XP — Середня задача', earnTaskHard:'+50 XP — Складна задача',
    earnCheckin:'+10 XP — Щоденний чек-ін', earnVisit:'+5 XP — Щоденний візит',
    earnBuyLabel:'100 XP = 50 монет',
    roomOnline:'онлайн', noMsgsYet:'Будь першим хто напише!', globalRoomDesc:'Тут можуть писати всі користувачі',
    withdrawCrypto:'Вивести в крипту', withdrawTitle:'Вивід монет у крипту', withdrawCoins:'Сума (монети)', withdrawWallet:'Адреса вашого гаманця', withdrawNetwork:'Мережа', withdrawFee:'Комісія (5%)', withdrawNet:'Ви отримаєте', withdrawConfirm:'Створити запит', withdrawSuccess:'Запит на вивід створено!', withdrawCancel:'Скасувати вивід', withdrawCancelled:'Вивід скасовано. Монети повернено.', withdrawHistory:'Історія виводів', withdrawPending:'У вас є активний запит на вивід', withdrawMin:'Мін. вивід: 500 монет', withdrawStatus:'Статус', noWithdrawals:'Виводів ще не було',
  },
  DE:{
    appName:'LOLance', appTag:'Premium Micro-Task Plattform',
    dashboard:'Dashboard', tasks:'Aufgaben', createTask:'Neue Aufgabe',
    feed:'Feed', wallet:'Geldbörse', chat:'Chat', support:'Unterstützung',
    profile:'Profil', leaderboard:'Rangliste', logout:'Abmelden',
    login:'Anmelden', register:'Registrieren', welcomeBack:'Willkommen zurück',
    balance:'Guthaben', earnings:'Verdienste', spent:'Ausgegeben', pending:'Ausstehend',
    completed:'Abgeschlossen', active:'Aktiv', level:'Level', streak:'Serie',
    deposit:'Mit USDT kaufen', withdraw:'Coins ausgeben', transfer:'Coins senden',
    publish:'Aufgabe veröffentlichen', searchTasks:'Aufgaben suchen…', all:'Alle',
    open:'Offen', inProgress:'In Bearbeitung', cancel:'Abbrechen',
    takeTask:'Aufgabe annehmen', completeTask:'Fertigstellen', viewTask:'Anzeigen',
    sendMessage:'Senden', typeMessage:'Nachricht eingeben…',
    createTicket:'Ticket erstellen', faq:'FAQ', tickets:'Tickets',
    saveProfile:'Profil speichern', notifications:'Benachrichtigungen',
    markRead:'Alle als gelesen markieren', noNotifications:'Noch keine Benachrichtigungen',
    required:'Bitte füllen Sie alle erforderlichen Felder aus.',
    loginSuccess:'Willkommen!', registerSuccess:'Konto erstellt. Sie können sich jetzt anmelden.',
    logoutSuccess:'Erfolgreich abgemeldet.', profileSaved:'Profil gespeichert!',
    taskCreated:'Aufgabe veröffentlicht!', taskTaken:'Aufgabe angenommen!', taskCompleted:'Aufgabe abgeschlossen! Belohnung gutgeschrieben.',
    depositDone:'Krypto-Kauf erfolgreich.', withdrawDone:'Coins erfolgreich ausgegeben.',
    transferDone:'Coin-Tipp gesendet.', ticketDone:'Ticket erstellt!',
    txDeposit:'Krypto-Kauf', txWithdraw:'Coin-Ausgabe', txTransfer:'Coin-Tipp an',
    invalidAmount:'Bitte geben Sie einen Betrag größer als Null ein.',
    insufficient:'Unzureichendes Guthaben.',
    noMessage:'Schreiben Sie zuerst etwas.',
    yourPosition:'Ihre Position', score:'Punktzahl', badges:'Abzeichen',
    achievements:'Erfolge', xpProgress:'Fortschritt bis zur nächsten Stufe',
    difficulty:'Schwierigkeit', reward:'Belohnung', slots:'Plätze', deadline:'Frist',
    easy:'Leicht', medium:'Mittel', hard:'Schwer', description:'Beschreibung',
    preview:'Live-Vorschau', category:'Kategorie',
    guestMode:'Gastmodus', createAccount:'Konto erstellen',
    password:'Passwort', orText:'oder', browseAsGuest:'Als Gast durchsuchen', noAccount:'Kein Konto?', haveAccount:'Bereits ein Konto?', fullName:'Vollständiger Name', minChars:'Min. 8 Zeichen',
    earnOnTasks:'Verdienen Sie mit Micro-Tasks', authSubtitle:'Premium-Plattform für Freiberufler und Unternehmen. Aufgaben erledigen, wachsen und verdienen.',
    quickEarnings:'Schnelle Einnahmen', quickEarningsDesc:'Erstes Geld pro Stunde', levelsAchievements:'Level & Erfolge', levelsAchievementsDesc:'Wachsen und Rekorde aufstellen', premiumFeatures:'Premium-Funktionen', premiumFeaturesDesc:'Alle Funktionen freigeschaltet', globalCommunity:'Globale Gemeinschaft', globalCommunityDesc:'Weltweit zusammenarbeiten', activeStat:'Aktiv', paidOut:'On-chain Volumen',
    verifyEmail:'E-Mail bestätigen', codeSentTo:'Wir haben einen 6-stelligen Code gesendet an', solveCaptcha:'Captcha lösen', enterAnswer:'Antwort eingeben', verifyCaptcha:'Prüfen', wrongAnswer:'Falsche Antwort', verificationCode:'Verifizierungscode', showCode:'Anzeigen', hideCode:'Verbergen', enterCodeScreen:'Code vom Bildschirm eingeben', sixDigits:'6 Ziffern', confirmBtn:'Bestätigen', backToLogin:'Zurück zum Login', verifySuccess:'Super! Sie sind eingeloggt 🎉', wrongCode:'Falscher Code', invalidCode:'Gültigen 6-stelligen Code eingeben',
    guest:'Gast', welcomeGuestTitle:'Willkommen bei LOLance Premium!', welcomeGuestDesc:'Aufgaben und Funktionen ohne Einschränkungen durchsuchen.', dashMotivation:'Heute sind Sie dem Zeitplan voraus.', dashMotivationDesc:'Erledigen Sie eine weitere Aufgabe für Ihren Streak.',
    dayStreak:'Tage Serie', available:'verfügbar', totalEarned:'verdient', tasksDone:'erledigt', pts:'Pkt',
    quickActions:'Schnellaktionen', browseOpenTasks:'Aufgaben durchsuchen →', publishNewTask:'+ Neue Aufgabe', walletOverview:'Geldübersicht', trendingTasks:'Beliebte Aufgaben', miniLeaderboard:'Mini-Rangliste',
    noTasksFound:'Keine Aufgaben gefunden', adjustFilters:'Versuchen Sie die Filter anzupassen.', cancelled:'Abgebrochen', byUser:'von',
    titleLabel:'Titel', titlePlaceholder:'Klarer Aufgabenname', descPlaceholder:'Was genau muss gemacht werden?', selectOption:'Wählen…', previewTitlePh:'Titel erscheint hier…', previewDescPh:'Beschreibungsvorschau…', noDeadline:'Kein Termin',
    noPosts:'Keine Beiträge', mediaPreview:'Medienvorschau', readMore:'Mehr lesen ↓', showLess:'Weniger zeigen ↑', save:'Speichern', saved:'Gespeichert',
    txHistory:'Transaktionsverlauf', type:'Typ', amountCol:'Betrag', whenCol:'Wann', recipientUsername:'Empfänger-Username', confirm:'Bestätigen', guestWallet:'Geldbörse nur für registrierte Benutzer verfügbar.',
    conversations:'Gespräche', online:'Online', lastSeen:'Zuletzt gesehen', selectConversation:'Gespräch wählen', guestChat:'Chat nur für registrierte Benutzer verfügbar.',
    chatReplyWallet1:'Prüfen Sie den Geldbörse-Tab für Ihren Kontostand.', chatReplyWallet2:'Das Guthaben wird nach Aufgabenabschluss aktualisiert.', chatReplyTask1:'Durchsuchen Sie die Aufgabenseite nach offenen Plätzen.', chatReplyTask2:'Fristen stehen auf jeder Aufgabenkarte.', chatReplyReward1:'Belohnungen werden automatisch nach Abschluss gutgeschrieben.', chatReplyReward2:'Ihre Verdiensthistorie finden Sie im Geldbörse-Bereich.', chatReplyLevel1:'Ihr Level und XP werden auf dem Dashboard angezeigt.', chatReplyLevel2:'Halten Sie Ihre Serie aktiv für Bonuspunkte.', chatFallback1:'Verstanden, ich melde mich bald.', chatFallback2:'Danke für die Nachricht!', chatFallback3:'Notiert. Ich prüfe das.',
    subject:'Betreff', subjectPlaceholder:'Beschreiben Sie Ihr Problem kurz', issueType:'Problemtyp', priorityLabel:'Priorität', detailsLabel:'Details', detailsPlaceholder:'Zusätzlichen Kontext angeben…', billing:'Abrechnung', technical:'Technisch', accountType:'Konto', generalType:'Allgemein', normalPriority:'Normal', highPriority:'Hoch', criticalPriority:'Kritisch', submitTicket:'Ticket senden', noTicketsYet:'Noch keine Tickets', createTicketHelp:'Erstellen Sie eines oben, wenn Sie Hilfe benötigen.', statusCol:'Status', createdCol:'Erstellt', guestSupport:'Tickets nur für registrierte Benutzer verfügbar.',
    settings:'Einstellungen', languageLabel:'Sprache', animationsLabel:'Animationen', animOn:'An ✓', animOff:'Aus', readyToStartQ:'Bereit loszulegen?', readyToStartDesc:'Registrieren Sie sich, um zu verdienen.', editProfileTitle:'Profil bearbeiten', roleTitle:'Rolle / Titel', rolePlaceholder:'Freiberufler, Designer…', bioLabel:'Bio', bioPlaceholder:'Stellen Sie sich vor…', skillsLabel:'Fähigkeiten', skillsPlaceholder:'Design, Video, Text…', defaultRole:'Freiberufler', browseWithout:'Ohne Verpflichtung durchsuchen', guestAccount:'Gastkonto',
    you:'Sie',
    earnTitle:'Verdienen', landingMicroTasks:'mit Micro-Tasks', landingSubtitle:'Premium-Plattform für Freiberufler und Unternehmen.', getStarted:'Loslegen', signUpBtn:'Registrieren', usersStat:'Benutzer', paidStat:'On-chain', ratingStat:'Bewertung', tasksStat:'Aufgaben',
    whyLolance:'Warum LOLance?', skillGrowth:'Fähigkeitswachstum', skillGrowthDesc:'Lernen Sie reale Fähigkeiten bei echten Projekten.', securePayments:'Sichere Zahlungen', securePaymentsDesc:'Geschützte Transaktionen mit transparenten Gebühren.', transparentRating:'Transparente Bewertung', transparentRatingDesc:'Bauen Sie Ihren Ruf durch Qualitätsarbeit auf.', personalizedTasks:'Personalisierte Aufgaben', personalizedTasksDesc:'KI-basierte Aufgaben nach Ihren Fähigkeiten.',
    howItWorks:'So funktioniert es', signUpStep:'Registrierung', signUpStepDesc:'Schnelle Anmeldung in 2 Minuten', browseStep:'Aufgaben durchsuchen', browseStepDesc:'Interessante Arbeit finden', executeStep:'Ausführen', executeStepDesc:'Qualität liefern', getPaidStep:'Bezahlt werden', getPaidStepDesc:'Sofortige Zahlung',
    readyToEarn:'Bereit zum Verdienen?', joinFreelancers:'Schließen Sie sich tausenden Freiberuflern an', signUpNow:'Jetzt registrieren',
    aboutLink:'Über uns', contactLink:'Kontakt', privacyLink:'Datenschutz', termsLink:'AGB', allRights:'Alle Rechte vorbehalten.',
    managementCard:'Verwaltung', rewardsCard:'Belohnungen', growthCard:'Wachstum', goalsCard:'Ziele', rankingCard:'Ranking',
    justNow:'gerade', minsAgo:'Min', hoursAgo:'Std', daysAgo:'T', guestWelcome:'Sie sind im Gastmodus 🎭',
    guestRegTask:'Registrieren Sie sich, um eine Aufgabe anzunehmen', guestRegCreate:'Registrieren Sie sich, um eine Aufgabe zu erstellen',
    notifTaskTaken:'Aufgabe angenommen!', notifTaskCompleted:'Abgeschlossen', notifCredited:'gutgeschrieben.',
    chatRooms:'Chat-Räume', bronzeRoom:'Global', silverRoom:'Silber', goldRoom:'Gold', diamondRoom:'Diamant',
    pointsRequired:'Level erforderlich', buyPass:'7-Tage-Pass kaufen', passCost:'Coins / 7 Tage',
    passActive:'Pass aktiv bis', lockRoom:'Gesperrt', unlockRoom:'Entsperren für',
    yourPoints:'Ihr XP', earnPoints:'XP verdienen', buyPoints:'XP mit Coins kaufen',
    pointsBalance:'XP-Stand', checkinTitle:'Tägliches Check-in', checkinBtn:'Einchecken (+10 XP)',
    checkinDone:'Heute bereits eingecheckt ✓', checkinStreak:'Check-in-Serie',
    visitBonus:'Täglicher Besuchsbonus', pointsCalendar:'30-Tage-Kalender',
    howEarnPts:'So verdienen Sie XP',
    earnTaskEasy:'+20 XP — Einfache Aufgabe', earnTaskMedium:'+35 XP — Mittlere Aufgabe', earnTaskHard:'+50 XP — Schwere Aufgabe',
    earnCheckin:'+10 XP — Tägliches Check-in', earnVisit:'+5 XP — Täglicher Besuch',
    earnBuyLabel:'100 XP = 50 Coins',
    roomOnline:'online', noMsgsYet:'Sei der Erste, der schreibt!', globalRoomDesc:'Hier können alle Nutzer schreiben',
    withdrawCrypto:'Auszahlung in Krypto', withdrawTitle:'Coins in Krypto auszahlen', withdrawCoins:'Betrag (Coins)', withdrawWallet:'Ihre Wallet-Adresse', withdrawNetwork:'Netzwerk', withdrawFee:'Gebühr (5%)', withdrawNet:'Sie erhalten', withdrawConfirm:'Auszahlung beantragen', withdrawSuccess:'Auszahlungsantrag erstellt!', withdrawCancel:'Auszahlung stornieren', withdrawCancelled:'Auszahlung storniert. Coins erstattet.', withdrawHistory:'Auszahlungshistorie', withdrawPending:'Sie haben eine offene Auszahlung', withdrawMin:'Min. Auszahlung: 500 Coins', withdrawStatus:'Status', noWithdrawals:'Noch keine Auszahlungen',
  },
  FR:{
    appName:'LOLance', appTag:'Plateforme Premium de Micro-Tâches',
    dashboard:'Tableau de bord', tasks:'Tâches', createTask:'Nouvelle tâche',
    feed:'Flux', wallet:'Portefeuille', chat:'Chat', support:'Support',
    profile:'Profil', leaderboard:'Classement', logout:'Déconnexion',
    login:'Connexion', register:'S\'inscrire', welcomeBack:'Bienvenue',
    balance:'Solde', earnings:'Gains', spent:'Dépensé', pending:'En attente',
    completed:'Complété', active:'Actif', level:'Niveau', streak:'Série',
    deposit:'Acheter via USDT', withdraw:'Dépenser des coins', transfer:'Envoyer des coins',
    publish:'Publier une tâche', searchTasks:'Rechercher des tâches…', all:'Tous',
    open:'Ouvert', inProgress:'En cours', cancel:'Annuler',
    takeTask:'Prendre la tâche', completeTask:'Terminer', viewTask:'Afficher',
    sendMessage:'Envoyer', typeMessage:'Tapez un message…',
    createTicket:'Créer un ticket', faq:'FAQ', tickets:'Tickets',
    saveProfile:'Enregistrer le profil', notifications:'Notifications',
    markRead:'Marquer tout comme lu', noNotifications:'Aucune notification pour le moment',
    required:'Veuillez remplir tous les champs obligatoires.',
    loginSuccess:'Bienvenue!', registerSuccess:'Compte créé. Vous pouvez vous connecter.',
    logoutSuccess:'Déconnexion réussie.', profileSaved:'Profil enregistré!',
    taskCreated:'Tâche publiée!', taskTaken:'Tâche prise!', taskCompleted:'Tâche complétée! Récompense créditée.',
    depositDone:'Achat crypto réussi.', withdrawDone:'Coins dépensés avec succès.',
    transferDone:'Pourboire en coins envoyé.', ticketDone:'Ticket créé!',
    txDeposit:'Achat crypto', txWithdraw:'Dépense de coins', txTransfer:'Pourboire à',
    invalidAmount:'Veuillez entrer un montant supérieur à zéro.',
    insufficient:'Solde insuffisant.',
    noMessage:'Écrivez quelque chose d\'abord.',
    yourPosition:'Votre position', score:'Score', badges:'Badges',
    achievements:'Réalisations', xpProgress:'Progression vers le niveau suivant',
    difficulty:'Difficulté', reward:'Récompense', slots:'Emplacements', deadline:'Échéance',
    easy:'Facile', medium:'Moyen', hard:'Difficile', description:'Description',
    preview:'Aperçu en direct', category:'Catégorie',
    guestMode:'Mode invité', createAccount:'Créer un compte',
    password:'Mot de passe', orText:'ou', browseAsGuest:'Parcourir en invité', noAccount:'Pas de compte ?', haveAccount:'Déjà un compte ?', fullName:'Nom complet', minChars:'Min. 8 caractères',
    earnOnTasks:'Gagnez avec des Micro-Tâches', authSubtitle:'Plateforme premium pour freelancers et entreprises. Complétez des tâches, évoluez et gagnez.',
    quickEarnings:'Gains rapides', quickEarningsDesc:'Premier argent en une heure', levelsAchievements:'Niveaux & Réalisations', levelsAchievementsDesc:'Évoluez et battez des records', premiumFeatures:'Fonctions Premium', premiumFeaturesDesc:'Toutes les fonctions débloquées', globalCommunity:'Communauté mondiale', globalCommunityDesc:'Collaboration mondiale', activeStat:'Actifs', paidOut:'Volume on-chain',
    verifyEmail:'Vérifiez votre e-mail', codeSentTo:'Nous avons envoyé un code à 6 chiffres à', solveCaptcha:'Résoudre le captcha', enterAnswer:'Entrez la réponse', verifyCaptcha:'Vérifier', wrongAnswer:'Mauvaise réponse', verificationCode:'Code de vérification', showCode:'Afficher', hideCode:'Masquer', enterCodeScreen:'Entrez le code à l\'écran', sixDigits:'6 chiffres', confirmBtn:'Confirmer', backToLogin:'Retour connexion', verifySuccess:'Génial ! Vous êtes connecté 🎉', wrongCode:'Mauvais code', invalidCode:'Entrez un code valide à 6 chiffres',
    guest:'Invité', welcomeGuestTitle:'Bienvenue sur LOLance Premium !', welcomeGuestDesc:'Parcourez les tâches et fonctions sans limites.', dashMotivation:'Aujourd\'hui vous êtes en avance.', dashMotivationDesc:'Complétez une tâche pour booster votre série.',
    dayStreak:'jours de série', available:'disponible', totalEarned:'gagné', tasksDone:'tâches', pts:'pts',
    quickActions:'Actions rapides', browseOpenTasks:'Parcourir les tâches →', publishNewTask:'+ Nouvelle tâche', walletOverview:'Aperçu portefeuille', trendingTasks:'Tâches tendance', miniLeaderboard:'Mini-classement',
    noTasksFound:'Aucune tâche trouvée', adjustFilters:'Essayez d\'ajuster les filtres.', cancelled:'Annulé', byUser:'par',
    titleLabel:'Titre', titlePlaceholder:'Nom clair de la tâche', descPlaceholder:'Que faut-il faire exactement ?', selectOption:'Sélectionner…', previewTitlePh:'Le titre apparaîtra ici…', previewDescPh:'Aperçu de la description…', noDeadline:'Pas d\'échéance',
    noPosts:'Aucun post', mediaPreview:'Aperçu média', readMore:'Lire plus ↓', showLess:'Moins ↑', save:'Enregistrer', saved:'Enregistré',
    txHistory:'Historique des transactions', type:'Type', amountCol:'Montant', whenCol:'Quand', recipientUsername:'Nom d\'utilisateur destinataire', confirm:'Confirmer', guestWallet:'Le portefeuille est réservé aux utilisateurs inscrits.',
    conversations:'Conversations', online:'En ligne', lastSeen:'Vu récemment', selectConversation:'Sélectionnez une conversation', guestChat:'Le chat est réservé aux utilisateurs inscrits.',
    chatReplyWallet1:'Consultez l\'onglet Portefeuille pour votre solde.', chatReplyWallet2:'Les fonds sont mis à jour après la complétion de la tâche.', chatReplyTask1:'Parcourez la page Tâches pour les places disponibles.', chatReplyTask2:'Les échéances sont indiquées sur chaque carte.', chatReplyReward1:'Les récompenses sont créditées automatiquement.', chatReplyReward2:'L\'historique des gains est dans la section Portefeuille.', chatReplyLevel1:'Votre niveau et XP sont affichés sur le tableau de bord.', chatReplyLevel2:'Maintenez votre série pour des points bonus.', chatFallback1:'Compris, je reviens bientôt.', chatFallback2:'Merci pour le message !', chatFallback3:'Noté. Je vérifie.',
    subject:'Objet', subjectPlaceholder:'Décrivez brièvement votre problème', issueType:'Type de problème', priorityLabel:'Priorité', detailsLabel:'Détails', detailsPlaceholder:'Fournir un contexte supplémentaire…', billing:'Facturation', technical:'Technique', accountType:'Compte', generalType:'Général', normalPriority:'Normal', highPriority:'Élevé', criticalPriority:'Critique', submitTicket:'Soumettre le ticket', noTicketsYet:'Aucun ticket', createTicketHelp:'Créez-en un ci-dessus si vous avez besoin d\'aide.', statusCol:'Statut', createdCol:'Créé', guestSupport:'Tickets réservés aux utilisateurs inscrits.',
    settings:'Paramètres', languageLabel:'Langue', animationsLabel:'Animations', animOn:'Act ✓', animOff:'Dés', readyToStartQ:'Prêt à commencer ?', readyToStartDesc:'Inscrivez-vous pour gagner.', editProfileTitle:'Modifier le profil', roleTitle:'Rôle / Titre', rolePlaceholder:'Freelancer, Designer…', bioLabel:'Bio', bioPlaceholder:'Présentez-vous…', skillsLabel:'Compétences', skillsPlaceholder:'Design, Vidéo, Texte…', defaultRole:'Freelance', browseWithout:'Parcourez sans engagement', guestAccount:'Compte invité',
    you:'Vous',
    earnTitle:'Gagnez', landingMicroTasks:'avec des Micro-Tâches', landingSubtitle:'Plateforme premium pour freelancers et entreprises.', getStarted:'Commencer', signUpBtn:'S\'inscrire', usersStat:'Utilisateurs', paidStat:'On-chain', ratingStat:'Évaluation', tasksStat:'Tâches',
    whyLolance:'Pourquoi LOLance ?', skillGrowth:'Développement des compétences', skillGrowthDesc:'Apprenez des compétences réelles sur de vrais projets.', securePayments:'Paiements sécurisés', securePaymentsDesc:'Transactions protégées avec des frais transparents.', transparentRating:'Évaluation transparente', transparentRatingDesc:'Construisez votre réputation par un travail de qualité.', personalizedTasks:'Tâches personnalisées', personalizedTasksDesc:'Tâches IA selon vos compétences.',
    howItWorks:'Comment ça marche', signUpStep:'Inscription', signUpStepDesc:'Inscription rapide en 2 minutes', browseStep:'Parcourir les tâches', browseStepDesc:'Trouver un travail intéressant', executeStep:'Exécuter', executeStepDesc:'Compléter avec qualité', getPaidStep:'Être payé', getPaidStepDesc:'Paiement instantané',
    readyToEarn:'Prêt à gagner ?', joinFreelancers:'Rejoignez des milliers de freelancers', signUpNow:'S\'inscrire maintenant',
    aboutLink:'À propos', contactLink:'Contact', privacyLink:'Confidentialité', termsLink:'Conditions', allRights:'Tous droits réservés.',
    managementCard:'Gestion', rewardsCard:'Récompenses', growthCard:'Croissance', goalsCard:'Objectifs', rankingCard:'Classement',
    justNow:'à l\'instant', minsAgo:'min', hoursAgo:'h', daysAgo:'j', guestWelcome:'Vous êtes en mode invité 🎭',
    guestRegTask:'Inscrivez-vous pour prendre une tâche', guestRegCreate:'Inscrivez-vous pour créer une tâche',
    notifTaskTaken:'Tâche prise !', notifTaskCompleted:'Terminé', notifCredited:'crédité.',
    chatRooms:'Salons de chat', bronzeRoom:'Global', silverRoom:'Argent', goldRoom:'Or', diamondRoom:'Diamant',
    pointsRequired:'niveau requis', buyPass:'Acheter un pass 7 jours', passCost:'coins / 7 jours',
    passActive:'Pass actif jusqu\'au', lockRoom:'Verrouillé', unlockRoom:'Débloquer pour',
    yourPoints:'Votre XP', earnPoints:'Gagner de l\'XP', buyPoints:'Acheter de l\'XP avec coins',
    pointsBalance:'Solde XP', checkinTitle:'Check-in quotidien', checkinBtn:'S\'enregistrer (+10 XP)',
    checkinDone:'Déjà enregistré aujourd\'hui ✓', checkinStreak:'Série de check-ins',
    visitBonus:'Bonus de visite quotidien', pointsCalendar:'Calendrier 30 jours',
    howEarnPts:'Comment gagner de l\'XP',
    earnTaskEasy:'+20 XP — Tâche facile', earnTaskMedium:'+35 XP — Tâche moyenne', earnTaskHard:'+50 XP — Tâche difficile',
    earnCheckin:'+10 XP — Check-in quotidien', earnVisit:'+5 XP — Visite quotidienne',
    earnBuyLabel:'100 XP = 50 coins',
    roomOnline:'en ligne', noMsgsYet:'Soyez le premier à écrire !', globalRoomDesc:'Tous les utilisateurs peuvent écrire ici',
    withdrawCrypto:'Retirer en crypto', withdrawTitle:'Retirer des coins en crypto', withdrawCoins:'Montant (coins)', withdrawWallet:'Adresse de votre portefeuille', withdrawNetwork:'Réseau', withdrawFee:'Frais (5%)', withdrawNet:'Vous recevrez', withdrawConfirm:'Soumettre le retrait', withdrawSuccess:'Demande de retrait créée !', withdrawCancel:'Annuler le retrait', withdrawCancelled:'Retrait annulé. Coins remboursés.', withdrawHistory:'Historique des retraits', withdrawPending:'Vous avez un retrait en attente', withdrawMin:'Retrait min. : 500 coins', withdrawStatus:'Statut', noWithdrawals:'Aucun retrait pour le moment',
  },
  ES:{
    appName:'LOLance', appTag:'Plataforma Premium de Micro-Tareas',
    dashboard:'Panel', tasks:'Tareas', createTask:'Nueva tarea',
    feed:'Feed', wallet:'Billetera', chat:'Chat', support:'Soporte',
    profile:'Perfil', leaderboard:'Clasificación', logout:'Cerrar sesión',
    login:'Iniciar sesión', register:'Registrarse', welcomeBack:'Bienvenido',
    balance:'Saldo', earnings:'Ganancias', spent:'Gastado', pending:'Pendiente',
    completed:'Completado', active:'Activo', level:'Nivel', streak:'Racha',
    deposit:'Comprar con USDT', withdraw:'Gastar coins', transfer:'Enviar coins',
    publish:'Publicar tarea', searchTasks:'Buscar tareas…', all:'Todos',
    open:'Abierto', inProgress:'En progreso', cancel:'Cancelar',
    takeTask:'Tomar tarea', completeTask:'Completar', viewTask:'Ver',
    sendMessage:'Enviar', typeMessage:'Escribir mensaje…',
    createTicket:'Crear ticket', faq:'FAQ', tickets:'Tickets',
    saveProfile:'Guardar perfil', notifications:'Notificaciones',
    markRead:'Marcar todo como leído', noNotifications:'Sin notificaciones aún',
    required:'Por favor completa todos los campos requeridos.',
    loginSuccess:'¡Bienvenido!', registerSuccess:'Cuenta creada. Puedes iniciar sesión.',
    logoutSuccess:'Sesión cerrada correctamente.', profileSaved:'¡Perfil guardado!',
    taskCreated:'¡Tarea publicada!', taskTaken:'¡Tarea tomada!', taskCompleted:'¡Tarea completada! Recompensa acreditada.',
    depositDone:'Compra cripto exitosa.', withdrawDone:'Coins gastadas correctamente.',
    transferDone:'Propina en coins enviada.', ticketDone:'¡Ticket creado!',
    txDeposit:'Compra cripto', txWithdraw:'Gasto de coins', txTransfer:'Propina a',
    invalidAmount:'Ingresa un monto mayor que cero.',
    insufficient:'Saldo insuficiente.',
    noMessage:'Escribe algo primero.',
    yourPosition:'Tu posición', score:'Puntuación', badges:'Insignias',
    achievements:'Logros', xpProgress:'Progreso al siguiente nivel',
    difficulty:'Dificultad', reward:'Recompensa', slots:'Espacios', deadline:'Fecha límite',
    easy:'Fácil', medium:'Medio', hard:'Difícil', description:'Descripción',
    preview:'Vista previa en vivo', category:'Categoría',
    guestMode:'Modo invitado', createAccount:'Crear cuenta',
    password:'Contraseña', orText:'o', browseAsGuest:'Explorar como invitado', noAccount:'¿Sin cuenta?', haveAccount:'¿Ya tienes cuenta?', fullName:'Nombre completo', minChars:'Mín. 8 caracteres',
    earnOnTasks:'Gana con Micro-Tareas', authSubtitle:'Plataforma premium para freelancers y empresas. Completa tareas, crece y gana.',
    quickEarnings:'Ganancias rápidas', quickEarningsDesc:'Primer dinero en una hora', levelsAchievements:'Niveles y Logros', levelsAchievementsDesc:'Crece y establece récords', premiumFeatures:'Funciones Premium', premiumFeaturesDesc:'Todas las funciones desbloqueadas', globalCommunity:'Comunidad global', globalCommunityDesc:'Colaboración mundial', activeStat:'Activos', paidOut:'Volumen on-chain',
    verifyEmail:'Verifica tu email', codeSentTo:'Enviamos un código de 6 dígitos a', solveCaptcha:'Resolver captcha', enterAnswer:'Ingresa la respuesta', verifyCaptcha:'Verificar', wrongAnswer:'Respuesta incorrecta', verificationCode:'Código de verificación', showCode:'Mostrar', hideCode:'Ocultar', enterCodeScreen:'Ingresa el código de la pantalla', sixDigits:'6 dígitos', confirmBtn:'Confirmar', backToLogin:'Volver al login', verifySuccess:'¡Genial! Estás conectado 🎉', wrongCode:'Código incorrecto', invalidCode:'Ingresa un código válido de 6 dígitos',
    guest:'Invitado', welcomeGuestTitle:'¡Bienvenido a LOLance Premium!', welcomeGuestDesc:'Explora tareas y funciones sin límites.', dashMotivation:'Hoy vas adelantado.', dashMotivationDesc:'Completa una tarea más para aumentar tu racha.',
    dayStreak:'días de racha', available:'disponible', totalEarned:'ganado', tasksDone:'tareas', pts:'pts',
    quickActions:'Acciones rápidas', browseOpenTasks:'Explorar tareas →', publishNewTask:'+ Nueva tarea', walletOverview:'Resumen de billetera', trendingTasks:'Tareas populares', miniLeaderboard:'Mini-clasificación',
    noTasksFound:'No se encontraron tareas', adjustFilters:'Intenta ajustar los filtros.', cancelled:'Cancelado', byUser:'por',
    titleLabel:'Título', titlePlaceholder:'Nombre claro de la tarea', descPlaceholder:'¿Qué hay que hacer exactamente?', selectOption:'Seleccionar…', previewTitlePh:'El título aparecerá aquí…', previewDescPh:'Vista previa de la descripción…', noDeadline:'Sin fecha límite',
    noPosts:'Sin publicaciones', mediaPreview:'Vista previa de medios', readMore:'Leer más ↓', showLess:'Mostrar menos ↑', save:'Guardar', saved:'Guardado',
    txHistory:'Historial de transacciones', type:'Tipo', amountCol:'Monto', whenCol:'Cuándo', recipientUsername:'Usuario destinatario', confirm:'Confirmar', guestWallet:'La billetera solo está disponible para usuarios registrados.',
    conversations:'Conversaciones', online:'En línea', lastSeen:'Visto recientemente', selectConversation:'Selecciona una conversación', guestChat:'El chat solo está disponible para usuarios registrados.',
    chatReplyWallet1:'Consulta la pestaña Billetera para tu saldo.', chatReplyWallet2:'Los fondos se actualizan tras completar la tarea.', chatReplyTask1:'Explora la página de Tareas para espacios abiertos.', chatReplyTask2:'Los plazos se muestran en cada tarjeta de tarea.', chatReplyReward1:'Las recompensas se acreditan automáticamente.', chatReplyReward2:'Tu historial de ganancias está en la sección Billetera.', chatReplyLevel1:'Tu nivel y XP se muestran en el panel.', chatReplyLevel2:'Mantén tu racha activa para ganar más XP.', chatFallback1:'Entendido, vuelvo pronto.', chatFallback2:'¡Gracias por el mensaje!', chatFallback3:'Anotado. Lo verifico.',
    subject:'Asunto', subjectPlaceholder:'Describe brevemente tu problema', issueType:'Tipo de problema', priorityLabel:'Prioridad', detailsLabel:'Detalles', detailsPlaceholder:'Proporciona contexto adicional…', billing:'Facturación', technical:'Técnico', accountType:'Cuenta', generalType:'General', normalPriority:'Normal', highPriority:'Alto', criticalPriority:'Crítico', submitTicket:'Enviar ticket', noTicketsYet:'Sin tickets aún', createTicketHelp:'Crea uno arriba si necesitas ayuda.', statusCol:'Estado', createdCol:'Creado', guestSupport:'Los tickets solo están disponibles para usuarios registrados.',
    settings:'Configuración', languageLabel:'Idioma', animationsLabel:'Animaciones', animOn:'Act ✓', animOff:'Des', readyToStartQ:'¿Listo para empezar?', readyToStartDesc:'Regístrate para ganar.', editProfileTitle:'Editar perfil', roleTitle:'Rol / Título', rolePlaceholder:'Freelancer, Diseñador…', bioLabel:'Bio', bioPlaceholder:'Preséntate…', skillsLabel:'Habilidades', skillsPlaceholder:'Diseño, Video, Texto…', defaultRole:'Freelancer', browseWithout:'Explora sin compromiso', guestAccount:'Cuenta de invitado',
    you:'Tú',
    earnTitle:'Gana', landingMicroTasks:'con Micro-Tareas', landingSubtitle:'Plataforma premium para freelancers y empresas.', getStarted:'Empezar', signUpBtn:'Registrarse', usersStat:'Usuarios', paidStat:'On-chain', ratingStat:'Calificación', tasksStat:'Tareas',
    whyLolance:'¿Por qué LOLance?', skillGrowth:'Crecimiento de habilidades', skillGrowthDesc:'Aprende habilidades reales en proyectos reales.', securePayments:'Pagos seguros', securePaymentsDesc:'Transacciones protegidas con comisiones transparentes.', transparentRating:'Calificación transparente', transparentRatingDesc:'Construye tu reputación con trabajo de calidad.', personalizedTasks:'Tareas personalizadas', personalizedTasksDesc:'Tareas IA según tus habilidades.',
    howItWorks:'Cómo funciona', signUpStep:'Registro', signUpStepDesc:'Registro rápido en 2 minutos', browseStep:'Explorar tareas', browseStepDesc:'Encontrar trabajo interesante', executeStep:'Ejecutar', executeStepDesc:'Completar con calidad', getPaidStep:'Cobra', getPaidStepDesc:'Pago instantáneo',
    readyToEarn:'¿Listo para ganar?', joinFreelancers:'Únete a miles de freelancers', signUpNow:'Registrarse ahora',
    aboutLink:'Acerca de', contactLink:'Contacto', privacyLink:'Privacidad', termsLink:'Términos', allRights:'Todos los derechos reservados.',
    managementCard:'Gestión', rewardsCard:'Recompensas', growthCard:'Crecimiento', goalsCard:'Metas', rankingCard:'Ranking',
    justNow:'ahora', minsAgo:'min', hoursAgo:'h', daysAgo:'d', guestWelcome:'Estás en modo invitado 🎭',
    guestRegTask:'Regístrate para tomar una tarea', guestRegCreate:'Regístrate para crear una tarea',
    notifTaskTaken:'¡Tarea tomada!', notifTaskCompleted:'Completada', notifCredited:'acreditado.',
    chatRooms:'Salas de chat', bronzeRoom:'Global', silverRoom:'Plata', goldRoom:'Oro', diamondRoom:'Diamante',
    pointsRequired:'nivel requerido', buyPass:'Comprar pase 7 días', passCost:'monedas / 7 días',
    passActive:'Pase activo hasta', lockRoom:'Bloqueado', unlockRoom:'Desbloquear por',
    yourPoints:'Tu XP', earnPoints:'Ganar XP', buyPoints:'Comprar XP con monedas',
    pointsBalance:'Saldo de XP', checkinTitle:'Check-in diario', checkinBtn:'Registrarse (+10 XP)',
    checkinDone:'Ya registrado hoy ✓', checkinStreak:'Racha de check-ins',
    visitBonus:'Bono de visita diaria', pointsCalendar:'Calendario 30 días',
    howEarnPts:'Cómo ganar XP',
    earnTaskEasy:'+20 XP — Tarea fácil', earnTaskMedium:'+35 XP — Tarea media', earnTaskHard:'+50 XP — Tarea difícil',
    earnCheckin:'+10 XP — Check-in diario', earnVisit:'+5 XP — Visita diaria',
    earnBuyLabel:'100 XP = 50 monedas',
    roomOnline:'en línea', noMsgsYet:'¡Sé el primero en escribir!', globalRoomDesc:'Todos los usuarios pueden escribir aquí',
    withdrawCrypto:'Retirar a crypto', withdrawTitle:'Retirar coins a crypto', withdrawCoins:'Cantidad (coins)', withdrawWallet:'Dirección de tu billetera', withdrawNetwork:'Red', withdrawFee:'Comisión (5%)', withdrawNet:'Recibirás', withdrawConfirm:'Solicitar retiro', withdrawSuccess:'¡Solicitud de retiro creada!', withdrawCancel:'Cancelar retiro', withdrawCancelled:'Retiro cancelado. Coins devueltos.', withdrawHistory:'Historial de retiros', withdrawPending:'Tienes un retiro pendiente', withdrawMin:'Retiro mín.: 500 coins', withdrawStatus:'Estado', noWithdrawals:'Sin retiros aún',
  },
  PL:{
    appName:'LOLance', appTag:'Platforma Premium Mikro-Zadań',
    dashboard:'Pulpit', tasks:'Zadania', createTask:'Nowe zadanie',
    feed:'Kanał', wallet:'Portfel', chat:'Chat', support:'Wsparcie',
    profile:'Profil', leaderboard:'Ranking', logout:'Wyloguj',
    login:'Zaloguj', register:'Zarejestruj', welcomeBack:'Wítaj z powrotem',
    balance:'Saldo', earnings:'Zarobki', spent:'Wydane', pending:'Oczekujące',
    completed:'Ukończone', active:'Aktywne', level:'Poziom', streak:'Seria',
    deposit:'Kup za USDT', withdraw:'Wydaj coiny', transfer:'Wyślij coiny',
    publish:'Opublikuj zadanie', searchTasks:'Szukaj zadań…', all:'Wszystkie',
    open:'Otwarte', inProgress:'W trakcie', cancel:'Anuluj',
    takeTask:'Przyjmij zadanie', completeTask:'Ukończ', viewTask:'Pokaż',
    sendMessage:'Wyślij', typeMessage:'Napisz wiadomość…',
    createTicket:'Utwórz zgłoszenie', faq:'FAQ', tickets:'Zgłoszenia',
    saveProfile:'Zapisz profil', notifications:'Powiadomienia',
    markRead:'Oznacz wszystkie jako przeczytane', noNotifications:'Brak powiadomień',
    required:'Wypełnij wszystkie wymagane pola.',
    loginSuccess:'Witaj!', registerSuccess:'Konto utworzone. Możesz się zalogować.',
    logoutSuccess:'Wylogowano pomyślnie.', profileSaved:'Profil zapisany!',
    taskCreated:'Zadanie opublikowane!', taskTaken:'Zadanie przyjęte!', taskCompleted:'Zadanie ukończone! Nagroda zaliczona.',
    depositDone:'Zakup crypto zakończony.', withdrawDone:'Wydanie coinów zakończone.',
    transferDone:'Napiwek w coinach wysłany.', ticketDone:'Zgłoszenie utworzone!',
    txDeposit:'Zakup crypto', txWithdraw:'Wydanie coinów', txTransfer:'Napiwek dla',
    invalidAmount:'Wpisz kwotę większą niż zero.',
    insufficient:'Niewystarczające saldo.',
    noMessage:'Najpierw napisz coś.',
    yourPosition:'Twoja pozycja', score:'Wynik', badges:'Odznaki',
    achievements:'Osiągnięcia', xpProgress:'Postęp do następnego poziomu',
    difficulty:'Trudność', reward:'Nagroda', slots:'Miejsca', deadline:'Termin',
    easy:'Łatwe', medium:'Średnie', hard:'Trudne', description:'Opis',
    preview:'Podgląd na żywo', category:'Kategoria',
    guestMode:'Tryb gościa', createAccount:'Utwórz konto',
    password:'Hasło', orText:'lub', browseAsGuest:'Przeglądaj jako gość', noAccount:'Nie masz konta?', haveAccount:'Masz już konto?', fullName:'Imię i nazwisko', minChars:'Min. 8 znaków',
    earnOnTasks:'Zarabiaj na Mikro-Zadaniach', authSubtitle:'Platforma premium dla freelancerów i firm. Wykonuj zadania, rozwijaj się i zarabiaj.',
    quickEarnings:'Szybkie zarobki', quickEarningsDesc:'Pierwsze pieniądze w godzinę', levelsAchievements:'Poziomy i Osiągnięcia', levelsAchievementsDesc:'Rozwijaj się i ustanawiaj rekordy', premiumFeatures:'Funkcje Premium', premiumFeaturesDesc:'Wszystkie funkcje odblokowane', globalCommunity:'Globalna społeczność', globalCommunityDesc:'Współpraca na całym świecie', activeStat:'Aktywnych', paidOut:'Wolumen on-chain',
    verifyEmail:'Zweryfikuj swój email', codeSentTo:'Wysłaliśmy 6-cyfrowy kod na', solveCaptcha:'Rozwiąż captchę', enterAnswer:'Wpisz odpowiedź', verifyCaptcha:'Sprawdź', wrongAnswer:'Zła odpowiedź', verificationCode:'Kod weryfikacyjny', showCode:'Pokaż', hideCode:'Ukryj', enterCodeScreen:'Wpisz kod z ekranu', sixDigits:'6 cyfr', confirmBtn:'Potwierdź', backToLogin:'Powrót do logowania', verifySuccess:'Super! Jesteś zalogowany 🎉', wrongCode:'Zły kod', invalidCode:'Wpisz poprawny 6-cyfrowy kod',
    guest:'Gość', welcomeGuestTitle:'Witaj w LOLance Premium!', welcomeGuestDesc:'Przeglądaj zadania i funkcje bez ograniczeń.', dashMotivation:'Dziś jesteś przed harmonogramem.', dashMotivationDesc:'Wykonaj kolejne zadanie dla serii.',
    dayStreak:'dni serii', available:'dostępne', totalEarned:'zarobione', tasksDone:'zadań', pts:'pkt',
    quickActions:'Szybkie akcje', browseOpenTasks:'Przeglądaj zadania →', publishNewTask:'+ Nowe zadanie', walletOverview:'Przegląd portfela', trendingTasks:'Popularne zadania', miniLeaderboard:'Mini-ranking',
    noTasksFound:'Nie znaleziono zadań', adjustFilters:'Spróbuj zmienić filtry.', cancelled:'Anulowane', byUser:'od',
    titleLabel:'Tytuł', titlePlaceholder:'Jasna nazwa zadania', descPlaceholder:'Co dokładnie trzeba zrobić?', selectOption:'Wybierz…', previewTitlePh:'Tytuł pojawi się tutaj…', previewDescPh:'Podgląd opisu…', noDeadline:'Bez terminu',
    noPosts:'Brak postów', mediaPreview:'Podgląd mediów', readMore:'Czytaj więcej ↓', showLess:'Mniej ↑', save:'Zapisz', saved:'Zapisano',
    txHistory:'Historia transakcji', type:'Typ', amountCol:'Kwota', whenCol:'Kiedy', recipientUsername:'Nazwa użytkownika odbiorcy', confirm:'Potwierdź', guestWallet:'Portfel dostępny tylko dla zarejestrowanych użytkowników.',
    conversations:'Rozmowy', online:'Online', lastSeen:'Widziany niedawno', selectConversation:'Wybierz rozmowę', guestChat:'Chat dostępny tylko dla zarejestrowanych użytkowników.',
    chatReplyWallet1:'Sprawdź zakładkę Portfel, aby zobaczyć saldo.', chatReplyWallet2:'Środki są aktualizowane po zakończeniu zadania.', chatReplyTask1:'Przeglądaj stronę Zadań w poszukiwaniu wolnych miejsc.', chatReplyTask2:'Terminy są pokazane na każdej karcie zadania.', chatReplyReward1:'Nagrody są automatycznie naliczane po zakończeniu.', chatReplyReward2:'Historia zarobków jest w sekcji Portfel.', chatReplyLevel1:'Twój poziom i XP są pokazane na pulpicie.', chatReplyLevel2:'Utrzymuj serię aktywną, aby zdobywać więcej XP.', chatFallback1:'Rozumiem, odezwę się wkrótce.', chatFallback2:'Dzięki za wiadomość!', chatFallback3:'Zanotowano. Sprawdzę.',
    subject:'Temat', subjectPlaceholder:'Krótko opisz problem', issueType:'Typ problemu', priorityLabel:'Priorytet', detailsLabel:'Szczegóły', detailsPlaceholder:'Podaj dodatkowy kontekst…', billing:'Rozliczenia', technical:'Techniczny', accountType:'Konto', generalType:'Ogólny', normalPriority:'Normalny', highPriority:'Wysoki', criticalPriority:'Krytyczny', submitTicket:'Wyślij zgłoszenie', noTicketsYet:'Brak zgłoszeń', createTicketHelp:'Utwórz jedno powyżej, jeśli potrzebujesz pomocy.', statusCol:'Status', createdCol:'Utworzono', guestSupport:'Zgłoszenia dostępne tylko dla zarejestrowanych użytkowników.',
    settings:'Ustawienia', languageLabel:'Język', animationsLabel:'Animacje', animOn:'Wł ✓', animOff:'Wył', readyToStartQ:'Gotowy zacząć?', readyToStartDesc:'Zarejestruj się, aby zarabiać.', editProfileTitle:'Edytuj profil', roleTitle:'Rola / Tytuł', rolePlaceholder:'Freelancer, Projektant…', bioLabel:'Bio', bioPlaceholder:'Przedstaw się…', skillsLabel:'Umiejętności', skillsPlaceholder:'Projektowanie, Wideo, Tekst…', defaultRole:'Freelancer', browseWithout:'Przeglądaj bez zobowiązań', guestAccount:'Konto gościa',
    you:'Ty',
    earnTitle:'Zarabiaj', landingMicroTasks:'na Mikro-Zadaniach', landingSubtitle:'Platforma premium dla freelancerów i firm.', getStarted:'Zacznij', signUpBtn:'Zarejestruj się', usersStat:'Użytkowników', paidStat:'On-chain', ratingStat:'Ocena', tasksStat:'Zadań',
    whyLolance:'Dlaczego LOLance?', skillGrowth:'Rozwój umiejętności', skillGrowthDesc:'Ucz się prawdziwych umiejętności na realnych projektach.', securePayments:'Bezpieczne płatności', securePaymentsDesc:'Chronione transakcje z przejrzystymi opłatami.', transparentRating:'Przejrzysty ranking', transparentRatingDesc:'Buduj reputację dzięki jakościowej pracy.', personalizedTasks:'Spersonalizowane zadania', personalizedTasksDesc:'Zadania AI dopasowane do umiejętności.',
    howItWorks:'Jak to działa', signUpStep:'Rejestracja', signUpStepDesc:'Szybka rejestracja w 2 minuty', browseStep:'Przeglądaj zadania', browseStepDesc:'Znajdź ciekawą pracę', executeStep:'Wykonaj', executeStepDesc:'Ukończ z jakością', getPaidStep:'Otrzymaj zapłatę', getPaidStepDesc:'Natychmiastowa płatność',
    readyToEarn:'Gotowy do zarabiania?', joinFreelancers:'Dołącz do tysięcy freelancerów', signUpNow:'Zarejestruj się teraz',
    aboutLink:'O nas', contactLink:'Kontakt', privacyLink:'Prywatność', termsLink:'Regulamin', allRights:'Wszelkie prawa zastrzeżone.',
    managementCard:'Zarządzanie', rewardsCard:'Nagrody', growthCard:'Wzrost', goalsCard:'Cele', rankingCard:'Ranking',
    justNow:'właśnie', minsAgo:'min', hoursAgo:'godz', daysAgo:'d', guestWelcome:'Jesteś w trybie gościa 🎭',
    guestRegTask:'Zarejestruj się, aby przyjąć zadanie', guestRegCreate:'Zarejestruj się, aby utworzyć zadanie',
    notifTaskTaken:'Zadanie przyjęte!', notifTaskCompleted:'Ukończono', notifCredited:'zaliczone.',
    chatRooms:'Pokoje czatu', bronzeRoom:'Globalny', silverRoom:'Srebro', goldRoom:'Złoto', diamondRoom:'Diament',
    pointsRequired:'wymagany poziom', buyPass:'Kup przepustkę 7 dni', passCost:'coinów / 7 dni',
    passActive:'Przepustka ważna do', lockRoom:'Zablokowany', unlockRoom:'Odblokuj za',
    yourPoints:'Twoje XP', earnPoints:'Zdobywaj XP', buyPoints:'Kup XP za coiny',
    pointsBalance:'Saldo XP', checkinTitle:'Codzienny check-in', checkinBtn:'Zamelduj się (+10 XP)',
    checkinDone:'Już zameldowany dziś ✓', checkinStreak:'Seria check-inów',
    visitBonus:'Bonus za dzienny odwiedź', pointsCalendar:'Kalendarz 30 dni',
    howEarnPts:'Jak zdobywać XP',
    earnTaskEasy:'+20 XP — Łatwe zadanie', earnTaskMedium:'+35 XP — Średnie zadanie', earnTaskHard:'+50 XP — Trudne zadanie',
    earnCheckin:'+10 XP — Codzienny check-in', earnVisit:'+5 XP — Codzienna wizyta',
    earnBuyLabel:'100 XP = 50 coinów',
    roomOnline:'online', noMsgsYet:'Bądź pierwszym, który pisze!', globalRoomDesc:'Tutaj mogą pisać wszyscy użytkownicy',
    withdrawCrypto:'Wypłata na krypto', withdrawTitle:'Wypłata coinów na krypto', withdrawCoins:'Kwota (coiny)', withdrawWallet:'Adres Twojego portfela', withdrawNetwork:'Sieć', withdrawFee:'Opłata (5%)', withdrawNet:'Otrzymasz', withdrawConfirm:'Złóż wniosek', withdrawSuccess:'Wniosek o wypłatę złożony!', withdrawCancel:'Anuluj wypłatę', withdrawCancelled:'Wypłata anulowana. Coiny zwrócone.', withdrawHistory:'Historia wypłat', withdrawPending:'Masz oczekującą wypłatę', withdrawMin:'Min. wypłata: 500 coinów', withdrawStatus:'Status', noWithdrawals:'Brak wypłat',
  },
};
function t(k){ return (i18n[S.lang]||i18n.UA)[k] || k; }

/* ── 3. UTILITIES ───────────────────────────────────────────── */
const uid = ()=> Math.random().toString(36).slice(2,9);

/* ── 4. EMPTY DATA ──────────────────────────────────────────── */

const seedFaqs = [];

/* ── 4. STATE ────────────────────────────────────────────────── */
let S = {};
let currentUser = null;
let isGuest = false;
let currentPage = 'dashboard';
let activeChatId = null;
let notifOpen = false;

function defaultState(){
  return {
    lang:'UA', animationsOn:true,
    balance:0, earnings:0, spent:0, pending:0,
    level:1, xp:0, streak:0, completedTasks:0, activeTasks:0,
    achievements:[],
    bio:'', role:'', skills:'',
    tasks:[],
    feed:[],
    notifications:[],
    transactions:[],
    threads:[],
    tickets:[],
    coinBalance:0, coinsPurchased:0, coinsSpent:0,
    cryptoDeposits:[], pendingCryptoCount:0, coinHistory:[],
    checkinStreak:0, doneCheckinToday:false, checkins:[],
    chatRooms:[], activeRoomTier:1, chatRoomMessages:[],
  };
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){ S=JSON.parse(raw); }
  }catch(e){}
  if(!S) S=defaultState();
}

async function syncProfile(){
  if(!currentUser || isGuest) return;
  try{
    const {ok, data} = await apiFetch(API.profile);
    if(ok && data.user){
      currentUser = data.user;
      S.name = data.user.name;
      S.username = data.user.username;
      S.level = data.user.level || 1;
      S.xp = data.user.xp || 0;
      S.earnings = data.user.total_earnings || 0;
      S.spent = data.user.total_spent || 0;
      S.streak = data.user.streak || 0;
      S.bio = data.user.bio || '';
      S.role = data.user.role || '';
      S.skills = data.user.skills || '';
      saveState();
    }
  }catch(e){}
}

async function loadTasks(filter='open'){
  try{
    const {ok, data} = await apiFetch(`${API.tasks}?filter=${filter}`);
    if(ok && data.tasks){
      const apiTasks = data.tasks.map(t=>({
        id:String(t.id),
        title:t.title,
        description:t.description,
        category:t.category,
        difficulty:t.difficulty,
        reward:Number(t.reward||0),
        slots:Number(t.slots||1),
        deadline:t.deadline,
        status:t.status,
        creator_id:Number(t.creator_id||0),
        owner:t.creator_username||`User #${t.creator_id}`,
        taken_slots:Number(t.taken_slots||0),
        my_assignment_status:t.my_assignment_status||null,
        pending_submissions:Number(t.pending_submissions||0),
        slotsLeft:Math.max(0, Number(t.slots||1)-Number(t.taken_slots||0)),
        participants:[],
        progress:t.status==='completed'?100:(t.status==='in_progress'?55:0),
        createdAt:t.created_at||new Date().toISOString()
      }));
      const map=new Map((S.tasks||[]).map(task=>[String(task.id),task]));
      apiTasks.forEach(task=>{
        const key=String(task.id);
        map.set(key,{...(map.get(key)||{}),...task});
      });
      S.tasks=Array.from(map.values()).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      saveState();
    }
  }catch(e){
  }
}

async function loadWallet(){
  if(isGuest) return;
  try{
    const {ok, data} = await apiFetch(API.wallet);
    if(ok){
      S.balance = data.balance || 0;
      S.pendingBalance = data.pending_balance || 0;
      S.pending = data.pending_balance || 0;
      S.transactions = data.transactions || [];
      S.coinBalance = data.coin_balance || 0;
      S.coinsPurchased = data.coins_purchased || 0;
      S.coinsSpent = data.coins_spent || 0;
      S.pendingCryptoCount = data.crypto_pending_count || 0;
    }

    const {ok:cryptoOk, data:cryptoData} = await apiFetch(`${API.cryptoDeposit}?action=history`);
    if(cryptoOk){
      S.cryptoDeposits = cryptoData.deposits || [];
      S.coinBalance = cryptoData.coin_balance ?? S.coinBalance ?? 0;
      S.coinsPurchased = cryptoData.total_purchased ?? S.coinsPurchased ?? 0;
      S.coinsSpent = cryptoData.total_spent ?? S.coinsSpent ?? 0;
    }

    const {ok:coinsOk, data:coinsData} = await apiFetch(API.coins);
    if(coinsOk){
      S.coinBalance = coinsData.coin_balance ?? S.coinBalance ?? 0;
      S.coinsPurchased = coinsData.total_purchased ?? S.coinsPurchased ?? 0;
      S.coinsSpent = coinsData.total_spent ?? S.coinsSpent ?? 0;
      S.coinHistory = coinsData.spending_history || [];
    }

    const {ok:wdOk, data:wdData} = await apiFetch(`${API.cryptoWithdraw}?action=history`);
    if(wdOk){
      S.cryptoWithdrawals = wdData.withdrawals || [];
    }

    saveState();
  }catch(e){}
}

async function loadMessages(){
  if(isGuest) return;
  try{
    const {ok, data} = await apiFetch(API.messages);
    if(ok){
      S.threads = data.threads || [];
      saveState();
    }
  }catch(e){}
}

async function loadSupport(){
  if(isGuest) return;
  try{
    const {ok,data}=await apiFetch(API.support);
    if(ok){
      S.tickets=(data.tickets||[]).map(ticket=>({
        id:String(ticket.id),
        subject:ticket.subject,
        type:ticket.category,
        priority:ticket.priority,
        status:ticket.status,
        ts:ticket.created_at,
        updatedAt:ticket.updated_at,
        description:ticket.description||''
      }));
      saveState();
      if(currentPage==='support'){
        const main=document.getElementById('mainContent');
        if(main) renderSupport(main);
      }
    }
  }catch(e){}
}

async function loadPoints(){
  if(isGuest) return;
  try{
    const {ok,data}=await apiFetch(API.xp);
    if(ok){
      S.xp=Number(data.xp??S.xp??0);
      S.level=Number(data.level??S.level??1);
      S.checkinStreak=Number(data.checkin_streak||0);
      S.doneCheckinToday=!!data.done_today;
      S.checkins=Array.isArray(data.checkins)?data.checkins:[];
      saveState();
    }
  }catch(e){}
}

async function loadChatRooms(tier){
  if(isGuest) return;
  try{
    const {ok,data}=await apiFetch(API.chatRooms);
    if(ok){
      S.chatRooms=Array.isArray(data.rooms)?data.rooms:[];
      S.xp=Number(data.user_xp??S.xp??0);
      S.level=Number(data.user_level??S.level??1);
      if(!tier){
        const firstAccessible=(S.chatRooms||[]).find(r=>r.has_access) || S.chatRooms[0];
        tier=Number(firstAccessible?.tier||S.activeRoomTier||1);
      }
      const activeRoom=(S.chatRooms||[]).find(r=>Number(r.tier)===Number(tier));
      if(activeRoom && activeRoom.has_access){
        S.activeRoomTier=Number(tier);
        const msgRes=await apiFetch(`${API.chatRooms}?tier=${S.activeRoomTier}`);
        if(msgRes.ok){
          S.chatRoomMessages=Array.isArray(msgRes.data.messages)?msgRes.data.messages:[];
          S.xp=Number(msgRes.data.user_xp??S.xp??0);
          S.level=Number(msgRes.data.user_level??S.level??1);
        }else{
          S.chatRoomMessages=[];
        }
      }else{
        S.chatRoomMessages=[];
      }
      saveState();
    }
  }catch(e){}
}

async function sendRoomMessage(){
  const input=document.getElementById('roomMessageInput');
  if(!input)return;
  const message=input.value.trim();
  if(!message){toast(t('noMessage'),'error');return;}
  const tier=Number(S.activeRoomTier||1);
  const {ok,data}=await apiFetch(API.chatRooms,{method:'POST',body:JSON.stringify({action:'send',tier,message})});
  if(!ok){toast(data.message||'Error','error');return;}
  input.value='';
  await loadChatRooms(tier);
  navigate('chat');
}

async function sendGlobalMessage(){
  const input=document.getElementById('globalMessageInput');
  if(!input)return;
  const message=input.value.trim();
  if(!message){toast(t('noMessage'),'error');return;}
  const {ok,data}=await apiFetch(API.chatRooms,{method:'POST',body:JSON.stringify({action:'send',tier:1,message})});
  if(!ok){toast(data.message||'Error','error');return;}
  input.value='';
  await loadChatRooms(1);
  toast('Message sent to Global chat','success');
  navigate('chat');
}

async function buyRoomPass(tier){
  const {ok,data}=await apiFetch(API.chatRooms,{method:'POST',body:JSON.stringify({action:'buy_pass',tier:Number(tier)})});
  if(!ok){toast(data.message||'Error','error');return;}
  await loadWallet();
  await loadPoints();
  await loadChatRooms(Number(tier));
  toast(data.message||'Pass purchased','success');
  navigate('chat');
}

async function dailyCheckin(){
  const {ok,data}=await apiFetch(API.xp,{method:'POST',body:JSON.stringify({action:'checkin'})});
  if(!ok){toast(data.message||'Check-in failed','error');return;}
  await loadPoints();
  toast(`+${Number(data.xp_earned||0)} XP`,'success');
  navigate('profile');
}

async function buyPointsPack(){
  const packs=Math.max(1,Number(document.getElementById('buyPointsPacks')?.value||1));
  const {ok,data}=await apiFetch(API.xp,{method:'POST',body:JSON.stringify({action:'buy_xp',packs})});
  if(!ok){toast(data.message||'Purchase failed','error');return;}
  await loadWallet();
  await loadPoints();
  toast(`+${Number(data.xp_earned||0)} XP`,'success');
  if(currentPage==='chat') navigate('chat');
  else navigate('profile');
}

async function loadLeaderboard(){
  try{
    const {ok, data} = await apiFetch(API.leaderboard);
    if(ok){
      S.leaderboard = data.leaderboard || [];
      S.userPosition = data.user_position;
      saveState();
    }
  }catch(e){}
}
function saveState(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(S)); }catch(e){} }
function calcScore(u){
  return Math.round((u.earnings||0)*1.02+(u.completedTasks||0)*65+(u.streak||0)*20+(u.level||1)*110+(u.xp||0));
}

/* ── 5. API ──────────────────────────────────────────────────── */
async function apiFetch(url,opts={}){
  const res=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opts});
  const data=await res.json().catch(()=>({success:false,message:'Server error.'}));
  return {ok:res.ok&&data.success,data};
}

/* ── 6. UTILS ────────────────────────────────────────────────── */
function esc(s){const d=document.createElement('div');d.textContent=s??'';return d.innerHTML;}
function fmtDate(s){if(!s)return '—';const loc={UA:'uk-UA',EN:'en-US',DE:'de-DE',FR:'fr-FR',ES:'es-ES',PL:'pl-PL'}[S.lang]||'uk-UA';return new Date(s).toLocaleDateString(loc,{day:'2-digit',month:'short',year:'numeric'});}
function fmtTime(s){if(!s)return '';const loc={UA:'uk-UA',EN:'en-US',DE:'de-DE',FR:'fr-FR',ES:'es-ES',PL:'pl-PL'}[S.lang]||'uk-UA';return new Date(s).toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit'});}
function fmtAgo(s){
  const diff=Math.floor((Date.now()-new Date(s))/60000);
  if(diff<1)return t('justNow');
  if(diff<60)return diff+t('minsAgo');
  if(diff<1440)return Math.floor(diff/60)+t('hoursAgo');
  return Math.floor(diff/1440)+t('daysAgo');
}
function renderAnimatedBrandLayer(scope='default'){
  return `
    <div class="brand-sprites brand-sprites-${scope}" aria-hidden="true">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-a">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-b">
      <img src="assets/lolance-logo.svg" alt="" class="brand-sprite sprite-c">
    </div>`;
}

/* ── 7. TOAST ────────────────────────────────────────────────── */
function toast(msg,type='info'){
  const root=document.getElementById('toastRoot');
  if(!root)return;
  const el=document.createElement('div');
  el.className=`toast toast-${type}`;
  el.innerHTML=`<span>${esc(msg)}</span>`;
  root.appendChild(el);
  setTimeout(()=>{el.classList.add('hiding');setTimeout(()=>el.remove(),300);},3200);
}

/* ── 8. ALERTS ───────────────────────────────────────────────── */
function showAlert(id,msg,type='error'){const e=document.getElementById(id);if(e){e.className=`alert alert-${type} show`;e.textContent=msg;}}
function hideAlert(id){const e=document.getElementById(id);if(e)e.className='alert';}

/* ── 9. BTN LOADING ──────────────────────────────────────────── */
function setLoading(btn,state){
  if(!btn)return;
  if(state){btn.dataset.o=btn.innerHTML;btn.classList.add('btn-loading');btn.disabled=true;btn.innerHTML=`<span class="btn-txt">${btn.dataset.o}</span>`;}
  else{btn.classList.remove('btn-loading');btn.disabled=false;if(btn.dataset.o)btn.innerHTML=btn.dataset.o;}
}

/* ── 10. NOTIFICATIONS ───────────────────────────────────────── */
function addNotif(text,type='info'){
  S.notifications.unshift({id:uid(),text,type,read:false,timestamp:new Date().toISOString()});
  saveState();
  updateNotifBadge();
}
function updateNotifBadge(){
  const count=S.notifications.filter(n=>!n.read).length;
  const badge=document.getElementById('notifBadge');
  if(badge){badge.textContent=count||'';badge.style.display=count?'flex':'none';}
}
/* ── 11. SCROLL PROGRESS ─────────────────────────────────────── */
function initScroll(){
  const bar=document.getElementById('scrollBar');
  if(!bar)return;
  window.addEventListener('scroll',()=>{
    const h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=(h>0?(window.scrollY/h*100):0)+'%';
  },{passive:true});
}

/* ── 12. ROUTER ──────────────────────────────────────────────── */
function navigate(page){
  currentPage=page;
  document.querySelectorAll('.nav-btn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  document.querySelectorAll('.mob-btn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const mc=document.getElementById('mainContent');
  if(!mc)return;
  mc.style.opacity='0';
  setTimeout(()=>{
    mc.innerHTML='';
    renderPage(page,mc);
    mc.style.opacity='1';
    mc.style.transition='opacity .2s';
    mc.scrollTop=0;
  },80);
  const titles={dashboard:t('dashboard'),tasks:t('tasks'),createTask:t('createTask'),feed:t('feed'),wallet:t('wallet'),chat:t('chat'),support:t('support'),profile:t('profile'),leaderboard:t('leaderboard')};
  const tb=document.getElementById('topbarTitle');
  if(tb)tb.textContent=titles[page]||page;
  document.title=`${titles[page]||page} — LOLance`;
}
function renderPage(page,el){
  const pages={dashboard:renderDashboard,tasks:renderTasks,createTask:renderCreateTask,feed:renderFeed,wallet:renderWallet,chat:renderChat,support:renderSupport,profile:renderProfile,leaderboard:renderLeaderboard};
  
  // Load data before rendering each page
  if(page==='tasks' && !isGuest){
    loadTasks('open');
    loadTasks('my');
    loadTasks('taken');
  }
  if(page==='wallet' && !isGuest) loadWallet();
  if(page==='chat' && !isGuest){ loadChatRooms(); loadPoints(); }
  if(page==='support' && !isGuest) loadSupport();
  if(page==='profile' && !isGuest) loadPoints();
  if(page==='leaderboard') loadLeaderboard();
  
  (pages[page]||renderDashboard)(el);
}

/* ── 13. SHELL ───────────────────────────────────────────────── */
function renderShell(){
  if(!currentUser && !isGuest){renderAuth();return;}
  document.body.classList.toggle('animations-off',!S.animationsOn);
  const navItems=[
    {page:'dashboard',icon:'⚡',label:t('dashboard')},
    {page:'tasks',icon:'📋',label:t('tasks')},
    {page:'createTask',icon:'✚',label:t('createTask')},
    {page:'feed',icon:'📡',label:t('feed')},
    {page:'wallet',icon:'💎',label:t('wallet')},
    {page:'chat',icon:'💬',label:t('chat')},
    {page:'support',icon:'🛟',label:t('support')},
    {page:'leaderboard',icon:'🏆',label:t('leaderboard')},
    {page:'profile',icon:'👤',label:t('profile')},
  ];
  const mobItems=[
    {page:'dashboard',icon:'⚡',label:t('dashboard')},
    {page:'tasks',icon:'📋',label:t('tasks')},
    {page:'createTask',icon:'✚',label:t('createTask')},
    {page:'wallet',icon:'💎',label:t('wallet')},
    {page:'profile',icon:'👤',label:t('profile')},
  ];
  const unreadCount=(S.notifications||[]).filter(n=>!n.read).length;
  const app=document.getElementById('app');
  if(!app)return;

  app.innerHTML=`
    <div class="scroll-progress" aria-hidden="true"><span id="scrollProgressBar"></span></div>
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">L</div>
          <div>
            <div class="logo-text">LOL<em>ance</em></div>
            <div class="logo-tag">${t('appTag')}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(n=>`<button class="nav-btn${currentPage===n.page?' active':''}" data-page="${n.page}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span></button>`).join('')}
        </nav>
        <div class="sidebar-user">
          ${currentUser?`
            <div class="user-av" aria-hidden="true">${(currentUser.name||'?').charAt(0).toUpperCase()}</div>
            <div><div class="user-name">${esc(currentUser.name||currentUser.username)}</div><div class="user-handle">@${esc(currentUser.username)}</div></div>
          `:`
            <div class="user-av" aria-hidden="true">🎭</div>
            <div><div class="user-name">${t('guest')}</div><div class="user-handle">@guest</div></div>
          `}
        </div>
      </aside>
      <div class="main-wrap">
        ${renderAnimatedBrandLayer('shell')}
        <header class="topbar" role="banner">
          <div><div class="topbar-title" id="topbarTitle">${t('dashboard')}</div></div>
          <div class="topbar-right">
            <div id="notifPanel" class="notif-panel" aria-hidden="true"></div>
            <button class="btn btn-ghost btn-sm btn-icon" id="notifToggle" aria-label="${t('notifications')}" aria-haspopup="true" aria-expanded="false" style="position:relative;">
              🔔<span class="nav-badge" id="notifBadge" style="position:absolute;top:2px;right:2px;display:${unreadCount?'flex':'none'};font-size:9px;min-width:14px;height:14px;">${unreadCount||''}</span>
            </button>
            <select id="langToggle" class="btn btn-ghost btn-sm" style="padding:7px 10px;font-size:13px;border-radius:var(--r-sm);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);cursor:pointer;">
              <option value="UA" ${S.lang==='UA'?'selected':''}>🇺🇦 Українська</option>
              <option value="EN" ${S.lang==='EN'?'selected':''}>🇬🇧 English</option>
              <option value="DE" ${S.lang==='DE'?'selected':''}>🇩🇪 Deutsch</option>
              <option value="FR" ${S.lang==='FR'?'selected':''}>🇫🇷 Français</option>
              <option value="ES" ${S.lang==='ES'?'selected':''}>🇪🇸 Español</option>
              <option value="PL" ${S.lang==='PL'?'selected':''}>🇵🇱 Polski</option>
            </select>
            ${isGuest?`<button class="btn btn-primary btn-sm" id="guestLoginBtn">${t('login')}</button>`:`<button class="btn btn-danger btn-sm" id="logoutBtn">${t('logout')}</button>`}
          </div>
        </header>
        ${isGuest?`<div style="background:linear-gradient(90deg,rgba(184,255,92,.05),rgba(125,215,255,.05));border-bottom:1px solid rgba(184,255,92,.1);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;"><span>🎭 ${t('guestMode')} — ${t('welcomeGuestDesc')}</span><button class="btn btn-primary btn-xs" id="guestCreateBtn">${t('createAccount')}</button></div>`:''}
        <main class="main-content" id="mainContent" tabindex="-1"></main>
      </div>
      <nav class="mobile-nav" aria-label="Mobile navigation">
        <div class="mobile-nav-inner">
          ${mobItems.map(n=>`<button class="mob-btn${currentPage===n.page?' active':''}" data-page="${n.page}" aria-label="${n.label}"><span class="icon" aria-hidden="true">${n.icon}</span><span>${n.label}</span></button>`).join('')}
        </div>
      </nav>
    </div>`;

  const np=document.getElementById('notifPanel');
  if(np){
    np.innerHTML=`
      <div class="notif-head"><h4>${t('notifications')}</h4><button class="btn btn-ghost btn-xs" id="markReadBtn">${t('markRead')}</button></div>
      <div class="notif-list">${S.notifications.length?S.notifications.map(n=>`<div class="notif-item${n.read?'':' unread'}"><div>${esc(n.text)}</div><div class="notif-time">${fmtAgo(n.timestamp)}</div></div>`).join(''):`<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">${t('noNotifications')}</div>`}</div>`;
  }

  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
  if(isGuest){
    document.getElementById('guestLoginBtn')?.addEventListener('click',()=>renderAuth('login'));
    document.getElementById('guestCreateBtn')?.addEventListener('click',()=>renderAuth('register'));
  }else{
    document.getElementById('logoutBtn')?.addEventListener('click',doLogout);
  }
  document.getElementById('langToggle')?.addEventListener('change',e=>{S.lang=e.target.value;saveState();renderShell();navigate(currentPage);});
  document.getElementById('notifToggle')?.addEventListener('click',toggleNotif);
  document.getElementById('markReadBtn')?.addEventListener('click',()=>{S.notifications.forEach(n=>n.read=true);saveState();updateNotifBadge();renderShell();navigate(currentPage);});

  if(currentUser && !isGuest) syncProfile();

  navigate(currentPage);
  updateNotifBadge();
}

function toggleNotif(){
  notifOpen=!notifOpen;
  const p=document.getElementById('notifPanel');
  const btn=document.getElementById('notifToggle');
  if(p){p.classList.toggle('open',notifOpen);p.setAttribute('aria-hidden',String(!notifOpen));}
  if(btn)btn.setAttribute('aria-expanded',String(notifOpen));
}

/* ── 14. AUTH ────────────────────────────────────────────────── */
function renderAuth(mode='login'){
  document.getElementById('app').innerHTML=`
    <div class="auth-landing">
      <!-- Background layers -->
      <div class="bg-orbs" aria-hidden="true"></div>
      <div class="bg-grid" aria-hidden="true"></div>
      ${renderAnimatedBrandLayer('auth')}
      
      <div class="auth-container">
        <!-- Left: Hero + Benefits -->
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-logo-large">LOL<em>ance</em></div>
            <h1 class="auth-title">${t('earnOnTasks')}</h1>
            <p class="auth-subtitle">${t('authSubtitle')}</p>
            
            <div class="auth-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">⚡</span>
                <div>
                  <div class="benefit-title">${t('quickEarnings')}</div>
                  <div class="benefit-text">${t('quickEarningsDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🎖️</span>
                <div>
                  <div class="benefit-title">${t('levelsAchievements')}</div>
                  <div class="benefit-text">${t('levelsAchievementsDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">💎</span>
                <div>
                  <div class="benefit-title">${t('premiumFeatures')}</div>
                  <div class="benefit-text">${t('premiumFeaturesDesc')}</div>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🌍</span>
                <div>
                  <div class="benefit-title">${t('globalCommunity')}</div>
                  <div class="benefit-text">${t('globalCommunityDesc')}</div></div>
                </div>
              </div>
            </div>

            <div class="auth-stats">
              <div class="stat"><strong>12.5K+</strong><span>${t('activeStat')}</span></div>
              <div class="stat"><strong>2.3M USDT</strong><span>${t('paidOut')}</span></div>
              <div class="stat"><strong>4.9★</strong><span>${t('leaderboard')}</span></div>
            </div>
          </div>

          <!-- Illustration -->
          <div class="auth-illustration">
            <div class="illu-circle"></div>
            <div class="illu-element illu-1">🚀</div>
            <div class="illu-element illu-2">💰</div>
            <div class="illu-element illu-3">📈</div>
            <div class="illu-element illu-4">🎯</div>
            <div class="illu-element illu-5">⭐</div>
          </div>
        </div>

        <!-- Right: Auth Forms -->
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-tabs" role="tablist">
              <button class="auth-tab${mode==='login'?' active':''}" id="tabLogin" role="tab" aria-selected="${mode==='login'}">${t('login')}</button>
              <button class="auth-tab${mode==='register'?' active':''}" id="tabRegister" role="tab" aria-selected="${mode==='register'}">${t('register')}</button>
            </div>
            <select id="authLangSelector" class="form-input" style="width:100px;font-size:13px;height:36px;padding:6px 8px;margin-top:0;" aria-label="Language selector">
              <option value="UA" ${S.lang==='UA'?'selected':''}>🇺🇦 Українська</option>
              <option value="EN" ${S.lang==='EN'?'selected':''}>🇬🇧 English</option>
              <option value="DE" ${S.lang==='DE'?'selected':''}>🇩🇪 Deutsch</option>
              <option value="PL" ${S.lang==='PL'?'selected':''}>🇵🇱 Polski</option>
            </select>
          </div>

          <div id="authAlert" class="alert" style="margin-bottom:16px;"></div>

          ${mode==='login'?`
            <form id="loginForm" class="auth-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="loginEmail">Email</label>
                <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" autocomplete="email" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="loginPwd">${t('password')}</label>
                <input type="password" id="loginPwd" class="form-input" placeholder="••••••••" autocomplete="current-password" required>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:8px;">
                <span class="btn-txt">${t('login')}</span>
              </button>
            </form>

            <div class="auth-divider">
              <span>${t('orText')}</span>
            </div>

            <button type="button" id="guestBtn" class="btn btn-outline btn-block btn-lg">
              <span class="btn-txt">🎭 ${t('browseAsGuest')}</span>
            </button>

            <div class="auth-footer">
              <span>${t('noAccount')}</span>
              <button type="button" id="switchRegister" class="link-btn">${t('register')}</button>
            </div>
          `:`
            <form id="registerForm" class="auth-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="regName">${t('fullName')} *</label>
                <input type="text" id="regName" class="form-input" placeholder="${t('fullName')}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="regUser">Username *</label>
                <input type="text" id="regUser" class="form-input" placeholder="ivan_dev" pattern="[a-zA-Z0-9_]{3,32}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="regEmail">Email *</label>
                <input type="email" id="regEmail" class="form-input" placeholder="you@example.com" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="regPwd">${t('password')} *</label>
                <input type="password" id="regPwd" class="form-input" placeholder="${t('minChars')}" required>
              </div>
              <div class="form-group" style="margin-top:-2px;">
                <label style="display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.45;color:var(--text-soft);">
                  <input type="checkbox" id="regAcceptTerms" style="margin-top:2px;" required>
                  <span>Я погоджуюсь з <a href="terms.html" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">Правилами платформи</a> та <a href="privacy.html" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;">Політикою приватності</a>.</span>
                </label>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:8px;">
                <span class="btn-txt">${t('register')}</span>
              </button>
            </form>

            <div class="auth-footer">
              <span>${t('haveAccount')}</span>
              <button type="button" id="switchLogin" class="link-btn">${t('login')}</button>
            </div>
          `}
        </div>
      </div>
    </div>`;

  document.getElementById('tabLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('tabRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('switchLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('switchRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('loginForm')?.addEventListener('submit',handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit',handleRegister);
  document.getElementById('guestBtn')?.addEventListener('click',handleGuestMode);
  document.getElementById('authLangSelector')?.addEventListener('change',e=>{S.lang=e.target.value;saveState();renderAuth(mode);});
}

async function handleLogin(e){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPwd').value;
  if(!email||!password){showAlert('authAlert',t('required'));return;}
  hideAlert('authAlert');setLoading(btn,true);
  const {ok,data}=await apiFetch(API.login,{method:'POST',body:JSON.stringify({email,password})});
  setLoading(btn,false);
  if(ok){currentUser=data.user;isGuest=false;loadState();toast(t('loginSuccess'),'success');renderShell();}
  else showAlert('authAlert',data.message||'Login failed.');
}

async function handleRegister(e){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const name=document.getElementById('regName').value.trim();
  const username=document.getElementById('regUser').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const password=document.getElementById('regPwd').value;
  const acceptTerms=!!document.getElementById('regAcceptTerms')?.checked;
  const acceptPrivacy=acceptTerms;
  if(!name||!username||!email||!password){showAlert('authAlert',t('required'));return;}
  if(!acceptTerms){showAlert('authAlert','Потрібно погодитись з Правилами платформи та Політикою приватності.');return;}
  hideAlert('authAlert');setLoading(btn,true);
  const {ok,data}=await apiFetch(API.register,{method:'POST',body:JSON.stringify({name,username,email,password,accept_terms:acceptTerms,accept_privacy:acceptPrivacy})});
  setLoading(btn,false);
  if(ok){isGuest=false;toast(t('registerSuccess'),'success');renderVerification(data.user_id,email);}
  else showAlert('authAlert',data.message||'Register failed.');
}

async function doLogout(){
  await apiFetch(API.logout,{method:'POST'});
  currentUser=null;toast(t('logoutSuccess'),'info');renderAuth();
}

function handleGuestMode(){
  isGuest=true;
  currentUser=null;
  loadState();
  toast(t('guestWelcome'),'info');
  renderShell();
}

/* ── 14. EMAIL VERIFICATION ─────────────────────────────────── */
function renderVerification(userId, email){
  // Generate random math puzzle
  const num1 = Math.floor(Math.random() * 50) + 1;
  const num2 = Math.floor(Math.random() * 50) + 1;
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let correctAnswer;
  
  if(op === '+') correctAnswer = num1 + num2;
  else if(op === '-') correctAnswer = num1 - num2;
  else correctAnswer = num1 * num2;
  
  document.getElementById('app').innerHTML=`
    <div class="auth-landing">
      <div class="bg-orbs" aria-hidden="true"></div>
      <div class="bg-grid" aria-hidden="true"></div>
      ${renderAnimatedBrandLayer('auth')}
      
      <div class="auth-container">
        <div class="auth-hero">
          <div class="auth-hero-content">
            <div class="auth-logo-large">LOL<em>ance</em></div>
            <h1 class="auth-title">${t('verifyEmail')}</h1>
            <p class="auth-subtitle">${t('codeSentTo')} ${email}</p>
            
            <div style="margin-top:20px;padding:20px;background:rgba(184,255,92,.08);border:2px solid rgba(184,255,92,.4);border-radius:12px;text-align:center;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${t('solveCaptcha')}</div>
              
              <div style="font-size:32px;font-weight:900;margin:15px 0;font-family:monospace;color:#b8ff5c;">
                ${num1} <span style="color:rgba(184,255,92,.6);">${op}</span> ${num2} = <span style="color:rgba(184,255,92,.5);">?</span>
              </div>
              
              <div style="display:flex;gap:8px;margin:12px 0;">
                <input type="number" id="captchaAnswer" class="form-input" placeholder="${t('enterAnswer')}" style="flex:1;text-align:center;font-size:18px;font-weight:900;">
                <button type="button" id="solveCaptchaBtn" class="btn btn-primary btn-sm" style="min-width:100px;">
                  ${t('verifyCaptcha')}
                </button>
              </div>
              <div id="captchaError" class="alert alert-error" style="margin-top:8px;display:none;"></div>
            </div>

            <div id="codeSection" style="margin-top:20px;padding:15px;background:rgba(184,255,92,.1);border:1px solid rgba(184,255,92,.3);border-radius:8px;text-align:center;display:none;">
              <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">📧 ${t('verificationCode')}</div>
              <div style="font-size:13px;color:var(--text-soft);">Код надіслано на email. Перевір папки Inbox / Spam та введи 6-значний код нижче.</div>
            </div>
          </div>
        </div>

        <div class="auth-card" id="verifyCard" style="display:none;">
          <div id="verifyAlert" class="alert" style="margin-bottom:16px;"></div>
          
          <form id="verifyForm" class="auth-form" novalidate>
            <div class="form-group">
              <label class="form-label">${t('enterCodeScreen')}</label>
              <input type="text" id="verifyCode" class="form-input" placeholder="000000" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="off" required>
              <small style="color:#888;margin-top:8px;display:block;">${t('sixDigits')}</small>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:16px;">
              <span class="btn-txt">${t('confirmBtn')}</span>
            </button>
          </form>

          <div class="auth-footer" style="margin-top:24px;text-align:center;">
            <button type="button" id="backToAuth" class="link-btn">${t('backToLogin')}</button>
          </div>
        </div>
      </div>
    </div>`;

  // Store data
  window.__verifyUserId = userId;
  window.__verifyEmail = email;
  window.__correctAnswer = correctAnswer;

  // Captcha solver
  const solveCaptchaBtn = document.getElementById('solveCaptchaBtn');
  const captchaInput = document.getElementById('captchaAnswer');
  const captchaError = document.getElementById('captchaError');
  
  solveCaptchaBtn?.addEventListener('click', () => {
    const userAnswer = parseInt(captchaInput.value);
    if(userAnswer === correctAnswer){
      captchaError.style.display = 'none';
      document.querySelector('.auth-hero').style.display = 'none';
      document.getElementById('verifyCard').style.display = 'block';
      document.getElementById('codeSection').style.display = 'block';
      document.getElementById('verifyCode').focus();
    } else {
      captchaError.textContent = '❌ ' + t('wrongAnswer');
      captchaError.style.display = 'block';
      captchaInput.value = '';
      captchaInput.focus();
    }
  });

  captchaInput?.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') solveCaptchaBtn.click();
  });
  document.getElementById('verifyForm')?.addEventListener('submit', (e) => handleVerify(e, userId));
  document.getElementById('backToAuth')?.addEventListener('click', () => renderAuth('login'));
  
  // Auto-focus
  captchaInput?.focus();
  
  // Format code input
  const codeInput = document.getElementById('verifyCode');
  codeInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

async function handleVerify(e, userId){
  e.preventDefault();
  const btn=e.target.querySelector('[type=submit]');
  const code=document.getElementById('verifyCode').value.trim();
  
  if(!code || code.length !== 6 || !/^\d{6}$/.test(code)){
    showAlert('verifyAlert', t('invalidCode'));
    return;
  }
  
  setLoading(btn, true);
  const {ok, data} = await apiFetch(API.verify, {
    method:'POST', 
    body:JSON.stringify({user_id: userId, code: code})
  });
  setLoading(btn, false);
  
  if(ok){
    currentUser = data.user;
    isGuest = false;
    loadState();
    toast(t('verifySuccess'), 'success');
    renderShell();
  } else {
    showAlert('verifyAlert', data.message || t('wrongCode'));
  }
}

/* ── 15. DASHBOARD ───────────────────────────────────────────── */
function renderDashboard(el){
  const myScore=calcScore({earnings:S.earnings,completedTasks:S.completedTasks,streak:S.streak,level:S.level,xp:S.xp});
  const xpPct=Math.min(100,Math.round((S.xp%1000)/10));
  const trending=S.tasks.filter(t=>t.status==='open').slice(0,3);
  const mini=[];
  el.innerHTML=`
    <div class="fade-up">
      <!-- Hero welcome -->
      <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">⚡ ${t('welcomeBack')}, ${isGuest?t('guest'):esc(currentUser.name||currentUser.username)}</div>
            <h1 style="font-size:clamp(18px,3vw,24px);font-weight:900;margin-bottom:4px;">${isGuest?t('welcomeGuestTitle'):t('dashMotivation')}</h1>
            <p style="font-size:14px;color:var(--text-soft);">${isGuest?t('welcomeGuestDesc'):t('dashMotivationDesc')}</p>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div class="streak-badge"><span class="streak-fire">🔥</span>${S.streak} day streak</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">Level ${S.level} · ${S.xp} XP</div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card"><div class="stat-glow stat-glow-green"></div><div class="stat-label">${t('balance')}</div><div class="stat-value" style="color:var(--primary)">${S.balance.toLocaleString()} <span style="font-size:12px;">coins</span></div><div class="stat-sub">${t('available')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-blue"></div><div class="stat-label">${t('earnings')}</div><div class="stat-value">${S.earnings.toLocaleString()} <span style="font-size:12px;">coins</span></div><div class="stat-sub">${t('totalEarned')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-purple"></div><div class="stat-label">${t('completed')}</div><div class="stat-value">${S.completedTasks}</div><div class="stat-sub">${t('tasksDone')}</div></div>
        <div class="stat-card"><div class="stat-glow stat-glow-orange"></div><div class="stat-label">${t('level')} / ${t('score')}</div><div class="stat-value">${S.level}</div><div class="stat-sub">${myScore.toLocaleString()} ${t('pts')}</div></div>
      </div>

      <!-- XP bar -->
      <div class="card card-sm" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span style="font-size:13px;font-weight:700;">${t('xpProgress')}</span>
          <span style="font-size:12px;color:var(--muted);">${S.xp%1000}/1000 XP → Lvl ${S.level+1}</span>
        </div>
        <div class="xp-bar-wrap"><div class="xp-bar" style="width:${xpPct}%"></div></div>
      </div>

      <div class="two-col" style="margin-bottom:20px;">
        <!-- Quick actions -->
        <div class="card">
          <div class="section-title">⚡ ${t('quickActions')}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn btn-primary w-full" onclick="navigate('tasks')">${t('browseOpenTasks')}</button>
            <button class="btn btn-ghost w-full" onclick="navigate('createTask')">${t('publishNewTask')}</button>
            <button class="btn btn-info w-full" onclick="navigate('wallet')">${t('walletOverview')}</button>
          </div>
        </div>

        <!-- Achievements -->
        <div class="card">
          <div class="section-title">🏅 ${t('achievements')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px;">
            ${S.achievements.map(a=>`<span class="achievement">🎖 ${esc(a)}</span>`).join('')}
            ${S.completedTasks>=5&&!S.achievements.includes('Lvl Climb')?'<span class="achievement">🚀 Lvl Climb</span>':''}
          </div>
        </div>
      </div>

      <div class="two-col">
        <!-- Trending tasks -->
        <div>
          <div class="section-title">📋 ${t('trendingTasks')} <span class="count">${trending.length}</span></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${trending.map(task=>`
              <div class="card card-sm" style="cursor:pointer;" onclick="navigate('tasks')">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
                  <div>
                    <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${esc(task.title)}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      <span class="badge badge-${task.difficulty}">${t(task.difficulty)}</span>
                      <span class="chip" style="cursor:default;font-size:11px;padding:2px 8px;">${esc(task.category)}</span>
                    </div>
                  </div>
                  <div style="font-size:17px;font-weight:900;color:var(--primary);white-space:nowrap;">${task.reward} 🪙</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Mini leaderboard -->
        <div>
          <div class="section-title">🏆 ${t('miniLeaderboard')}</div>
          <div class="card" style="padding:0;">
            ${mini.map((u,i)=>`
              <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:${i<mini.length-1?'1px solid var(--line)':'none'};">
                <div style="font-size:13px;font-weight:800;color:var(--muted);width:16px;">${i+1}</div>
                <div class="user-av" style="width:32px;height:32px;font-size:12px;">${u.av}</div>
                <div style="flex:1"><div style="font-size:13px;font-weight:700;">${esc(u.name)}</div><div style="font-size:11px;color:var(--muted);">${u.score.toLocaleString()} pts</div></div>
                ${i===0?'<span style="font-size:18px;">👑</span>':i===1?'<span style="color:var(--primary);font-size:12px;font-weight:700;">🥈</span>':'<span style="color:var(--info);font-size:12px;font-weight:700;">🥉</span>'}
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  
  // Event handlers for quick action buttons
  el.querySelectorAll('button[onclick*="navigate"]').forEach(btn => {
    const page = btn.getAttribute('onclick').match(/'([^']+)'/)?.[1];
    if(page) {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', () => navigate(page));
    }
  });
  
  // Event handlers for task cards in trending section
  el.querySelectorAll('.card-sm[onclick*="navigate"]').forEach(card => {
    const page = card.getAttribute('onclick').match(/'([^']+)'/)?.[1];
    if(page) {
      card.removeAttribute('onclick');
      card.addEventListener('click', () => navigate(page));
    }
  });
}

/* ── 16. TASKS ───────────────────────────────────────────────── */
function renderTasks(el){
  let filterStatus='all', filterCat='all', searchQ='';
  function filtered(){
    return S.tasks.filter(t=>{
      if(filterStatus!=='all'&&t.status!==filterStatus)return false;
      if(filterCat!=='all'&&t.category!==filterCat)return false;
      if(searchQ&&!t.title.toLowerCase().includes(searchQ.toLowerCase()))return false;
      return true;
    });
  }
  function renderGrid(){
    const list=filtered();
    const grid=document.getElementById('tasksGrid');
    if(!grid)return;
    if(!list.length){grid.innerHTML=`<div class="empty" style="grid-column:1/-1;"><div class="empty-icon">📭</div><h3>${t('noTasksFound')}</h3><p>${t('adjustFilters')}</p></div>`;return;}
    grid.innerHTML=list.map(task=>{
      const participantsList=task.participants||[];
      const isOwner=!isGuest&&currentUser&&(
        task.owner===currentUser.name||
        task.owner===currentUser.username||
        Number(task.creator_id||0)===Number(currentUser.id||0)
      );
      const slotsTotal=Number(task.slots||1);
      const takenSlots=(task.taken_slots!==undefined&&task.taken_slots!==null)
        ?Number(task.taken_slots)
        :Math.max(0,slotsTotal-Number(task.slotsLeft??slotsTotal));
      const slotsLeft=(task.slotsLeft!==undefined&&task.slotsLeft!==null)
        ?Number(task.slotsLeft)
        :Math.max(0,slotsTotal-takenSlots);
      const myAssignmentStatus=task.my_assignment_status||null;
      const canTake=!isGuest&&task.status!=='completed'&&task.status!=='cancelled'&&slotsLeft>0&&currentUser&&!isOwner&&!myAssignmentStatus&&!participantsList.includes(currentUser.username);
      const canSubmit=!isGuest&&currentUser&&(myAssignmentStatus==='taken'||participantsList.includes(currentUser.username)&&task.status==='in_progress');
      const canApprove=!isGuest&&isOwner&&Number(task.pending_submissions||0)>0;
      return `<div class="task-card" data-tid="${task.id}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge badge-${task.status}">${task.status==='open'?t('open'):task.status==='in_progress'?t('inProgress'):task.status==='completed'?t('completed'):t('cancelled')}</span>
            <span class="badge badge-${task.difficulty}">${t(task.difficulty)}</span>
          </div>
          <div class="task-reward">${task.reward}<span>coins</span></div>
        </div>
        <div class="task-title">${esc(task.title)}</div>
        <div class="task-desc">${esc(task.description)}</div>
        <div class="task-meta">
          <span class="chip" style="cursor:default;font-size:11px;">${esc(task.category)}</span>
          <span class="text-xs text-muted">👤 ${slotsLeft}/${slotsTotal} slots</span>
          <span class="text-xs text-muted">📅 ${fmtDate(task.deadline)}</span>
        </div>
        ${task.status==='in_progress'?`<div class="progress-wrap"><div class="progress-bar" style="width:${task.progress}%"></div></div>`:``}
        <div class="task-footer">
          <span class="text-xs text-muted">${t('byUser')} ${esc(task.owner)}</span>
          <div style="display:flex;gap:7px;">
            ${canTake?`<button class="btn btn-primary btn-xs take-btn" data-tid="${task.id}">${t('takeTask')}</button>`:''}
            ${canSubmit?`<button class="btn btn-success btn-xs complete-btn" data-tid="${task.id}">${t('completeTask')}</button>`:''}
            ${canApprove?`<button class="btn btn-info btn-xs approve-btn" data-tid="${task.id}">${t('confirm')}</button>`:''}
          </div>
        </div>
      </div>`;
    }).join('');
    // Events
    grid.querySelectorAll('.take-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();takeTask(b.dataset.tid);}));
    grid.querySelectorAll('.complete-btn').forEach(b=>b.addEventListener('click',async e=>{e.stopPropagation();await completeTask(b.dataset.tid,'submit');renderGrid();}));
    grid.querySelectorAll('.approve-btn').forEach(b=>b.addEventListener('click',async e=>{e.stopPropagation();await completeTask(b.dataset.tid,'approve');renderGrid();}));
  }

  el.innerHTML=`
    <div class="fade-up">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
        <h1 style="font-size:20px;font-weight:900;">${t('tasks')}</h1>
        <button class="btn btn-primary btn-sm" id="openCreateTaskBtn">+ ${t('createTask')}</button>
      </div>
      <!-- Search + filters -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="position:relative;flex:1;min-width:200px;">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;">🔍</span>
          <input type="text" id="taskSearch" class="form-input" style="padding-left:36px;" placeholder="${t('searchTasks')}">
        </div>
        <select id="taskStatusFilter" class="form-select form-input" style="width:auto;min-width:130px;">
          <option value="all">${t('all')}</option>
          <option value="open">${t('open')}</option>
          <option value="in_progress">${t('inProgress')}</option>
          <option value="completed">${t('completed')}</option>
        </select>
      </div>
      <div class="chips-row" id="catChips" style="margin-bottom:18px;">
        <button class="chip active" data-cat="all">${t('all')}</button>
        ${CATEGORIES.map(c=>`<button class="chip" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="tasks-grid" id="tasksGrid"></div>
    </div>`;

  renderGrid();
  document.getElementById('openCreateTaskBtn')?.addEventListener('click',()=>navigate('createTask'));
  document.getElementById('taskSearch')?.addEventListener('input',e=>{searchQ=e.target.value;renderGrid();});
  document.getElementById('taskStatusFilter')?.addEventListener('change',e=>{filterStatus=e.target.value;renderGrid();});
  document.getElementById('catChips')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-cat]');if(!btn)return;
    document.querySelectorAll('#catChips .chip').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');filterCat=btn.dataset.cat;renderGrid();
  });
}

async function takeTask(tid){
  if(isGuest){toast(t('guestRegTask'),'warning');return;}
  const task=S.tasks.find(t=>String(t.id)===String(tid));
  const serverTaskId=Number(tid);

  if(!Number.isInteger(serverTaskId) || serverTaskId<=0){
    toast('Invalid task ID','error');
    return;
  }

  const {ok,data}=await apiFetch(API.takeTask,{method:'POST',body:JSON.stringify({task_id:serverTaskId})});
  if(!ok){toast(data.message||'Error taking task','error');return;}
  addNotif(`${t('notifTaskTaken')} "${task?.title||'#'+tid}"!`,'success');
  toast(t('taskTaken'),'success');
  await loadTasks('open');
  await loadTasks('my');
  await loadTasks('taken');
  navigate('tasks');
}

async function completeTask(tid,action='submit'){
  const task=S.tasks.find(t=>String(t.id)===String(tid));
  const serverTaskId=Number(tid);

  if(!Number.isInteger(serverTaskId) || serverTaskId<=0){
    toast('Invalid task ID','error');
    return;
  }

  const {ok,data}=await apiFetch(API.completeTask,{method:'POST',body:JSON.stringify({task_id:serverTaskId,action})});
  if(!ok){toast(data.message||'Error','error');return;}
  if(action==='submit'){
    toast(t('taskCompleted'),'success');
  }else{
    addNotif(`Completed "${task?.title||('#'+tid)}" · +${Number(data.reward||0)} coins!`,'success');
    toast(data.message||t('confirm'),'success');
    await syncProfile();
    await loadWallet();
  }
  await loadTasks('open');
  await loadTasks('my');
  await loadTasks('taken');
  navigate('tasks');
}

/* ── 17. CREATE TASK ─────────────────────────────────────────── */
function renderCreateTask(el){
  el.innerHTML=`
    <div class="fade-up" style="max-width:900px;">
      <h1 style="font-size:20px;font-weight:900;margin-bottom:20px;">${t('createTask')}</h1>
      <div class="two-col">
        <div class="card">
          <div id="ctAlert" class="alert" style="margin-bottom:14px;"></div>
          <form id="createTaskForm" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group"><label class="form-label">${t('titleLabel')} *</label><input type="text" id="ctTitle" class="form-input" placeholder="${t('titlePlaceholder')}" maxlength="120" required></div>
            <div class="form-group"><label class="form-label">${t('description')} *</label><textarea id="ctDesc" class="form-textarea" rows="4" placeholder="${t('descPlaceholder')}" required></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('category')}</label>
                <select id="ctCat" class="form-select form-input"><option value="">${t('selectOption')}</option>${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></div>
              <div class="form-group"><label class="form-label">${t('difficulty')}</label>
                <select id="ctDiff" class="form-select form-input"><option value="easy">${t('easy')}</option><option value="medium" selected>${t('medium')}</option><option value="hard">${t('hard')}</option></select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">${t('reward')} (coins)</label><input type="number" id="ctReward" class="form-input" min="1" placeholder="100"></div>
              <div class="form-group"><label class="form-label">${t('slots')}</label><input type="number" id="ctSlots" class="form-input" min="1" max="20" value="2"></div>
            </div>
            <div class="form-group"><label class="form-label">${t('deadline')}</label><input type="date" id="ctDeadline" class="form-input"></div>
            <button type="submit" class="btn btn-primary btn-block"><span class="btn-txt">🚀 ${t('publish')}</span></button>
          </form>
        </div>
        <div>
          <div class="section-title">👁 ${t('preview')}</div>
          <div id="taskPreview" class="task-card" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;gap:8px;"><span class="badge badge-open">${t('open')}</span><span class="badge badge-medium">${t('medium')}</span></div>
            <div class="task-title" id="pvTitle" style="color:var(--muted);">${t('previewTitlePh')}</div>
            <div class="task-desc" id="pvDesc" style="color:var(--muted-2);">${t('previewDescPh')}</div>
            <div class="task-meta"><span class="chip" id="pvCat" style="cursor:default;font-size:11px;">${t('category')}</span><span class="text-xs text-muted" id="pvSlots">2 ${t('slots')}</span></div>
            <div class="task-footer"><span class="text-xs text-muted" id="pvDeadline">${t('noDeadline')}</span><div class="task-reward" id="pvReward">0<span>coins</span></div></div>
          </div>
        </div>
      </div>
    </div>`;

  // Live preview
  const update=()=>{
    document.getElementById('pvTitle').textContent=document.getElementById('ctTitle').value||t('previewTitlePh');
    document.getElementById('pvDesc').textContent=document.getElementById('ctDesc').value||t('previewDescPh');
    document.getElementById('pvCat').textContent=document.getElementById('ctCat').value||t('category');
    document.getElementById('pvSlots').textContent=(document.getElementById('ctSlots').value||'2')+' '+t('slots');
    document.getElementById('pvReward').innerHTML=`${document.getElementById('ctReward').value||0}<span>coins</span>`;
    const dl=document.getElementById('ctDeadline').value;
    document.getElementById('pvDeadline').textContent=dl?'📅 '+fmtDate(dl):t('noDeadline');
  };
  document.querySelectorAll('#createTaskForm input,#createTaskForm textarea,#createTaskForm select').forEach(i=>i.addEventListener('input',update));

  document.getElementById('createTaskForm').addEventListener('submit',async e=>{
    e.preventDefault();
    if(isGuest){toast(t('guestRegCreate'),'warning');return;}
    const title=document.getElementById('ctTitle').value.trim();
    const desc=document.getElementById('ctDesc').value.trim();
    const cat=document.getElementById('ctCat').value;
    const diff=document.getElementById('ctDiff').value;
    const reward=parseFloat(document.getElementById('ctReward').value)||0;
    const slots=parseInt(document.getElementById('ctSlots').value)||2;
    const deadline=document.getElementById('ctDeadline').value;
    if(!title||!desc||!cat){showAlert('ctAlert',t('required'));return;}
    hideAlert('ctAlert');

    if(reward<=0||slots<=0){showAlert('ctAlert',t('invalidAmount'));return;}
    const {ok,data}=await apiFetch(API.tasks,{method:'POST',body:JSON.stringify({title,description:desc,category:cat,difficulty:diff,reward,slots,deadline:deadline||null})});
    if(!ok||!data.task_id){showAlert('ctAlert',data.message||'Task creation failed');return;}

    const newTask={
      id:String(data.task_id),title,description:desc,category:cat,reward,difficulty:diff,
      slots,slotsLeft:slots,status:'open',progress:0,deadline:deadline||null,
      owner:currentUser.name||currentUser.username,participants:[],createdAt:new Date().toISOString(),
      creator_id:Number(currentUser.id||0),taken_slots:0,my_assignment_status:null,pending_submissions:0
    };

    S.tasks.unshift(newTask);
    saveState();
    addNotif(`${t('taskCreated')} "${title}"!`,'success');
    toast(t('taskCreated'),'success');
    loadTasks('my');
    navigate('tasks');
  });
}

/* ── 18. FEED ────────────────────────────────────────────────── */
function renderFeed(el){
  let filter='all';
  function filtered(){return filter==='all'?S.feed:S.feed.filter(p=>p.type===filter);}
  function renderCards(){
    const list=filtered();
    const c=document.getElementById('feedCards');
    if(!c)return;
    if(!list.length){c.innerHTML=`<div class="empty"><div class="empty-icon">📡</div><h3>${t('noPosts')}</h3></div>`;return;}
    c.innerHTML=list.map(p=>`
      <div class="feed-card">
        <div class="feed-header">
          <div class="feed-av">${esc(p.av||p.author.charAt(0))}</div>
          <div style="flex:1"><div class="feed-author">${esc(p.author)}</div><div class="feed-time">${fmtAgo(p.timestamp)}</div></div>
          <span class="badge badge-${p.type==='task'?'open':p.type==='wallet'?'in_progress':'completed'}">${p.type==='task'?t('tasks'):p.type==='achievement'?t('achievements'):t('wallet')}</span>
        </div>
        ${p.hasMedia?`<div class="feed-media" style="background:linear-gradient(135deg,rgba(184,255,92,.05),rgba(125,215,255,.04));display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">📷 ${t('mediaPreview')}</div>`:''}
        <div class="feed-text${p.expanded?'':''}" style="${!p.expanded&&p.text.length>160?'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;':''}">${esc(p.text)}</div>
        ${p.text.length>160?`<button class="action-btn" data-expand="${p.id}">${p.expanded?t('showLess'):t('readMore')}</button>`:''}
        <div class="feed-actions">
          <button class="action-btn${p.liked?' liked':''}" data-like="${p.id}">❤ ${p.likes}</button>
          <button class="action-btn${p.bookmarked?' bookmarked':''}" data-bm="${p.id}">🔖 ${p.bookmarked?t('saved'):t('save')}</button>
        </div>
      </div>`).join('');
    c.querySelectorAll('[data-like]').forEach(b=>b.addEventListener('click',()=>{
      const f=S.feed.find(x=>x.id===b.dataset.like);if(!f)return;
      f.liked=!f.liked;f.likes+=f.liked?1:-1;saveState();renderCards();
    }));
    c.querySelectorAll('[data-bm]').forEach(b=>b.addEventListener('click',()=>{
      const f=S.feed.find(x=>x.id===b.dataset.bm);if(!f)return;
      f.bookmarked=!f.bookmarked;saveState();renderCards();
    }));
    c.querySelectorAll('[data-expand]').forEach(b=>b.addEventListener('click',()=>{
      const f=S.feed.find(x=>x.id===b.dataset.expand);if(!f)return;
      f.expanded=!f.expanded;saveState();renderCards();
    }));
  }

  el.innerHTML=`
    <div class="fade-up" style="max-width:680px;">
      <div style="display:flex;gap:8px;margin-bottom:18px;" id="feedFilters">
        <button class="chip active" data-ft="all">${t('all')}</button>
        <button class="chip" data-ft="task">${t('tasks')}</button>
        <button class="chip" data-ft="achievement">${t('achievements')}</button>
        <button class="chip" data-ft="wallet">${t('wallet')}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;" id="feedCards"></div>
    </div>`;

  renderCards();
  document.getElementById('feedFilters')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-ft]');if(!btn)return;
    document.querySelectorAll('#feedFilters .chip').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');filter=btn.dataset.ft;renderCards();
  });
}

/* ── 19. WALLET ──────────────────────────────────────────────── */
function renderWallet(el){
  if(isGuest){
    el.innerHTML=`
      <div class="fade-up">
        <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);">
          <div class="empty">
            <div class="empty-icon">🎭</div>
            <h3>${t('guestMode')}</h3>
            <p>${t('guestWallet')}</p>
            <button class="btn btn-primary btn-sm" id="guestRegisterWallet">${t('register')}</button>
          </div>
        </div>
      </div>`;
    document.getElementById('guestRegisterWallet')?.addEventListener('click',()=>renderAuth('register'));
    return;
  }

  function renderTxList(){
    const tbody=document.getElementById('txBody');
    if(!tbody)return;
    tbody.innerHTML=(S.transactions||[]).map(tx=>{
      const amount=Number(tx.amount||0);
      const type=String(tx.type||'');
      const label=tx.label||tx.description||type;
      const ts=tx.ts||tx.created_at;
      const positive=['deposit','transfer_received','task_reward'].includes(type)||amount>0;
      return `
      <tr>
        <td><span class="badge badge-${positive?'open':'in_progress'}">${esc(type)}</span></td>
        <td style="font-size:13px;">${esc(label)}</td>
        <td style="font-weight:700;color:${positive?'var(--success)':'var(--danger)'};">${positive?'+':'-'}${Math.abs(amount).toLocaleString()} coins</td>
        <td style="font-size:12px;color:var(--muted);">${ts?fmtAgo(ts):'—'}</td>
      </tr>`;
    }).join('');
  }

  function renderCryptoHistory(){
    const wrap=document.getElementById('cryptoHistory');
    if(!wrap)return;
    const deposits=S.cryptoDeposits||[];
    wrap.innerHTML=deposits.length?deposits.map(dep=>`
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:14px;font-weight:700;">${Number(dep.amount_usdt||0).toLocaleString()} USDT → ${Number(dep.amount_coins||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(dep.network||'TRC20')} · ${dep.created_at?fmtDate(dep.created_at)+' '+fmtTime(dep.created_at):''}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;word-break:break-all;">${esc(dep.transaction_hash||dep.wallet_address||'')}</div>
        </div>
        <span class="badge badge-${dep.status==='confirmed'?'completed':dep.status==='pending'?'in_progress':'cancelled'}">${esc(dep.status||'pending')}</span>
      </div>
    `).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">Історія crypto-депозитів поки порожня.</div>`;
  }

  function renderCoinHistory(){
    const wrap=document.getElementById('coinHistory');
    if(!wrap)return;
    const items=S.coinHistory||[];
    wrap.innerHTML=items.length?items.map(item=>`
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:14px;font-weight:700;">-${Number(item.amount||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(item.description||item.type||'')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">${item.created_at?fmtDate(item.created_at)+' '+fmtTime(item.created_at):''}</div>
        </div>
        <span class="badge badge-info">${esc(item.type||'spend')}</span>
      </div>
    `).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">Витрат монет ще не було.</div>`;
  }

  function renderWithdrawHistory(){
    const wrap=document.getElementById('withdrawHistory');
    if(!wrap)return;
    const items=S.cryptoWithdrawals||[];
    wrap.innerHTML=items.length?items.map(w=>{
      const statusColors={pending:'in_progress',completed:'completed',rejected:'cancelled',cancelled:'cancelled'};
      const statusBadge=statusColors[w.status]||'in_progress';
      return `
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;">${Number(w.amount_coins||0).toLocaleString()} coins → ${Number(w.amount_native||0)} ${esc(w.currency||'USDT')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(w.network||'TRC20')} · ${t('withdrawFee')}: ${Number(w.fee_coins||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;word-break:break-all;">→ ${esc(w.wallet_address||'')}</div>
          ${w.transaction_hash?`<div style="font-size:11px;color:var(--success);margin-top:4px;">tx: ${esc(w.transaction_hash)}</div>`:''}
          ${w.admin_note?`<div style="font-size:11px;color:var(--warning);margin-top:4px;">📝 ${esc(w.admin_note)}</div>`:''}
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">${w.created_at?fmtDate(w.created_at)+' '+fmtTime(w.created_at):''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="badge badge-${statusBadge}">${esc(w.status||'pending')}</span>
          ${w.status==='pending'?`<button class="btn btn-ghost btn-xs cancelWithdrawBtn" data-wid="${w.id}" style="font-size:11px;color:var(--danger);">${t('withdrawCancel')}</button>`:''}
        </div>
      </div>`;
    }).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">${t('noWithdrawals')}</div>`;

    wrap.querySelectorAll('.cancelWithdrawBtn').forEach(btn=>{
      btn.addEventListener('click',async e=>{
        e.stopPropagation();
        const wid=btn.dataset.wid;
        setLoading(btn,true);
        try{
          const {ok,data}=await apiFetch(API.cryptoWithdraw,{method:'POST',body:JSON.stringify({action:'cancel',withdraw_id:Number(wid)})});
          if(!ok){toast(data.message||'Cancel failed','error');return;}
          toast(t('withdrawCancelled'),'success');
          await loadWallet();
          navigate('wallet');
        }finally{setLoading(btn,false);}
      });
    });
  }

  el.innerHTML=`
    <div class="fade-up">
      <!-- Hero balance -->
      <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-bottom:20px;">
        <div class="wallet-hero" style="margin-bottom:0;">
          <div class="wallet-balance-label">${t('balance')}</div>
          <div class="wallet-balance"><sup>🪙</sup>${Number(S.balance||0).toLocaleString()}</div>
          <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap;">
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('earnings')}</div><div style="font-size:18px;font-weight:800;color:var(--success);">${S.earnings.toLocaleString()} 🪙</div></div>
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('spent')}</div><div style="font-size:18px;font-weight:800;color:var(--danger);">${S.spent.toLocaleString()} 🪙</div></div>
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('pending')}</div><div style="font-size:18px;font-weight:800;color:var(--warning);">${S.pending.toLocaleString()} 🪙</div></div>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-primary btn-sm" id="buyCoinsBtn">₮ Buy with USDT</button>
            <button class="btn btn-success btn-sm" id="withdrawCoinsBtn">💸 ${t('withdrawCrypto')}</button>
            <button class="btn btn-outline btn-sm" id="refreshCoinsBtn">⟳ Refresh</button>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
          <div>
            <div class="wallet-balance-label">Game Coins</div>
            <div class="wallet-balance" style="font-size:36px;"><sup>🪙</sup>${Number(S.coinBalance||0).toLocaleString()}</div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;">
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Purchased</div><div style="font-size:16px;font-weight:800;color:var(--info);">${Number(S.coinsPurchased||0).toLocaleString()}</div></div>
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Spent</div><div style="font-size:16px;font-weight:800;color:var(--warning);">${Number(S.coinsSpent||0).toLocaleString()}</div></div>
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Pending</div><div style="font-size:16px;font-weight:800;color:var(--primary);">${Number(S.pendingCryptoCount||0).toLocaleString()} crypto</div></div>
            </div>
          </div>
          <div class="card-flat" style="padding:12px;font-size:13px;color:var(--muted);">Rate: <strong style="color:var(--primary);">1 USDT = 100 coins</strong></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div class="card" style="padding:0;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">USDT Deposits</div>
          <div id="cryptoHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
        </div>
        <div class="card" style="padding:0;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">Coin Spending</div>
          <div id="coinHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
        </div>
      </div>

      <!-- Withdrawal history -->
      <div class="card" style="padding:0;margin-bottom:20px;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">💸 ${t('withdrawHistory')}</div>
        <div id="withdrawHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
      </div>

      <!-- Tx history -->
      <div class="card" style="padding:0;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">${t('txHistory')}</div>
        <div class="table-wrap" style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--line);">${t('type')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('description')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('amountCol')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('whenCol')}</th>
            </tr></thead>
            <tbody id="txBody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  renderTxList();
  renderCryptoHistory();
  renderCoinHistory();
  renderWithdrawHistory();

  document.getElementById('buyCoinsBtn')?.addEventListener('click',()=>showWalletModal('crypto'));
  document.getElementById('withdrawCoinsBtn')?.addEventListener('click',()=>showWithdrawModal());
  document.getElementById('refreshCoinsBtn')?.addEventListener('click',async()=>{await loadWallet();navigate('wallet');});
}

function showWalletModal(type){
  const isCrypto=type==='crypto';
  if(!isCrypto){return;}
  const modBg=document.createElement('div');
  modBg.className='modal-backdrop';
  modBg.innerHTML=`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal-close" id="modalCloseBtn" aria-label="Close">✕</button>
      <div class="modal-title" id="modalTitle">Buy Coins with USDT</div>
      <div id="walletModalAlert" class="alert" style="margin-bottom:12px;"></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Network</label><select id="cryptoNetwork" class="form-select"><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option></select></div>
        <div class="form-group"><label class="form-label">${t('amountCol')} (USDT)</label><input type="number" id="wAmount" class="form-input" min="1" placeholder="100"></div>
        <div class="card-flat" style="padding:12px;font-size:13px;color:var(--muted);">Rate: <strong style="color:var(--primary);">1 USDT = 100 coins</strong></div><div id="cryptoStep2"></div>
        <button class="btn btn-primary btn-block" id="wConfirmBtn"><span class="btn-txt">${t('confirm')}</span></button>
      </div>
    </div>`;
  document.getElementById('modalRoot').appendChild(modBg);
  modBg.setAttribute('aria-hidden','false');

  const close=()=>{modBg.remove();};
  modBg.addEventListener('click',e=>{if(e.target===modBg)close();});
  document.getElementById('modalCloseBtn')?.addEventListener('click',close);
  document.getElementById('wConfirmBtn')?.addEventListener('click',async()=>{
    const btn=document.getElementById('wConfirmBtn');
    const amount=parseFloat(document.getElementById('wAmount').value)||0;
    if(amount<=0){showAlert('walletModalAlert',t('invalidAmount'));return;}

    hideAlert('walletModalAlert');
    setLoading(btn,true);
    try{
      const network=document.getElementById('cryptoNetwork')?.value||'TRC20';
      const {ok,data}=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'initiate',amount_usdt:amount,network})});
      if(!ok){showAlert('walletModalAlert',data.message||'Failed to create deposit');return;}

      const step2=document.getElementById('cryptoStep2');
      if(step2){
        step2.innerHTML=`
          <div class="card-flat" style="padding:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:12px;color:var(--muted);">Send exactly <strong style="color:var(--text);">${Number(data.amount_usdt||amount).toLocaleString()} USDT</strong> via <strong style="color:var(--text);">${esc(data.network||network)}</strong></div>
            <div style="font-size:12px;color:var(--muted);">Wallet address</div>
            <div style="word-break:break-all;font-size:13px;font-weight:700;color:var(--primary);">${esc(data.wallet_address||'')}</div>
            <div style="font-size:12px;color:var(--muted);">You will receive <strong style="color:var(--success);">${Number(data.amount_coins||amount*100).toLocaleString()} coins</strong></div>
            <div style="font-size:12px;color:var(--muted);">Expires: ${data.expires_at?fmtDate(data.expires_at)+' '+fmtTime(data.expires_at):'—'}</div>
            <div class="form-group" style="margin-top:8px;"><label class="form-label">Transaction hash</label><input type="text" id="cryptoTxHash" class="form-input" placeholder="Paste blockchain tx hash"></div>
            <button class="btn btn-success btn-block" id="cryptoFinalConfirm">I paid, confirm deposit</button>
          </div>`;

        document.getElementById('cryptoFinalConfirm')?.addEventListener('click',async()=>{
          const txHash=document.getElementById('cryptoTxHash')?.value?.trim();
          if(!txHash){showAlert('walletModalAlert','Встав tx hash транзакції.');return;}
          const finalBtn=document.getElementById('cryptoFinalConfirm');
          setLoading(finalBtn,true);
          try{
            const confirmRes=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'confirm',deposit_id:data.deposit_id,tx_hash:txHash})});
            if(!confirmRes.ok){showAlert('walletModalAlert',confirmRes.data.message||'Confirmation failed');return;}
            await loadWallet();
            toast(confirmRes.data.message||'Coins credited','success');
            close();
            navigate('wallet');
          }finally{
            setLoading(finalBtn,false);
          }
        });
      }
      toast(data.message||'Deposit created','info');
    }finally{
      setLoading(btn,false);
    }
  });
}

function showWithdrawModal(){
  const balance=Number(S.coinBalance||0);
  const modBg=document.createElement('div');
  modBg.className='modal-backdrop';
  modBg.innerHTML=`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="wdModalTitle">
      <button class="modal-close" id="wdModalCloseBtn" aria-label="Close">✕</button>
      <div class="modal-title" id="wdModalTitle">💸 ${t('withdrawTitle')}</div>
      <div id="wdModalAlert" class="alert" style="margin-bottom:12px;"></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card-flat" style="padding:12px;font-size:13px;">
          ${t('balance')}: <strong style="color:var(--primary);">${balance.toLocaleString()} coins</strong>
          <span style="margin-left:12px;color:var(--muted);">${t('withdrawMin')}</span>
        </div>
        <div class="form-group"><label class="form-label">${t('withdrawCoins')}</label><input type="number" id="wdAmount" class="form-input" min="500" max="${balance}" placeholder="500"></div>
        <div class="form-group"><label class="form-label">${t('withdrawNetwork')}</label><select id="wdNetwork" class="form-select"><option value="TRC20">TRC20 (USDT)</option><option value="BEP20">BEP20 (USDT)</option><option value="ERC20">ERC20 (ETH)</option><option value="BTC">BTC</option><option value="SOL">SOL</option></select></div>
        <div class="form-group"><label class="form-label">${t('withdrawWallet')}</label><input type="text" id="wdWalletAddr" class="form-input" placeholder="T..., 0x..., bc1..., ..."></div>
        <div id="wdPreview" class="card-flat" style="padding:12px;font-size:13px;display:none;">
          <div>${t('withdrawFee')}: <strong id="wdFeeDisplay">0</strong> coins</div>
          <div style="margin-top:4px;">${t('withdrawNet')}: <strong id="wdNetDisplay" style="color:var(--success);">0</strong></div>
        </div>
        <button class="btn btn-success btn-block" id="wdConfirmBtn"><span class="btn-txt">${t('withdrawConfirm')}</span></button>
      </div>
    </div>`;
  document.getElementById('modalRoot').appendChild(modBg);
  modBg.setAttribute('aria-hidden','false');

  const close=()=>{modBg.remove();};
  modBg.addEventListener('click',e=>{if(e.target===modBg)close();});
  document.getElementById('wdModalCloseBtn')?.addEventListener('click',close);

  const amountInput=document.getElementById('wdAmount');
  const preview=document.getElementById('wdPreview');
  const feeDisp=document.getElementById('wdFeeDisplay');
  const netDisp=document.getElementById('wdNetDisplay');

  function updatePreview(){
    const amt=parseFloat(amountInput?.value)||0;
    if(amt>=500){
      const fee=Math.round(amt*5)/100;
      const net=amt-fee;
      if(feeDisp)feeDisp.textContent=fee.toLocaleString();
      if(netDisp)netDisp.textContent=net.toLocaleString();
      if(preview)preview.style.display='block';
    }else{
      if(preview)preview.style.display='none';
    }
  }
  amountInput?.addEventListener('input',updatePreview);

  document.getElementById('wdConfirmBtn')?.addEventListener('click',async()=>{
    const btn=document.getElementById('wdConfirmBtn');
    const amount=parseFloat(document.getElementById('wdAmount')?.value)||0;
    const network=document.getElementById('wdNetwork')?.value||'TRC20';
    const walletAddr=(document.getElementById('wdWalletAddr')?.value||'').trim();

    if(amount<500){showAlert('wdModalAlert',t('withdrawMin'));return;}
    if(amount>balance){showAlert('wdModalAlert',t('insufficient'));return;}
    if(walletAddr.length<10){showAlert('wdModalAlert',t('withdrawWallet')+' (min 10 chars)');return;}

    hideAlert('wdModalAlert');
    setLoading(btn,true);
    try{
      const {ok,data}=await apiFetch(API.cryptoWithdraw,{method:'POST',body:JSON.stringify({action:'initiate',amount_coins:amount,network,wallet_address:walletAddr})});
      if(!ok){showAlert('wdModalAlert',data.message||'Withdrawal failed');return;}
      toast(t('withdrawSuccess'),'success');
      await loadWallet();
      close();
      navigate('wallet');
    }finally{
      setLoading(btn,false);
    }
  });
}

/* ── 20. CHAT ────────────────────────────────────────────────── */
function getAutoReply(msg){
  const rules=[
    {re:/wallet|balance|funds/i,keys:['chatReplyWallet1','chatReplyWallet2']},
    {re:/task|deadline|slots/i,keys:['chatReplyTask1','chatReplyTask2']},
    {re:/reward|earn|pay/i,keys:['chatReplyReward1','chatReplyReward2']},
    {re:/level|xp|streak/i,keys:['chatReplyLevel1','chatReplyLevel2']},
  ];
  for(const r of rules){if(r.re.test(msg)){return t(r.keys[Math.floor(Math.random()*r.keys.length)]);}}
  const fk=['chatFallback1','chatFallback2','chatFallback3'];
  return t(fk[Math.floor(Math.random()*fk.length)]);
}
function renderChat(el){
  if(isGuest){
    el.innerHTML=`
      <div class="fade-up">
        <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);">
          <div class="empty">
            <div class="empty-icon">🎭</div>
            <h3>${t('guestMode')}</h3>
            <p>${t('guestChat')}</p>
            <button class="btn btn-primary btn-sm" id="guestRegisterChat">${t('register')}</button>
          </div>
        </div>
      </div>`;
    document.getElementById('guestRegisterChat')?.addEventListener('click',()=>renderAuth('register'));
    return;
  }
  const rooms=(S.chatRooms||[]);
  const activeTier=Number(S.activeRoomTier||1);
  const activeRoom=rooms.find(r=>Number(r.tier)===activeTier) || rooms[0];
  const messages=(S.chatRoomMessages||[]);

  el.innerHTML=`
    <div class="fade-up">
      <div class="card" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div class="section-title" style="margin-bottom:4px;">💬 ${t('chatRooms')}</div>
          <div style="font-size:13px;color:var(--muted);">XP / LVL: <b>${Number(S.xp||0).toLocaleString()} XP · Lv ${Number(S.level||1)}</b></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input id="buyPointsPacks" type="number" min="1" max="100" value="1" class="form-input" style="width:90px;">
          <button id="buyPointsBtn" class="btn btn-ghost btn-sm">${t('buyPoints')}</button>
        </div>
      </div>

      <div class="chat-wrap">
        <div class="chat-threads">
          <div class="chat-threads-head">${t('chatRooms')}</div>
          <div class="thread-list">
            ${rooms.map(room=>{
              const locked=!room.has_access;
              return `<button class="thread-btn ${Number(room.tier)===Number(activeTier)?'active':''}" data-room-tier="${room.tier}">
                <div class="user-av" style="width:34px;height:34px;font-size:13px;">${room.emoji}</div>
                <div style="flex:1;min-width:0;text-align:left;">
                  <div class="thread-name">${esc(room.name)}</div>
                  <div class="thread-prev">${locked?`${t('lockRoom')} · Lv ${Number(room.min_level||1)}+`:`${Number(room.online||0)} ${t('roomOnline')}`}</div>
                </div>
              </button>`;
            }).join('')}
          </div>
        </div>

        <div class="chat-main">
          ${activeRoom?`
            <div class="chat-header">
              <div class="user-av" style="width:34px;height:34px;font-size:13px;">${activeRoom.emoji}</div>
              <div>
                <div style="font-size:14px;font-weight:700;">${esc(activeRoom.name)}</div>
                <div style="font-size:12px;color:var(--muted);">${activeRoom.is_global?t('globalRoomDesc'):`${Number(activeRoom.online||0)} ${t('roomOnline')}`}</div>
              </div>
            </div>

            ${activeRoom.has_access?`
              <div class="chat-messages" id="chatMessages">
                ${messages.length?messages.map(m=>`
                  <div class="msg ${Number(m.user_id)===Number(currentUser.id)?'self':''}">
                    ${Number(m.user_id)===Number(currentUser.id)?'':`<div class="msg-av">${esc((m.username||'?').charAt(0).toUpperCase())}</div>`}
                    <div>
                      ${Number(m.user_id)===Number(currentUser.id)?'':`<div style="font-size:11px;color:var(--muted);margin-bottom:2px;">@${esc(m.username||'user')}</div>`}
                      <div class="msg-bubble">${esc(m.message||'')}</div>
                      <div class="msg-time">${fmtTime(m.created_at)}</div>
                    </div>
                  </div>`).join(''):`<div class="empty" style="padding:24px;"><p>${t('noMsgsYet')}</p></div>`}
              </div>
              <div class="chat-composer">
                <textarea class="chat-input" id="roomMessageInput" placeholder="${t('typeMessage')}" rows="1"></textarea>
                <button class="btn btn-primary btn-sm" id="roomSendBtn">${t('sendMessage')}</button>
              </div>
            `:`
              <div class="card-flat" style="padding:14px;margin:12px;">
                <div style="font-weight:800;margin-bottom:6px;">🔒 ${t('lockRoom')}</div>
                <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">Lv ${Number(activeRoom.min_level||1)}+</div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <button class="btn btn-primary btn-sm" data-buy-pass="${activeRoom.tier}">${t('unlockRoom')} ${Number(activeRoom.pass_coins||0)} ${t('passCost')}</button>
                </div>
              </div>
            `}
          `:``}
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="font-size:13px;color:var(--muted);margin-bottom:8px;">🌐 ${t('globalRoomDesc')}</div>
        <div class="chat-composer">
          <textarea class="chat-input" id="globalMessageInput" placeholder="${t('typeMessage')}" rows="1"></textarea>
          <button class="btn btn-success btn-sm" id="globalSendBtn">${t('sendMessage')}</button>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('[data-room-tier]').forEach(b=>b.addEventListener('click',async()=>{
    const tier=Number(b.dataset.roomTier||1);
    await loadChatRooms(tier);
    navigate('chat');
  }));

  document.querySelectorAll('[data-buy-pass]').forEach(b=>b.addEventListener('click',()=>buyRoomPass(Number(b.dataset.buyPass||0))));
  document.getElementById('buyPointsBtn')?.addEventListener('click',buyPointsPack);

  document.getElementById('roomSendBtn')?.addEventListener('click',sendRoomMessage);
  document.getElementById('roomMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendRoomMessage();}});
  document.getElementById('globalSendBtn')?.addEventListener('click',sendGlobalMessage);
  document.getElementById('globalMessageInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendGlobalMessage();}});

  const msgs=document.getElementById('chatMessages');
  if(msgs)msgs.scrollTop=msgs.scrollHeight;
}

/* ── 21. SUPPORT ─────────────────────────────────────────────── */
function renderSupport(el){
  el.innerHTML=`
    <div class="fade-up" style="max-width:740px;">
      <!-- FAQ -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">❓ ${t('faq')}</div>
        <div id="faqList">
          ${seedFaqs.map((f,i)=>`
            <div class="faq-item" data-fi="${i}">
              <button class="faq-q">${esc(f.q)}<span class="arrow">▾</span></button>
              <div class="faq-a">${esc(f.a)}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Create ticket -->
      ${isGuest?`
      <div class="card" style="margin-bottom:20px;">
        <div style="padding:16px;background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border:1px solid rgba(184,255,92,.15);border-radius:var(--r-lg);text-align:center;">
          <div style="font-size:32px;margin-bottom:12px;">🎭</div>
          <h3 style="margin-bottom:8px;">${t('guestMode')}</h3>
          <p style="font-size:14px;color:var(--text-soft);margin-bottom:14px;">${t('guestSupport')}</p>
          <button class="btn btn-primary btn-sm" id="guestRegisterSupport">${t('register')}</button>
        </div>
      </div>
      `:`
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">🎫 ${t('createTicket')}</div>
        <div id="tkAlert" class="alert" style="margin-bottom:12px;"></div>
        <form id="ticketForm" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">${t('subject')} *</label><input type="text" id="tkSubject" class="form-input" placeholder="${t('subjectPlaceholder')}" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">${t('issueType')}</label>
              <select id="tkType" class="form-select form-input"><option>${t('billing')}</option><option>${t('technical')}</option><option>${t('accountType')}</option><option>${t('generalType')}</option></select></div>
            <div class="form-group"><label class="form-label">${t('priorityLabel')}</label>
              <select id="tkPriority" class="form-select form-input"><option>${t('normalPriority')}</option><option>${t('highPriority')}</option><option>${t('criticalPriority')}</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">${t('detailsLabel')}</label><textarea id="tkDetails" class="form-textarea" rows="3" placeholder="${t('detailsPlaceholder')}"></textarea></div>
          <button type="submit" class="btn btn-primary" style="align-self:flex-start;"><span class="btn-txt">${t('submitTicket')}</span></button>
        </form>
      </div>
      `}

      <!-- Ticket history -->
      <div class="card" style="padding:0;">
        <div style="padding:14px 18px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">${t('tickets')} <span class="count" style="background:rgba(255,255,255,.07);padding:2px 7px;border-radius:99px;font-size:12px;font-weight:600;color:var(--muted);">${S.tickets.length}</span></div>
        ${S.tickets.length?`<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--line);">${t('subject')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('type')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('statusCol')}</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('createdCol')}</th>
          </tr></thead>
          <tbody>${S.tickets.map(tk=>`<tr>
            <td style="padding:12px 16px;">${esc(tk.subject)}</td>
            <td style="padding:12px 16px;"><span class="badge badge-info">${esc(tk.type)}</span></td>
            <td style="padding:12px 16px;"><span class="badge badge-${tk.status==='open'?'open':'completed'}">${tk.status}</span></td>
            <td style="padding:12px 16px;color:var(--muted);">${fmtAgo(tk.ts)}</td>
          </tr>`).join('')}</tbody>
        </table>`:`<div class="empty"><h3>${t('noTicketsYet')}</h3><p>${t('createTicketHelp')}</p></div>`}
      </div>
    </div>`;

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q')?.addEventListener('click',()=>{
      const wasOpen=item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));
      if(!wasOpen)item.classList.add('open');
    });
  });

  document.getElementById('guestRegisterSupport')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('ticketForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=e.target.querySelector('[type=submit]');
    const subj=document.getElementById('tkSubject').value.trim();
    const type=document.getElementById('tkType').value;
    const priority=document.getElementById('tkPriority').value;
    const details=document.getElementById('tkDetails').value.trim();
    if(!subj){showAlert('tkAlert',t('required'));return;}
    hideAlert('tkAlert');
    const categoryMap={
      [t('billing')]:'billing',
      [t('technical')]:'technical',
      [t('accountType')]:'account',
      [t('generalType')]:'general'
    };
    const priorityMap={
      [t('normalPriority')]:'normal',
      [t('highPriority')]:'high',
      [t('criticalPriority')]:'critical'
    };
    setLoading(btn,true);
    const {ok,data}=await apiFetch(API.support,{method:'POST',body:JSON.stringify({
      subject:subj,
      category:categoryMap[type]||'general',
      priority:priorityMap[priority]||'normal',
      description:details||subj
    })});
    setLoading(btn,false);
    if(!ok){showAlert('tkAlert',data.message||'Ticket creation failed.');return;}
    await loadSupport();
    e.target.reset();
    toast(t('ticketDone'),'success');
    navigate('support');
  });
}

/* ── 22. PROFILE ─────────────────────────────────────────────── */
function renderProfile(el){
  const myScore=calcScore({earnings:S.earnings,completedTasks:S.completedTasks,streak:S.streak,level:S.level,xp:S.xp});
  const xpPct=Math.min(100,Math.round((S.xp%1000)/10));
  const todayStr=new Date().toISOString().slice(0,10);
  const checkinSet=new Set((S.checkins||[]).map(ci=>ci.checkin_date));
  const last30=Array.from({length:30},(_,idx)=>{
    const d=new Date();
    d.setDate(d.getDate()-(29-idx));
    const iso=d.toISOString().slice(0,10);
    return {iso,done:checkinSet.has(iso),today:iso===todayStr};
  });

  const pointsCard=isGuest?'':`
    <div class="card card-sm" style="margin-bottom:16px;">
      <div class="section-title">⭐ ${t('earnPoints')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div class="card-flat" style="padding:10px;"><div class="stat-label">XP</div><div style="font-size:20px;font-weight:900;">${Number(S.xp||0).toLocaleString()} XP</div></div>
        <div class="card-flat" style="padding:10px;"><div class="stat-label">${t('checkinStreak')}</div><div style="font-size:20px;font-weight:900;">${Number(S.checkinStreak||0)} 🔥</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <button id="dailyCheckinBtn" class="btn btn-${S.doneCheckinToday?'ghost':'success'} btn-sm" ${S.doneCheckinToday?'disabled':''}>${S.doneCheckinToday?t('checkinDone'):'Check-in (+10 XP)'}</button>
        <input id="buyPointsPacks" type="number" min="1" max="100" value="1" class="form-input" style="width:90px;">
        <button id="buyPointsBtn" class="btn btn-ghost btn-sm">${t('buyPoints')}</button>
      </div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;">
        <div>• ${t('earnTaskEasy')}</div>
        <div>• ${t('earnTaskMedium')}</div>
        <div>• ${t('earnTaskHard')}</div>
        <div>• ${t('earnCheckin')}</div>
        <div>• ${t('earnVisit')}</div>
        <div>• ${t('earnBuyLabel')}</div>
      </div>
    </div>`;

  const calendarHtml=isGuest?'':`
    <div class="card" style="margin-top:20px;">
      <div class="section-title">📅 ${t('pointsCalendar')}</div>
      <div style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;">
        ${last30.map(day=>`<div title="${day.iso}" style="border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;text-align:center;font-size:12px;${day.done?'background:rgba(184,255,92,.15);border-color:rgba(184,255,92,.45);':''}${day.today?'box-shadow:0 0 0 1px rgba(125,215,255,.55) inset;':''}"><div style="font-size:11px;color:var(--muted);">${day.iso.slice(8)}</div><div>${day.done?'✅':'•'}</div></div>`).join('')}
      </div>
    </div>`;

  const rightCol=isGuest
    ? `<div class="card"><div class="section-title">👉 ${t('readyToStartQ')}</div><p style="font-size:14px;color:var(--text-soft);margin-bottom:14px;">${t('readyToStartDesc')}</p><button class="btn btn-primary btn-block" id="guestCreateBtn"><span class="btn-txt">${t('register')}</span></button></div>`
    : `<div class="card"><div class="section-title">✏️ ${t('editProfileTitle')}</div><form id="profileForm" style="display:flex;flex-direction:column;gap:14px;"><div class="form-group"><label class="form-label">${t('roleTitle')}</label><input type="text" id="pfRole" class="form-input" value="${esc(S.role||'')}" placeholder="${t('rolePlaceholder')}" maxlength="60"></div><div class="form-group"><label class="form-label">${t('bioLabel')}</label><textarea id="pfBio" class="form-textarea" rows="3" maxlength="500" placeholder="${t('bioPlaceholder')}">${esc(S.bio||'')}</textarea></div><div class="form-group"><label class="form-label">${t('skillsLabel')}</label><input type="text" id="pfSkills" class="form-input" value="${esc(S.skills||'')}" placeholder="${t('skillsPlaceholder')}"></div><button type="submit" class="btn btn-primary btn-block"><span class="btn-txt">${t('saveProfile')}</span></button></form></div>`;

  const exchanger=isGuest?'':`<div class="card" style="margin-top:20px;"><div class="section-title">₮ Обмінник: USDT → 🪙</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;"><div class="card-flat" style="padding:10px;"><div class="stat-label">Coins</div><div style="font-weight:800;">${Number(S.coinBalance||0).toLocaleString()}</div></div><div class="card-flat" style="padding:10px;"><div class="stat-label">Rate</div><div style="font-weight:800;">1 USDT = 100 🪙</div></div><div class="card-flat" style="padding:10px;"><div class="stat-label">Pending</div><div style="font-weight:800;">${Number(S.pendingCryptoCount||0)}</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><input id="exchAmount" class="form-input" type="number" min="1" max="10000" placeholder="USDT amount"><select id="exchNetwork" class="form-select"><option value="TRC20">TRC20</option><option value="BEP20">BEP20</option></select></div><div id="exchangeAlert" class="alert" style="margin-top:10px;"></div><button id="exchInitBtn" class="btn btn-primary btn-block" style="margin-top:10px;"><span class="btn-txt">Отримати адресу</span></button><div id="exchangeStep2" style="margin-top:10px;"></div></div>`;

  el.innerHTML=`
    <div class="fade-up" style="max-width:800px;">
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <div class="user-av lg" style="border:2px solid rgba(184,255,92,.3);">${isGuest?'🎭':(currentUser.name||'?').charAt(0).toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-size:20px;font-weight:900;">${isGuest?t('guestAccount'):esc(currentUser.name||currentUser.username)}</div>
            <div style="font-size:14px;color:var(--muted);">${isGuest?t('browseWithout'):'@'+esc(currentUser.username)+' · '+esc(S.role||t('defaultRole'))}</div>
            ${!isGuest&&S.bio?`<div style="font-size:14px;color:var(--text-soft);margin-top:6px;">${esc(S.bio)}</div>`:''}
          </div>
          <div style="text-align:right">
            <div class="streak-badge"><span class="streak-fire">🔥</span>${S.streak} ${t('dayStreak')}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px;">Lvl ${S.level} · ${myScore.toLocaleString()} ${t('pts')}</div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:12px;color:var(--muted);">
            <span>${t('xpProgress')}</span><span>${S.xp%1000}/1000 XP</span>
          </div>
          <div class="xp-bar-wrap"><div class="xp-bar" style="width:${xpPct}%"></div></div>
        </div>
      </div>

      <div class="two-col">
        <div>
          <div class="stats-grid" style="margin-bottom:16px;">
            <div class="stat-card"><div class="stat-glow stat-glow-green"></div><div class="stat-label">${t('earnings')}</div><div class="stat-value" style="font-size:22px;">${S.earnings.toLocaleString()} 🪙</div></div>
            <div class="stat-card"><div class="stat-glow stat-glow-blue"></div><div class="stat-label">${t('completed')}</div><div class="stat-value" style="font-size:22px;">${S.completedTasks}</div></div>
          </div>
          ${pointsCard}
          <div class="card card-sm">
            <div class="section-title">⚙️ ${t('settings')}</div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;">${t('languageLabel')}</span><select id="profileLangBtn" class="btn btn-ghost btn-xs" style="padding:5px 8px;font-size:12px;border-radius:var(--r-sm);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);cursor:pointer;"><option value="UA" ${S.lang==='UA'?'selected':''}>🇺🇦 UA</option><option value="EN" ${S.lang==='EN'?'selected':''}>🇬🇧 EN</option><option value="DE" ${S.lang==='DE'?'selected':''}>🇩🇪 DE</option><option value="FR" ${S.lang==='FR'?'selected':''}>🇫🇷 FR</option><option value="ES" ${S.lang==='ES'?'selected':''}>🇪🇸 ES</option><option value="PL" ${S.lang==='PL'?'selected':''}>🇵🇱 PL</option></select></div>
              <div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;">${t('animationsLabel')}</span><button class="btn btn-${S.animationsOn?'success':'ghost'} btn-xs" id="animToggleBtn">${S.animationsOn?t('animOn'):t('animOff')}</button></div>
            </div>
          </div>
        </div>
        ${rightCol}
      </div>

      ${calendarHtml}
      ${exchanger}
    </div>`;

  document.getElementById('profileForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const role=document.getElementById('pfRole').value.trim();
    const bio=document.getElementById('pfBio').value.trim();
    const skills=document.getElementById('pfSkills').value.trim();
    const {ok,data}=await apiFetch(API.profile,{method:'POST',body:JSON.stringify({role,bio,skills})});
    if(!ok){toast(data.message||'Profile save failed','error');return;}
    S.role=role;
    S.bio=bio;
    S.skills=skills;
    if(data.user){currentUser={...currentUser,...data.user};}
    saveState();
    toast(t('profileSaved'),'success');
  });
  document.getElementById('guestCreateBtn')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('profileLangBtn')?.addEventListener('change',e=>{S.lang=e.target.value;saveState();renderShell();navigate('profile');});
  document.getElementById('animToggleBtn')?.addEventListener('click',()=>{S.animationsOn=!S.animationsOn;document.body.classList.toggle('animations-off',!S.animationsOn);saveState();navigate('profile');});
  document.getElementById('dailyCheckinBtn')?.addEventListener('click',dailyCheckin);
  document.getElementById('buyPointsBtn')?.addEventListener('click',buyPointsPack);

  document.getElementById('exchInitBtn')?.addEventListener('click',async()=>{
    const amount=parseFloat(document.getElementById('exchAmount')?.value)||0;
    const network=document.getElementById('exchNetwork')?.value||'TRC20';
    const alertEl=document.getElementById('exchangeAlert');
    if(amount<1||amount>10000){if(alertEl){alertEl.className='alert alert-error show';alertEl.textContent='Сума: від 1 до 10000 USDT';}return;}
    const {ok,data}=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'initiate',amount_usdt:amount,network})});
    if(!ok){if(alertEl){alertEl.className='alert alert-error show';alertEl.textContent=data.message||'Помилка';}return;}
    const step2=document.getElementById('exchangeStep2');
    if(step2){
      step2.innerHTML=`<div class="card-flat" style="padding:10px;"><div style="font-size:12px;color:var(--muted);">Надішли ${Number(data.amount_usdt||amount)} USDT (${esc(data.network||network)}) на адресу:</div><div style="font-size:13px;font-weight:700;color:var(--primary);word-break:break-all;margin:6px 0;">${esc(data.wallet_address||'')}</div><input id="exchTxHash" class="form-input" placeholder="tx hash" style="margin-top:8px;"><button id="exchConfirmBtn" class="btn btn-success btn-block" style="margin-top:8px;">Підтвердити</button></div>`;
      document.getElementById('exchConfirmBtn')?.addEventListener('click',async()=>{
        const txHash=document.getElementById('exchTxHash')?.value?.trim();
        if(!txHash)return;
        const res=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'confirm',deposit_id:data.deposit_id,tx_hash:txHash})});
        if(!res.ok){toast(res.data.message||'Помилка підтвердження','error');return;}
        await loadWallet();
        toast(res.data.message||'Депозит підтверджено','success');
        navigate('profile');
      });
    }
  });
}

/* ── 23. LEADERBOARD ─────────────────────────────────────────── */
function renderLeaderboard(el){
  const board=(S.leaderboard||[]).map((u,idx)=>({
    id:Number(u.id||0),
    name:u.name||u.username||'User',
    username:u.username||'user',
    av:(u.name||u.username||'?').charAt(0).toUpperCase(),
    earnings:Number(u.earnings||0),
    completed:Number(u.completed_tasks||0),
    level:Number(u.level||1),
    xp:Number(u.xp||0),
    streak:Number(u.streak||0),
    score:Number(u.score||0),
    rank:Number(u.position||idx+1),
    achievements:[]
  }));
  const myScore=calcScore({earnings:S.earnings,completedTasks:S.completedTasks,streak:S.streak,level:S.level,xp:S.xp});
  const meId=Number(currentUser?.id||0);
  const top3=board.slice(0,3);
  const medalOrder=[1,0,2]; // 2nd, 1st, 3rd
  const medals=['🥈','👑','🥉'];

  el.innerHTML=`
    <div class="fade-up">
      <!-- Podium -->
      <div class="card" style="margin-bottom:20px;">
        <div class="section-title">🏆 ${t('leaderboard')}</div>
        <div class="podium">
          ${medalOrder.map((idx,pos)=>{
            const u=top3[idx];if(!u)return '';
            const rank=idx+1;
            return `<div class="podium-item">
              <div class="podium-av rank-${rank}" style="position:relative;">
                ${rank===1?`<span class="podium-crown">👑</span>`:''}
                ${u.av}
              </div>
              <div class="podium-bar rank-${rank}" style="display:flex;align-items:center;justify-content:center;">
                <span style="font-size:18px;">${medals[pos]}</span>
              </div>
              <div class="podium-name">${esc(u.name)}</div>
              <div class="podium-score">${u.score.toLocaleString()} pts</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Full table -->
      <div class="card" style="padding:0;">
        <div style="overflow-x:auto;">
          <table class="rank-table">
            <thead><tr>
              <th>#</th><th>User</th><th>${t('score')}</th>
              <th>${t('earnings')}</th><th>${t('completed')}</th>
              <th>${t('streak')}</th><th>${t('badges')}</th>
            </tr></thead>
            <tbody>
              ${board.map((u,i)=>`
                <tr class="${Number(u.id)===meId?'me':''}">
                  <td style="font-weight:800;${i<3?'color:var(--warning);':''}">${u.rank||i+1}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="user-av" style="width:30px;height:30px;font-size:11px;">${u.av}</div>
                      <div>
                        <div style="font-size:13px;font-weight:700;">${esc(u.name)}${Number(u.id)===meId?' <span style="font-size:11px;color:var(--primary);">('+t('you')+')</span>':''}</div>
                        <div style="font-size:11px;color:var(--muted);">@${esc(u.username)}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:800;">${u.score.toLocaleString()}</td>
                  <td style="color:var(--success);">${(u.earnings||0).toLocaleString()} 🪙</td>
                  <td>${u.completed||0}</td>
                  <td><span class="streak-badge" style="font-size:12px;"><span style="font-size:14px;">🔥</span>${u.streak||0}</span></td>
                  <td><div style="display:flex;gap:4px;flex-wrap:wrap;">${(u.achievements||[]).slice(0,2).map(a=>`<span style="font-size:10px;background:rgba(255,200,108,.1);border:1px solid rgba(255,200,108,.2);padding:2px 6px;border-radius:99px;color:var(--warning);">${esc(a)}</span>`).join('')}</div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Your position -->
      <div class="card" style="margin-top:16px;background:var(--primary-dim);border-color:rgba(184,255,92,.2);">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div><div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.06em;">${t('yourPosition')}</div>
            <div style="font-size:26px;font-weight:900;">#${Number(S.userPosition||0)||'—'}</div></div>
          <div class="divider" style="width:1px;height:40px;margin:0;"></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('score')}</div><div style="font-size:18px;font-weight:800;">${myScore.toLocaleString()}</div></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('level')}</div><div style="font-size:18px;font-weight:800;">${S.level}</div></div>
          <div><div style="font-size:11px;color:var(--muted);">${t('streak')}</div><div style="font-size:18px;font-weight:800;">🔥 ${S.streak}</div></div>
        </div>
      </div>
    </div>`;
}

/* ── 23.5 LANDING PAGE ──────────────────────────────────────── */
function renderLanding(){
  document.getElementById('app').innerHTML=`
    <div class="landing-page">
      <!-- Animated background -->
      <div class="landing-bg" aria-hidden="true">
        <div class="landing-orb landing-orb-1"></div>
        <div class="landing-orb landing-orb-2"></div>
        <div class="landing-orb landing-orb-3"></div>
        <div class="landing-grid"></div>
      </div>
      ${renderAnimatedBrandLayer('landing')}

      <!-- Content -->
      <div class="landing-container">
        <!-- Header -->
        <div class="landing-header">
          <div class="landing-logo">
            <img src="assets/lolance-logo.svg" alt="LOLance logo" class="landing-logo-image">
            <div>LOL<em>ance</em></div>
          </div>
          <select id="landingLangSelector" class="landing-lang-select" aria-label="Language">
            <option value="UA" ${S.lang==='UA'?'selected':''}>🇺🇦 UA</option>
            <option value="EN" ${S.lang==='EN'?'selected':''}>🇬🇧 EN</option>
            <option value="DE" ${S.lang==='DE'?'selected':''}>🇩🇪 DE</option>
            <option value="PL" ${S.lang==='PL'?'selected':''}>🇵🇱 PL</option>
          </select>
        </div>

        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="title-word">${t('earnTitle')}</span>
              <span class="title-word">${t('landingMicroTasks')}</span>
            </h1>
            <p class="hero-subtitle">
              ${t('landingSubtitle')}
            </p>
            
            <!-- CTAs -->
            <div class="hero-ctas">
              <button id="goLogin" class="btn btn-primary btn-lg" style="gap:8px;">
                <span>🚀</span>
                <span>${t('getStarted')}</span>
              </button>
              <button id="goRegister" class="btn btn-outline btn-lg" style="gap:8px;">
                <span>✨</span>
                <span>${t('signUpBtn')}</span>
              </button>
            </div>

            <div class="hero-stats">
              <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">12.5K+</div>
                <div class="stat-label">${t('usersStat')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">2.3M USDT</div>
                <div class="stat-label">${t('paidStat')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">4.9</div>
                <div class="stat-label">${t('ratingStat')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">98K+</div>
                <div class="stat-label">${t('tasksStat')}</div>
              </div>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="hero-visual">
            <div class="floating-card card-1">
              <div class="card-header">📋</div>
              <div class="card-text">${t('managementCard')}</div>
            </div>
            <div class="floating-card card-2">
              <div class="card-header">💎</div>
              <div class="card-text">${t('rewardsCard')}</div>
            </div>
            <div class="floating-card card-3">
              <div class="card-header">📈</div>
              <div class="card-text">${t('growthCard')}</div>
            </div>
            <div class="floating-card card-4">
              <div class="card-header">🎯</div>
              <div class="card-text">${t('goalsCard')}</div>
            </div>
            <div class="floating-card card-5">
              <div class="card-header">🏆</div>
              <div class="card-text">${t('rankingCard')}</div>
            </div>
            <div class="main-visual">
              <span style="font-size:120px;animation:float 6s ease-in-out infinite;">💼</span>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
          <h2 class="section-title">${t('whyLolance')}</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⚡</div>
              <h3>${t('quickEarnings')}</h3>
              <p>${t('quickEarningsDesc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎓</div>
              <h3>${t('skillGrowth')}</h3>
              <p>${t('skillGrowthDesc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌍</div>
              <h3>${t('globalCommunity')}</h3>
              <p>${t('globalCommunityDesc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>${t('securePayments')}</h3>
              <p>${t('securePaymentsDesc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>${t('transparentRating')}</h3>
              <p>${t('transparentRatingDesc')}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3>${t('personalizedTasks')}</h3>
              <p>${t('personalizedTasksDesc')}</p>
            </div>
          </div>
        </div>

        <!-- How It Works -->
        <div class="how-section">
          <h2 class="section-title">${t('howItWorks')}</h2>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-icon">📝</div>
              <h3>${t('signUpStep')}</h3>
              <p>${t('signUpStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-icon">📋</div>
              <h3>${t('browseStep')}</h3>
              <p>${t('browseStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon">⚙️</div>
              <h3>${t('executeStep')}</h3>
              <p>${t('executeStepDesc')}</p>
            </div>
            <div class="step-connector">→</div>
            <div class="step-card">
              <div class="step-number">4</div>
              <div class="step-icon">💰</div>
              <h3>${t('getPaidStep')}</h3>
              <p>${t('getPaidStepDesc')}</p>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="landing-cta-section">
          <h2>${t('readyToEarn')}</h2>
          <p>${t('joinFreelancers')}</p>
          <div class="landing-cta-buttons">
            <button id="ctaRegister" class="btn btn-primary btn-lg">
              ${t('signUpNow')} →
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="landing-footer">
          <div class="footer-links">
            <a href="#" class="footer-link">${t('aboutLink')}</a>
            <a href="#" class="footer-link">${t('contactLink')}</a>
            <a href="#" class="footer-link">${t('privacyLink')}</a>
            <a href="#" class="footer-link">${t('termsLink')}</a>
          </div>
          <div class="footer-text">© 2024 LOLance. ${t('allRights')}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('goLogin')?.addEventListener('click',()=>renderAuth('login'));
  document.getElementById('goRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('ctaRegister')?.addEventListener('click',()=>renderAuth('register'));
  document.getElementById('landingLangSelector')?.addEventListener('change',e=>{S.lang=e.target.value;saveState();renderLanding();});
}

/* ── 24. INIT ─────────────────────────────────────────────────── */
async function init(){
  loadState();

  // Check PHP session
  try{
    const {ok,data}=await apiFetch(API.session);
    if(ok&&data.user){
      currentUser=data.user;
      isGuest=data.user.is_guest||false;
    }
  }catch(e){ /* no PHP available, render auth */ }

  if(currentUser){renderShell();}
  else{renderLanding();}

  if(currentUser && !isGuest){
    await loadPoints();
    await apiFetch(API.xp,{method:'POST',body:JSON.stringify({action:'daily_visit'})});
    await loadPoints();
  }

  initScroll();
}

init();

})();
