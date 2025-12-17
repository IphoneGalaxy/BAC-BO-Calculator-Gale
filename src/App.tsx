import { useState, useEffect } from 'react';
import { DollarSign, Power, Zap, ShieldAlert, AlertCircle, Coins } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  pb: number;
  tie: number;
  totalInvested: number;
  accumulatedLossNext: number;
  netProfit: number;
  tieBalance: number;
}

const App = () => {
  const [baseBet, setBaseBet] = useState(25); // Aposta Inicial
  const [houseMin, setHouseMin] = useState(0.5); // Mínimo da Casa
  const [protectionMode, setProtectionMode] = useState('none'); // 'none', 'gale', 'all'
  const [protectionStrategy, setProtectionStrategy] = useState('fixed'); // 'calculated' (Recuperar) ou 'fixed' (Moedinha)
  const [fixedChipValue, setFixedChipValue] = useState(1); // Valor da "Moedinha"
  const [steps, setSteps] = useState<Step[]>([]);
  
  const TIE_PAYOUT_MULT = 5; 
  const PB_REFUND = 0.90; 
  
  const houseMinOptions = [0.50, 1.00, 2.50, 5.00, 10.00];
  const chipOptions = [0.50, 1, 2.50, 5, 10, 25];

  // Garante que respeita o mínimo da casa
  const validateBet = (val: number) => {
    if (val <= 0) return 0;
    return Math.max(val, houseMin);
  };

  const ceilToMin = (value: number) => {
    if (value <= 0) return 0;
    let effectiveValue = Math.max(value, houseMin);
    return Math.ceil(effectiveValue / 0.5) * 0.5;
  };

  useEffect(() => {
    calculateStrategy();
  }, [baseBet, protectionMode, houseMin, protectionStrategy, fixedChipValue]);

  const calculateStrategy = () => {
    let currentSteps: Step[] = [];
    
    const calculateStep = (stepName: string, stepId: number, previousLoss: number): Step => {
      
      // 1. Aposta Principal (Progressão Simples)
      let pbBet = 0;
      if (stepId === 1) pbBet = baseBet;
      if (stepId === 2) pbBet = baseBet * 2;
      if (stepId === 3) pbBet = baseBet * 4;
      
      pbBet = validateBet(pbBet);

      // 2. Proteção
      let tieBet = 0;
      let isProtected = false;

      // Regra de ativação
      if (protectionMode === 'all') isProtected = true;
      if (protectionMode === 'gale' && stepId > 1) isProtected = true;

      if (isProtected) {
        if (protectionStrategy === 'fixed') {
            // ESTRATÉGIA MOEDINHA: Usa sempre o valor fixo escolhido
            // Mas tem que ser pelo menos o mínimo da casa
            tieBet = Math.max(fixedChipValue, houseMin);
        } else {
            // ESTRATÉGIA CALCULADA: Tenta recuperar o prejuízo anterior
            let rawTie = (previousLoss + (pbBet * 0.10)) / 4;
            tieBet = ceilToMin(rawTie);
        }
      }

      // Totais
      const currentInvested = pbBet + tieBet;
      const totalInvestedAccumulated = previousLoss + currentInvested;
      
      // Lucro COR
      const netProfit = pbBet - previousLoss - tieBet;

      // Saldo EMPATE
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
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-lg">B</div>
          <span className="font-bold tracking-tight text-sm">BAC BO <span className="text-indigo-400">ULTIMATE</span></span>
        </div>
        <div className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
          V4.0
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* 1. Configuração Básica */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Aposta Inicial</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-3.5 text-slate-500" />
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={baseBet}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBaseBet(val === '' ? 0 : Number(val));
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={(e) => {
                    if (e.target.value === '' || Number(e.target.value) < houseMin) {
                      setBaseBet(houseMin);
                    }
                  }}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-2.5 pl-8 pr-2 text-lg font-bold text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                Mínimo da Casa <AlertCircle size={10} className="text-slate-500"/>
              </label>
              <select 
                value={houseMin}
                onChange={(e) => setHouseMin(Number(e.target.value))}
                className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-3 px-2 text-sm font-bold text-white focus:border-indigo-500 outline-none"
              >
                {houseMinOptions.map(opt => (
                  <option key={opt} value={opt}>R$ {opt.toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quando Proteger?</label>
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setProtectionMode('none')} className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'none' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                  <Power size={14} /> SEM
                </button>
                <button onClick={() => setProtectionMode('gale')} className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'gale' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                  <ShieldAlert size={14} /> SÓ GALES
                </button>
                <button onClick={() => setProtectionMode('all')} className={`py-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${protectionMode === 'all' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                  <Zap size={14} /> SEMPRE
                </button>
            </div>
          </div>
        </div>

        {/* 2. Estratégia de Proteção (Só aparece se tiver proteção ativa) */}
        {protectionMode !== 'none' && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 shadow-xl animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-2 mb-3">
                <Coins size={16} className="text-yellow-500"/>
                <h3 className="text-xs font-bold text-slate-300 uppercase">Como Proteger?</h3>
             </div>
             
             <div className="flex gap-2 mb-3">
                <button 
                  onClick={() => setProtectionStrategy('calculated')}
                  className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${protectionStrategy === 'calculated' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  Recuperar Tudo
                </button>
                <button 
                  onClick={() => setProtectionStrategy('fixed')}
                  className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${protectionStrategy === 'fixed' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  Ficha Fixa (Moedinha)
                </button>
             </div>

             {protectionStrategy === 'fixed' && (
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Valor da Moedinha</label>
                  <select 
                    value={fixedChipValue}
                    onChange={(e) => setFixedChipValue(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg py-2 px-2 text-sm text-white focus:border-yellow-500 outline-none"
                  >
                    {chipOptions.map(opt => (
                      <option key={opt} value={opt}>R$ {opt.toFixed(2)}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-2">
                    *Se o mínimo da casa for maior que a moedinha, usaremos o mínimo da casa.
                  </p>
               </div>
             )}
          </div>
        )}

        {/* 3. Sequência */}
        <div className="space-y-4 pt-2">
           {steps.map((step, idx) => (
             <div key={step.id} className="relative">
                {idx < steps.length - 1 && (
                  <div className="absolute left-4 top-full h-6 w-0.5 bg-slate-700 z-0"></div>
                )}

                <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow relative z-10 overflow-hidden group hover:border-slate-600 transition-colors">
                  
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

                  <div className="p-3 flex items-center gap-3">
                     <div className="flex-1 bg-blue-900/10 border border-blue-500/20 rounded-lg p-2 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-blue-400 uppercase font-bold">Aposta Cor</p>
                            <p className="text-[9px] text-slate-500">Principal</p>
                        </div>
                        <p className="text-xl font-black text-white">R$ {step.pb.toFixed(2)}</p>
                     </div>

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