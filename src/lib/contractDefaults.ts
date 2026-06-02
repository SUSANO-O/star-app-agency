import type { CampaignContractData, ContractClause } from './contractTypes';

const clause = (id: string, title: string, body: string): ContractClause => ({
  id,
  title,
  body,
});

export const DEMO_CAMPAIGN_ID = 'demo-contract';
export const DEMO_CAMPAIGN_NAME = 'Demo — Summer Launch 2026';

/** Asegura contratos persistidos incompletos (p. ej. tras migración). */
export function normalizeContract(
  data: Partial<CampaignContractData> & { campaignId: string; campaignName?: string },
): CampaignContractData {
  const base = createDefaultContract(
    data.campaignId,
    data.campaignName ?? 'Campaña',
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
  const name = campaignName || 'Campaña sin título';

  return {
    campaignId,
    campaignName: name,
    documentTitle: 'Acuerdo de Prestación de Servicios — Campaña',
    documentNumber: `CMP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    partyALabel: 'Parte A (Agencia / Divulgadora)',
    partyBLabel: 'Parte B (Cliente / Receptora)',
    signerName: '',
    entityName: '',
    partyBSignatureText: 'Aprobado Legal',
    partyBPreApproved: true,
    introParagraph: `Por medio del presente documento se establece un acuerdo vinculante para la ejecución de la campaña publicitaria denominada «${name}», incluyendo creativos, medios, reportes y material confidencial asociado.`,
    clauses: [
      clause(
        'c1',
        'Cláusula 1: Objeto de la campaña',
        `Las partes acuerdan colaborar en el diseño, lanzamiento y medición de la campaña «${name}», conforme al briefing y calendario aprobados. Cualquier alcance adicional requerirá addendum por escrito.`,
      ),
      clause(
        'c2',
        'Cláusula 2: Confidencialidad',
        'La información estratégica, datos de audiencia, presupuestos y activos creativos se tratarán como estrictamente confidenciales durante la vigencia del acuerdo y por cinco (5) años adicionales.',
      ),
      clause(
        'c3',
        'Cláusula 3: Propiedad y uso',
        'Los entregables finales aprobados podrán ser utilizados por el Cliente en los canales pactados. La Agencia conserva derecho de exhibir el caso en portafolio salvo pacto contrario.',
      ),
      clause(
        'c4',
        'Cláusula 4: Vigencia',
        'Este acuerdo entra en vigor desde la fecha de firma electrónica y permanece activo hasta la finalización de la campaña y cierre administrativo mutuo.',
      ),
    ],
    status: 'draft',
    ...overrides,
  };
}
