// Registry stub only — content undefined by WERTE.IT (docs/PRD.md §6.3,
// docs/SPEC_v1.md §3). `status: 'planned'` lets the home page list this
// scenario as not yet available without any routing or component work.
import type { Scenario } from '../../models/domain.model';

export const SOFTWARE_PROCUREMENT_SCENARIO: Scenario = {
  id: 'software-procurement',
  path: 'softwarebeschaffung',
  title: 'Softwarebeschaffung',
  summary:
    'Wie Barrierefreiheit beim Einkauf von Software verloren geht. Dieses Szenario ist in Vorbereitung.',
  status: 'planned',
  steps: [],
  barriers: [],
};
