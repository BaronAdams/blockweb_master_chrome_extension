import { useStateContext } from '@/context/GlobalStateContext'
import { useTranslation } from 'react-i18next'
import { getT } from '@/lib/i18n'
import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import felixAvatar from '@/assets/avatars/felix.svg'
import anekaAvatar from '@/assets/avatars/aneka.svg'
import bobAvatar from '@/assets/avatars/bob.svg'
import jackAvatar from '@/assets/avatars/jack.svg'
import mollyAvatar from '@/assets/avatars/molly.svg'
import sarahAvatar from '@/assets/avatars/sarah.svg'

// twh (translator without hook)
// twhc (common translator without hook)
const twhc = getT("common")


/* =========================================================
   GÉNÉRATION DE PHRASE DE CONFIRMATION
   Paragraphes motivationnels complets (50+ mots) dans 14 langues.
   L'utilisateur doit recopier le paragraphe entier à la main.
   Pas de \n — le textarea wrappera naturellement le texte.
   Un code 8 chiffres est ajouté à la fin pour l'unicité.
========================================================= */

const CONFIRM_PARAGRAPHS: Record<string, string[]> = {
    en: [
        "Every minute you spend scrolling through content that adds nothing to your life is a minute you will never get back. The screens that surround you are not your enemies, but the habits you have built around them might be. True freedom comes from choosing where your attention goes, not from letting algorithms decide for you. Take control today because tomorrow you will wish you had started sooner.",
        "The most productive people in the world do not have more hours in their day than you do. They simply protect their time with fierce intentionality. Every notification you ignore is a small victory. Every blocked website is a boundary you set for yourself. These tiny decisions compound over weeks and months into a completely different version of your life.",
        "Distraction is the silent thief of ambition. It does not announce itself loudly. It whispers just one more video, just five more minutes, just a quick check. Before you know it, hours have vanished and the work remains untouched. Recognizing this pattern is the first step. Building systems that prevent it is the second. You are taking that second step right now.",
        "Your future self will either thank you or blame you for the choices you make today. Every time you resist the pull of a distracting website, you are investing in the person you want to become. Discipline feels uncomfortable in the moment, but regret feels worse in the long run. Choose the discomfort that leads to growth, not the comfort that leads to stagnation.",
        "The internet was supposed to be the greatest tool for human productivity ever created. Instead, it has become the greatest source of distraction. But the tool itself is not the problem. The problem is using it without boundaries. By setting clear rules for yourself, you reclaim the original promise of technology, a tool that serves you, not one that controls you.",
    ],
    fr: [
        "Chaque minute que vous passez à faire défiler du contenu qui n'apporte rien à votre vie est une minute que vous ne récupérerez jamais. Les écrans qui vous entourent ne sont pas vos ennemis, mais les habitudes que vous avez construites autour d'eux pourraient l'être. La vraie liberté vient du choix de là où va votre attention, pas de laisser les algorithmes décider pour vous. Prenez le contrôle aujourd'hui.",
        "Les personnes les plus productives au monde n'ont pas plus d'heures dans leur journée que vous. Elles protègent simplement leur temps avec une intentionnalité féroce. Chaque notification que vous ignorez est une petite victoire. Chaque site bloqué est une limite que vous vous fixez. Ces petites décisions se cumulent au fil des semaines et des mois pour transformer complètement votre vie.",
        "La distraction est le voleur silencieux de l'ambition. Elle ne s'annonce pas bruyamment. Elle murmure juste une dernière vidéo, encore cinq minutes, juste un petit coup d'œil. Avant que vous ne vous en rendiez compte, des heures ont disparu et le travail reste intact. Reconnaître ce schéma est la première étape. Construire des systèmes qui l'empêchent est la deuxième.",
        "Votre futur vous-même vous remerciera ou vous reprochera les choix que vous faites aujourd'hui. Chaque fois que vous résistez à l'attrait d'un site distrayant, vous investissez dans la personne que vous voulez devenir. La discipline est inconfortable sur le moment, mais le regret est bien pire sur le long terme. Choisissez l'inconfort qui mène à la croissance.",
        "Internet était censé être le plus grand outil de productivité humaine jamais créé. Au lieu de cela, il est devenu la plus grande source de distraction. Mais l'outil lui-même n'est pas le problème. Le problème c'est de l'utiliser sans limites. En fixant des règles claires pour vous-même, vous retrouvez la promesse originale de la technologie, un outil qui vous sert et non un outil qui vous contrôle.",
    ],
    es: [
        "Cada minuto que pasas desplazándote por contenido que no aporta nada a tu vida es un minuto que nunca recuperarás. Las pantallas que te rodean no son tus enemigos, pero los hábitos que has construido alrededor de ellas podrían serlo. La verdadera libertad viene de elegir dónde va tu atención, no de dejar que los algoritmos decidan por ti. Toma el control hoy porque mañana desearás haber empezado antes.",
        "Las personas más productivas del mundo no tienen más horas en su día que tú. Simplemente protegen su tiempo con una intencionalidad feroz. Cada notificación que ignoras es una pequeña victoria. Cada sitio bloqueado es un límite que te pones a ti mismo. Estas pequeñas decisiones se acumulan a lo largo de semanas y meses en una versión completamente diferente de tu vida.",
        "La distracción es el ladrón silencioso de la ambición. No se anuncia ruidosamente. Susurra solo un video más, solo cinco minutos más, solo una revisión rápida. Antes de que te des cuenta, las horas han desaparecido y el trabajo permanece intacto. Reconocer este patrón es el primer paso. Construir sistemas que lo prevengan es el segundo paso que estás dando ahora.",
        "Tu yo futuro te agradecerá o te culpará por las decisiones que tomes hoy. Cada vez que resistes la atracción de un sitio web distractor, estás invirtiendo en la persona que quieres convertirte. La disciplina se siente incómoda en el momento, pero el arrepentimiento se siente peor a largo plazo. Elige la incomodidad que conduce al crecimiento.",
        "Internet debía ser la herramienta más grande para la productividad humana jamás creada. En cambio, se ha convertido en la mayor fuente de distracción. Pero la herramienta en sí no es el problema. El problema es usarla sin límites. Al establecer reglas claras para ti mismo, recuperas la promesa original de la tecnología, una herramienta que te sirve.",
    ],
    de: [
        "Jede Minute, die du damit verbringst durch Inhalte zu scrollen die deinem Leben nichts bringen, ist eine Minute die du niemals zurückbekommst. Die Bildschirme um dich herum sind nicht deine Feinde, aber die Gewohnheiten die du um sie herum aufgebaut hast könnten es sein. Wahre Freiheit kommt davon zu wählen wohin deine Aufmerksamkeit geht, nicht davon Algorithmen für dich entscheiden zu lassen.",
        "Die produktivsten Menschen der Welt haben nicht mehr Stunden am Tag als du. Sie schützen ihre Zeit einfach mit unerbittlicher Absicht. Jede Benachrichtigung die du ignorierst ist ein kleiner Sieg. Jede blockierte Website ist eine Grenze die du dir selbst setzt. Diese kleinen Entscheidungen summieren sich über Wochen und Monate zu einer völlig anderen Version deines Lebens.",
        "Ablenkung ist der stille Dieb des Ehrgeizes. Sie kündigt sich nicht laut an. Sie flüstert nur noch ein Video, nur noch fünf Minuten, nur ein kurzer Blick. Bevor du es merkst sind Stunden verschwunden und die Arbeit bleibt unangetastet. Dieses Muster zu erkennen ist der erste Schritt. Systeme zu bauen die es verhindern ist der zweite Schritt den du gerade machst.",
        "Dein zukünftiges Ich wird dir entweder danken oder dich für die Entscheidungen die du heute triffst verantwortlich machen. Jedes Mal wenn du dem Reiz einer ablenkenden Website widerstehst investierst du in die Person die du werden willst. Disziplin fühlt sich im Moment unangenehm an, aber Bedauern fühlt sich auf lange Sicht schlimmer an.",
        "Das Internet sollte das größte Werkzeug für menschliche Produktivität sein das jemals geschaffen wurde. Stattdessen ist es zur größten Quelle der Ablenkung geworden. Aber das Werkzeug selbst ist nicht das Problem. Das Problem ist es ohne Grenzen zu benutzen. Indem du klare Regeln für dich selbst aufstellst gewinnst du das ursprüngliche Versprechen der Technologie zurück.",
    ],
    it: [
        "Ogni minuto che passi a scorrere contenuti che non aggiungono nulla alla tua vita è un minuto che non recupererai mai. Gli schermi che ti circondano non sono i tuoi nemici, ma le abitudini che hai costruito attorno ad essi potrebbero esserlo. La vera libertà viene dalla scelta di dove va la tua attenzione, non dal lasciare che gli algoritmi decidano per te. Prendi il controllo oggi.",
        "Le persone più produttive al mondo non hanno più ore nella loro giornata di quante ne abbia tu. Semplicemente proteggono il loro tempo con feroce intenzionalità. Ogni notifica che ignori è una piccola vittoria. Ogni sito bloccato è un confine che ti poni. Queste piccole decisioni si accumulano nel corso di settimane e mesi in una versione completamente diversa della tua vita.",
        "La distrazione è il ladro silenzioso dell'ambizione. Non si annuncia rumorosamente. Sussurra solo un altro video, solo cinque minuti in più, solo un rapido controllo. Prima che tu te ne renda conto le ore sono svanite e il lavoro rimane intatto. Riconoscere questo schema è il primo passo. Costruire sistemi che lo prevengano è il secondo che stai facendo ora.",
        "Il tuo futuro te stesso ti ringrazierà o ti incolperà per le scelte che fai oggi. Ogni volta che resisti al richiamo di un sito distraente stai investendo nella persona che vuoi diventare. La disciplina è scomoda nel momento ma il rimpianto è peggiore nel lungo periodo. Scegli il disagio che porta alla crescita non il comfort che porta alla stagnazione.",
        "Internet doveva essere il più grande strumento per la produttività umana mai creato. Invece è diventato la più grande fonte di distrazione. Ma lo strumento in sé non è il problema. Il problema è usarlo senza limiti. Stabilendo regole chiare per te stesso recuperi la promessa originale della tecnologia, uno strumento che ti serve e non uno che ti controlla.",
    ],
    pt: [
        "Cada minuto que você gasta rolando conteúdo que não acrescenta nada à sua vida é um minuto que você nunca vai recuperar. As telas ao seu redor não são seus inimigos, mas os hábitos que você construiu ao redor delas podem ser. A verdadeira liberdade vem de escolher para onde vai sua atenção, não de deixar algoritmos decidirem por você. Assuma o controle hoje.",
        "As pessoas mais produtivas do mundo não têm mais horas no dia do que você. Elas simplesmente protegem seu tempo com intencionalidade feroz. Cada notificação que você ignora é uma pequena vitória. Cada site bloqueado é um limite que você estabelece para si mesmo. Essas pequenas decisões se acumulam ao longo de semanas e meses em uma versão completamente diferente da sua vida.",
        "A distração é o ladrão silencioso da ambição. Ela não se anuncia ruidosamente. Ela sussurra só mais um vídeo, só mais cinco minutos, só uma olhada rápida. Antes que você perceba horas desapareceram e o trabalho permanece intocado. Reconhecer esse padrão é o primeiro passo. Construir sistemas que o previnam é o segundo passo que você está dando agora.",
        "Seu eu futuro vai agradecer ou culpar você pelas escolhas que você faz hoje. Cada vez que você resiste ao apelo de um site distrator você está investindo na pessoa que quer se tornar. Disciplina é desconfortável no momento mas arrependimento é pior a longo prazo. Escolha o desconforto que leva ao crescimento.",
        "A internet deveria ser a maior ferramenta de produtividade humana já criada. Em vez disso tornou-se a maior fonte de distração. Mas a ferramenta em si não é o problema. O problema é usá-la sem limites. Ao definir regras claras para si mesmo você recupera a promessa original da tecnologia, uma ferramenta que te serve.",
    ],
    nl: [
        "Elke minuut die je besteedt aan het scrollen door inhoud die niets toevoegt aan je leven is een minuut die je nooit meer terugkrijgt. De schermen om je heen zijn niet je vijanden, maar de gewoontes die je eromheen hebt opgebouwd zouden dat wel kunnen zijn. Ware vrijheid komt van het kiezen waar je aandacht naartoe gaat, niet van het laten beslissen door algoritmes. Neem vandaag de controle.",
        "De meest productieve mensen ter wereld hebben niet meer uren op een dag dan jij. Ze beschermen hun tijd simpelweg met felle intentionaliteit. Elke melding die je negeert is een kleine overwinning. Elke geblokkeerde website is een grens die je voor jezelf stelt. Deze kleine beslissingen stapelen zich op over weken en maanden tot een compleet andere versie van je leven.",
        "Afleiding is de stille dief van ambitie. Het kondigt zich niet luid aan. Het fluistert nog één video, nog vijf minuten, even snel kijken. Voor je het weet zijn uren verdwenen en het werk blijft onaangeroerd. Dit patroon herkennen is de eerste stap. Systemen bouwen die het voorkomen is de tweede stap die je nu aan het zetten bent.",
        "Je toekomstige zelf zal je bedanken of de schuld geven voor de keuzes die je vandaag maakt. Elke keer dat je de verleiding van een afleidende website weerstaat investeer je in de persoon die je wilt worden. Discipline voelt oncomfortabel op het moment maar spijt voelt erger op de lange termijn. Kies het ongemak dat leidt tot groei.",
        "Het internet zou het grootste hulpmiddel voor menselijke productiviteit moeten zijn dat ooit is gecreëerd. In plaats daarvan is het de grootste bron van afleiding geworden. Maar het hulpmiddel zelf is niet het probleem. Het probleem is het gebruiken zonder grenzen. Door duidelijke regels voor jezelf te stellen win je de oorspronkelijke belofte van technologie terug.",
    ],
    pl: [
        "Każda minuta którą spędzasz przeglądając treści które nic nie wnoszą do twojego życia to minuta której nigdy nie odzyskasz. Ekrany wokół ciebie nie są twoimi wrogami ale nawyki które wokół nich zbudowałeś mogą nimi być. Prawdziwa wolność pochodzi z wyboru dokąd kierujesz swoją uwagę a nie z pozwalania algorytmom decydować za ciebie. Przejmij kontrolę dzisiaj.",
        "Najbardziej produktywni ludzie na świecie nie mają więcej godzin w ciągu dnia niż ty. Po prostu chronią swój czas z zaciekłą intencjonalnością. Każde powiadomienie które ignorujesz to małe zwycięstwo. Każda zablokowana strona to granica którą sobie stawiasz. Te małe decyzje kumulują się przez tygodnie i miesiące w zupełnie inną wersję twojego życia.",
        "Rozpraszanie to cichy złodziej ambicji. Nie ogłasza się głośno. Szepcze jeszcze jeden film, jeszcze pięć minut, tylko szybkie sprawdzenie. Zanim się zorientujesz godziny zniknęły a praca pozostaje nietknięta. Rozpoznanie tego wzorca to pierwszy krok. Budowanie systemów które temu zapobiegają to drugi krok który właśnie podejmujesz.",
        "Twoje przyszłe ja podziękuje ci lub obwini cię za wybory które podejmujesz dzisiaj. Za każdym razem gdy opierasz się pokusie rozpraszającej strony internetowej inwestujesz w osobę którą chcesz się stać. Dyscyplina jest niewygodna w danym momencie ale żal jest gorszy na dłuższą metę. Wybierz dyskomfort który prowadzi do wzrostu.",
        "Internet miał być największym narzędziem ludzkiej produktywności jakie kiedykolwiek stworzono. Zamiast tego stał się największym źródłem rozproszenia. Ale samo narzędzie nie jest problemem. Problemem jest używanie go bez granic. Ustalając jasne zasady dla siebie odzyskujesz pierwotną obietnicę technologii narzędzie które ci służy.",
    ],
    ru: [
        "Каждая минута которую вы тратите на прокрутку контента не добавляющего ничего в вашу жизнь это минута которую вы никогда не вернёте. Экраны вокруг вас не ваши враги но привычки которые вы построили вокруг них могут ими быть. Настоящая свобода приходит от выбора куда направить внимание а не от того чтобы позволять алгоритмам решать за вас. Возьмите контроль сегодня.",
        "Самые продуктивные люди в мире не имеют больше часов в сутках чем вы. Они просто защищают своё время с яростной осознанностью. Каждое уведомление которое вы игнорируете это маленькая победа. Каждый заблокированный сайт это граница которую вы устанавливаете для себя. Эти маленькие решения накапливаются неделями и месяцами превращаясь в совершенно другую версию вашей жизни.",
        "Отвлечение это тихий вор амбиций. Оно не объявляет о себе громко. Оно шепчет ещё одно видео, ещё пять минут, только быстро проверю. Прежде чем вы это осознаете часы исчезли а работа остаётся нетронутой. Осознание этого паттерна первый шаг. Построение систем предотвращающих его второй шаг который вы делаете прямо сейчас.",
        "Ваше будущее я либо поблагодарит вас либо обвинит за выбор который вы делаете сегодня. Каждый раз когда вы сопротивляетесь притяжению отвлекающего сайта вы инвестируете в человека которым хотите стать. Дисциплина неприятна в моменте но сожаление хуже в долгосрочной перспективе. Выберите дискомфорт ведущий к росту.",
        "Интернет должен был стать величайшим инструментом человеческой продуктивности когда-либо созданным. Вместо этого он стал величайшим источником отвлечения. Но сам инструмент не проблема. Проблема в использовании его без границ. Устанавливая чёткие правила для себя вы возвращаете изначальное обещание технологий инструмент который служит вам.",
    ],
    zh: [
        "你花在浏览那些对你的生活毫无贡献的内容上的每一分钟都是你永远无法找回的一分钟。围绕你的屏幕不是你的敌人但你围绕它们建立的习惯可能是。真正的自由来自于选择你的注意力去向何处而不是让算法替你决定。今天就掌控你的生活因为明天你会希望自己早就开始了。",
        "世界上最有效率的人并不比你一天多出更多小时。他们只是以坚定的意图保护自己的时间。你忽略的每一个通知都是一个小小的胜利。你屏蔽的每一个网站都是你为自己设定的界限。这些小决定在数周和数月中累积成你生活的完全不同的版本。",
        "分心是雄心的无声窃贼。它不会大声宣布自己的到来。它低语着再看一个视频就五分钟只是快速看一下。在你意识到之前几个小时已经消失而工作仍然原封不动。认识到这种模式是第一步。建立防止它的系统是你现在正在迈出的第二步。",
        "你未来的自己会感谢你或者责备你今天所做的选择。每次你抵制一个让人分心的网站的吸引力你都在投资你想成为的那个人。自律在当下感觉不舒服但后悔在长期来看感觉更糟。选择通向成长的不适而不是通向停滞的舒适。",
        "互联网本应是人类有史以来创造的最伟大的生产力工具。然而它却成了最大的分心来源。但工具本身不是问题。问题在于毫无节制地使用它。通过为自己制定明确的规则你就能重新获得技术的最初承诺一个为你服务的工具而不是控制你的工具。",
    ],
    ja: [
        "あなたの人生に何も加えないコンテンツをスクロールして過ごすすべての分は二度と取り戻せない分です。あなたを取り巻くスクリーンは敵ではありませんがその周りに築いた習慣は敵かもしれません。本当の自由はアルゴリズムに決めさせるのではなく注意をどこに向けるかを選ぶことから生まれます。明日始めればよかったと思う前に今日コントロールを取りましょう。",
        "世界で最も生産性の高い人々はあなたより一日の時間が多いわけではありません。彼らは激しい意図を持って自分の時間を守っているだけです。あなたが無視する通知はすべて小さな勝利です。ブロックしたウェブサイトはすべて自分自身に設定した境界です。これらの小さな決断は数週間数ヶ月かけて人生のまったく異なるバージョンへと積み重なっていきます。",
        "気が散ることは野心の静かな泥棒です。大きな声で自分を知らせません。もう一本だけ動画をあと五分だけちょっと確認するだけとささやきます。気づく前に何時間も消え去り仕事は手つかずのままです。このパターンを認識することが第一歩です。それを防ぐシステムを構築することがあなたが今踏み出している第二歩です。",
        "未来の自分はあなたが今日する選択に感謝するか非難するかのどちらかです。気を散らすウェブサイトの誘惑に抵抗するたびにあなたはなりたい人間に投資しています。規律はその瞬間は不快ですが後悔は長期的にはもっと悪いです。成長につながる不快さを選びましょう停滞につながる快適さではなく。",
        "インターネットはかつて作られた最も偉大な人間の生産性ツールであるべきでした。代わりに最大の気晴らしの源になりました。しかしツール自体は問題ではありません。問題は境界なしにそれを使うことです。自分自身に明確なルールを設定することであなたは技術の元の約束を取り戻します。あなたに仕えるツールであってあなたを支配するツールではないということを。",
    ],
    ko: [
        "당신의 삶에 아무것도 더하지 않는 콘텐츠를 스크롤하며 보내는 매 분은 영원히 돌려받을 수 없는 분입니다. 당신을 둘러싼 화면은 적이 아니지만 그 주변에 구축한 습관은 적일 수 있습니다. 진정한 자유는 알고리즘이 당신을 대신해 결정하게 하는 것이 아니라 주의를 어디에 둘지 선택하는 데서 옵니다. 내일 시작했으면 좋겠다고 후회하기 전에 오늘 통제권을 잡으세요.",
        "세계에서 가장 생산적인 사람들은 하루에 당신보다 더 많은 시간을 가지고 있지 않습니다. 그들은 단지 맹렬한 의도로 자신의 시간을 보호할 뿐입니다. 당신이 무시하는 모든 알림은 작은 승리입니다. 차단한 모든 웹사이트는 스스로에게 설정한 경계입니다. 이 작은 결정들은 몇 주와 몇 달에 걸쳐 당신 삶의 완전히 다른 버전으로 축적됩니다.",
        "산만함은 야망의 조용한 도둑입니다. 그것은 시끄럽게 자신을 알리지 않습니다. 영상 하나만 더 오분만 더 빠르게 확인만이라고 속삭입니다. 당신이 깨닫기 전에 몇 시간이 사라지고 일은 그대로 남아 있습니다. 이 패턴을 인식하는 것이 첫 번째 단계입니다. 그것을 방지하는 시스템을 구축하는 것이 당신이 지금 밟고 있는 두 번째 단계입니다.",
        "미래의 당신은 오늘 당신이 내리는 선택에 대해 감사하거나 비난할 것입니다. 산만한 웹사이트의 유혹에 저항할 때마다 당신은 되고 싶은 사람에게 투자하고 있는 것입니다. 규율은 그 순간에는 불편하지만 후회는 장기적으로 더 나쁩니다. 성장으로 이어지는 불편함을 선택하세요 정체로 이어지는 편안함이 아니라.",
        "인터넷은 인류가 만든 가장 위대한 생산성 도구여야 했습니다. 대신 가장 큰 산만함의 원천이 되었습니다. 하지만 도구 자체는 문제가 아닙니다. 문제는 경계 없이 사용하는 것입니다. 자신을 위한 명확한 규칙을 설정함으로써 당신은 기술의 원래 약속을 되찾습니다. 당신을 섬기는 도구이지 당신을 지배하는 도구가 아닌 것을.",
    ],
    ar: [
        "كل دقيقة تقضيها في تصفح محتوى لا يضيف شيئاً لحياتك هي دقيقة لن تستعيدها أبداً. الشاشات من حولك ليست أعداءك لكن العادات التي بنيتها حولها قد تكون كذلك. الحرية الحقيقية تأتي من اختيار أين يذهب انتباهك وليس من ترك الخوارزميات تقرر نيابة عنك. تحكم في حياتك اليوم لأنك غداً ستتمنى لو بدأت في وقت أبكر.",
        "أكثر الناس إنتاجية في العالم ليس لديهم ساعات أكثر في يومهم منك. إنهم ببساطة يحمون وقتهم بنية شرسة. كل إشعار تتجاهله هو انتصار صغير. كل موقع محظور هو حد تضعه لنفسك. هذه القرارات الصغيرة تتراكم على مدى أسابيع وأشهر لتصبح نسخة مختلفة تماماً من حياتك.",
        "التشتت هو اللص الصامت للطموح. لا يعلن عن نفسه بصوت عالٍ. يهمس فقط فيديو واحد آخر فقط خمس دقائق أخرى فقط نظرة سريعة. قبل أن تدرك ذلك تختفي الساعات ويبقى العمل كما هو. إدراك هذا النمط هو الخطوة الأولى. بناء أنظمة تمنعه هو الخطوة الثانية التي تتخذها الآن.",
        "ذاتك المستقبلية ستشكرك أو تلومك على الخيارات التي تتخذها اليوم. في كل مرة تقاوم فيها جاذبية موقع مشتت تستثمر في الشخص الذي تريد أن تصبحه. الانضباط غير مريح في اللحظة لكن الندم أسوأ على المدى الطويل. اختر الانزعاج الذي يقود إلى النمو وليس الراحة التي تقود إلى الركود.",
        "كان من المفترض أن يكون الإنترنت أعظم أداة للإنتاجية البشرية تم إنشاؤها على الإطلاق. بدلاً من ذلك أصبح أكبر مصدر للتشتت. لكن الأداة نفسها ليست المشكلة. المشكلة هي استخدامها بدون حدود. بوضع قواعد واضحة لنفسك تستعيد الوعد الأصلي للتكنولوجيا أداة تخدمك وليست أداة تتحكم فيك.",
    ],
    hi: [
        "आपके जीवन में कुछ भी नहीं जोड़ने वाली सामग्री को स्क्रॉल करते हुए बिताया गया हर मिनट एक ऐसा मिनट है जो आप कभी वापस नहीं पाएंगे। आपके चारों ओर की स्क्रीन आपकी दुश्मन नहीं हैं लेकिन उनके आसपास आपने जो आदतें बनाई हैं वे हो सकती हैं। सच्ची स्वतंत्रता यह चुनने से आती है कि आपका ध्यान कहां जाता है न कि एल्गोरिदम को आपके लिए निर्णय लेने देने से। आज नियंत्रण लें।",
        "दुनिया में सबसे उत्पादक लोगों के पास आपसे ज्यादा घंटे नहीं होते। वे बस अपने समय की उग्र इरादे से रक्षा करते हैं। आप जो हर सूचना अनदेखी करते हैं वह एक छोटी जीत है। हर अवरुद्ध वेबसाइट एक सीमा है जो आप अपने लिए निर्धारित करते हैं। ये छोटे निर्णय हफ्तों और महीनों में आपके जीवन के एक पूरी तरह से अलग संस्करण में जमा होते हैं।",
        "विचलन महत्वाकांक्षा का मौन चोर है। यह जोर से अपनी घोषणा नहीं करता। यह फुसफुसाता है बस एक और वीडियो बस पांच मिनट और बस एक त्वरित जांच। इससे पहले कि आप इसे महसूस करें घंटे गायब हो गए हैं और काम अछूता रह गया है। इस पैटर्न को पहचानना पहला कदम है। इसे रोकने वाले सिस्टम बनाना दूसरा कदम है जो आप अभी उठा रहे हैं।",
        "आपका भविष्य का स्वयं आज आपके द्वारा किए गए विकल्पों के लिए आपको धन्यवाद देगा या दोषी ठहराएगा। हर बार जब आप एक विचलित करने वाली वेबसाइट के आकर्षण का विरोध करते हैं तो आप उस व्यक्ति में निवेश कर रहे होते हैं जो आप बनना चाहते हैं। अनुशासन इस क्षण में असहज लगता है लेकिन पछतावा लंबे समय में बदतर लगता है।",
        "इंटरनेट मानव उत्पादकता के लिए अब तक बनाया गया सबसे बड़ा उपकरण होना चाहिए था। इसके बजाय यह विचलन का सबसे बड़ा स्रोत बन गया है। लेकिन उपकरण स्वयं समस्या नहीं है। समस्या सीमाओं के बिना इसका उपयोग करना है। अपने लिए स्पष्ट नियम निर्धारित करके आप प्रौद्योगिकी के मूल वादे को पुनः प्राप्त करते हैं एक उपकरण जो आपकी सेवा करता है।",
    ],
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Génère une phrase de confirmation longue (50+ mots).
 * Approche : paragraphe motivationnel pré-écrit (comme BlockerX)
 * + code 8 chiffres pour l'unicité.
 * PAS de \n — le textarea wrappera naturellement.
 * Comparaison simple par === après trim().
 */
function generateConfirmPhrase(lang: string = 'en'): string {
    const paragraphs = CONFIRM_PARAGRAPHS[lang] ?? CONFIRM_PARAGRAPHS['en']
    const paragraph = pick(paragraphs)
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    return paragraph + ' ' + code
}

/* Input sans copier-coller */
export const NoPasteInput = ({
    value, onChange, placeholder, autoFocus, className
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    autoFocus?: boolean
    className?: string
}) => (
    <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        className={className}
        onChange={e => onChange(e.target.value)}
        onPaste={e => e.preventDefault()}
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
    />
)


/* Indicateur visuel caractère par caractère — montre en vert les caractères
   correctement saisis et en rouge le premier caractère erroné */
function PhraseMatchDisplay({ typed, target }: { typed: string; target: string }) {
    if (!typed) return null

    const chars: { char: string; ok: boolean }[] = []
    let firstErrorIdx = -1

    for (let i = 0; i < typed.length; i++) {
        const isCorrect = i < target.length && typed[i] === target[i]
        chars.push({ char: typed[i] === '\n' ? '↵' : typed[i], ok: isCorrect })
        if (!isCorrect && firstErrorIdx === -1) firstErrorIdx = i
    }

    const totalCorrect = firstErrorIdx === -1 ? typed.length : firstErrorIdx
    const isComplete = typed.trim() === target.trim()

    return (
        <div className="space-y-2">
            {/* Compteur */}
            <div className="flex items-center justify-between text-[10px]">
                <span className={isComplete ? "text-emerald-400 font-medium" : "text-zinc-500"}>
                    {isComplete
                        ? "✓ Phrase matches perfectly"
                        : `${totalCorrect} / ${target.length} characters correct`
                    }
                </span>
                {firstErrorIdx !== -1 && (
                    <span className="text-rose-400">
                        ✗ Error at position {firstErrorIdx + 1}
                    </span>
                )}
            </div>

            {/* Barre de progression */}
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-200 ${
                        isComplete ? 'bg-emerald-500' : firstErrorIdx !== -1 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalCorrect / target.length) * 100)}%` }}
                />
            </div>
        </div>
    )
}

/* Textarea sans copier-coller — pour la phrase multi-lignes */
const NoPasteTextarea = ({
    value, onChange, placeholder, autoFocus, rows = 7, className
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    autoFocus?: boolean
    rows?: number
    className?: string
}) => (
    <textarea
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        rows={rows}
        className={className}
        onChange={e => onChange(e.target.value)}
        onPaste={e => e.preventDefault()}
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        onDrop={e => e.preventDefault()}
    />
)


/* =========================================================
   TYPES
========================================================= */
interface SubscriptionRow {
    plan:       string
    is_valid:   boolean
    expires_at: string | null
    updated_at: string
}

type SaveStatus = 'idle' | 'loading' | 'success' | 'error'

/* =========================================================
   HELPERS
========================================================= */
async function sendToBackground<T = { success?: boolean; error?: string }>(
    msg: Record<string, unknown>
): Promise<T> {
    return new Promise((resolve) =>
        chrome.runtime.sendMessage(msg, (r) => resolve(r ?? { error: twhc("backgroundNotReply") }))
    )
}

const PLAN_LABEL: Record<string, string> = {
    FREE:     twhc('free'),
    MONTHLY:  twhc('monthly'),
    YEARLY:   twhc('yearly'),
    LIFETIME: twhc('lifetime'),
}

const PLAN_COLOR: Record<string, string> = {
    FREE:     'text-zinc-400 bg-zinc-800 border-zinc-700',
    MONTHLY:  'text-amber-300 bg-amber-500/10 border-amber-500/30',
    YEARLY:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
    LIFETIME: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

function formatExpiry(ts: number | null): string | null {
    if (!ts) return null
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
    })
}

/* =========================================================
   AVATARS PRÉDÉFINIS
========================================================= */
const AVATARS = [felixAvatar, anekaAvatar, bobAvatar, jackAvatar, mollyAvatar, sarahAvatar]

/* =========================================================
   COMPOSANT
========================================================= */
const Account = () => {
    const { t }  = useTranslation('account')
    const { t: tc } = useTranslation('common')
    const location             = useLocation()
    const { state, avatarUrl } = useStateContext()   // ← source unique de vérité

    /* ── Username ── */
    const [newUsername,   setNewUsername]  = useState('')
    const [userSaveStatus, setUserSave]   = useState<SaveStatus>('idle')
    const [userSaveError,  setUserError]  = useState<string | null>(null)

    /* ── Mot de passe ── */
    const [showPwdForm,  setShowPwdForm]  = useState(false)
    const [currentPwd,   setCurrentPwd]   = useState('')
    const [newPwd,       setNewPwd]       = useState('')
    const [confirmPwd,   setConfirmPwd]   = useState('')
    const [pwdStatus,    setPwdStatus]    = useState<SaveStatus>('idle')
    const [pwdError,     setPwdError]     = useState<string | null>(null)

    /* ── Déconnexion ── */
    const [logoutLoading,  setLogoutLoading]  = useState(false)
    const [logoutStep,     setLogoutStep]     = useState<'idle' | 'confirm' | 'password' | 'phrase'>('idle')
    const [logoutPassword, setLogoutPassword] = useState('')
    const [showLogoutPwd,   setShowLogoutPwd]   = useState(false)
    const [logoutPhrase,   setLogoutPhrase]   = useState('')
    const [logoutPhraseTarget, setLogoutPhraseTarget] = useState('')
    const [logoutError,    setLogoutError]    = useState<string | null>(null)

    /* ── Suppression (4 étapes) ── */
    const [deleteStep,     setDeleteStep]     = useState<'idle' | 'confirm' | 'password' | 'phrase'>('idle')
    const [deletePassword, setDeletePassword] = useState('')
    const [showDeletePwd,   setShowDeletePwd]   = useState(false)
    const [deletePhrase,   setDeletePhrase]   = useState('')
    const [deletePhraseTarget, setDeletePhraseTarget] = useState('')
    const [deleteLoading,  setDeleteLoading]  = useState(false)
    const [deleteError,    setDeleteError]    = useState<string | null>(null)

    /* ── Historique ── */
    const [history,        setHistory]        = useState<SubscriptionRow[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)

    /* ── Redirection si non connecté ── */
    useEffect(() => {
        // state === null = pas encore chargé → on attend
        // state !== null mais isAuthenticated === false → rediriger
        if (state !== null && !state.auth?.isAuthenticated) {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }, [state])

    /* ── Sync username depuis le contexte ── */
    useEffect(() => {
        if (state?.auth?.userName) setNewUsername(state.auth.userName)
    }, [state?.auth?.userName])

    /* ── Charger l'historique Supabase ── */
    useEffect(() => {
        if (!state?.auth?.isAuthenticated || !state?.auth?.accessToken || !state?.auth?.userId) return
        const load = async () => {
            setHistoryLoading(true)
            try {
                const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${state.auth.userId}&select=plan,is_valid,expires_at,updated_at&order=updated_at.desc`
                const res = await fetch(url, {
                    headers: {
                        apikey:        import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                        Authorization: `Bearer ${state.auth.accessToken}`,
                    },
                })
                if (res.ok) setHistory(await res.json())
            } catch { /* silencieux */ }
            setHistoryLoading(false)
        }
        load()
    }, [state?.auth?.isAuthenticated])

    /* ── Changer d'avatar ──
       On écrit dans le storage — le contexte met automatiquement
       à jour avatarUrl via son listener onChanged */
    const handleAvatarSelect = async (url: string) => {
        const userId = state?.auth?.userId ?? 'guest'
        await chrome.storage.local.set({ [`bwm_avatar_${userId}`]: url })
    }

    /* ── Modifier le username ── */
    const handleUpdateUsername = async () => {
        const trimmed = newUsername.trim()
        if (!trimmed || trimmed === state?.auth?.userName) return
        setUserSave('loading')
        setUserError(null)
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_USERNAME', username: trimmed,
        })
        if (res.error) {
            setUserError(res.error)
            setUserSave('error')
        } else {
            setUserSave('success')
            setTimeout(() => setUserSave('idle'), 2500)
        }
    }

    /* ── Changer le mot de passe ── */
    const handleChangePassword = async () => {
        setPwdError(null)
        if (!currentPwd || !newPwd || !confirmPwd) {
            setPwdError(t('fillInputs'))
            setPwdStatus('error')
            return
        }
        if (newPwd !== confirmPwd) {
            setPwdError(t('newPwdsDontMatch'))
            setPwdStatus('error')
            return
        }
        if (newPwd.length < 6) {
            setPwdError(t('pwdLengthRule'))
            setPwdStatus('error')
            return
        }
        setPwdStatus('loading')
        const res = await sendToBackground<{ success: boolean; error?: string }>({
            type: 'UPDATE_PASSWORD', currentPwd, newPwd,
        })
        if (res.error) {
            setPwdError(res.error)
            setPwdStatus('error')
        } else {
            setPwdStatus('success')
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
            setTimeout(() => { setPwdStatus('idle'); setShowPwdForm(false) }, 2000)
        }
    }

    /* ── Déconnexion — 3 étapes : confirm → password → phrase ── */
    const handleLogoutPasswordCheck = async () => {
        if (!logoutPassword.trim()) {
            setLogoutError(t('enterPwd'))
            return
        }
        setLogoutLoading(true)
        setLogoutError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'VERIFY_PASSWORD', password: logoutPassword,
        })
        setLogoutLoading(false)
        if (res.error) {
            setLogoutError(t('incorrectPwd'))
            return
        }
        // Mot de passe OK → générer la phrase et passer à l'étape phrase
        const phrase = generateConfirmPhrase(navigator.language?.slice(0, 2) ?? 'en')
        setLogoutPhraseTarget(phrase)
        setLogoutPhrase('')
        setLogoutStep('phrase')
    }

    const handleLogout = async () => {
        if (logoutPhrase.trim() !== logoutPhraseTarget.trim()) {
            setLogoutError(t('phraseIncorrect'))
            return
        }
        setLogoutLoading(true)
        await sendToBackground({ type: 'SIGN_OUT' })
        window.location.href = chrome.runtime.getURL('src/auth/index.html')
    }

    /* ── Suppression — étape password ── */
    const handleDeletePasswordCheck = async () => {
        if (!deletePassword.trim()) {
            setDeleteError(t('enterPwd'))
            return
        }
        setDeleteLoading(true)
        setDeleteError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'VERIFY_PASSWORD', password: deletePassword,
        })
        setDeleteLoading(false)
        if (res.error) {
            setDeleteError(t('incorrectPwd'))
            return
        }
        // Mot de passe OK → générer la phrase
        const phrase = generateConfirmPhrase(navigator.language?.slice(0, 2) ?? 'en')
        setDeletePhraseTarget(phrase)
        setDeletePhrase('')
        setDeleteStep('phrase')
    }

    /* ── Suppression — étape phrase ── */
    const handleDeleteAccount = async () => {
        if (deletePhrase.trim() !== deletePhraseTarget.trim()) {
            setDeleteError(t('phraseIncorrect'))
            return
        }
        setDeleteLoading(true)
        setDeleteError(null)
        const res = await sendToBackground<{ success?: boolean; error?: string }>({
            type: 'DELETE_ACCOUNT', password: deletePassword,
        })
        if (res.error) {
            setDeleteError(res.error)
            setDeleteLoading(false)
        } else {
            window.location.href = chrome.runtime.getURL('src/auth/index.html')
        }
    }

    const plan     = state?.subscription?.plan ?? 'FREE'
    const isActive = location.pathname === '/account'

    return (
        <div id="tab-account" className={`tab-pane ${isActive && 'active'} max-w-xl mx-auto`}>

            {/* ── En-tête profil ── */}
            <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden shadow-2xl flex items-center justify-center">
                        {avatarUrl
                            ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                            : <Icon icon="solar:user-circle-bold" className="text-zinc-500 text-4xl" />
                        }
                    </div>
                    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${PLAN_COLOR[plan] ?? PLAN_COLOR.FREE}`}>
                        {PLAN_LABEL[plan] ?? plan}
                    </span>
                </div>
                <h2 className="text-base font-semibold text-white mt-3">
                    {state?.auth?.userName ?? t('user')}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">{state?.auth?.email ?? '—'}</p>
                {state?.isPremium && state.subscription?.expiresAt && plan !== 'LIFETIME' && (
                    <p className="text-[10px] text-zinc-600 mt-1">
                        {t('expiresAt')} <span className="text-zinc-400">{formatExpiry(state.subscription.expiresAt)}</span>
                    </p>
                )}
                {plan === 'LIFETIME' && (
                    <p className="text-[10px] text-emerald-600 mt-1">{t('lifetimeAccess')}</p>
                )}
            </div>

            <div className="space-y-4">

                {/* ── Avatar ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t('avatar')}</p>
                    <div className="grid grid-cols-6 gap-2">
                        {AVATARS.map(url => (
                            <button
                                key={url}
                                onClick={() => handleAvatarSelect(url)}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                                    avatarUrl === url
                                        ? 'border-white scale-110 shadow-lg shadow-white/10'
                                        : 'border-zinc-700 hover:border-zinc-500'
                                }`}
                            >
                                <img src={url} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Nom d'utilisateur ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{t('username')}</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateUsername()}
                            placeholder={t('yourUsername')}
                            className="flex-1 bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                        />
                        <button
                            onClick={handleUpdateUsername}
                            disabled={userSaveStatus === 'loading' || !newUsername.trim() || newUsername.trim() === state?.auth?.userName}
                            className="px-4 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 min-w-[80px] justify-center"
                        >
                            {userSaveStatus === 'loading'
                                ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                : userSaveStatus === 'success'
                                    ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> {tc('saved')}</>
                                    : tc('edit')
                            }
                        </button>
                    </div>
                    {userSaveStatus === 'error' && userSaveError && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1">
                            <Icon icon="solar:danger-circle-linear" width="11" /> {userSaveError}
                        </p>
                    )}
                </div>

                {/* ── Mot de passe ── */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Mot de passe</p>
                        <button
                            onClick={() => { setShowPwdForm(v => !v); setPwdStatus('idle'); setPwdError(null) }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showPwdForm ? tc('cancel') : tc('edit')}
                        </button>
                    </div>

                    {!showPwdForm && <p className="text-xs text-zinc-600">••••••••</p>}

                    {showPwdForm && (
                        <div className="space-y-2">
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    placeholder={t('currentPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    placeholder={t('newPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="relative group">
                                <Icon icon="solar:lock-keyhole-linear" className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors" width="13" />
                                <input
                                    type="password"
                                    value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                    placeholder={t('confirmNewPwd')}
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                            </div>
                            {pwdStatus === 'error' && pwdError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {pwdError}
                                </p>
                            )}
                            <button
                                onClick={handleChangePassword}
                                disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                className="w-full py-2 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-1"
                            >
                                {pwdStatus === 'loading'
                                    ? <><Icon icon="svg-spinners:ring-resize" width="12" /> {t('updating')}</>
                                    : pwdStatus === 'success'
                                        ? <><Icon icon="solar:check-circle-linear" width="12" className="text-emerald-600" /> {t('passwordSuccess')}</>
                                        : t('updatePwd')
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Actions compte ── */}
                <div className="flex flex-col gap-2 pt-2">

                    {/* ── Déconnexion — protégée par mot de passe ── */}
                    {logoutStep === 'idle' && (
                        <button
                            onClick={() => setLogoutStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:logout-linear" width="14" />
                            {t('signOut')}
                        </button>
                    )}

                    {logoutStep === 'confirm' && (
                        <div className="space-y-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-amber-400 shrink-0 mt-0.5" width="14" />
                                <p className="text-xs text-amber-300/80">
                                    {t('confirmSignOut')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={() => setLogoutStep('password')}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg border border-zinc-600 transition-colors"
                                >
                                    {tc('continue')}
                                </button>
                            </div>
                        </div>
                    )}

                    {logoutStep === 'password' && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500">{t('enterPwdToLogout')}</p>
                            <div className="relative">
                                <input
                                    type={showLogoutPwd ? "text" : "password"}
                                    value={logoutPassword}
                                    onChange={e => { setLogoutPassword(e.target.value); setLogoutError(null) }}
                                    onKeyDown={e => e.key === 'Enter' && handleLogoutPasswordCheck()}
                                    placeholder={t('yourPwd')}
                                    autoFocus
                                    className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 pr-10 py-2.5 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutPwd(v => !v)}
                                    className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    <Icon icon={showLogoutPwd ? "solar:eye-linear" : "solar:eye-closed-linear"} width="14" />
                                </button>
                            </div>
                            {logoutError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1.5">
                                    <Icon icon="solar:danger-circle-linear" width="11" />
                                    {logoutError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutPassword(''); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleLogoutPasswordCheck}
                                    disabled={logoutLoading}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-lg border border-zinc-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {logoutLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : tc('continue')
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Déconnexion — étape 3 : phrase de confirmation ── */}
                    {logoutStep === 'phrase' && (
                        <div className="space-y-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-amber-300">{t('typePhrase')}</p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">{t('typePhraseDesc')}</p>
                                {/* Phrase à recopier — sélectionnable mais non copiable via l'UI */}
                                <div
                                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-amber-300 leading-relaxed select-text whitespace-pre-wrap"
                                    onCopy={e => e.preventDefault()}
                                >
                                    {logoutPhraseTarget}
                                </div>
                            </div>
                            <NoPasteTextarea
                                value={logoutPhrase}
                                onChange={v => { setLogoutPhrase(v); setLogoutError(null) }}
                                placeholder={t('typeHere')}
                                autoFocus
                                rows={10}
                                className="w-full bg-black border border-zinc-700 text-white text-xs rounded-lg px-3 py-2.5 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 resize-none leading-relaxed"
                            />
                            <PhraseMatchDisplay typed={logoutPhrase} target={logoutPhraseTarget} />
                            {logoutError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1.5">
                                    <Icon icon="solar:danger-circle-linear" width="11" />
                                    {logoutError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setLogoutStep('idle'); setLogoutPassword(''); setLogoutPhrase(''); setLogoutError(null) }}
                                    className="flex-1 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={logoutLoading || logoutPhrase.trim() !== logoutPhraseTarget.trim()}
                                    className="flex-1 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded-lg border border-zinc-600 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {logoutLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : <Icon icon="solar:logout-linear" width="12" />
                                    }
                                    {t('logOut')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 0 : bouton initial ── */}
                    {deleteStep === 'idle' && (
                        <button
                            onClick={() => setDeleteStep('confirm')}
                            className="w-full py-2.5 rounded-lg border border-rose-900/30 text-rose-500 hover:bg-rose-950/30 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:trash-bin-trash-linear" width="14" />
                            {t('deleteMyAccount')}
                        </button>
                    )}

                    {/* ── Suppression — étape 1 : avertissement détaillé ── */}
                    {deleteStep === 'confirm' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                                <Icon icon="solar:danger-triangle-linear" className="text-rose-400 shrink-0 mt-0.5" width="16" />
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-rose-300">{t('permanentDeletion')}</p>
                                    <p className="text-[10px] text-rose-400/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('deleteDesc')  }} />
                                    <ul className="text-[10px] text-rose-400/70 space-y-0.5">
                                        <li>{t('yourIds')}</li>
                                        <li>{t('yourSubandHist')}</li>
                                        <li>{t('yourData')}</li>
                                    </ul>
                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        {t('blockRulesDesc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteStep('idle')}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={() => setDeleteStep('password')}
                                    className="flex-1 py-2 rounded-lg bg-rose-900/50 hover:bg-rose-800/60 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors"
                                >
                                    {tc('continue')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 2 : saisie du mot de passe ── */}
                    {deleteStep === 'password' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <p className="text-[11px] text-rose-300 font-medium">{t('confirmId')}</p>
                            <p className="text-[10px] text-rose-400/70">{t('enterPwdForDeletion')}</p>
                            <div className="relative group">
                                <Icon icon="solar:lock-password-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-rose-400 transition-colors" width="13" />
                                <input
                                    type={showDeletePwd ? "text" : "password"}
                                    value={deletePassword}
                                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(null) }}
                                    onKeyDown={e => e.key === 'Enter' && handleDeletePasswordCheck()}
                                    placeholder={t('yourPwd')}
                                    autoFocus
                                    className="w-full bg-black border border-rose-900/40 focus:border-rose-700/60 text-white text-xs rounded-lg pl-9 pr-10 py-2 outline-none transition-colors placeholder:text-zinc-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDeletePwd(v => !v)}
                                    className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    <Icon icon={showDeletePwd ? "solar:eye-linear" : "solar:eye-closed-linear"} width="14" />
                                </button>
                            </div>
                            {deleteError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {deleteError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteError(null) }}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleDeletePasswordCheck}
                                    disabled={deleteLoading || !deletePassword.trim()}
                                    className="flex-1 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800/70 border border-rose-700/50 text-rose-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {deleteLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : tc('continue')
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Suppression — étape 3 : phrase de confirmation ── */}
                    {deleteStep === 'phrase' && (
                        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4 space-y-3">
                            <div className="space-y-1.5">
                                <p className="text-[11px] text-rose-300 font-semibold">{t('typePhrase')}</p>
                                <p className="text-[10px] text-rose-400/70 leading-relaxed">{t('typePhraseDescDelete')}</p>
                                {/* Phrase à recopier */}
                                <div
                                    className="px-3 py-2 rounded-lg bg-black/60 border border-rose-900/40 text-[11px] text-rose-300 leading-relaxed select-text whitespace-pre-wrap"
                                    onCopy={e => e.preventDefault()}
                                >
                                    {deletePhraseTarget}
                                </div>
                            </div>
                            <NoPasteTextarea
                                value={deletePhrase}
                                onChange={v => { setDeletePhrase(v); setDeleteError(null) }}
                                placeholder={t('typeHere')}
                                autoFocus
                                rows={10}
                                className="w-full bg-black border border-rose-900/40 focus:border-rose-700/60 text-white text-xs rounded-lg px-3 py-2.5 outline-none transition-colors placeholder:text-zinc-600 resize-none leading-relaxed"
                            />
                            <PhraseMatchDisplay typed={deletePhrase} target={deletePhraseTarget} />
                            {deleteError && (
                                <p className="text-[10px] text-rose-400 flex items-center gap-1">
                                    <Icon icon="solar:danger-circle-linear" width="11" /> {deleteError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeletePhrase(''); setDeleteError(null) }}
                                    className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs transition-colors"
                                >
                                    {tc('cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading || deletePhrase.trim() !== deletePhraseTarget.trim()}
                                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    {deleteLoading
                                        ? <Icon icon="svg-spinners:ring-resize" width="12" />
                                        : t('permanentDelete')
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Historique des abonnements ── */}
            <div className="border-t border-white/5 mt-8 pt-8">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Icon icon="solar:bill-list-linear" className="text-zinc-500" />
                    {t('subHistory')}
                </h3>
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-zinc-500 text-xs">
                            <Icon icon="svg-spinners:ring-resize" width="14" /> {tc('loading')}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Icon icon="solar:bill-list-linear" className="text-zinc-700 text-2xl" />
                            <p className="text-xs text-zinc-600">{t('noSubSaved')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">{t('plan')}</th>
                                    <th className="px-4 py-3 font-medium">{t('status')}</th>
                                    <th className="px-4 py-3 font-medium">{t('expiration')}</th>
                                    <th className="px-4 py-3 font-medium text-right">{t('update')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 bg-black text-xs text-zinc-400">
                                {history.map((row, i) => (
                                    <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLOR[row.plan] ?? PLAN_COLOR.FREE}`}>
                                                {PLAN_LABEL[row.plan] ?? row.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] ${row.is_valid ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                {row.is_valid ? `● ${t('active')}` : `○ ${t('expired')}`}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.expires_at ? formatDate(row.expires_at) : <span className="text-zinc-600">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600">
                                            {formatDate(row.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Account