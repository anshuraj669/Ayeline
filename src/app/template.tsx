import { ViewTransition } from "react";

/**
 * Re-mounts on every navigation, so each page enters and leaves as one piece. Going into
 * an item slides forward and coming back slides back (see `transitionTypes` on links);
 * other navigations open like a window coming toward you. Named elements inside, such as
 * an item's title, morph from page to page on their own.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const motion = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page" };
  return (
    <ViewTransition enter={motion} exit={motion} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
