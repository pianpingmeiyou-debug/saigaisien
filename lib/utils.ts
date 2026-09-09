/** このファイルの役割と主要な処理フローを、実装の近くにコメントで説明しています。 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
