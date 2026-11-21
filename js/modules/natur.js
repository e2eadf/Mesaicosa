// Naturalisation : entraînement à l'examen civique (mention naturalisation) et à l'entretien d'assimilation.
import { mountQuiz } from '../quiz.js';
import { NAT_QUESTIONS, NAT_TOPICS } from '../content-natur.js';

export const mount = (el, api) => mountQuiz(el, api, {
  bank: NAT_QUESTIONS, topics: NAT_TOPICS, prefix: 'nat', shuffleOptions: true, lang: 'fr',
  counts: [[10, '10'], [20, '20'], [40, '40']],
  exam: { n: 40, minutes: 45, pass: 32, label: 'Examen blanc (40 questions, 45 min)' },
  intro: `<p class="small muted">L'examen civique (obligatoire depuis 2026 pour la naturalisation) est un QCM de 40 questions en 45 minutes sur cinq thèmes, avec 28 questions de connaissance et 12 mises en situation ; il faut 32 bonnes réponses (80 %). Ces questions d'entraînement ont été rédigées pour l'app à partir des thèmes officiels : complète avec le livret du citoyen et la liste officielle publiée par le ministère de l'Intérieur.</p>`,
});
