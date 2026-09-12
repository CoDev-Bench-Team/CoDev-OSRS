import { Gallery } from './shared/ui/gallery/Gallery';

/** Spec 002 delivers the component library, not product screens, and FR-016
 *  forbids routing here. So the gallery is simply what the app renders; its
 *  sections are reached by in-page anchors. Spec 003 replaces this with the
 *  routed shell. */
export default function App() {
  return <Gallery />;
}
