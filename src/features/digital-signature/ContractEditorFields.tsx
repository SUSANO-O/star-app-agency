import {
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import type { CampaignContractData, ContractClause } from '../../lib/contractTypes';

interface ContractEditorFieldsProps {
  contract: CampaignContractData;
  onChange: (updates: Partial<CampaignContractData>) => void;
  readOnly?: boolean;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20';

const labelClass =
  'mb-2 flex items-center text-xs font-bold uppercase tracking-wider text-slate-500';

export function ContractEditorFields({
  contract,
  onChange,
  readOnly = false,
}: ContractEditorFieldsProps) {
  const updateClause = (id: string, patch: Partial<ContractClause>) => {
    onChange({
      clauses: contract.clauses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const addClause = () => {
    const n = contract.clauses.length + 1;
    onChange({
      clauses: [
        ...contract.clauses,
        {
          id: `clause-${Date.now()}`,
          title: `Clause ${n}`,
          body: '',
        },
      ],
    });
  };

  const removeClause = (id: string) => {
    if (contract.clauses.length <= 1) return;
    onChange({ clauses: contract.clauses.filter((c) => c.id !== id) });
  };

  const moveClause = (id: string, direction: 'up' | 'down') => {
    const idx = contract.clauses.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const next = direction === 'up' ? idx - 1 : idx + 1;
    if (next < 0 || next >= contract.clauses.length) return;
    const clauses = [...contract.clauses];
    [clauses[idx], clauses[next]] = [clauses[next], clauses[idx]];
    onChange({ clauses });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          <FileText className="mr-2 h-4 w-4 text-slate-400" />
          Document title
        </label>
        <input
          type="text"
          value={contract.documentTitle}
          disabled={readOnly}
          onChange={(e) => onChange({ documentTitle: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            <FileText className="mr-2 h-4 w-4 text-slate-400" />
            Reference no.
          </label>
          <input
            type="text"
            value={contract.documentNumber}
            disabled={readOnly}
            onChange={(e) => onChange({ documentNumber: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Linked campaign</label>
          <input
            type="text"
            value={contract.campaignName}
            disabled
            className={cnDisabled(inputClass)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Intro paragraph</label>
        <textarea
          rows={3}
          value={contract.introParagraph}
          disabled={readOnly}
          onChange={(e) => onChange({ introParagraph: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            <User className="mr-2 h-4 w-4 text-slate-400" />
            Legal representative (Party A)
          </label>
          <input
            type="text"
            value={contract.signerName}
            disabled={readOnly}
            onChange={(e) => onChange({ signerName: e.target.value })}
            placeholder="Signer name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            <Building2 className="mr-2 h-4 w-4 text-slate-400" />
            Client entity (Party B)
          </label>
          <input
            type="text"
            value={contract.entityName}
            disabled={readOnly}
            onChange={(e) => onChange({ entityName: e.target.value })}
            placeholder="Client legal name"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Party A label</label>
          <input
            type="text"
            value={contract.partyALabel}
            disabled={readOnly}
            onChange={(e) => onChange({ partyALabel: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Party B label</label>
          <input
            type="text"
            value={contract.partyBLabel}
            disabled={readOnly}
            onChange={(e) => onChange({ partyBLabel: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider text-slate-600">
          Party B styled signature (text)
        </label>
        <input
          type="text"
          value={contract.partyBSignatureText}
          disabled={readOnly}
          onChange={(e) => onChange({ partyBSignatureText: e.target.value })}
          className={`${inputClass} font-signature text-2xl`}
        />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={contract.partyBPreApproved}
            disabled={readOnly}
            onChange={(e) => onChange({ partyBPreApproved: e.target.checked })}
            className="rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
          />
          Mark Party B as pre-approved
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Editable clauses
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={addClause}
              className="flex items-center gap-1 rounded-lg bg-fuchsia-50 px-3 py-1.5 text-xs font-bold text-fuchsia-700 transition-colors hover:bg-fuchsia-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>

        {contract.clauses.map((clause, index) => (
          <div
            key={clause.id}
            className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2"
          >
            <div className="flex items-start gap-2">
              <span className="mt-2 text-[10px] font-black text-fuchsia-500">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="text"
                  value={clause.title}
                  disabled={readOnly}
                  onChange={(e) => updateClause(clause.id, { title: e.target.value })}
                  placeholder="Clause title"
                  className={inputClass}
                />
                <textarea
                  rows={2}
                  value={clause.body}
                  disabled={readOnly}
                  onChange={(e) => updateClause(clause.id, { body: e.target.value })}
                  placeholder="Clause content"
                  className={inputClass}
                />
              </div>
              {!readOnly && (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveClause(clause.id, 'up')}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move clause up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveClause(clause.id, 'down')}
                    disabled={index === contract.clauses.length - 1}
                    className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move clause down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeClause(clause.id)}
                    disabled={contract.clauses.length <= 1}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    aria-label="Remove clause"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function cnDisabled(base: string) {
  return `${base} cursor-not-allowed bg-slate-50 text-slate-500`;
}
