export type {
  CampaignContractData,
  ContractClause,
} from '../../lib/contractTypes';

export type ContractSealPayload = {
  signatureDataUrl: string;
  signerName: string;
  entityName: string;
};

export interface DigitalSignatureModuleProps {
  mode: 'campaign' | 'demo';
  campaignId: string;
  campaignName: string;
  onSealed?: () => void;
  onClose?: () => void;
  className?: string;
}
