export interface ContractClause {
  id: string;
  title: string;
  body: string;
}

export interface CampaignContractData {
  campaignId: string;
  campaignName: string;
  documentTitle: string;
  documentNumber: string;
  partyALabel: string;
  partyBLabel: string;
  signerName: string;
  entityName: string;
  partyBSignatureText: string;
  partyBPreApproved: boolean;
  introParagraph: string;
  clauses: ContractClause[];
  sealedAt?: string;
  signatureDataUrl?: string;
  status: 'draft' | 'sealed';
}
