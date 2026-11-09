// Textes originaux pour la dactylographie et la lecture rapide.
export const TYPING_TEXTS = [
  "Le temps est la seule ressource que l'on ne peut ni stocker ni racheter. Organiser sa semaine, c'est décider à l'avance de ce qui compte vraiment, puis protéger ces créneaux comme on protège un rendez-vous important.",
  "Un portefeuille diversifié répartit le risque entre plusieurs classes d'actifs : actions, obligations, immobilier et liquidités. L'objectif n'est pas d'éliminer la volatilité, mais de la rendre supportable sur la durée de placement choisie.",
  "Le Danube traverse dix pays avant de se jeter dans la mer Noire. Vienne, Bratislava, Budapest et Belgrade se sont développées sur ses rives, ce qui en fait le fleuve qui arrose le plus de capitales au monde.",
  "La régularité bat l'intensité. Vingt minutes d'entraînement chaque jour produisent davantage de progrès qu'une séance de trois heures le dimanche, parce que le cerveau consolide ses apprentissages pendant le sommeil.",
  "Un modèle de langage prédit le mot suivant à partir de tout ce qui précède. Entraîné sur d'immenses quantités de textes, il apprend la grammaire, des faits et des façons de raisonner, sans qu'aucune règle ne lui soit écrite à la main.",
  "En course à pied, l'endurance fondamentale se travaille à une allure où l'on peut tenir une conversation. C'est elle qui développe le cœur et les capillaires, et qui permet ensuite de supporter des séances plus rapides.",
  "« Car là où est ton trésor, là aussi sera ton cœur. » Ce verset de l'Évangile selon Matthieu invite à regarder où l'on place son temps, son argent et son attention, car ils révèlent ce qui nous tient réellement à cœur.",
  "Un bon discours tient en une phrase. Avant d'écrire, il faut pouvoir résumer son message à un ami en dix secondes ; tout le reste, exemples, chiffres et anecdotes, ne sert qu'à rendre cette phrase inoubliable.",
  "L'excédent brut d'exploitation mesure la richesse dégagée par l'activité courante, avant amortissements, frais financiers et impôts. Rapporté au chiffre d'affaires, il permet de comparer la rentabilité d'entreprises de tailles différentes.",
  "Le 14 juillet 1789, la prise de la Bastille marque le début symbolique de la Révolution française. Moins d'un mois plus tard, dans la nuit du 4 août, l'Assemblée abolit les privilèges.",
  "Travailler lentement est le moyen le plus rapide de progresser au piano. En jouant un passage difficile à mi-vitesse, sans erreur, on grave le bon geste ; accélérer ensuite devient presque naturel.",
  "Mens sana in corpore sano : un esprit sain dans un corps sain. La formule vient du poète latin Juvénal, qui l'employait pour dire ce qu'il est raisonnable de demander aux dieux.",
];

export const READING_TEXTS = [
  {
    id: 'interets', title: 'La magie des intérêts composés', theme: 'Finance',
    text: `Placer de l'argent à intérêts simples, c'est toucher chaque année le même montant, calculé sur la somme de départ. Avec les intérêts composés, les intérêts gagnés sont réinvestis et produisent à leur tour des intérêts. La différence paraît minime au début, puis elle devient spectaculaire avec le temps.
Prenons 10 000 euros placés à 5 % par an. Avec des intérêts simples, on gagne 500 euros chaque année : au bout de trente ans, le capital atteint 25 000 euros. Avec des intérêts composés, la deuxième année rapporte 525 euros, la troisième un peu plus de 551 euros, et ainsi de suite. Au bout de trente ans, le capital dépasse 43 000 euros, soit plus de quatre fois la mise initiale.
Les financiers utilisent une astuce pour estimer ce phénomène : la règle de 72. En divisant 72 par le taux d'intérêt annuel, on obtient approximativement le nombre d'années nécessaires pour doubler son capital. À 5 %, il faut un peu plus de quatorze ans ; à 8 %, seulement neuf ans.
Cette mécanique explique pourquoi le facteur le plus puissant d'un placement de long terme n'est pas toujours le montant investi, mais la durée. Commencer dix ans plus tôt peut compter davantage que doubler ses versements. Elle fonctionne aussi dans l'autre sens : une dette dont les intérêts s'accumulent sans être remboursés grossit selon la même logique, ce qui rend les crédits renouvelables particulièrement dangereux.`,
    quiz: [
      { q: 'Que se passe-t-il avec des intérêts composés ?', a: ['Les intérêts sont versés une seule fois', 'Les intérêts gagnés produisent eux-mêmes des intérêts', 'Le taux augmente chaque année', 'Le capital est garanti par l\'État'], c: 1 },
      { q: 'Combien vaut environ 10 000 € placés 30 ans à 5 % composés ?', a: ['25 000 €', '30 000 €', 'Plus de 43 000 €', '100 000 €'], c: 2 },
      { q: 'Selon la règle de 72, combien de temps faut-il pour doubler un capital à 8 % ?', a: ['Environ 6 ans', 'Environ 9 ans', 'Environ 14 ans', 'Environ 20 ans'], c: 1 },
      { q: 'Quel facteur le texte présente-t-il comme le plus puissant sur le long terme ?', a: ['Le montant investi', 'La durée du placement', 'Le choix de la banque', 'La fiscalité'], c: 1 },
    ],
  },
  {
    id: 'danube', title: 'Le Danube, fleuve des capitales', theme: 'Géographie',
    text: `Le Danube prend sa source dans la Forêt-Noire, en Allemagne, et parcourt près de 2 850 kilomètres avant de se jeter dans la mer Noire. C'est le deuxième plus long fleuve d'Europe après la Volga. Il traverse ou longe dix pays : l'Allemagne, l'Autriche, la Slovaquie, la Hongrie, la Croatie, la Serbie, la Roumanie, la Bulgarie, la Moldavie et l'Ukraine. Aucun autre fleuve au monde n'en traverse autant.
Quatre capitales se sont développées sur ses rives : Vienne, Bratislava, Budapest et Belgrade. À Budapest, le fleuve sépare deux villes historiques, Buda sur la rive droite, perchée sur des collines, et Pest sur la rive gauche, plus plate, qui ne furent réunies qu'en 1873.
Pendant des siècles, le Danube a servi de frontière. Les Romains en avaient fait la limite nord de leur empire, jalonnée de camps militaires dont certains sont devenus des villes. Plus tard, il est devenu une grande voie commerciale : depuis l'ouverture du canal Rhin-Main-Danube en 1992, un bateau peut relier la mer du Nord à la mer Noire en traversant le continent.
Avant de rejoindre la mer, le fleuve forme un immense delta partagé entre la Roumanie et l'Ukraine. Ces marais, roselières et canaux abritent plusieurs centaines d'espèces d'oiseaux, et le delta est inscrit au patrimoine mondial de l'Unesco.`,
    quiz: [
      { q: 'Où le Danube prend-il sa source ?', a: ['Dans les Alpes suisses', 'Dans la Forêt-Noire', 'Dans les Carpates', 'En Bohême'], c: 1 },
      { q: 'Lequel de ces pays le Danube ne traverse-t-il pas ?', a: ['Hongrie', 'Serbie', 'Pologne', 'Bulgarie'], c: 2 },
      { q: 'Quelle capitale n\'est pas sur le Danube ?', a: ['Vienne', 'Prague', 'Budapest', 'Belgrade'], c: 1 },
      { q: 'Que permet le canal Rhin-Main-Danube depuis 1992 ?', a: ['Relier la mer du Nord à la mer Noire', 'Irriguer la plaine hongroise', 'Produire de l\'électricité', 'Relier Vienne à Venise'], c: 0 },
    ],
  },
  {
    id: 'llm', title: 'Comment apprend un modèle de langage', theme: 'IA',
    text: `Un modèle de langage comme ceux qui animent les assistants conversationnels repose sur une idée simple : prédire la suite d'un texte. On lui présente un début de phrase, il calcule pour chaque mot possible la probabilité qu'il vienne ensuite, puis il en choisit un, et recommence.
Pour devenir bon à cet exercice, le modèle est d'abord entraîné sur d'immenses quantités de textes. À chaque erreur de prédiction, ses milliards de paramètres sont légèrement ajustés. Personne ne lui écrit de règles de grammaire ni de listes de faits : ces connaissances émergent parce qu'elles sont utiles pour bien prédire. Pour compléter « La capitale de l'Italie est », il faut avoir retenu que c'est Rome.
Les textes ne sont pas découpés en mots mais en jetons, des morceaux de mots fréquents. L'architecture la plus répandue, appelée transformeur, utilise un mécanisme d'attention : pour traiter chaque jeton, le modèle regarde tous les autres et pondère ceux qui comptent le plus pour comprendre le contexte.
Cette première phase produit un modèle qui sait compléter des textes, mais pas forcément suivre des consignes. Une seconde phase, souvent appelée affinage, l'entraîne sur des exemples de conversations et sur des retours humains indiquant quelles réponses sont les plus utiles et les plus sûres.
Comprendre ce fonctionnement aide à mieux s'en servir : un modèle produit des réponses plausibles, ce qui le rend très fort pour rédiger ou synthétiser, mais impose de vérifier les faits importants.`,
    quiz: [
      { q: 'Quelle est la tâche de base d\'un modèle de langage ?', a: ['Traduire des textes', 'Prédire la suite d\'un texte', 'Chercher sur internet', 'Corriger l\'orthographe'], c: 1 },
      { q: 'Comment le modèle acquiert-il ses connaissances ?', a: ['Des experts lui écrivent des règles', 'Il les déduit en apprenant à bien prédire', 'Il consulte une encyclopédie en direct', 'Il les reçoit d\'une base de données'], c: 1 },
      { q: 'Que fait le mécanisme d\'attention ?', a: ['Il réduit la consommation d\'énergie', 'Il pondère les jetons les plus utiles au contexte', 'Il filtre les contenus dangereux', 'Il traduit les jetons en mots'], c: 1 },
      { q: 'À quoi sert la phase d\'affinage ?', a: ['À apprendre à suivre des consignes et être utile', 'À augmenter la vitesse', 'À ajouter des langues', 'À supprimer des paramètres'], c: 0 },
    ],
  },
  {
    id: 'gutenberg', title: "Gutenberg et l'imprimerie", theme: 'Histoire',
    text: `Au milieu du XVe siècle, à Mayence, en Allemagne, Johannes Gutenberg met au point un procédé qui va transformer l'Europe : l'imprimerie à caractères mobiles en métal. L'idée de caractères mobiles n'était pas totalement nouvelle, puisqu'elle existait déjà en Asie, mais Gutenberg réunit plusieurs innovations en un système efficace.
Il invente un moule permettant de fondre rapidement des lettres identiques dans un alliage de plomb, d'étain et d'antimoine. Il adapte une presse à vis, inspirée de celles qui servaient à presser le raisin, et met au point une encre grasse qui adhère bien au métal.
Son œuvre la plus célèbre est une Bible en latin, imprimée vers 1455, appelée Bible à quarante-deux lignes en raison du nombre de lignes par colonne. Environ cent quatre-vingts exemplaires auraient été produits, sur papier et sur parchemin ; une cinquantaine subsistent aujourd'hui, ce qui en fait l'un des livres les plus précieux au monde.
Les conséquences sont immenses. En quelques décennies, des ateliers d'imprimerie s'ouvrent dans des centaines de villes européennes. Le prix des livres baisse, les textes se diffusent plus vite et de façon plus fidèle qu'avec la copie à la main. Au siècle suivant, l'imprimerie jouera un rôle décisif dans la diffusion de la Réforme protestante et des idées scientifiques.
Gutenberg lui-même ne s'enrichit pas : un procès avec son associé lui fait perdre une partie de son matériel, et il meurt en 1468 sans avoir mesuré l'ampleur de la révolution qu'il avait lancée.`,
    quiz: [
      { q: 'Dans quelle ville Gutenberg a-t-il développé son procédé ?', a: ['Paris', 'Mayence', 'Venise', 'Strasbourg'], c: 1 },
      { q: 'Pourquoi parle-t-on de « Bible à quarante-deux lignes » ?', a: ['Elle a 42 pages', 'Elle compte 42 lignes par colonne', 'Elle a été imprimée en 1442', 'Elle comporte 42 livres'], c: 1 },
      { q: 'Combien d\'exemplaires subsistent environ aujourd\'hui ?', a: ['Une dizaine', 'Une cinquantaine', 'Environ cent quatre-vingts', 'Plus de mille'], c: 1 },
      { q: 'De quoi s\'est inspirée la presse de Gutenberg ?', a: ['Des presses à raisin', 'Des métiers à tisser', 'Des moulins à eau', 'Des tampons chinois'], c: 0 },
    ],
  },
  {
    id: 'sommeil', title: 'Le sommeil, allié de la mémoire', theme: 'Apprendre',
    text: `On croit souvent que l'on apprend surtout au moment où l'on étudie. En réalité, une grande partie du travail se fait plus tard, pendant le sommeil. Les chercheurs appellent ce phénomène la consolidation : les souvenirs fragiles de la journée sont stabilisés et réorganisés pendant la nuit.
Au cours de la journée, les nouvelles informations sont d'abord enregistrées par l'hippocampe, une structure du cerveau qui fonctionne comme une mémoire tampon. Pendant le sommeil lent profond, surtout en début de nuit, l'hippocampe « rejoue » les expériences récentes et les transmet progressivement au cortex, où elles sont stockées durablement et reliées aux connaissances existantes.
Le sommeil paradoxal, plus abondant en fin de nuit, semble jouer un rôle complémentaire, notamment pour les apprentissages de gestes et pour l'établissement de liens nouveaux entre des idées. C'est une raison de ne pas raccourcir systématiquement ses nuits par la fin : les dernières heures ne sont pas les moins utiles.
Plusieurs études montrent qu'après une nuit de sommeil, on retient mieux une liste de mots ou un morceau de piano qu'après le même temps passé éveillé. À l'inverse, une nuit blanche réduit fortement la capacité à mémoriser le lendemain.
Pour celui qui veut progresser, la conclusion est pratique : répartir ses séances sur plusieurs jours, réviser brièvement le soir ce que l'on veut retenir, et protéger ses heures de sommeil. Une courte sieste peut aussi aider à consolider ce qui a été appris le matin.`,
    quiz: [
      { q: 'Comment appelle-t-on la stabilisation des souvenirs pendant la nuit ?', a: ['La répétition', 'La consolidation', 'La compression', 'L\'encodage'], c: 1 },
      { q: 'Quel est le rôle de l\'hippocampe selon le texte ?', a: ['Stocker définitivement les souvenirs', 'Servir de mémoire tampon pour les informations nouvelles', 'Réguler la température', 'Produire les rêves'], c: 1 },
      { q: 'Quand le sommeil paradoxal est-il le plus abondant ?', a: ['En début de nuit', 'En fin de nuit', 'Pendant la sieste uniquement', 'Il est constant'], c: 1 },
      { q: 'Quel conseil pratique le texte donne-t-il ?', a: ['Étudier tard la nuit', 'Répartir les séances sur plusieurs jours', 'Supprimer la sieste', 'Tout réviser la veille'], c: 1 },
    ],
  },
];
