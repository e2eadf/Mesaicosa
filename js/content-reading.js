// Textes originaux supplémentaires pour la lecture rapide, avec quiz (v1.4).
export const MORE_READING = [
  {
    id: 'bilan', title: "Lire les comptes d'une entreprise", theme: 'Finance d\'entreprise',
    text: `Pour comprendre une entreprise, trois documents suffisent souvent : le bilan, le compte de résultat et le tableau des flux de trésorerie. Chacun répond à une question différente.
Le bilan est une photographie à une date précise. À l'actif figure ce que l'entreprise possède ou contrôle : bâtiments, machines, stocks, créances sur les clients, trésorerie. Au passif figure la manière dont tout cela est financé : par les capitaux propres, apportés par les actionnaires ou accumulés grâce aux bénéfices passés, et par les dettes. Les deux colonnes sont toujours égales, car tout bien a une source de financement.
Le compte de résultat, lui, est un film : il décrit l'activité sur une période, généralement un an. On part du chiffre d'affaires, on soustrait les achats, les salaires et les autres charges pour obtenir l'excédent brut d'exploitation. Après les amortissements, les frais financiers et l'impôt, il reste le résultat net.
Enfin, le tableau des flux de trésorerie montre d'où vient l'argent et où il va réellement. C'est le plus difficile à maquiller : une entreprise peut afficher un bénéfice comptable tout en manquant de liquidités, par exemple si ses clients tardent à payer. Beaucoup de faillites concernent d'ailleurs des sociétés rentables sur le papier.
Un analyste lit donc ces trois documents ensemble. Le bilan dit si l'entreprise est solide, le compte de résultat si elle est rentable, et la trésorerie si elle peut tenir dans la durée.`,
    quiz: [
      { q: 'À quoi le texte compare-t-il le bilan ?', a: ['À un film', 'À une photographie', 'À une carte', 'À un journal de bord'], c: 1 },
      { q: 'Pourquoi l\'actif et le passif sont-ils toujours égaux ?', a: ['Par obligation fiscale', 'Car tout bien a une source de financement', 'Car les dettes sont plafonnées', 'Par convention entre banques'], c: 1 },
      { q: 'Quel document est présenté comme le plus difficile à maquiller ?', a: ['Le bilan', 'Le compte de résultat', 'Le tableau des flux de trésorerie', 'Le rapport annuel'], c: 2 },
      { q: 'Comment une entreprise rentable peut-elle manquer de liquidités ?', a: ['Si ses clients tardent à payer', 'Si son capital est trop élevé', 'Si elle a trop d\'actionnaires', 'Si elle paie peu d\'impôts'], c: 0 },
    ],
  },
  {
    id: 'obligations', title: 'Les obligations et les taux', theme: 'Finance de marché',
    text: `Une obligation est un titre de dette. Un État ou une entreprise emprunte une somme, par exemple 1 000 euros, et s'engage à verser chaque année un intérêt fixe, appelé coupon, puis à rembourser les 1 000 euros à une date prévue, l'échéance.
Une fois émise, l'obligation s'échange sur un marché, et son prix varie. La raison principale est l'évolution des taux d'intérêt. Imaginons une obligation qui verse un coupon de 2 %. Si, quelques mois plus tard, les nouvelles obligations comparables rapportent 4 %, plus personne ne voudra payer 1 000 euros pour un titre qui ne rapporte que 2 %. Son prix baisse donc jusqu'à ce que son rendement redevienne comparable à celui du marché. À l'inverse, quand les taux baissent, les anciennes obligations à coupon élevé prennent de la valeur.
La sensibilité d'une obligation à ces mouvements dépend surtout de sa durée restante. Une obligation qui arrive à échéance dans un an bouge peu, car le remboursement est proche. Une obligation à trente ans peut perdre une part importante de sa valeur si les taux montent fortement. Les gérants mesurent ce risque avec un indicateur appelé duration.
Le second risque est celui de l'emprunteur lui-même : s'il fait défaut, il ne rembourse pas. C'est pourquoi un pays ou une entreprise jugé fragile doit offrir un taux plus élevé pour attirer les prêteurs. L'écart avec le taux d'un emprunteur très sûr s'appelle le spread.`,
    quiz: [
      { q: 'Comment s\'appelle l\'intérêt versé par une obligation ?', a: ['Le dividende', 'Le coupon', 'Le spread', 'La duration'], c: 1 },
      { q: 'Que devient le prix d\'une obligation existante quand les taux montent ?', a: ['Il monte', 'Il baisse', 'Il ne change pas', 'Il est suspendu'], c: 1 },
      { q: 'Quelle obligation est la plus sensible aux variations de taux ?', a: ['Celle à échéance dans un an', 'Celle à échéance dans trente ans', 'Celle émise par un État', 'Celle à coupon élevé'], c: 1 },
      { q: 'Comment s\'appelle l\'écart de taux exigé d\'un emprunteur plus risqué ?', a: ['Le coupon', 'La duration', 'Le spread', 'L\'échéance'], c: 2 },
    ],
  },
  {
    id: 'etf', title: 'La gestion indicielle', theme: 'Finance de marché',
    text: `Pendant longtemps, investir en Bourse signifiait confier son argent à un gérant chargé de choisir les meilleures actions. Dans les années 1970, une idée différente a émergé : plutôt que d'essayer de battre le marché, pourquoi ne pas simplement le reproduire ?
C'est le principe de la gestion indicielle. Un fonds indiciel achète toutes les actions d'un indice, comme le CAC 40 ou le S&P 500, dans les mêmes proportions. Sa performance suit donc celle de l'indice, à quelques frais près. Les ETF, ou fonds cotés, ont rendu cette approche accessible à tous : ils s'achètent en Bourse comme une action, en quelques secondes.
L'argument principal est celui des coûts. Un fonds actif doit payer des analystes et des gérants, et ses frais annuels dépassent souvent 1,5 %. Un ETF sur un grand indice coûte fréquemment moins de 0,3 %. Sur vingt ou trente ans, cet écart, répété chaque année, pèse lourdement sur le résultat final.
Le second argument est statistique. De nombreuses études montrent qu'une majorité de fonds actifs font moins bien que leur indice de référence sur longue période, une fois les frais déduits. Ceux qui réussissent une année ne sont pas forcément ceux qui réussissent la suivante.
La gestion indicielle a aussi ses limites. Elle achète sans discernement toutes les entreprises de l'indice, y compris celles qui sont surévaluées, et donne plus de poids aux plus grandes capitalisations. Certains investisseurs combinent donc les deux approches : un cœur de portefeuille indiciel et quelques choix actifs autour.`,
    quiz: [
      { q: 'Quel est le principe de la gestion indicielle ?', a: ['Choisir les meilleures actions', 'Reproduire un indice', 'Acheter uniquement des obligations', 'Spéculer à court terme'], c: 1 },
      { q: 'Quel est l\'ordre de grandeur des frais d\'un ETF sur un grand indice selon le texte ?', a: ['Moins de 0,3 %', 'Environ 1,5 %', 'Environ 3 %', 'Plus de 5 %'], c: 0 },
      { q: 'Que montrent de nombreuses études sur les fonds actifs ?', a: ['Ils battent toujours leur indice', 'Une majorité fait moins bien que l\'indice après frais', 'Ils n\'ont aucun frais', 'Ils sont interdits aux particuliers'], c: 1 },
      { q: 'Quelle limite de la gestion indicielle le texte cite-t-il ?', a: ['Elle est trop chère', 'Elle achète aussi les entreprises surévaluées', 'Elle ne s\'achète pas en Bourse', 'Elle exclut les grandes entreprises'], c: 1 },
    ],
  },
  {
    id: 'inflation', title: "Comprendre l'inflation", theme: 'Économie',
    text: `L'inflation désigne la hausse générale et durable des prix. Quand elle atteint 5 % sur un an, il faut en moyenne 105 euros pour acheter ce qui en coûtait 100 l'année précédente. Autrement dit, chaque euro perd du pouvoir d'achat.
Les économistes distinguent plusieurs causes. L'inflation par la demande apparaît quand les ménages et les entreprises veulent acheter plus que ce que l'économie peut produire : les vendeurs augmentent alors leurs prix. L'inflation par les coûts survient quand les matières premières, l'énergie ou les salaires renchérissent, et que les entreprises répercutent ces hausses. Les anticipations jouent aussi un rôle : si chacun s'attend à une forte hausse des prix, les salariés réclament des augmentations et les entreprises relèvent leurs tarifs par précaution, ce qui entretient le phénomène.
Pour la contenir, les banques centrales disposent d'un outil principal : leur taux directeur. En le relevant, elles renchérissent le crédit, ce qui freine la consommation et l'investissement, puis, avec retard, la hausse des prix. La Banque centrale européenne vise une inflation de 2 % à moyen terme, un niveau jugé suffisamment bas pour préserver la monnaie et suffisamment élevé pour éviter la déflation.
La déflation, baisse générale des prix, peut sembler une bonne nouvelle. Elle est pourtant redoutée : les ménages reportent leurs achats en attendant des prix plus bas, les entreprises vendent moins, et le poids réel des dettes augmente. Le Japon en a fait l'expérience pendant une longue période à partir des années 1990.`,
    quiz: [
      { q: 'Avec 5 % d\'inflation, combien faut-il pour acheter ce qui coûtait 100 € un an plus tôt ?', a: ['95 €', '100 €', '105 €', '150 €'], c: 2 },
      { q: 'Quel est le principal outil d\'une banque centrale contre l\'inflation ?', a: ['Le taux directeur', 'Les impôts', 'Les droits de douane', 'Le salaire minimum'], c: 0 },
      { q: 'Quelle inflation la BCE vise-t-elle à moyen terme ?', a: ['0 %', '1 %', '2 %', '5 %'], c: 2 },
      { q: 'Pourquoi la déflation est-elle redoutée ?', a: ['Elle rend les produits rares', 'Les ménages reportent leurs achats et les dettes pèsent plus', 'Elle augmente les salaires trop vite', 'Elle supprime l\'épargne'], c: 1 },
    ],
  },
  {
    id: 'nil', title: 'Le Nil, fleuve nourricier', theme: 'Géographie',
    text: `Le Nil est l'un des plus longs fleuves du monde, avec plus de 6 600 kilomètres selon la plupart des mesures. Il résulte de la rencontre de deux grands cours d'eau. Le Nil Blanc, le plus long, est associé à la région du lac Victoria, en Afrique de l'Est. Le Nil Bleu naît du lac Tana, sur les hauts plateaux d'Éthiopie. Les deux se rejoignent à Khartoum, la capitale du Soudan, avant de traverser le désert vers le nord.
Le Nil Bleu, bien que plus court, apporte l'essentiel de l'eau et des sédiments pendant la saison des pluies éthiopienne. Pendant des millénaires, ces crues annuelles ont déposé sur les rives égyptiennes un limon fertile. Toute la civilisation de l'Égypte ancienne s'est organisée autour de ce rythme : les paysans semaient après le retrait des eaux, et le calendrier lui-même suivait les saisons du fleuve. L'historien grec Hérodote décrivait déjà l'Égypte comme un « don du Nil ».
Au XXe siècle, la construction du haut barrage d'Assouan, achevé en 1970, a mis fin aux crues en Égypte. Il a permis de produire de l'électricité, d'irriguer toute l'année et de protéger les villes, mais il retient aussi les sédiments, ce qui appauvrit les sols et fragilise le delta.
Aujourd'hui, le partage des eaux du Nil est un enjeu diplomatique majeur. L'Éthiopie a construit un très grand barrage sur le Nil Bleu, tandis que l'Égypte, qui dépend presque entièrement du fleuve, redoute une baisse du débit.`,
    quiz: [
      { q: 'Où le Nil Blanc et le Nil Bleu se rejoignent-ils ?', a: ['Au Caire', 'À Khartoum', 'À Assouan', 'À Addis-Abeba'], c: 1 },
      { q: 'D\'où vient le Nil Bleu ?', a: ['Du lac Victoria', 'Du lac Tana', 'Du lac Nasser', 'Du lac Tchad'], c: 1 },
      { q: 'Quand le haut barrage d\'Assouan a-t-il été achevé ?', a: ['En 1902', 'En 1950', 'En 1970', 'En 2011'], c: 2 },
      { q: 'Quel inconvénient du barrage le texte mentionne-t-il ?', a: ['Il retient les sédiments', 'Il provoque des crues', 'Il assèche le lac Victoria', 'Il empêche la navigation'], c: 0 },
    ],
  },
  {
    id: 'indonesie', title: "L'Indonésie, archipel géant", theme: 'Géographie',
    text: `L'Indonésie est le plus grand archipel du monde. Elle s'étend sur plus de 5 000 kilomètres d'ouest en est, presque la distance entre Paris et New York, et compte plus de 17 000 îles, dont plusieurs milliers sont habitées. Les plus connues sont Sumatra, Java, Bornéo, partagée avec la Malaisie et Brunei, Sulawesi et la Nouvelle-Guinée, partagée avec la Papouasie-Nouvelle-Guinée.
Avec plus de 270 millions d'habitants, c'est le quatrième pays le plus peuplé de la planète. Plus de la moitié de la population vit sur Java, une île d'une superficie comparable à celle de l'Angleterre, ce qui en fait l'un des endroits les plus densément peuplés du monde. La capitale, Jakarta, s'y trouve, mais la ville s'enfonce lentement à cause du pompage des nappes phréatiques et souffre d'inondations répétées. Le gouvernement a donc lancé la construction d'une nouvelle capitale, Nusantara, sur l'île de Bornéo.
L'archipel se situe sur la « ceinture de feu » du Pacifique, une zone de forte activité sismique et volcanique. Il compte plus d'une centaine de volcans actifs. L'éruption du Tambora en 1815 fut l'une des plus violentes de l'histoire : ses cendres ont refroidi le climat mondial, et l'année suivante fut surnommée en Europe « l'année sans été ».
Le pays est aussi d'une grande diversité culturelle, avec des centaines de langues locales. Pour unir cet ensemble, l'indonésien, une forme standardisée du malais, a été adopté comme langue nationale.`,
    quiz: [
      { q: 'Combien d\'îles l\'Indonésie compte-t-elle environ ?', a: ['Environ 1 700', 'Plus de 17 000', 'Environ 170 000', 'Environ 500'], c: 1 },
      { q: 'Sur quelle île vit plus de la moitié de la population ?', a: ['Sumatra', 'Bornéo', 'Java', 'Sulawesi'], c: 2 },
      { q: 'Pourquoi une nouvelle capitale est-elle construite ?', a: ['Jakarta s\'enfonce et subit des inondations', 'Jakarta est trop petite', 'Pour se rapprocher de l\'Australie', 'À cause d\'une guerre'], c: 0 },
      { q: 'Quelle conséquence l\'éruption du Tambora (1815) a-t-elle eue ?', a: ['Elle a créé une nouvelle île', 'Elle a refroidi le climat mondial', 'Elle a détruit Jakarta', 'Elle a provoqué la séparation de Bornéo'], c: 1 },
    ],
  },
  {
    id: 'panama', title: 'Le canal de Panama', theme: 'Géographie',
    text: `Avant le canal de Panama, un navire qui voulait aller de New York à San Francisco devait contourner toute l'Amérique du Sud par le cap Horn, un voyage de plusieurs semaines dans des eaux dangereuses. Percer l'isthme de Panama, large de quelques dizaines de kilomètres seulement, était donc un rêve ancien.
Une première tentative française fut lancée en 1881 sous la direction de Ferdinand de Lesseps, déjà célèbre pour le canal de Suez. Elle tourna au désastre : le relief, les pluies torrentielles et surtout les maladies tropicales, paludisme et fièvre jaune, firent des milliers de morts. La compagnie fit faillite, provoquant en France un retentissant scandale financier.
Les États-Unis reprirent le projet au début du XXe siècle. Ils changèrent de méthode : plutôt qu'un canal au niveau de la mer, ils construisirent un système d'écluses qui élève les navires jusqu'à un grand lac artificiel, le lac Gatún, avant de les redescendre de l'autre côté. Ils menèrent aussi une vaste campagne contre les moustiques. Le canal, long d'environ 80 kilomètres, fut inauguré en 1914.
Les États-Unis contrôlèrent la zone du canal pendant des décennies, avant de la rétrocéder au Panama le 31 décembre 1999. De nouvelles écluses, plus grandes, ont été ouvertes en 2016 pour accueillir des navires de taille supérieure. Le canal reste aujourd'hui un passage essentiel du commerce mondial, mais il dépend de l'eau douce des lacs : lors des sécheresses, le nombre de passages doit être réduit.`,
    quiz: [
      { q: 'Qui dirigea la première tentative de percement en 1881 ?', a: ['Gustave Eiffel', 'Ferdinand de Lesseps', 'Theodore Roosevelt', 'Simón Bolívar'], c: 1 },
      { q: 'Quelle fut la principale cause de l\'échec français ?', a: ['Les maladies tropicales et le relief', 'Une guerre avec la Colombie', 'Le manque d\'acier', 'Un tremblement de terre'], c: 0 },
      { q: 'Quand le canal fut-il inauguré ?', a: ['En 1869', 'En 1903', 'En 1914', 'En 1999'], c: 2 },
      { q: 'Pourquoi le canal doit-il parfois réduire le nombre de passages ?', a: ['À cause des marées', 'À cause des sécheresses', 'À cause des grèves', 'À cause de la neige'], c: 1 },
    ],
  },
  {
    id: 'neurones', title: 'Les réseaux de neurones', theme: 'IA',
    text: `Les réseaux de neurones artificiels sont au cœur de la plupart des progrès récents de l'intelligence artificielle. Leur nom vient d'une analogie lointaine avec le cerveau, mais leur fonctionnement est avant tout mathématique.
Un neurone artificiel reçoit plusieurs nombres en entrée. Il multiplie chacun d'eux par un coefficient, appelé poids, additionne le tout, puis applique une fonction simple qui décide de la valeur qu'il transmet. Seul, il ne fait presque rien. Mais en empilant des milliers ou des millions de neurones en couches successives, on obtient un système capable de représenter des relations très complexes : reconnaître un visage, traduire une phrase, prédire le mot suivant d'un texte.
Tout le savoir du réseau se trouve dans ses poids. Au départ, ils sont choisis au hasard, et le réseau répond n'importe quoi. L'entraînement consiste à lui montrer des exemples dont on connaît la bonne réponse, à mesurer son erreur, puis à ajuster légèrement chaque poids dans la direction qui réduit cette erreur. Cette méthode, appelée rétropropagation du gradient, est répétée des millions de fois.
On parle d'apprentissage profond quand le réseau comporte de nombreuses couches. Les premières couches d'un réseau qui analyse des images apprennent ainsi à détecter des contours simples, les suivantes des formes, puis des objets entiers, sans que personne ne leur ait expliqué ces notions.
Cette puissance a un revers : il est difficile de savoir précisément pourquoi un réseau donne telle réponse. Rendre ces systèmes plus compréhensibles est aujourd'hui un domaine de recherche à part entière.`,
    quiz: [
      { q: 'Où se trouve le « savoir » d\'un réseau de neurones ?', a: ['Dans ses poids', 'Dans une base de règles', 'Dans un dictionnaire', 'Dans le processeur'], c: 0 },
      { q: 'Comment s\'appelle la méthode d\'ajustement des poids ?', a: ['La compilation', 'La rétropropagation du gradient', 'La tokenisation', 'Le chiffrement'], c: 1 },
      { q: 'Que détectent les premières couches d\'un réseau qui analyse des images ?', a: ['Des objets entiers', 'Des contours simples', 'Des visages', 'Des textes'], c: 1 },
      { q: 'Quelle difficulté le texte mentionne-t-il ?', a: ['Les réseaux sont trop lents', 'Il est difficile d\'expliquer leurs réponses', 'Ils ne fonctionnent qu\'en anglais', 'Ils ne peuvent pas apprendre'], c: 1 },
    ],
  },
  {
    id: 'consignes-ia', title: 'Bien parler à une IA', theme: 'IA',
    text: `Les assistants d'intelligence artificielle donnent des résultats très variables selon la façon dont on les sollicite. Une demande comme « fais-moi un résumé » produit souvent un texte correct mais générique. Quelques habitudes simples permettent d'obtenir beaucoup mieux.
La première est de donner le contexte. L'assistant ne sait pas qui vous êtes ni pourquoi vous posez la question. Préciser le but, par exemple préparer une réunion avec un client, et le public visé, des experts ou des débutants, change profondément la réponse.
La deuxième est de décrire le résultat attendu : longueur, ton, format. « Un résumé en cinq points de deux lignes maximum, pour un directeur pressé » est beaucoup plus clair qu'un simple « résume ».
La troisième est de fournir un exemple. Montrer un paragraphe que l'on aime, ou le format d'un tableau souhaité, vaut souvent mieux qu'une longue explication.
La quatrième est de procéder par étapes. Pour une tâche complexe, il est efficace de demander d'abord un plan, de le corriger, puis de faire rédiger chaque partie. On peut aussi demander à l'assistant de poser ses questions avant de commencer.
Enfin, il faut garder un regard critique. Un modèle de langage produit des réponses plausibles, pas nécessairement exactes. Pour les chiffres, les citations, les références juridiques ou médicales, la vérification auprès d'une source fiable reste indispensable. Bien utilisée, l'IA devient un excellent partenaire de réflexion ; mal utilisée, elle donne l'illusion d'un travail fait.`,
    quiz: [
      { q: 'Quelle est la première habitude recommandée ?', a: ['Écrire en anglais', 'Donner le contexte', 'Poser des questions courtes', 'Utiliser des mots-clés'], c: 1 },
      { q: 'Pourquoi fournir un exemple ?', a: ['Pour aller plus vite', 'Cela vaut souvent mieux qu\'une longue explication', 'C\'est obligatoire', 'Pour économiser des crédits'], c: 1 },
      { q: 'Que conseille le texte pour une tâche complexe ?', a: ['Tout demander en une fois', 'Procéder par étapes, en commençant par un plan', 'Changer d\'assistant', 'Éviter les questions'], c: 1 },
      { q: 'Que faut-il vérifier auprès d\'une source fiable ?', a: ['La mise en page', 'Les chiffres, citations et références', 'L\'orthographe', 'La longueur du texte'], c: 1 },
    ],
  },
  {
    id: 'traductions-bible', title: 'Les grandes traductions de la Bible', theme: 'Bible',
    text: `La Bible n'a pas été écrite en français, ni même dans une seule langue. L'Ancien Testament est rédigé principalement en hébreu, avec quelques passages en araméen, et le Nouveau Testament en grec. Son histoire est donc aussi une histoire de traductions.
La plus ancienne grande traduction est la Septante. Réalisée à partir du IIIe siècle avant notre ère à Alexandrie, en Égypte, elle met les Écritures hébraïques à la portée des Juifs de langue grecque. Son nom vient d'une tradition selon laquelle soixante-dix, ou soixante-douze, traducteurs y auraient travaillé. Les premiers chrétiens l'ont largement utilisée.
À la fin du IVe siècle, Jérôme entreprend une traduction latine, en partie directement depuis l'hébreu. Cette version, appelée plus tard la Vulgate, c'est-à-dire « la répandue », devient la Bible de référence de l'Occident pendant plus d'un millénaire.
Au XVIe siècle, la Réforme protestante insiste sur la lecture personnelle des Écritures. Martin Luther traduit la Bible en allemand ; son Nouveau Testament paraît en 1522. En Angleterre, la version dite du roi Jacques, publiée en 1611, marque durablement la langue anglaise.
En français, de nombreuses traductions se succèdent. Celle de Louis Segond, pasteur suisse, achevée à la fin du XIXe siècle, connaît un succès immense dans le monde protestant francophone ; sa version de 1910 est encore très lue. Au XXe siècle, la Bible de Jérusalem et la Traduction œcuménique de la Bible, fruit d'un travail commun entre catholiques et protestants, s'imposent à leur tour.`,
    quiz: [
      { q: 'En quelle langue le Nouveau Testament a-t-il été écrit ?', a: ['En hébreu', 'En latin', 'En grec', 'En araméen uniquement'], c: 2 },
      { q: 'Où la Septante a-t-elle été réalisée ?', a: ['À Rome', 'À Jérusalem', 'À Alexandrie', 'À Athènes'], c: 2 },
      { q: 'Qui est l\'auteur de la traduction latine appelée la Vulgate ?', a: ['Augustin', 'Jérôme', 'Luther', 'Érasme'], c: 1 },
      { q: 'Quelle traduction est le fruit d\'un travail commun entre catholiques et protestants ?', a: ['La Bible de Jérusalem', 'La Segond 1910', 'La Traduction œcuménique de la Bible', 'La version du roi Jacques'], c: 2 },
    ],
  },
  {
    id: 'qumran', title: 'Les manuscrits de la mer Morte', theme: 'Bible',
    text: `En 1947, des bergers bédouins qui cherchaient une chèvre égarée près de la mer Morte entrent dans une grotte des falaises de Qumrân. Ils y trouvent des jarres contenant de vieux rouleaux de cuir enveloppés de lin. Ils viennent de faire l'une des plus grandes découvertes archéologiques du XXe siècle.
Au cours des années suivantes, archéologues et bédouins explorent onze grottes et mettent au jour les restes de près de neuf cents manuscrits, souvent réduits à l'état de fragments. Ils ont été copiés entre le IIIe siècle avant notre ère et le Ier siècle de notre ère, la plupart en hébreu, certains en araméen ou en grec.
Environ un quart de ces textes sont des livres de la Bible hébraïque : on y retrouve tous les livres de l'Ancien Testament ou presque, à l'exception notable du livre d'Esther. Le plus célèbre est un rouleau complet du livre d'Ésaïe, long de plus de sept mètres. Avant cette découverte, les plus anciens manuscrits hébreux complets de la Bible dataient du Moyen Âge. Qumrân a fait reculer cette date d'environ mille ans.
La comparaison a montré que le texte avait été transmis avec une grande fidélité, même si certaines variantes existent. Les autres manuscrits, règles de vie communautaire, hymnes et commentaires, éclairent la diversité du judaïsme à l'époque de Jésus.
L'identité exacte de ceux qui ont caché ces rouleaux reste débattue ; beaucoup de chercheurs les rattachent au mouvement des Esséniens.`,
    quiz: [
      { q: 'En quelle année les premiers manuscrits ont-ils été découverts ?', a: ['En 1897', 'En 1947', 'En 1967', 'En 1987'], c: 1 },
      { q: 'Quel livre biblique est absent des manuscrits de Qumrân ?', a: ['Ésaïe', 'Les Psaumes', 'Esther', 'La Genèse'], c: 2 },
      { q: 'De combien d\'années la découverte a-t-elle fait reculer la date des plus anciens manuscrits hébreux ?', a: ['D\'environ cent ans', 'D\'environ mille ans', 'D\'environ trois mille ans', 'Elle n\'a rien changé'], c: 1 },
      { q: 'Quel est le manuscrit le plus célèbre ?', a: ['Un rouleau complet d\'Ésaïe', 'Un évangile inconnu', 'Une lettre de Paul', 'Un livre de Moïse en grec'], c: 0 },
    ],
  },
  {
    id: 'aristote', title: "Les trois leviers de la persuasion", theme: 'Éloquence',
    text: `Il y a plus de deux mille trois cents ans, le philosophe grec Aristote analysait déjà ce qui rend un discours convaincant. Dans sa Rhétorique, il distingue trois leviers, toujours enseignés aujourd'hui sous leurs noms grecs : l'ethos, le pathos et le logos.
L'ethos concerne l'orateur lui-même. Le public se laisse plus facilement convaincre par quelqu'un qui lui paraît compétent, honnête et bienveillant. Cette crédibilité se construit avant le discours, par la réputation, mais aussi pendant, par la tenue, la maîtrise du sujet et le respect montré envers l'auditoire.
Le pathos s'adresse aux émotions. Un chiffre sur la pauvreté touche moins qu'une histoire concrète, celle d'une famille ou d'une personne. Susciter l'indignation, l'espoir ou la fierté donne de l'énergie à un message. Mal dosé, le pathos devient cependant de la manipulation, et le public finit par s'en méfier.
Le logos, enfin, est la force de l'argument lui-même : la logique du raisonnement, les preuves, les exemples, les chiffres. C'est lui qui permet à une conviction de résister à l'examen, une fois l'émotion retombée.
Pour Aristote, un bon orateur combine les trois. Un discours purement logique peut ennuyer, un discours purement émotionnel peut paraître creux, et un orateur sans crédibilité ne sera pas écouté. Avant de prendre la parole, on peut donc se poser trois questions : pourquoi me croirait-on ? Qu'est-ce qui va toucher mon public ? Quelles preuves puis-je apporter ?`,
    quiz: [
      { q: 'Dans quel ouvrage Aristote analyse-t-il la persuasion ?', a: ['La Politique', 'La Rhétorique', 'La République', 'Les Confessions'], c: 1 },
      { q: 'À quoi correspond l\'ethos ?', a: ['Aux émotions', 'À la crédibilité de l\'orateur', 'À la logique', 'Au style'], c: 1 },
      { q: 'Quel risque le texte associe-t-il au pathos ?', a: ['L\'ennui', 'La manipulation s\'il est mal dosé', 'La longueur', 'Le manque de preuves'], c: 1 },
      { q: 'Qu\'est-ce que le logos ?', a: ['La force de l\'argument', 'La voix de l\'orateur', 'Le public', 'La conclusion'], c: 0 },
    ],
  },
  {
    id: 'trac', title: 'Apprivoiser le trac', theme: 'Éloquence',
    text: `Presque tout le monde ressent le trac avant de parler en public : cœur qui s'accélère, mains moites, voix qui tremble. Ces réactions ne sont pas un signe de faiblesse. Elles viennent d'un mécanisme ancien de l'organisme, qui libère de l'adrénaline face à une situation perçue comme un danger.
La bonne nouvelle est que cette énergie peut être utile. De nombreux comédiens et orateurs expérimentés disent avoir encore le trac ; ils ont simplement appris à le transformer en concentration. Plusieurs techniques y aident.
La respiration est la plus immédiate. Une expiration lente et longue, deux fois plus longue que l'inspiration, ralentit le rythme cardiaque. Quelques cycles avant de monter sur scène suffisent souvent à retrouver une voix stable.
La préparation réduit l'incertitude, principale source d'angoisse. Il ne s'agit pas d'apprendre son texte par cœur, ce qui expose au trou de mémoire, mais de maîtriser parfaitement son plan et ses premières phrases. Un début solide installe la confiance pour la suite.
La répétition à voix haute, idéalement devant une ou deux personnes ou face à une caméra, habitue le corps à la situation. L'enregistrement permet aussi de repérer ses tics et son débit.
Enfin, changer de regard sur le public aide beaucoup. L'auditoire n'est pas un jury qui attend l'erreur : il souhaite en général que l'orateur réussisse, car un bon discours est plus agréable à écouter. Chercher dans la salle quelques visages attentifs et leur parler comme à des amis rend l'exercice plus naturel.`,
    quiz: [
      { q: 'D\'où viennent les réactions du trac selon le texte ?', a: ['D\'un manque de talent', 'D\'une libération d\'adrénaline face à un danger perçu', 'D\'un manque de sommeil', 'D\'une mauvaise alimentation'], c: 1 },
      { q: 'Quelle technique de respiration est conseillée ?', a: ['Inspirer très vite', 'Retenir son souffle', 'Expirer deux fois plus longtemps qu\'on inspire', 'Respirer par la bouche'], c: 2 },
      { q: 'Pourquoi déconseiller d\'apprendre son texte par cœur ?', a: ['Cela prend trop de temps', 'Cela expose au trou de mémoire', 'C\'est interdit', 'Le public le remarque toujours'], c: 1 },
      { q: 'Comment le texte invite-t-il à voir le public ?', a: ['Comme un jury sévère', 'Comme des personnes qui souhaitent la réussite de l\'orateur', 'Comme des adversaires', 'Comme des élèves'], c: 1 },
    ],
  },
  {
    id: 'endurance', title: "L'endurance fondamentale", theme: 'Sport',
    text: `Beaucoup de coureurs débutants commettent la même erreur : ils courent toujours trop vite. Essoufflés au bout de quelques minutes, ils finissent leurs sorties épuisés et progressent peu. Les entraîneurs recommandent pourtant de passer la majorité du temps à une allure beaucoup plus lente, dite d'endurance fondamentale.
Cette allure se reconnaît facilement : on peut tenir une conversation en courant, en phrases complètes, sans chercher son souffle. Elle correspond, selon les personnes, à environ 65 à 75 % de la fréquence cardiaque maximale. Une montre équipée d'un capteur cardiaque permet de la contrôler, mais la sensation suffit souvent.
À cette intensité modérée, le corps développe ses fondations. Le cœur devient plus efficace et pompe plus de sang à chaque battement. Les muscles se dotent de davantage de capillaires et de mitochondries, ces petites centrales qui produisent l'énergie à partir de l'oxygène. L'organisme apprend aussi à mieux utiliser les graisses comme carburant. Ces adaptations sont lentes mais durables.
Les séances rapides, comme le fractionné, ont aussi leur place, mais en petite proportion. Beaucoup d'entraîneurs recommandent qu'environ 80 % du volume d'entraînement se fasse en endurance fondamentale et 20 % à intensité plus élevée.
Courir lentement présente un autre avantage : le risque de blessure diminue, et la récupération est plus rapide. Pour un coureur qui s'entraîne deux ou trois fois par semaine, c'est souvent la clé pour progresser des mois durant sans s'arrêter.`,
    quiz: [
      { q: 'Comment reconnaître l\'allure d\'endurance fondamentale ?', a: ['On est essoufflé', 'On peut tenir une conversation', 'On court au maximum', 'On marche'], c: 1 },
      { q: 'À quel pourcentage de la fréquence cardiaque maximale correspond-elle environ ?', a: ['40 à 50 %', '65 à 75 %', '85 à 95 %', '100 %'], c: 1 },
      { q: 'Quelle répartition de l\'entraînement le texte mentionne-t-il ?', a: ['50 % / 50 %', '80 % lent / 20 % intense', '20 % lent / 80 % intense', '100 % intense'], c: 1 },
      { q: 'Que sont les mitochondries ?', a: ['Des muscles du dos', 'De petites centrales qui produisent l\'énergie', 'Des vaisseaux sanguins', 'Des globules rouges'], c: 1 },
    ],
  },
  {
    id: 'ebbinghaus', title: "La courbe de l'oubli", theme: 'Apprendre',
    text: `À la fin du XIXe siècle, le psychologue allemand Hermann Ebbinghaus mena sur lui-même une série d'expériences devenues célèbres. Pour étudier la mémoire sans être influencé par le sens des mots, il apprit par cœur des listes de syllabes sans signification, comme « dax » ou « bok », puis mesura combien il en retenait après quelques minutes, quelques heures ou quelques jours.
Ses résultats, publiés en 1885, ont donné naissance à la « courbe de l'oubli ». L'oubli est très rapide au début : une grande partie de ce que l'on vient d'apprendre disparaît dans les heures qui suivent. Puis la courbe s'aplatit, et ce qui reste s'efface beaucoup plus lentement.
Ebbinghaus fit une seconde découverte, plus encourageante. Réapprendre une liste déjà oubliée demande moins d'efforts que la première fois : une trace subsiste. Surtout, chaque révision ralentit l'oubli suivant. En répartissant les révisions dans le temps plutôt qu'en les concentrant, on retient beaucoup plus pour le même effort. C'est ce que les chercheurs appellent l'effet d'espacement.
Ces principes ont été confirmés par de nombreuses études depuis. Ils sont à la base des méthodes de répétition espacée, utilisées par les étudiants en médecine, les apprenants en langues ou les candidats aux concours. Une notion est revue juste avant d'être oubliée, à intervalles de plus en plus longs : le lendemain, trois jours plus tard, une semaine, un mois.
Un autre effet complète le tableau : se tester est plus efficace que relire. Chercher activement une réponse dans sa mémoire la renforce davantage que la reconnaître dans un texte.`,
    quiz: [
      { q: 'Qu\'apprenait Ebbinghaus dans ses expériences ?', a: ['Des poèmes', 'Des syllabes sans signification', 'Des numéros de téléphone', 'Des langues étrangères'], c: 1 },
      { q: 'Comment évolue l\'oubli selon la courbe ?', a: ['Lentement puis vite', 'Très vite au début puis plus lentement', 'De façon régulière', 'Il n\'y a pas d\'oubli'], c: 1 },
      { q: 'Qu\'est-ce que l\'effet d\'espacement ?', a: ['Réviser tout la veille', 'Répartir les révisions dans le temps pour mieux retenir', 'Laisser des espaces dans ses notes', 'Apprendre en marchant'], c: 1 },
      { q: 'Qu\'est-ce qui est plus efficace que relire ?', a: ['Surligner', 'Se tester', 'Recopier', 'Écouter de la musique'], c: 1 },
    ],
  },
  {
    id: 'piano', title: "La naissance du piano", theme: 'Musique',
    text: `Au début du XVIIIe siècle, les musiciens disposent de deux grands instruments à clavier. L'orgue, puissant, est réservé aux églises. Le clavecin, très répandu, a un défaut : ses cordes sont pincées par un petit bec, et le son a toujours la même force, quelle que soit la façon dont on enfonce la touche.
Vers 1700, à Florence, un facteur d'instruments au service des Médicis, Bartolomeo Cristofori, met au point un mécanisme nouveau. Les cordes ne sont plus pincées mais frappées par des marteaux recouverts de cuir, qui retombent aussitôt pour laisser la corde vibrer. Selon la force avec laquelle on appuie, le son est doux ou fort. L'instrument est d'ailleurs baptisé « gravicembalo col piano e forte », clavecin avec le doux et le fort, d'où viendront les noms de pianoforte puis de piano.
L'invention se diffuse lentement. Au cours du XVIIIe siècle, des facteurs allemands, autrichiens puis anglais l'améliorent. Mozart compose pour des pianofortes viennois légers, au son clair. Beethoven réclame des instruments toujours plus puissants, au registre plus étendu, et ses sonates en exploitent toutes les possibilités.
Au XIXe siècle, le piano devient l'instrument roi. Le cadre en fonte permet de tendre davantage les cordes, le double échappement facilite les notes répétées rapidement, et le clavier atteint progressivement les 88 touches devenues la norme. Liszt et Chopin en font l'instrument de la virtuosité et de l'intimité à la fois, et le piano entre dans les salons de la bourgeoisie, où il restera longtemps un symbole d'éducation.`,
    quiz: [
      { q: 'Quel était le défaut du clavecin ?', a: ['Il était trop grand', 'Le son avait toujours la même force', 'Il n\'avait pas de clavier', 'Il ne jouait que des notes graves'], c: 1 },
      { q: 'Qui a inventé le piano ?', a: ['Jean-Sébastien Bach', 'Bartolomeo Cristofori', 'Wolfgang Amadeus Mozart', 'Antonio Stradivari'], c: 1 },
      { q: 'D\'où vient le nom « piano » ?', a: ['Du nom de son inventeur', 'D\'une expression signifiant « le doux et le fort »', 'D\'une ville italienne', 'Du bois utilisé'], c: 1 },
      { q: 'Combien de touches compte le clavier devenu la norme ?', a: ['61', '76', '88', '100'], c: 2 },
    ],
  },
];
