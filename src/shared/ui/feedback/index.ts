/** The shell's feedback surfaces (spec 003 FR-011, FR-012, FR-018, FR-019,
 *  FR-020). None is drawn in the design file; all are recorded in
 *  docs/design-system/additions.md.
 *
 *  They take their route back as an `action` node rather than importing the
 *  router, so the component library stays free of routing. */
export { Notice, type NoticeTone } from './Notice';
export { EmptyState } from './EmptyState';
export { ToastProvider } from './ToastProvider';
export { useToast, type Toaster, type ToastInput, type ToastTone } from './toast-context';
export { usePanelTask, type TaskCopy, type TaskResult } from './use-panel-task';
export {
  Skeleton,
  SkeletonRegion,
  SkeletonRows,
  SupplyCardSkeleton,
  FieldSkeleton,
  type SkeletonCell,
} from './Skeleton';
export { NotFoundScreen } from './NotFoundScreen';
export { ForbiddenScreen } from './ForbiddenScreen';
export { Placeholder } from './Placeholder';
export { ErrorBoundary } from './ErrorBoundary';
