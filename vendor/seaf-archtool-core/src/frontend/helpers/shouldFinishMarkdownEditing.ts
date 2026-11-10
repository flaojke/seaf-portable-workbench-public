export function shouldFinishMarkdownEditing(
  isEditing: boolean,
  currentTarget: HTMLElement,
  relatedTarget: Node | null
): boolean {
  return isEditing && !(relatedTarget && currentTarget.contains(relatedTarget));
}
