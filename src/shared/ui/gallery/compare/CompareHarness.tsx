/** Dev-only fidelity harness (spec 002 FR-005a, T018).
 *
 *  Renders the designer's original component from the vendored source beside
 *  the ported one, so `scripts/compare-fidelity.mjs` can read `getComputedStyle`
 *  from both and diff them. A screenshot comparison cannot catch a 500-weight
 *  that should be 700, or 11.5px rendered as 12px; this can.
 *
 *  The source components reference the original token names (`--brand-primary`,
 *  `--text-primary`), which the port renamed, so the original token files are
 *  loaded alongside the theme. Both sets coexist without collision. */
import { StatusPills } from '@ds/components/data-display/StatusPills.jsx';
import { SupplyCard as SourceSupplyCard } from '@ds/components/data-display/SupplyCard.jsx';
import { Search as SourceSearch } from '@ds/components/forms/Search.jsx';
import { Backdrop as SourceBackdrop } from '@ds/components/overlay/Backdrop.jsx';
import { ButtonTemplate as SourceButtonTemplate } from '@ds/components/actions/ButtonTemplate.jsx';
import { ButtonWithIcon as SourceButtonWithIcon } from '@ds/components/actions/ButtonWithIcon.jsx';
import { SignInButton as SourceSignInButton } from '@ds/components/actions/SignInButton.jsx';
import { CoDevSupplyRequestsLogo as SourceLockup } from '@ds/components/brand/CoDevSupplyRequestsLogo.jsx';

import '@ds/tokens/colors.css';
import '@ds/tokens/typography.css';
import '@ds/tokens/spacing.css';
import '@ds/tokens/elevation.css';

import {
  Search,
  StatusPill,
  SupplyCard,
  ButtonTemplate,
  ButtonWithIcon,
  SignInButton,
  CoDevSupplyRequestsLogo,
} from '../../index';

function Pair({ name, source, port }: { name: string; source: React.ReactNode; port: React.ReactNode }) {
  return (
    <div data-cmp={name} className="flex flex-col gap-8 border-t border-line-default pt-16">
      <span className="type-eyebrow uppercase text-ink-secondary">{name}</span>
      {/* Each side gets its own full-width block rather than sharing a flex row.
          In a row, a fluid component cannot reach its natural width and the
          comparison reads a shrunken value instead of a real difference. */}
      <div className="flex flex-col gap-32">
        <div data-side="source" className="flex w-full flex-col items-start gap-4">
          <span data-label className="font-sans text-11 text-ink-muted">source</span>
          {source}
        </div>
        <div data-side="port" className="flex w-full flex-col items-start gap-4">
          <span data-label className="font-sans text-11 text-ink-muted">port</span>
          {port}
        </div>
      </div>
    </div>
  );
}

export function CompareHarness() {
  return (
    <div className="flex min-h-screen flex-col gap-28 bg-surface-page p-32">
      <h1 className="type-page-title text-ink-heading">Fidelity comparison</h1>
      <p className="type-body max-w-[70ch] text-ink-body">
        Left is the designer's component from <code>design-system/</code>. Right is the port. Run{' '}
        <code>node scripts/compare-fidelity.mjs</code> to diff computed styles.
      </p>

      <Pair
        name="StatusPill / pending"
        source={<StatusPills status="Pending Approval" />}
        port={<StatusPill status="Pending Approval" />}
      />
      <Pair
        name="StatusPill / rejected"
        source={<StatusPills status="Rejected" />}
        port={<StatusPill status="Rejected" />}
      />
      <Pair
        name="StatusPill / availability"
        source={<StatusPills availability="unavailable" />}
        port={<StatusPill availability="unavailable" />}
      />
      <Pair name="Search" source={<SourceSearch />} port={<Search />} />
      <Pair
        name="SupplyCard"
        source={<SourceSupplyCard />}
        port={<SupplyCard />}
      />
      <Pair name="ButtonTemplate" source={<SourceButtonTemplate />} port={<ButtonTemplate />} />
      <Pair name="ButtonTemplate / saved" source={<SourceButtonTemplate state="saved" />} port={<ButtonTemplate state="saved" />} />
      <Pair name="ButtonWithIcon" source={<SourceButtonWithIcon />} port={<ButtonWithIcon />} />
      <Pair name="SignInButton" source={<SourceSignInButton />} port={<SignInButton />} />
      <Pair name="SignInButton / light" source={<SourceSignInButton darkmode={false} />} port={<SignInButton darkmode={false} />} />
      <Pair name="Lockup" source={<SourceLockup />} port={<CoDevSupplyRequestsLogo />} />
      <Pair
        name="Backdrop"
        source={<div className="relative h-[80px] w-[160px]"><SourceBackdrop /></div>}
        port={<div className="relative h-[80px] w-[160px]"><div className="absolute inset-0 bg-backdrop" /></div>}
      />
    </div>
  );
}
