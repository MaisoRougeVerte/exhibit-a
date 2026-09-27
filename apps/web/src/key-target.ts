/**
 * True when a key event comes from a link or button other than `own`: page-wide shortcuts
 * must leave Enter and Space to the control that has focus.
 */
export function fromOtherControl(event: KeyboardEvent, own: Element | null = null): boolean {
  if (!(event.target instanceof Element)) return false;
  const control = event.target.closest("a, button");
  return control !== null && control !== own;
}
