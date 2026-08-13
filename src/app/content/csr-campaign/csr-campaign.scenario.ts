// Structure, step and panel groups for the CSR-campaign scenario. Prose lives
// in csr-campaign.content.ts (docs/ARCHITECTURE.md §13) so structural edits
// never touch reviewed editorial text.
//
// **One page, one step** (docs/ARCHITECTURE.md §6, §9): a single-page scenario
// is modelled as a scenario with exactly one step, which gives it the route
// `/szenario/csr-kampagne` with no trailing step segment. The step exists
// because routing and the step-view map need something to key on, not because
// the campaign has a flow.
import type { Scenario } from '../../models/domain.model';
import { NAVIGATION_BARRIER } from './csr-campaign.content';

export const CSR_CAMPAIGN_SCENARIO: Scenario = {
  id: 'csr-campaign',
  path: 'csr-kampagne',
  title: 'CSR-Kampagne',
  // docs/UX-COPY.md §5.2 `scenario.csr.summary`.
  summary:
    'Die Kampagne „Inklusiv. Nachhaltig. Sichtbar." mit Spendenaufruf, Social Media und Event. Die Barrieren stecken überwiegend in Medien, Sprache und Bewegung.',
  status: 'available',
  steps: [{ id: 'kampagne', path: 'kampagne', title: 'Kampagnenseite' }],
  // Panel groups mirroring the page's **sections**, not its routing structure
  // (docs/ARCHITECTURE.md §12.1.1, docs/SPEC_v2.md §4.1). This is the scenario
  // that made the distinction necessary: fourteen switches on one page, and one
  // flat group of fourteen is exactly the scanning problem the grouping exists
  // to prevent.
  //
  // Titles are docs/UX-COPY.md §5.6 `csr.group.*`. Every group carries an
  // `anchorId` into the section it belongs to, because a user who resolves a
  // barrier here has to be able to reach the part of a long page that changed;
  // the ids are the ones the simulation renders
  // (scenarios/csr-campaign/campaign-page-step). Nothing pairs the two sides at
  // compile time — the frame deliberately knows nothing about a scenario
  // component's markup (§5.2) — so e2e/barrier-panel.spec.ts is what proves a
  // declared anchor actually hits something.
  //
  // **Only sections whose barriers exist are declared.** The page renders all
  // five from this slice on, but a declared group with no barrier is a legend
  // promising controls that are not there, and content/data-contract.spec.ts
  // rejects it. The remaining four are added by the slice that brings their
  // barriers (docs/SPEC_v2.md slices 15 to 18), in this order:
  //
  //   { id: 'texte',  title: 'Texte und Inhalte',           anchorId: 'sim-texte'  }
  //   { id: 'medien', title: 'Medien',                      anchorId: 'sim-medien' }
  //   { id: 'event',  title: 'Event und Podiumsdiskussion',  anchorId: 'sim-event'  }
  //   { id: 'spende', title: 'Spendenaufruf',                anchorId: 'sim-spende' }
  groups: [{ id: 'kampagnenseite', title: 'Kampagnenseite', anchorId: 'sim-kampagne' }],
  barriers: [NAVIGATION_BARRIER],
};
