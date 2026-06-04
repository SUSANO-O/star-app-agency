import type { CampaignContractData, ContractClause } from './contractTypes';

const clause = (id: string, title: string, body: string): ContractClause => ({
  id,
  title,
  body,
});

export const DEMO_CAMPAIGN_ID = 'demo-contract';
export const DEMO_CAMPAIGN_NAME = 'Demo — Summer Launch 2026';

/** Ensures persisted contracts are complete (e.g. after migration). */
export function normalizeContract(
  data: Partial<CampaignContractData> & { campaignId: string; campaignName?: string },
): CampaignContractData {
  const base = createDefaultContract(
    data.campaignId,
    data.campaignName ?? 'Campaign',
    data as Partial<CampaignContractData>,
  );
  return {
    ...base,
    ...data,
    campaignId: data.campaignId,
    campaignName: data.campaignName ?? base.campaignName,
    clauses:
      Array.isArray(data.clauses) && data.clauses.length > 0
        ? data.clauses
        : base.clauses,
    status: data.status === 'sealed' ? 'sealed' : 'draft',
  };
}

export function createDefaultContract(
  campaignId: string,
  campaignName: string,
  overrides?: Partial<CampaignContractData>,
): CampaignContractData {
  const name = campaignName || 'Untitled campaign';

  return {
    campaignId,
    campaignName: name,
    documentTitle: 'Services Agreement — Campaign',
    documentNumber: `CMP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    partyALabel: 'Party A (Agency / Discloser)',
    partyBLabel: 'Party B (Client / Recipient)',
    signerName: '',
    entityName: '',
    partyBSignatureText: 'Legal Approved',
    partyBPreApproved: true,
    introParagraph: `This document establishes a binding agreement for the advertising campaign «${name}», including creatives, media, reports, and associated confidential materials.`,
    clauses: [
      clause(
        'c1',
        'Clause 1: Campaign scope',
        `The parties agree to collaborate on the design, launch, and measurement of the campaign «${name}», in accordance with the approved brief and calendar. Any additional scope requires a written addendum.`,
      ),
      clause(
        'c2',
        'Clause 2: Confidentiality',
        'Strategic information, audience data, budgets, and creative assets shall be treated as strictly confidential during the term of this agreement and for five (5) additional years thereafter.',
      ),
      clause(
        'c3',
        'Clause 3: Ownership and use',
        'Approved final deliverables may be used by the Client on the agreed channels. The Agency retains the right to showcase the case in its portfolio unless otherwise agreed.',
      ),
      clause(
        'c4',
        'Clause 4: Term',
        'This agreement takes effect upon electronic signature and remains active until the campaign is completed and administratively closed by both parties.',
      ),
    ],
    status: 'draft',
    ...overrides,
  };
}
