/** The OSRS component library. Import from here, never from a component's
 *  own path — that is what the design system's adherence lint enforces. */

// Brand
export { CoDevRedMasterLogo, CoDevWhiteMasterLogo, CoDevSupplyRequestsLogo } from './brand/logos';

// Actions
export { Button, type ButtonVariant } from './actions/Button';
export { ButtonTemplate, ButtonWithIcon, SignInButton } from './actions/imported';

// Forms
export { Search } from './forms/Search';
export { Select } from './forms/Select';

// Data display
export { StatusPill } from './data-display/StatusPill';
export { SupplyCard } from './data-display/SupplyCard';
export { SummaryCard, TableCard, TableHead } from './data-display/cards';

// Overlay
export { Backdrop } from './overlay/Backdrop';

// Layout
export { TopBar, type NavItem } from './layout/TopBar';
export { Avatar } from './layout/Avatar';
export { PageHeader, SectionTitle } from './layout/headings';

// Feedback (spec 003 — the shell's loading, refusal, not-found, placeholder
// and failure surfaces; none is drawn in the source, all are in additions.md)
export {
  Notice,
  type NoticeTone,
  LoadingState,
  NotFoundScreen,
  RecordUnavailableScreen,
  ForbiddenScreen,
  Placeholder,
  ErrorBoundary,
} from './feedback';

// Icons
export { MdiLightClipboardText } from './icons/MdiLightClipboardText';
export { MdiLightBell } from './icons/MdiLightBell';
export { MdiClipboardTextOutline } from './icons/MdiClipboardTextOutline';
export { ArrowCircleDownFill } from './icons/ArrowCircleDownFill';
export { ArrowCounterClockwise } from './icons/ArrowCounterClockwise';
export { CaretRight } from './icons/CaretRight';
export { CheckCircleFill } from './icons/CheckCircleFill';
export { GoogleIcon, type GoogleIconSize } from './icons/GoogleIcon';
export { MdiChevronDown } from './icons/MdiChevronDown';

// Status vocabulary
export {
  REQUEST_STATUSES,
  STOCK_STATUSES,
  AVAILABILITIES,
  REQUEST_TONE,
  STOCK_TONE,
  HANDOVERS,
  HANDOVER_LABEL,
  type Handover,
  type RequestStatus,
  type StockStatus,
  type Availability,
  type StatusTone,
} from './status';
