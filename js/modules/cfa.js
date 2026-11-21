// Finance – mini-cas pratiques dans le style de l'examen CFA (à faire à la maison).
import { mountQuiz } from '../quiz.js';
import { CASES, CASE_TOPICS } from '../cases-finance.js';

export const mount = (el, api) => mountQuiz(el, api, {
  bank: CASES, topics: CASE_TOPICS, prefix: 'cfa', shuffleOptions: false, lang: 'en',
  counts: [[5, '5'], [10, '10'], [20, '20']],
  exam: null,
  intro: `<p class="small muted">Mini-cases in the style of CFA® exam items (three options, one correct answer), with a worked explanation after each answer. Keep a calculator at hand: this module is meant for home, not for the train. <span class="tiny">Original questions; CFA® is a trademark of CFA Institute.</span></p>`,
});
