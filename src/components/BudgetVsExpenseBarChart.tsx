import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AgencyBudgetSummary, JROInfo, AgenciaInfo } from '../types/budget';
import { formatCurrency, formatCompactCurrency, formatMonthName } from '../utils/budgetUtils';

interface BudgetVsExpenseBarChartProps {
  selectedMonth: string;
  presupuestoAsignadoTotal: number;
  gastoRealizadoAcumuladoTotal: number;
  agenciasResumen: AgencyBudgetSummary[];
  jros: JROInfo[];
  agencias: AgenciaInfo[];
}

type ViewMode = 'agencias' | 'regiones' | 'consolidado';
type RegionFilter = 'TODAS' | 'Región Central' | 'Región Occidente' | 'Región Oriente & Costa Sur';

export const BudgetVsExpenseBarChart: React.FC<BudgetVsExpenseBarChartProps> = ({
  selectedMonth,
  presupuestoAsignadoTotal,
  gastoRealizadoAcumuladoTotal,
  agenciasResumen,
  jros,
  agencias
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agencias');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('TODAS');

  // Overall calculations
  const saldoDisponibleTotal = presupuestoAsignadoTotal - gastoRealizadoAcumuladoTotal;
  const porcentajeConsumido = presupuestoAsignadoTotal > 0 
    ? (gastoRealizadoAcumuladoTotal / presupuestoAsignadoTotal) * 100 
    : 0;

  // Prepare chart dataset according to active viewMode
  const chartData = useMemo(() => {
    if (viewMode === 'consolidado') {
      return [
        {
          name: 'Flota Consolidada',
          shortName: 'Flota Total',
          fullName: 'Consolidado General de Flota (13 Agencias)',
          subtitle: `${agencias.length} Agencias · 3 JROs`,
          'Presupuesto Asignado': presupuestoAsignadoTotal,
          'Gasto Realizado Acumulado': gastoRealizadoAcumuladoTotal,
          disponible: saldoDisponibleTotal,
          porcentaje: porcentajeConsumido
        }
      ];
    }

    if (viewMode === 'regiones') {
      return jros.map(jro => {
        // Find agencies in this region
        const regionalAgencies = agenciasResumen.filter(ag => {
          const matchingAg = agencias.find(a => a.nombre === ag.agencia);
          return matchingAg?.jroId === jro.id;
        });

        const asignadoQ = regionalAgencies.reduce((sum, a) => sum + a.asignadoQ, 0);
        const autorizadoQ = regionalAgencies.reduce((sum, a) => sum + a.autorizadoQ, 0);
        const diff = asignadoQ - autorizadoQ;
        const pct = asignadoQ > 0 ? (autorizadoQ / asignadoQ) * 100 : 0;

        // Clean region name for labels
        const shortName = jro.region
          .replace('Región ', '')
          .replace('& Costa Sur', '')
          .trim();

        return {
          name: jro.region,
          shortName,
          fullName: jro.region,
          subtitle: `JRO: ${jro.nombre} (${jro.agenciasAsignadas.length} Agencias)`,
          'Presupuesto Asignado': asignadoQ,
          'Gasto Realizado Acumulado': autorizadoQ,
          disponible: diff,
          porcentaje: pct
        };
      });
    }

    // Default: 'agencias'
    const filtered = agenciasResumen.filter(ag => {
      if (regionFilter === 'TODAS') return true;
      return ag.region.toLowerCase().includes(regionFilter.toLowerCase().replace('región ', ''));
    });

    return filtered.map(ag => {
      // Short label for x-axis
      const shortLabel = ag.agencia
        .replace('Agencia ', '')
        .replace('/ San Cristóbal', '')
        .replace('/ Planta', '')
        .replace('/ Chiquimula', '')
        .replace('/ Puerto San José', '')
        .replace('/ Retalhuleu', '')
        .replace('/ Alta Verapaz', '')
        .trim();

      return {
        name: ag.agencia,
        shortName: shortLabel,
        fullName: ag.agencia,
        subtitle: `${ag.region} · JRO: ${ag.jroNombre}`,
        'Presupuesto Asignado': ag.asignadoQ,
        'Gasto Realizado Acumulado': ag.autorizadoQ,
        disponible: ag.disponibleQ,
        porcentaje: ag.porcentaje,
        reparacionesCount: ag.conteoReparaciones
      };
    });
  }, [
    viewMode, 
    regionFilter, 
    agenciasResumen, 
    presupuestoAsignadoTotal, 
    gastoRealizadoAcumuladoTotal, 
    saldoDisponibleTotal, 
    porcentajeConsumido, 
    jros, 
    agencias
  ]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const asignado = Number(data['Presupuesto Asignado'] || 0);
      const gasto = Number(data['Gasto Realizado Acumulado'] || 0);
      const diff = asignado - gasto;
      const pct = asignado > 0 ? (gasto / asignado) * 100 : 0;
      const isOver = gasto > asignado;

      return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[240px]">
          <div className="border-b border-slate-700/80 pb-1.5">
            <div className="font-bold text-white text-sm leading-snug">{data.fullName || label}</div>
            {data.subtitle && <div className="text-[11px] text-slate-400 mt-0.5">{data.subtitle}</div>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block shrink-0" />
                <span>Presupuesto Asignado:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(asignado, 'GTQ')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className={`w-2.5 h-2.5 rounded-xs inline-block shrink-0 ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span>Gasto Realizado Acumulado:</span>
              </span>
              <span className={`font-mono font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(gasto, 'GTQ')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {diff >= 0 ? 'Saldo Disponible:' : 'Excedido por:'}
            </span>
            <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(diff), 'GTQ')}
              <span className="ml-1 text-[10px] text-slate-400">({pct.toFixed(1)}%)</span>
            </span>
          </div>

          {typeof data.reparacionesCount === 'number' && (
            <div className="text-[10px] text-slate-400 text-right pt-0.5">
              {data.reparacionesCount} reparación(es) ejecutadas
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Relación: Presupuesto Asignado vs. Gasto Realizado Acumulado
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Comparativo de recursos asignados vs. costo de reparaciones autorizadas para camiones de bahías · <span className="font-semibold text-slate-700">{formatMonthName(selectedMonth)}</span>
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('agencias')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'agencias'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            13 Agencias
          </button>
          <button
            type="button"
            onClick={() => setViewMode('regiones')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'regiones'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 Regiones JRO
          </button>
          <button
            type="button"
            onClick={() => setViewMode('consolidado')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'consolidado'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consolidado Flota
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        <div>
          <span className="text-[11px] text-slate-500 font-medium block">Presupuesto Asignado</span>
          <span className="text-sm sm:text-base font-black text-blue-700 font-mono">
            {formatCurrency(presupuestoAsignadoTotal, 'GTQ')}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium block">Gasto Realizado Acumulado</span>
          <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
            {formatCurrency(gastoRealizadoAcumuladoTotal, 'GTQ')}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium block">Saldo Disponible Flota</span>
          <span className={`text-sm sm:text-base font-black font-mono ${
            saldoDisponibleTotal < 0 ? 'text-rose-600' : 'text-slate-800'
          }`}>
            {formatCurrency(saldoDisponibleTotal, 'GTQ')}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500 font-medium block">% Ejecución del Mes</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
              {porcentajeConsumido.toFixed(1)}%
            </span>
            {porcentajeConsumido > 85 ? (
              <span className="p-0.5 bg-rose-100 text-rose-700 rounded-sm" title="Umbral elevado">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-sm" title="Nivel saludable">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Agency Filter Chips (Only visible in 'agencias' mode) */}
      {viewMode === 'agencias' && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-500 text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filtrar por región:</span>
          </span>
          {(['TODAS', 'Región Central', 'Región Occidente', 'Región Oriente & Costa Sur'] as RegionFilter[]).map(reg => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegionFilter(reg)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                regionFilter === reg
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg === 'TODAS' ? 'Todas (13)' : reg.replace('Región ', '')}
            </button>
          ))}
        </div>
      )}

      {/* Main Recharts Bar Chart */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: 15,
              bottom: viewMode === 'agencias' ? 45 : 20
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 11, fill: '#475569' }}
              tickLine={false}
              interval={0}
              angle={viewMode === 'agencias' ? -35 : 0}
              textAnchor={viewMode === 'agencias' ? 'end' : 'middle'}
              height={viewMode === 'agencias' ? 55 : 25}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => formatCompactCurrency(val, 'GTQ')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              iconType="circle"
            />
            
            {/* Bar 1: Presupuesto Asignado */}
            <Bar
              dataKey="Presupuesto Asignado"
              name="Presupuesto Asignado"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={viewMode === 'consolidado' ? 80 : 35}
            />

            {/* Bar 2: Gasto Realizado Acumulado */}
            <Bar
              dataKey="Gasto Realizado Acumulado"
              name="Gasto Realizado Acumulado"
              radius={[4, 4, 0, 0]}
              maxBarSize={viewMode === 'consolidado' ? 80 : 35}
            >
              {chartData.map((entry, index) => {
                const asignado = entry['Presupuesto Asignado'];
                const gasto = entry['Gasto Realizado Acumulado'];
                const isOver = gasto > asignado;
                const isNear = gasto > asignado * 0.85;

                // Color code the bar according to risk
                const color = isOver ? '#ef4444' : isNear ? '#f59e0b' : '#10b981';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Explanatory Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Presupuesto Asignado (Meta de gasto)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Gasto Acumulado en Rango</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Alerta &gt; 85%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Presupuesto Excedido</span>
          </span>
        </div>

        <span className="font-mono text-slate-400">
          Valores actualizados en Quetzales (Q)
        </span>
      </div>
    </div>
  );
};
