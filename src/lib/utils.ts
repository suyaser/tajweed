import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our theme (src/styles/app.css) so `text-body-md` is a font size, not a colour, etc.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'label', 'body-md', 'body-lg', 'headline-md', 'headline-lg', 'arabic-label', 'arabic-body', 'arabic-headline', 'quran'],
      spacing: ['space-xs', 'space-sm', 'space-md', 'space-lg', 'space-xl', 'gutter', 'gutter-md', 'gutter-lg', 'target'],
      radius: ['control', 'card'],
      shadow: ['card', 'bar'],
      font: ['ui', 'arabic', 'naskh', 'quran'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
