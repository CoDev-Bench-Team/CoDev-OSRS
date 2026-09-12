import { useState } from 'react';
import { Section, Row, Swatch } from './Shell';
import {
  ArrowCircleDownFill,
  ArrowCounterClockwise,
  Avatar,
  Backdrop,
  Button,
  ButtonTemplate,
  ButtonWithIcon,
  CaretRight,
  CheckCircleFill,
  CoDevRedMasterLogo,
  CoDevSupplyRequestsLogo,
  CoDevWhiteMasterLogo,
  GoogleIcon,
  MdiClipboardTextOutline,
  MdiLightClipboardText,
  PageHeader,
  REQUEST_STATUSES,
  STOCK_STATUSES,
  Search,
  SignInButton,
  StatusPill,
  SummaryCard,
  SupplyCard,
  TableCard,
  TableHead,
  TopBar,
} from '../index';
import itemMonitor from '../../../assets/items/item-monitor.jpg';

const NAV = [
  { label: 'Catalog', current: true },
  { label: 'My Requests' },
  { label: 'Profile' },
];
const USER = { name: 'Maya Santos', role: 'Employee', initials: 'MS' };

/** Class names are written out in full on purpose. Tailwind extracts classes
 *  statically, so a constructed name like `text-${size}` is never generated —
 *  it compiles to nothing and the sample silently renders at the inherited
 *  size. Every utility here must appear literally in the source. */
const SIZES = [
  ['text-11', '11px', 'caption, eyebrow'],
  ['text-11-5', '11.5px', 'availability chip'],
  ['text-12', '12px', 'metadata, pills'],
  ['text-13', '13px', 'UI rows — the dominant size'],
  ['text-14', '14px', 'body'],
  ['text-15', '15px', 'subhead'],
  ['text-17', '17px', 'card title'],
  ['text-19', '19px', 'section title'],
  ['text-28', '28px', 'summary metric'],
  ['text-32', '32px', 'page title'],
] as const;

/** Same reason: written out, not built from the number. */
const STEPS = [
  ['w-4 h-4', '4'],
  ['w-7 h-7', '7'],
  ['w-8 h-8', '8'],
  ['w-10 h-10', '10'],
  ['w-12 h-12', '12'],
  ['w-16 h-16', '16'],
  ['w-18 h-18', '18'],
  ['w-20 h-20', '20'],
  ['w-22 h-22', '22'],
  ['w-28 h-28', '28'],
  ['w-32 h-32', '32'],
] as const;

const LINKS = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['spacing', 'Spacing & radii'],
  ['status', 'Status'],
  ['actions', 'Actions'],
  ['forms', 'Forms'],
  ['data', 'Data display'],
  ['layout', 'Layout'],
  ['icons', 'Icons'],
  ['brand', 'Brand'],
  ['overlay', 'Overlay'],
  ['overflow', 'Overflow'],
] as const;

export function Gallery() {
  const [qty, setQty] = useState(1);
  const [scrim, setScrim] = useState(false);

  return (
    <div className="min-h-screen bg-surface-page">
      <TopBar nav={NAV} user={USER} requestListCount={2} />

      <main className="mx-auto flex max-w-layout-content-width flex-col gap-32 px-layout-gutter py-28">
        <PageHeader
          title="Component library"
          subtitle="Every token and component in the OSRS design system, rendered from the same code the product uses"
        />

        <nav className="flex flex-wrap gap-8">
          {LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex min-h-touch-target items-center rounded-pill bg-surface-card px-12 py-6 font-sans text-12 font-bold leading-tight text-ink-secondary ring-default transition-osrs hover:text-brand-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section id="colour" title="Colour" note="One accent, and it is red. Nothing else in the UI is coloured except status.">
          <Row label="Brand">
            <Swatch token="--color-brand-primary" name="Primary" />
            <Swatch token="--color-brand-primary-alt" name="Primary alt" />
          </Row>
          <Row label="Surfaces — the warm page / cool header pairing is the signature">
            <Swatch token="--color-surface-page" name="Page" />
            <Swatch token="--color-surface-card" name="Card" />
            <Swatch token="--color-surface-table-header" name="Table header" />
            <Swatch token="--color-line-default" name="Border" />
          </Row>
          <Row label="Ink">
            <Swatch token="--color-ink-primary" name="Primary" />
            <Swatch token="--color-ink-body" name="Body" />
            <Swatch token="--color-ink-secondary" name="Secondary" />
            <Swatch token="--color-ink-muted" name="Muted" />
          </Row>
        </Section>

        <Section id="type" title="Type" note="Space Grotesk for display, Inter for everything else. The odd sizes are deliberate — 11.5px and 13px are transcribed, not rounded.">
          <div className="flex flex-col gap-12">
            <span className="type-page-title text-ink-heading">Page title — Space Grotesk 32/1.3</span>
            <span className="type-section-title text-ink-heading">Section title — 19/1.3</span>
            <span className="type-metric text-brand-primary">28 — summary metric</span>
            <span className="type-card-title text-ink-primary">Card title — Inter 700/17</span>
            <span className="type-body text-ink-body">Body — Inter 400/14/1.5, the only text that breathes</span>
            <span className="type-ui text-ink-primary">UI row — 13px, the dominant size</span>
            <span className="type-eyebrow uppercase text-ink-secondary">Eyebrow — 11px bold caps</span>
          </div>
          <Row label="Size ladder">
            {SIZES.map(([cls, px, use]) => (
              <div key={cls} className="flex w-[150px] flex-col gap-2">
                <span className={`${cls} font-sans text-ink-primary`}>Aa</span>
                <code className="font-sans text-11 text-ink-secondary">{cls}</code>
                <span className="font-sans text-11 text-ink-muted">
                  {px} — {use}
                </span>
              </div>
            ))}
          </Row>
        </Section>

        <Section id="spacing" title="Spacing & radii" note="The scale is irregular on purpose: 4, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 28, 32. Note that p-4 means 4px here, not Tailwind's 16px.">
          <Row label="Spacing">
            {STEPS.map(([cls, n]) => (
              <div key={n} className="flex flex-col items-center gap-4">
                <span className={`block bg-brand-primary ${cls}`} />
                <code className="font-sans text-11 text-ink-secondary">{n}</code>
              </div>
            ))}
          </Row>
          <Row label="Radii — by role">
            {[
              ['rounded-4', 'steppers'],
              ['rounded-6', 'fields'],
              ['rounded-8', 'chips'],
              ['rounded-10', 'structural'],
              ['rounded-24', 'login card'],
              ['rounded-pill', 'pills'],
            ].map(([r, use]) => (
              <div key={r} className="flex w-[120px] flex-col items-center gap-4">
                <span className={`block h-[48px] w-[48px] bg-surface-card ring-default ${r}`} />
                <code className="font-sans text-11 text-ink-secondary">{r}</code>
                <span className="font-sans text-11 text-ink-muted">{use}</span>
              </div>
            ))}
          </Row>
          <Row label="Elevation — exactly one shadow, exactly one ring">
            <span className="block h-[72px] w-[160px] rounded-10 bg-surface-card shadow-card" />
            <span className="block h-[72px] w-[160px] rounded-10 bg-surface-card ring-default" />
          </Row>
        </Section>

        <Section id="status" title="Status" note="Amber waits on a human, green is moving or done, red is stopped. Request status is the six legal states — no other value can be expressed.">
          <Row label="Request — the six legal states">
            {REQUEST_STATUSES.map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </Row>
          <Row label="Released, shown with its pickup label">
            <StatusPill status="Released" pickupLabel />
          </Row>
          <Row label="Stock">
            {STOCK_STATUSES.map((s) => (
              <StatusPill key={s} stock={s} />
            ))}
          </Row>
          <Row label="Availability — the squarer 8px chip at 11.5px">
            <StatusPill availability="available" />
            <StatusPill availability="unavailable" />
          </Row>
        </Section>

        <Section id="actions" title="Actions">
          <Row label="Button">
            <Button>Add to Request List</Button>
            <Button variant="accent">+ Add Catalog Item</Button>
            <Button variant="ghost">Cancel</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Row label="Imported library — different ink, different fonts, no OSRS screen uses these">
            <ButtonTemplate />
            <ButtonTemplate state="saved" />
            <ButtonWithIcon />
          </Row>
          <Row label="Google sign-in — third-party brand asset, never restyled">
            <SignInButton />
            <SignInButton darkmode={false} />
          </Row>
        </Section>

        <Section id="forms" title="Forms">
          <div className="max-w-[420px]">
            <Search />
          </div>
        </Section>

        <Section id="data" title="Data display">
          <Row label="Summary cards">
            <SummaryCard value="12" label="Pending approval" />
            <SummaryCard value="108" label="Available units" />
            <SummaryCard value="2" label="Low stock alerts" />
          </Row>
          <Row label="Supply card">
            <SupplyCard quantity={qty} onQuantityChange={setQty} />
            <SupplyCard
              category="Devices"
              name="Monitor"
              model='LG UltraFine 27"'
              availability="unavailable"
              image={itemMonitor}
            />
          </Row>
          <Row label="Table">
            <TableCard className="w-full">
              <TableHead cols={[['Request ID', '180px'], ['Requester', '200px'], ['Items'], ['Status', '160px']]} />
              {[
                ['REQ-2026-1847', 'Maya Santos', 'Laptop, Keyboard + 1 more', 'Pending Approval'],
                ['REQ-2026-1842', 'Samantha Reyes', 'Monitor, Dock', 'Released'],
                ['REQ-2026-1760', 'Isabella Mendoza', 'Laptop Stand', 'Rejected'],
              ].map(([id, who, items, status]) => (
                <div key={id} className="flex items-center border-t border-line-default px-20 py-18">
                  <span className="w-[180px] shrink-0 type-ui-bold text-ink-primary">{id}</span>
                  <span className="w-[200px] shrink-0 truncate type-ui text-ink-body">{who}</span>
                  <span className="flex-1 truncate type-ui text-ink-body">{items}</span>
                  <span className="w-[160px] shrink-0">
                    <StatusPill status={status as (typeof REQUEST_STATUSES)[number]} />
                  </span>
                </div>
              ))}
            </TableCard>
          </Row>
        </Section>

        <Section id="layout" title="Layout" note="The top bar and page header are redesigns, not ports — the source positions them by absolute coordinate.">
          <Row label="Avatar">
            <Avatar initials="MS" />
            <Avatar initials="EC" color="var(--color-osrs-avatar-green)" />
            <Avatar initials="MS" size={56} />
          </Row>
          <Row label="Page header">
            <PageHeader title="Inventory management" subtitle="Monitor stock levels, manage reservations, and keep office essentials ready for every team" />
          </Row>
        </Section>

        <Section id="icons" title="Icons" note="Material Design Icons at 24px and a set of 30px library glyphs. All paint with currentColor.">
          <Row label="MDI — 24px">
            <span className="text-ink-primary"><MdiLightClipboardText /></span>
            <span className="text-brand-primary"><MdiLightClipboardText /></span>
            <span className="text-ink-primary"><MdiClipboardTextOutline /></span>
          </Row>
          <Row label="Library glyphs — 30px">
            <span className="text-osrs-template-ink"><ArrowCircleDownFill /></span>
            <span className="text-osrs-template-ink"><ArrowCounterClockwise /></span>
            <span className="text-osrs-template-ink"><CaretRight /></span>
            <span className="text-osrs-template-ink"><CheckCircleFill /></span>
          </Row>
          <Row label="Google mark — renders monochrome, as the source exported it">
            <GoogleIcon size="32x32" />
            <GoogleIcon size="40x40" />
            <GoogleIcon size="48x48" />
          </Row>
        </Section>

        <Section id="brand" title="Brand">
          <Row>
            <CoDevRedMasterLogo />
            <span className="flex items-center bg-osrs-ink-900 p-16">
              <CoDevWhiteMasterLogo />
            </span>
            <CoDevSupplyRequestsLogo />
          </Row>
        </Section>

        <Section id="overlay" title="Overlay">
          <Button variant="ghost" onClick={() => setScrim(true)}>
            Show the scrim
          </Button>
          {scrim && (
            <Backdrop>
              <div className="flex max-w-[420px] flex-col gap-16 rounded-10 bg-surface-card p-22 shadow-card">
                <span className="type-card-title text-ink-primary">Confirm Rejection</span>
                <p className="type-body text-ink-body">50% black, no blur. The only transparency in the file besides the card shadow and the status tints.</p>
                <Button onClick={() => setScrim(false)}>Close</Button>
              </div>
            </Backdrop>
          )}
        </Section>

        <Section id="overflow" title="Overflow" note="Every component that renders supplied text, shown with realistic and deliberately overlong data. Designed geometry must be identical in both.">
          <Row label="Realistic">
            <SupplyCard name="Business Laptop" model="Dell Latitude 5440" />
          </Row>
          <Row label="Overlong — the card must not grow">
            <SupplyCard
              name="Ergonomic Adjustable Standing Desk Converter with Monitor Arm"
              model="Manufacturer Model Number XZ-99400-ULTRA-LONG-VARIANT"
              category="Devices and peripherals and accessories"
            />
          </Row>
          <Row label="Table rows — overlong">
            <TableCard className="w-full">
              <TableHead cols={[['Request ID', '180px'], ['Requester', '200px'], ['Items'], ['Status', '160px']]} />
              <div className="flex items-center border-t border-line-default px-20 py-18">
                <span className="w-[180px] shrink-0 type-ui-bold text-ink-primary">REQ-2026-1847</span>
                <span className="w-[200px] shrink-0 truncate type-ui text-ink-body">Maria Isabella Concepcion Mendoza-Villanueva</span>
                <span className="flex-1 truncate type-ui text-ink-body">Laptop, Wireless Keyboard, USB-C Headset, Monitor, Dock, Laptop Stand, Ergonomic Mouse</span>
                <span className="w-[160px] shrink-0"><StatusPill status="Pending Approval" /></span>
              </div>
            </TableCard>
          </Row>
        </Section>
      </main>
    </div>
  );
}
