import type { Task } from '../types'

// Production tasks (TCF Canada style: describe / narrate / argue)
export const TASKS: Task[] = [
  {
    id: 't1',
    type: 'describe',
    label: 'ОПИС',
    words: '60-120 слів',
    fr: 'Décrivez votre travail actuel : vos tâches, vos horaires, ce que vous aimez ou non.',
    ua: 'Опишіть вашу роботу: обов\'язки, графік, що подобається чи ні.',
  },
  {
    id: 't2',
    type: 'describe',
    label: 'ОПИС',
    words: '60-120 слів',
    fr: 'Décrivez votre logement : le quartier, les pièces, ce qui vous plaît.',
    ua: 'Опишіть своє житло: район, кімнати, що подобається.',
  },
  {
    id: 't3',
    type: 'narrate',
    label: 'РОЗПОВІДЬ',
    words: '120-150 слів',
    fr: 'Racontez un changement important dans votre vie récemment et comment vous vous êtes senti.',
    ua: 'Розкажіть про важливу зміну у вашому житті нещодавно і як ви себе почували.',
  },
  {
    id: 't4',
    type: 'narrate',
    label: 'РОЗПОВІДЬ',
    words: '120-150 слів',
    fr: "Racontez un voyage ou un road trip que vous avez fait. Que s'est-il passé ?",
    ua: 'Розкажіть про подорож чи роуд-трип. Що сталося?',
  },
  {
    id: 't5',
    type: 'argue',
    label: 'АРГУМЕНТ',
    words: '120-180 слів',
    fr: 'Certains pensent que le télétravail est meilleur que le travail au bureau. Donnez votre opinion avec des arguments.',
    ua: 'Дехто вважає, що віддалена робота краща за офісну. Висловіть свою думку з аргументами.',
  },
  {
    id: 't6',
    type: 'argue',
    label: 'АРГУМЕНТ',
    words: '120-180 слів',
    fr: "Pensez-vous qu'il est important d'apprendre une nouvelle langue à l'âge adulte ? Justifiez votre réponse.",
    ua: 'Чи важливо вивчати нову мову у дорослому віці? Обґрунтуйте відповідь.',
  },
]
