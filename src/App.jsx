import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

/* ---------- Dados fictícios (substituir pela API FastAPI depois) ---------- */
const dt = (i) =>
  new Date(2026, 7, 3 + 7 * i).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const mk = (id, nome, estilo, tempos, bracs) => ({
  id, nome, estilo,
  sessoes: tempos.map((t, i) => ({
    data: dt(i), dist: 50, tempo: t, bracadas: bracs[i], tempoNado: +(t - 4).toFixed(1),
  })),
});

const ATLETAS = [
  mk(1, "Ana Clara", "Crawl 50 m", [30.2, 29.9, 29.8, 29.4, 29.5, 29.1, 28.9, 28.8], [38, 38, 37, 37, 36, 36, 36, 35]),
  mk(2, "Rafael Souza", "Crawl 50 m", [27.5, 27.6, 27.4, 27.6, 27.3, 27.5, 27.2, 27.3], [34, 34, 35, 34, 34, 33, 34, 33]),
  mk(3, "Beatriz Lima", "Crawl 50 m", [31.0, 31.2, 31.1, 31.5, 31.4, 31.8, 31.7, 32.0], [40, 40, 41, 40, 41, 42, 41, 42]),
];

/* ---------- Métricas (fórmulas da seção 3.3 do TCC) ---------- */
const META = {
  SWOLF: { nome: "SWOLF", un: "pts", dir: -1, dec: 1 },
  CB: { nome: "Comp. de braçada", un: "m", dir: 1, dec: 2 },
  CN: { nome: "Cadência", un: "braç/min", dir: 0, dec: 1 },
  VN: { nome: "Vel. de nado", un: "m/s", dir: 1, dec: 2 },
  IN: { nome: "Índice de nado", un: "m²/s", dir: 1, dec: 2 },
  Vm: { nome: "Vel. média", un: "m/s", dir: 1, dec: 2 },
};

function metricas(s) {
  const cb = s.dist / s.bracadas;          // CB = distância / nº de braçadas
  const cn = s.bracadas / s.tempoNado;     // braçadas por segundo
  const vn = cb * cn;                      // VN = CB × frequência
  return { Vm: s.dist / s.tempo, CB: cb, CN: cn * 60, VN: vn, IN: cb * vn, SWOLF: s.tempo + s.bracadas };
}

/* ---------- Regressão linear simples (mínimos quadrados) ---------- */
function regressao(y) {
  const n = y.length, mx = (n + 1) / 2, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, st = 0, sr = 0;
  y.forEach((v, i) => { sxy += (i + 1 - mx) * (v - my); sxx += (i + 1 - mx) ** 2; });
  const b = sxy / sxx, a = my - b * mx;
  y.forEach((v, i) => { st += (v - my) ** 2; sr += (v - (a + b * (i + 1))) ** 2; });
  return { b, r2: st ? 1 - sr / st : 1, prever: (x) => a + b * x };
}

/* ---------- Componentes ---------- */
const Card = ({ titulo, children, className = "" }) => (
  <section className={`rounded-lg bg-white p-5 ring-1 ring-[#10252e]/10 ${className}`}>
    {titulo && <h2 className="mb-3 text-base font-semibold">{titulo}</h2>}
    {children}
  </section>
);

function Painel({ atleta }) {
  const [metrica, setMetrica] = useState("SWOLF");
  const ms = atleta.sessoes.map(metricas);
  const ult = ms.at(-1), ant = ms.at(-2);

  const tempos = atleta.sessoes.map((s) => s.tempo);
  const rl = regressao(tempos);
  const n = tempos.length;
  const futuros = [1, 2, 3].map((k) => +rl.prever(n + k).toFixed(2));
  const melhora = rl.b < -0.02, piora = rl.b > 0.02;

  const dadosMetrica = atleta.sessoes.map((s, i) => ({ data: s.data, valor: +ms[i][metrica].toFixed(3) }));
  const dadosPred = [
    ...atleta.sessoes.map((s, i) => ({
      data: s.data, real: s.tempo, previsto: i === n - 1 ? s.tempo : undefined,
    })),
    ...futuros.map((v, k) => ({ data: `+${k + 1}`, previsto: v })),
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Object.keys(META).map((k) => {
          const m = META[k], d = ult[k] - ant[k];
          const bom = m.dir === 0 ? null : d * m.dir > 0;
          return (
            <button key={k} onClick={() => setMetrica(k)}
              className={`rounded-lg bg-white p-4 text-left ring-1 transition ${metrica === k ? "ring-2 ring-[#0e7c86]" : "ring-[#10252e]/10"}`}>
              <div className="text-sm text-[#10252e]/70">{m.nome}</div>
              <div className="mt-1 text-2xl font-semibold">{ult[k].toFixed(m.dec)} <span className="text-sm font-normal">{m.un}</span></div>
              <div className={`text-sm ${bom === null ? "text-[#10252e]/60" : bom ? "text-[#0a7a4b]" : "text-[#b3261e]"}`}>
                {d >= 0 ? "+" : ""}{d.toFixed(m.dec)} vs. sessão anterior
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card titulo={`Evolução — ${META[metrica].nome} (${META[metrica].un})`}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={dadosMetrica}>
                <CartesianGrid stroke="#10252e18" />
                <XAxis dataKey="data" /><YAxis domain={["auto", "auto"]} /><Tooltip />
                <Line type="monotone" dataKey="valor" stroke="#0e7c86" strokeWidth={2.5} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Previsão de tempo (Regressão Linear)">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={dadosPred}>
                <CartesianGrid stroke="#10252e18" />
                <XAxis dataKey="data" /><YAxis domain={["auto", "auto"]} /><Tooltip /><Legend />
                <Line name="Tempo real (s)" dataKey="real" stroke="#0e7c86" strokeWidth={2.5} />
                <Line name="Previsto (s)" dataKey="previsto" stroke="#e0a100" strokeWidth={2.5} strokeDasharray="6 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm">
            Próximas 3 sessões: <b>{futuros.join(" s, ")} s</b>. Tendência:{" "}
            <b className={melhora ? "text-[#0a7a4b]" : piora ? "text-[#b3261e]" : ""}>
              {melhora ? "tempo diminuindo — o treino está surtindo efeito" : piora ? "tempo aumentando — vale ajustar o treino" : "estável"}
            </b>{" "}
            ({rl.b.toFixed(2)} s por sessão, R² = {rl.r2.toFixed(2)}).
          </p>
        </Card>
      </div>

      <Card titulo="Histórico de sessões">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-[#10252e]/15">
              {["Data", "Distância", "Tempo", "Braçadas", ...Object.keys(META)].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {atleta.sessoes.map((s, i) => (
                <tr key={i} className="border-b border-[#10252e]/8">
                  <td className="py-2 pr-4">{s.data}</td><td className="pr-4">{s.dist} m</td>
                  <td className="pr-4">{s.tempo} s</td><td className="pr-4">{s.bracadas}</td>
                  {Object.keys(META).map((k) => <td key={k} className="pr-4">{ms[i][k].toFixed(META[k].dec)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NovaSessao({ atleta, onSalvar }) {
  const [f, setF] = useState({ dist: 50, tempo: 29, bracadas: 36, tempoNado: 25 });
  const set = (k) => (e) => setF({ ...f, [k]: parseFloat(e.target.value) || 0 });
  const valido = f.dist > 0 && f.tempo > 0 && f.bracadas > 0 && f.tempoNado > 0 && f.tempoNado <= f.tempo;
  const m = valido ? metricas(f) : null;
  const campos = [["dist", "Distância (m)"], ["tempo", "Tempo total (s)"], ["bracadas", "Nº de braçadas"], ["tempoNado", "Tempo só de nado, sem saída e virada (s)"]];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card titulo={`Registrar sessão de ${atleta.nome}`}>
        <div className="space-y-3">
          {campos.map(([k, rot]) => (
            <label key={k} className="block text-sm">
              {rot}
              <input type="number" step="0.1" value={f[k]} onChange={set(k)}
                className="mt-1 w-full rounded-md border border-[#10252e]/25 px-3 py-2 focus:outline-2 focus:outline-[#0e7c86]" />
            </label>
          ))}
          {!valido && <p className="text-sm text-[#b3261e]">Preencha todos os campos; o tempo de nado não pode passar do tempo total.</p>}
          <button disabled={!valido}
            onClick={() => onSalvar({ ...f, data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) })}
            className="rounded-md bg-[#0e7c86] px-4 py-2 font-semibold text-white disabled:opacity-40">
            Salvar sessão
          </button>
        </div>
      </Card>
      <Card titulo="Métricas calculadas na hora">
        {m ? (
          <dl className="grid grid-cols-2 gap-4">
            {Object.keys(META).map((k) => (
              <div key={k}><dt className="text-sm text-[#10252e]/70">{META[k].nome}</dt>
                <dd className="text-xl font-semibold">{m[k].toFixed(META[k].dec)} <span className="text-sm font-normal">{META[k].un}</span></dd></div>
            ))}
          </dl>
        ) : <p className="text-sm">Informe os dados da sessão para ver as métricas.</p>}
      </Card>
    </div>
  );
}

export default function App() {
  const [atletas, setAtletas] = useState(ATLETAS);
  const [sel, setSel] = useState(1);
  const [aba, setAba] = useState("painel");
  const atleta = atletas.find((a) => a.id === sel);

  const salvar = (s) => {
    setAtletas(atletas.map((a) => (a.id === sel ? { ...a, sessoes: [...a.sessoes, { ...s, tempoNado: s.tempoNado }] } : a)));
    setAba("painel");
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-[#0b2a3a] p-5 text-white md:w-64 md:shrink-0">
        <div className="text-2xl font-bold">aquaData</div>
        <p className="mb-6 text-sm text-white/70">Painel do treinador</p>
        <div className="mb-2 text-sm text-white/70">Atletas</div>
        <ul className="space-y-1">
          {atletas.map((a) => (
            <li key={a.id}>
              <button onClick={() => setSel(a.id)}
                className={`w-full rounded-md px-3 py-2 text-left ${a.id === sel ? "bg-[#0e7c86]" : "hover:bg-white/10"}`}>
                <div className="font-medium">{a.nome}</div>
                <div className="text-xs text-white/70">{a.estilo} · {a.sessoes.length} sessões</div>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-white/50">Protótipo inicial — dados fictícios.</p>
      </aside>

      <main className="flex-1 p-5 md:p-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{atleta.nome}</h1>
          <nav className="flex gap-2">
            {[["painel", "Painel"], ["nova", "Nova sessão"]].map(([k, r]) => (
              <button key={k} onClick={() => setAba(k)}
                className={`rounded-md px-4 py-2 text-sm font-semibold ${aba === k ? "bg-[#10252e] text-white" : "bg-white ring-1 ring-[#10252e]/15"}`}>
                {r}
              </button>
            ))}
          </nav>
        </header>
        {aba === "painel" ? <Painel atleta={atleta} /> : <NovaSessao atleta={atleta} onSalvar={salvar} />}
      </main>
    </div>
  );
}
