import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Target, Power, Zap, ShieldAlert, AlertCircle } from 'lucide-react';

const App = () => {
  const [baseBet, setBaseBet] = useState(5); // Aposta Inicial
  const [houseMin, setHouseMin] = useState(0.5); // Mínimo da Casa/Mesa
  const [protectionMode, setProtectionMode] = useState('none'); // 'none', 'gale', 'all'
  const [steps, setSteps] = useState<any[]>([]); // Tipagem genérica para evitar erros de TS

  const TIE_PAYOUT_MULT = 5; // 4:1 + volta aposta
  const PB_REFUND = 0.90; // Devolve 90%

  const houseMinOptions = [0.50, 1.00, 2.50, 5.00, 10.00, 25.00];
  const availableChips = [0.50, 1, 2.50, 5, 10, 25, 125, 500, 2500]; // Adicionado para uso interno se precisar

  // Função para arredondar a ficha respeitando o MÍNIMO DA CASA
  const ceilToMin = (value: number) => {
    if (value <= 0) return 0;

    // Se o valor calculado for menor que o mínimo da casa, TEM que ser o mínimo da casa.
    let effectiveValue = Math.max(value, houseMin);

    // Arredonda para múltiplos de 0.50 (padrão de fichas) acima do valor efetivo
    return Math.ceil(effectiveValue / 0.5) * 0.5;
  };

  // Função auxiliar (opcional, se usada no futuro)
  const ceilToChip = (value: number, chipValue: number) => {
     if (value <= 0) return chipValue;
     return Math.ceil(value / chipValue) * chipValue;
  };

  useEffect(() => {
    calculateStrategy();
  }, [baseBet, protectionMode, houseMin]);

  const calculateStrategy = () => {
    let currentSteps: any[] = [];

    const calculateStep = (stepName: string, stepId: number, previousLoss: number) => {

      // 1. Aposta P/B (5-10-20 ou Proporcional)
      let pbBet = 0;
      if (stepId === 1) pbBet = baseBet;
      if (stepId === 2) pbBet = baseBet * 2;
      if (stepId === 3) pbBet = baseBet * 4;

      // Garante que a aposta principal também respeite o mínimo da casa
      if (pbBet < houseMin) pbBet = houseMin;

      // 2. Cálculo da Proteção
      let tieBet = 0;
      let isProtected = false;

      if (protectionMode === 'all') isProtected = true;
      if (protectionMode === 'gale' && stepId > 1) isProtected = true;

      if (isProtected) {
        // Fórmula Proteção: (PerdaAnterior + 10% PB) / 4
        let rawTie = (previousLoss + (pbBet * 0.10)) / 4;

        // Aplica a regra do Mínimo da Casa
        tieBet = ceilToMin(rawTie);
      }

      // Totais
      const currentInvested = pbBet + tieBet;
      const totalInvestedAccumulated = previousLoss + currentInvested;

      // Lucro se der COR
      const netProfit = pbBet - previousLoss - tieBet;

      // Saldo se der EMPATE
      let tieBalance = 0;
      if (tieBet > 0) {
        tieBalance = (tieBet * TIE_PAYOUT_MULT + pbBet * PB_REFUND) - totalInvestedAccumulated;
      } else {
        tieBalance = (pbBet * PB_REFUND) - totalInvestedAccumulated;
      }

      return {
        id: stepId,
        name: stepName,
        pb: pbBet,
        tie: tieBet,
        totalInvested: currentInvested,
        accumulatedLossNext: totalInvestedAccumulated,
        netProfit: netProfit,
        tieBalance: tieBalance
      };
    };

    const step1 = calculateStep("Entrada Inicial", 1, 0);
    currentSteps.push(step1);

    const step2 = calculateStep("Gale 1", 2, step1.accumulatedLossNext);
    currentSteps.push(step2);

    const step3 = calculateStep("Gale 2", 3, step2.accumulatedLossNext);
    currentSteps.push(step3);

    setSteps(currentSteps);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24">

      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 sticky top-0 z-30 px-4 py-3 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-lg">B</div>
          <span className="font-bold tracking-tight text-sm">BAC BO <span className="text-emerald-400">PRO</span></span>
        </div>
        <div className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
          Modo Casa
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-5">

        {/* Configuração */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 shadow-xl">

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Aposta Inicial</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-3.5 text-slate-500" />
                <input 
                  type="number" 
                  value={baseBet}
                  onChange={(e) => setBaseBet(Number(e.target.value))}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-2.5 pl-8 pr-2 text-lg font-bold text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                Mínimo da Mesa <AlertCircle size={10} className="text-slate-500"/>
              </label>
              <select 
                value={houseMin}
                onChange={(e) => setHouseMin(Number(e.target.value))}
                className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-3 px-2 text-sm font-bold text-white focus:border-emerald-500 outline-none"
              >
                {houseMinOptions.map(opt => (
                  <option key={opt} value={opt}>R$ {opt.toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Modo de Proteção</label>
            <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setProtectionMode('none')}
                  className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'none' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                >
                  <Power size={14} />
                  SEM PROTEÇÃO
                </button>
                <button 
                  onClick={() => setProtectionMode('gale')}
                  className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'gale' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                >
                  <ShieldAlert size={14} />
                  SÓ NOS GALES
                </button>
                <button 
                  onClick={() => setProtectionMode('all')}
                  className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                >
                  <Zap size={14} />
                  PROTEÇÃO TOTAL
                </button>
            </div>
          </div>
        </div>

        {/* Resumo de Risco */}
        {steps.length > 0 && (
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
              <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Risco Total (Loss)</p>
                  <p className="text-xl font-black text-red-400">R$ {steps[2]?.accumulatedLossNext.toFixed(2)}</p>
              </div>
              <div className="text-right">
                   <p className="text-[10px] text-slate-400 uppercase font-bold">Mínimo Mesa</p>
                   <p className="text-xl font-black text-slate-300">R$ {houseMin.toFixed(2)}</p>
              </div>
          </div>
        )}

        {/* Sequência */}
        <div className="space-y-4">
           {steps.map((step, idx) => (
             <div key={step.id} className="relative">
                {idx < steps.length - 1 && (
                  <div className="absolute left-4 top-full h-6 w-0.5 bg-slate-700 z-0"></div>
                )}

                <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow relative z-10 overflow-hidden group hover:border-slate-600 transition-colors">

                  {/* HEADER */}
                  <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-white bg-slate-700 border border-slate-600">
                         {step.id}
                       </span>
                       <span className="font-bold text-xs text-slate-300 uppercase">{step.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">Lucro:</span>
                       <span className="text-sm font-black text-emerald-400">+R$ {step.netProfit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-3 flex items-center gap-3">
                     {/* P/B */}
                     <div className="flex-1 bg-blue-900/10 border border-blue-500/20 rounded-lg p-2 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-blue-400 uppercase font-bold">Aposta Cor</p>
                            <p className="text-[9px] text-slate-500">Principal</p>
                        </div>
                        <p className="text-xl font-black text-white">R$ {step.pb.toFixed(2)}</p>
                     </div>

                     {/* Empate */}
                     {step.tie > 0 ? (
                       <div className="w-1/3 bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-2 flex flex-col justify-center text-center">
                          <p className="text-[8px] text-yellow-500 uppercase font-bold">Empate</p>
                          <p className="text-lg font-black text-yellow-400">R$ {step.tie.toFixed(2)}</p>
                       </div>
                     ) : (
                        <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-lg p-2 flex flex-col justify-center text-center opacity-50">
                           <p className="text-[8px] text-slate-500 uppercase font-bold">Empate</p>
                           <p className="text-[10px] font-bold text-slate-400">OFF</p>
                        </div>
                     )}
                  </div>

                  {/* FOOTER */}
                  <div className="px-3 pb-2">
                     <div className={`bg-slate-950/30 rounded p-1.5 flex justify-between items-center border ${step.tieBalance >= -0.1 ? 'border-emerald-900/30' : 'border-red-900/30'}`}>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Se der Empate:</span>
                        <span className={`text-[10px] font-bold ${step.tieBalance >= -0.1 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {step.tieBalance >= -0.1 
                               ? step.tieBalance < 0.5 ? "Zero a Zero" : `Lucro R$ ${step.tieBalance.toFixed(2)}`
                               : `Prejuízo - R$ ${Math.abs(step.tieBalance).toFixed(2)}`
                           }
                        </span>
                     </div>
                  </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default App;