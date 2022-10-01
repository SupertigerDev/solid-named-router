// Thanks to vuejs router
export function guardEvent(e: MouseEvent) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return;
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return;
  // don't redirect if `target="_blank"`
  // @ts-expect-error getAttribute does exist
  if (e.currentTarget && e.currentTarget.getAttribute) {
    // @ts-expect-error getAttribute exists
    const target = e.currentTarget.getAttribute("target");
    if (/\b_blank\b/i.test(target)) return;
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) e.preventDefault();

  return true;
}

export const removeTrailingSlash = (path: string) => {
  if (!path.endsWith("/")) return path;
  if (path.length === 1) return path;
  return path.substring(-1, path.length - 1);
};
