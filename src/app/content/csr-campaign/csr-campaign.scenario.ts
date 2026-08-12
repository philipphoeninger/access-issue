// Registry stub only — content lands in SPEC_v2.md (docs/SPEC_v1.md §3).
// `status: 'planned'` lets the home page list this scenario as not yet
// available without any routing or component work
// (docs/ARCHITECTURE.md §6 notes on `status`).
import type { Scenario } from '../../models/domain.model';

export const CSR_CAMPAIGN_SCENARIO: Scenario = {
  id: 'csr-campaign',
  path: 'csr-kampagne',
  title: 'CSR-Kampagne',
  // docs/UX-COPY.md §5.2 `scenario.csr.summary`.
  summary:
    'Die Kampagne „Inklusiv. Nachhaltig. Sichtbar." mit Video, Spendenaufruf, Social Media und Event. Die Barrieren stecken überwiegend in Medien, Sprache und Bewegung.',
  status: 'planned',
  steps: [],
  barriers: [],
};
