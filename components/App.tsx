"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NIVEIS, TIPOS_MOBILIDADE, type Cargo, type Mobilidade } from "@/lib/types";

type Painel =
  | { modo: "ver"; id: number }
  | { modo: "editar"; id: number }
  | { modo: "novo" }
  | { modo: "mob"; id: number | null; origem?: number }
  | null;

const brl = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const curto = (n: number) => (n >= 1000 ? `${n / 1000}k` : String(n));
const ordemNivel = (n: string) => {
  const i = (NIVEIS as readonly string[]).indexOf(n);
  return i === -1 ? 99 : i;
};
const classeNivel = (n: string) => "nv-" + ordemNivel(n);

async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data as T;
}

export default function App({
  initialCargos,
  initialMobilidades,
  temLogin,
}: {
  initialCargos: Cargo[];
  initialMobilidades: Mobilidade[];
  temLogin: boolean;
}) {
  const [cargos, setCargos] = useState(initialCargos);
  const [mobs, setMobs] = useState(initialMobilidades);
  const [aba, setAba] = useState<"cargos" | "mobilidade">("cargos");
  const [painel, setPainel] = useState<Painel>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("");
  const [nivel, setNivel] = useState("");
  const [lider, setLider] = useState("");
  const [tipoMob, setTipoMob] = useState("");

  const porId = useMemo(() => new Map(cargos.map((c) => [c.id, c])), [cargos]);
  const opcoes = (campo: keyof Cargo) =>
    Array.from(new Set(cargos.map((c) => c[campo]).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const areas = useMemo(() => opcoes("area"), [cargos]); // eslint-disable-line react-hooks/exhaustive-deps
  const lideres = useMemo(() => opcoes("lider"), [cargos]); // eslint-disable-line react-hooks/exhaustive-deps

  const escala = useMemo(() => {
    const max = Math.max(15000, ...cargos.map((c) => c.teto ?? 0));
    const topo = Math.ceil(max / 3000) * 3000;
    const marcas: number[] = [];
    for (let v = 0; v <= topo; v += 3000) marcas.push(v);
    return { topo, marcas };
  }, [cargos]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return cargos.filter(
      (c) =>
        (!area || c.area === area) &&
        (!nivel || c.nivel === nivel) &&
        (!lider || c.lider === lider) &&
        (!q || [c.nome, c.position, c.familia, c.time].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [cargos, busca, area, nivel, lider]);

  const grupos = useMemo(() => {
    const m = new Map<string, Cargo[]>();
    for (const c of filtrados) {
      const k = c.familia || "Sem trilha";
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    for (const lista of m.values())
      lista.sort((a, b) => ordemNivel(a.nivel) - ordemNivel(b.nivel) || (a.piso ?? 0) - (b.piso ?? 0));
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [filtrados]);

  const mobsFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return mobs
      .filter((m) => !tipoMob || m.tipo === tipoMob)
      .filter((m) => {
        if (!q) return true;
        const o = porId.get(m.origem_id)?.nome ?? "";
        const d = porId.get(m.destino_id)?.nome ?? "";
        return [o, d, m.observacao ?? ""].some((v) => v.toLowerCase().includes(q));
      })
      .sort((a, b) => (porId.get(a.origem_id)?.nome ?? "").localeCompare(porId.get(b.origem_id)?.nome ?? "", "pt-BR"));
  }, [mobs, tipoMob, busca, porId]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPainel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pct = (v: number) => `${(v / escala.topo) * 100}%`;
  const filtrosAtivos = !!(busca || area || nivel || lider || tipoMob);
  const limpar = () => {
    setBusca(""); setArea(""); setNivel(""); setLider(""); setTipoMob("");
  };

  async function salvarCargo(dados: Partial<Cargo>, id?: number) {
    const salvo = id
      ? await api<Cargo>(`/api/cargos/${id}`, "PUT", dados)
      : await api<Cargo>("/api/cargos", "POST", dados);
    setCargos((cs) => (id ? cs.map((c) => (c.id === id ? salvo : c)) : [...cs, salvo]));
    setPainel({ modo: "ver", id: salvo.id });
    setAviso(id ? "Cargo salvo." : "Cargo criado.");
  }

  async function excluirCargo(id: number) {
    await api(`/api/cargos/${id}`, "DELETE");
    setCargos((cs) => cs.filter((c) => c.id !== id));
    setMobs((ms) => ms.filter((m) => m.origem_id !== id && m.destino_id !== id));
    setPainel(null);
    setAviso("Cargo excluído.");
  }

  async function salvarMob(dados: Partial<Mobilidade>, id: number | null) {
    const salva = id
      ? await api<Mobilidade>(`/api/mobilidades/${id}`, "PUT", dados)
      : await api<Mobilidade>("/api/mobilidades", "POST", dados);
    setMobs((ms) => (id ? ms.map((m) => (m.id === id ? salva : m)) : [...ms, salva]));
    setPainel(null);
    setAviso(id ? "Mobilidade salva." : "Mobilidade criada.");
  }

  async function excluirMob(id: number) {
    await api(`/api/mobilidades/${id}`, "DELETE");
    setMobs((ms) => ms.filter((m) => m.id !== id));
    setPainel(null);
    setAviso("Mobilidade excluída.");
  }

  async function sair() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  const cargoAberto = painel && "id" in painel && painel.modo !== "mob" ? porId.get(painel.id) : undefined;

  return (
    <>
    <div className="barra-matter">
      <div>
        <a href="/" className="marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/matter-logo.png" alt="Matter" />
          <span>Área de edição</span>
        </a>
        <a href="/" className="ver-site">Ver o site</a>
      </div>
    </div>
    <div className="app">
      <header className="topo">
        <div>
          <h1>Cargos e salários</h1>
          <p className="muted">
            Alterações feitas aqui aparecem no site na hora. {cargos.length} cargos em {new Set(cargos.map((c) => c.familia)).size} trilhas, com {mobs.length} caminhos de mobilidade entre eles.
          </p>
        </div>
        <div className="acoes-topo">
          {temLogin && (
            <button className="btn ghost" onClick={sair}>Sair</button>
          )}
          <button
            className="btn primary"
            onClick={() => setPainel(aba === "cargos" ? { modo: "novo" } : { modo: "mob", id: null })}
          >
            {aba === "cargos" ? "Novo cargo" : "Nova mobilidade"}
          </button>
        </div>
      </header>

      <nav className="abas" role="tablist" aria-label="Seções">
        <button role="tab" aria-selected={aba === "cargos"} onClick={() => setAba("cargos")}>Cargos e faixas</button>
        <button role="tab" aria-selected={aba === "mobilidade"} onClick={() => setAba("mobilidade")}>Mobilidade entre cargos</button>
      </nav>

      <div className="filtros">
        <input
          type="search"
          placeholder={aba === "cargos" ? "Buscar por cargo, position ou time" : "Buscar por cargo ou competência"}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar"
        />
        {aba === "cargos" ? (
          <>
            <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área">
              <option value="">Todas as áreas</option>
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)} aria-label="Nível">
              <option value="">Todos os níveis</option>
              {NIVEIS.map((n) => <option key={n}>{n}</option>)}
            </select>
            <select value={lider} onChange={(e) => setLider(e.target.value)} aria-label="Líder">
              <option value="">Todos os líderes</option>
              {lideres.map((l) => <option key={l}>{l}</option>)}
            </select>
          </>
        ) : (
          <select value={tipoMob} onChange={(e) => setTipoMob(e.target.value)} aria-label="Tipo de mobilidade">
            <option value="">Todos os tipos</option>
            {TIPOS_MOBILIDADE.map((t) => <option key={t}>{t}</option>)}
          </select>
        )}
        {filtrosAtivos && <button className="btn link" onClick={limpar}>Limpar filtros</button>}
      </div>

      {aba === "cargos" ? (
        <section className="tabela" aria-label="Cargos agrupados por trilha">
          <div className="regua" aria-hidden="true">
            <span className="regua-rotulo">Faixa salarial (R$)</span>
            <div className="regua-escala">
              {escala.marcas.map((v) => (
                <span key={v} style={{ left: pct(v) }}>{curto(v)}</span>
              ))}
            </div>
          </div>

          {grupos.length === 0 && (
            <div className="vazio">
              <p>Nenhum cargo bate com esses filtros.</p>
              <button className="btn" onClick={limpar}>Limpar filtros</button>
            </div>
          )}

          {grupos.map(([familia, lista]) => (
            <div className="grupo" key={familia}>
              <h2>{familia}</h2>
              {lista.map((c) => (
                <button
                  key={c.id}
                  className={"linha" + (cargoAberto?.id === c.id ? " ativa" : "")}
                  onClick={() => setPainel({ modo: "ver", id: c.id })}
                >
                  <span className="linha-nome">
                    <strong>{c.nome}</strong>
                    <small>{[c.time, c.area].filter(Boolean).join(", ")}</small>
                  </span>
                  <span className={"nivel " + classeNivel(c.nivel)}>{c.nivel}</span>
                  <span className="linha-faixa">
                    <span className="trilho">
                      {escala.marcas.map((v) => <i key={v} style={{ left: pct(v) }} />)}
                      {c.piso != null && c.teto != null ? (
                        <span
                          className={"faixa " + classeNivel(c.nivel)}
                          style={{ left: pct(c.piso), width: `calc(${pct(c.teto - c.piso)} + 2px)` }}
                          title={`${brl(c.piso)} a ${brl(c.teto)}`}
                        />
                      ) : (
                        <span className="sem-faixa">Faixa não definida</span>
                      )}
                    </span>
                    <span className="valores">
                      {c.piso != null && c.teto != null ? `${brl(c.piso)} a ${brl(c.teto)}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))}

          <p className="legenda">
            {NIVEIS.map((n) => (
              <span key={n}><i className={"faixa " + classeNivel(n)} />{n}</span>
            ))}
          </p>
        </section>
      ) : (
        <section className="tabela" aria-label="Mobilidades">
          <div className="mob-cab" aria-hidden="true">
            <span>Cargo de origem</span><span>Pode ir para</span><span>Tipo</span><span>Competências transferíveis</span>
          </div>
          {mobsFiltradas.length === 0 && (
            <div className="vazio">
              <p>Nenhuma mobilidade encontrada.</p>
              <button className="btn" onClick={() => setPainel({ modo: "mob", id: null })}>Cadastrar mobilidade</button>
            </div>
          )}
          {mobsFiltradas.map((m) => (
            <button key={m.id} className="mob-linha" onClick={() => setPainel({ modo: "mob", id: m.id })}>
              <span>{porId.get(m.origem_id)?.nome}</span>
              <span>{porId.get(m.destino_id)?.nome}</span>
              <span><Tipo tipo={m.tipo} /></span>
              <span className="muted">{m.observacao}</span>
            </button>
          ))}
        </section>
      )}

      {painel && (
        <div className="sobreposicao" onClick={() => setPainel(null)}>
          <aside className="painel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {painel.modo === "ver" && cargoAberto && (
              <DetalheCargo
                cargo={cargoAberto}
                cargos={cargos}
                mobs={mobs}
                porId={porId}
                onEditar={() => setPainel({ modo: "editar", id: cargoAberto.id })}
                onExcluir={() => excluirCargo(cargoAberto.id)}
                onAbrir={(id) => setPainel({ modo: "ver", id })}
                onNovaMob={() => setPainel({ modo: "mob", id: null, origem: cargoAberto.id })}
                onFechar={() => setPainel(null)}
              />
            )}
            {(painel.modo === "editar" || painel.modo === "novo") && (
              <FormCargo
                cargo={painel.modo === "editar" ? porId.get(painel.id) : undefined}
                familias={opcoes("familia")}
                areas={areas}
                times={opcoes("time")}
                lideres={lideres}
                onSalvar={(d) => salvarCargo(d, painel.modo === "editar" ? painel.id : undefined)}
                onCancelar={() => setPainel(painel.modo === "editar" ? { modo: "ver", id: painel.id } : null)}
              />
            )}
            {painel.modo === "mob" && (
              <FormMob
                mob={painel.id ? mobs.find((m) => m.id === painel.id) : undefined}
                origemInicial={painel.origem}
                cargos={cargos}
                onSalvar={(d) => salvarMob(d, painel.id)}
                onExcluir={painel.id ? () => excluirMob(painel.id!) : undefined}
                onCancelar={() => setPainel(painel.origem ? { modo: "ver", id: painel.origem } : null)}
              />
            )}
          </aside>
        </div>
      )}

      <div className="aviso" role="status" aria-live="polite">{aviso}</div>
    </div>
    </>
  );
}

function Tipo({ tipo }: { tipo: string }) {
  const cls = tipo === "Direta" ? "t-direta" : tipo === "Condicionada" ? "t-cond" : "t-nova";
  return <span className={"tipo " + cls}>{tipo}</span>;
}

function Texto({ valor }: { valor: string | null }) {
  if (!valor) return <p className="muted">Não preenchido.</p>;
  const partes = valor.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  if (partes.length > 2) return <ul>{partes.map((p, i) => <li key={i}>{p.replace(/\.$/, "")}</li>)}</ul>;
  return <p>{valor}</p>;
}

function Foco({ valor }: { valor: string | null }) {
  if (!valor) return <p className="muted">Não preenchido.</p>;
  const partes = valor.split(/\s(?=(?:Objetivo|Atuação|Métricas):)/);
  return (
    <>
      {partes.map((p, i) => {
        const m = p.match(/^(Objetivo|Atuação|Métricas):\s*(.*)$/s);
        return m ? <p key={i}><b>{m[1]}.</b> {m[2]}</p> : <p key={i} className="foco-lead">{p}</p>;
      })}
    </>
  );
}

function BotaoExcluir({ onConfirmar, rotulo }: { onConfirmar: () => Promise<void>; rotulo: string }) {
  const [armado, setArmado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <>
      <button
        className={"btn " + (armado ? "perigo" : "ghost")}
        onClick={async () => {
          if (!armado) return setArmado(true);
          try { await onConfirmar(); } catch (e) { setErro((e as Error).message); setArmado(false); }
        }}
      >
        {armado ? "Clique de novo para excluir" : rotulo}
      </button>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </>
  );
}

function DetalheCargo({
  cargo, cargos, mobs, porId, onEditar, onExcluir, onAbrir, onNovaMob, onFechar,
}: {
  cargo: Cargo; cargos: Cargo[]; mobs: Mobilidade[]; porId: Map<number, Cargo>;
  onEditar: () => void; onExcluir: () => Promise<void>; onAbrir: (id: number) => void; onNovaMob: () => void; onFechar: () => void;
}) {
  const trilha = cargos
    .filter((c) => c.familia && c.familia === cargo.familia)
    .sort((a, b) => ordemNivel(a.nivel) - ordemNivel(b.nivel));
  const saidas = mobs.filter((m) => m.origem_id === cargo.id);
  const entradas = mobs.filter((m) => m.destino_id === cargo.id);
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), [cargo.id]);

  return (
    <div className="detalhe">
      <div className="painel-cab">
        <div>
          <h2 ref={ref} tabIndex={-1}>{cargo.nome}</h2>
          {cargo.position && <p className="muted">{cargo.position}</p>}
        </div>
        <button className="fechar" onClick={onFechar} aria-label="Fechar painel">×</button>
      </div>

      <div className="destaque-faixa">
        <span className={"nivel " + classeNivel(cargo.nivel)}>{cargo.nivel}</span>
        <strong>{cargo.piso != null && cargo.teto != null ? `${brl(cargo.piso)} a ${brl(cargo.teto)}` : "Faixa salarial não definida"}</strong>
      </div>

      <dl className="fichas">
        <div><dt>Área</dt><dd>{cargo.area ?? "—"}</dd></div>
        <div><dt>Time</dt><dd>{cargo.time ?? "—"}</dd></div>
        <div><dt>Líder</dt><dd>{cargo.lider ?? "—"}</dd></div>
        <div><dt>Papel</dt><dd>{cargo.papel ?? "—"}</dd></div>
        <div><dt>Complexidade</dt><dd>{cargo.complexidade ?? "—"}</dd></div>
        <div><dt>Autonomia</dt><dd>{cargo.autonomia ?? "—"}</dd></div>
      </dl>

      {trilha.length > 1 && (
        <section>
          <h3>Trilha de {cargo.familia}</h3>
          <ol className="degraus">
            {trilha.map((c) => (
              <li key={c.id} className={c.id === cargo.id ? "atual" : ""}>
                {c.id === cargo.id ? (
                  <span>{c.nome}</span>
                ) : (
                  <button className="btn link" onClick={() => onAbrir(c.id)}>{c.nome}</button>
                )}
                <small>{c.piso != null ? `${brl(c.piso)} a ${brl(c.teto)}` : "sem faixa"}</small>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section><h3>Descrição</h3><Texto valor={cargo.descricao} /></section>
      <section><h3>Foco da função</h3><Foco valor={cargo.foco} /></section>
      <section><h3>Requisitos</h3><Texto valor={cargo.requisitos} /></section>

      <section>
        <h3>Pode migrar para</h3>
        {saidas.length === 0 ? <p className="muted">Nenhuma mobilidade cadastrada a partir deste cargo.</p> : (
          <ul className="mob-lista">
            {saidas.map((m) => (
              <li key={m.id}>
                <button className="btn link" onClick={() => onAbrir(m.destino_id)}>{porId.get(m.destino_id)?.nome}</button>
                <Tipo tipo={m.tipo} />
                {m.observacao && <small>{m.observacao}</small>}
              </li>
            ))}
          </ul>
        )}
        <button className="btn" onClick={onNovaMob}>Adicionar mobilidade</button>
      </section>

      {entradas.length > 0 && (
        <section>
          <h3>Quem pode vir para cá</h3>
          <ul className="mob-lista">
            {entradas.map((m) => (
              <li key={m.id}>
                <button className="btn link" onClick={() => onAbrir(m.origem_id)}>{porId.get(m.origem_id)?.nome}</button>
                <Tipo tipo={m.tipo} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="painel-rodape">
        <BotaoExcluir rotulo="Excluir cargo" onConfirmar={onExcluir} />
        <button className="btn primary" onClick={onEditar}>Editar cargo</button>
      </div>
    </div>
  );
}

function FormCargo({
  cargo, familias, areas, times, lideres, onSalvar, onCancelar,
}: {
  cargo?: Cargo; familias: string[]; areas: string[]; times: string[]; lideres: string[];
  onSalvar: (d: Partial<Cargo>) => Promise<void>; onCancelar: () => void;
}) {
  const [f, setF] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    const campos = ["nome","position","familia","area","time","nivel","papel","lider","piso","teto","descricao","foco","complexidade","autonomia","requisitos"];
    for (const k of campos) base[k] = cargo ? String((cargo as Record<string, unknown>)[k] ?? "") : "";
    if (!base.nivel) base.nivel = "Júnior";
    return base;
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setSalvando(true);
    try { await onSalvar(f as unknown as Partial<Cargo>); }
    catch (err) { setErro((err as Error).message); }
    finally { setSalvando(false); }
  }

  const campo = (k: string, rotulo: string, extra?: React.InputHTMLAttributes<HTMLInputElement> & { lista?: string[] }) => (
    <label className="campo">
      <span>{rotulo}</span>
      <input value={f[k]} onChange={set(k)} list={extra?.lista ? `l-${k}` : undefined} {...extra} />
      {extra?.lista && <datalist id={`l-${k}`}>{extra.lista.map((o) => <option key={o} value={o} />)}</datalist>}
    </label>
  );
  const area = (k: string, rotulo: string, linhas = 4) => (
    <label className="campo largo">
      <span>{rotulo}</span>
      <textarea rows={linhas} value={f[k]} onChange={set(k)} />
    </label>
  );

  return (
    <form onSubmit={enviar} className="form">
      <div className="painel-cab">
        <h2>{cargo ? `Editar ${cargo.nome}` : "Novo cargo"}</h2>
        <button type="button" className="fechar" onClick={onCancelar} aria-label="Cancelar">×</button>
      </div>
      <div className="grade">
        <label className="campo largo">
          <span>Nome do cargo</span>
          <input value={f.nome} onChange={set("nome")} required autoFocus />
        </label>
        {campo("position", "Position (inglês)")}
        <label className="campo">
          <span>Nível</span>
          <select value={f.nivel} onChange={set("nivel")}>{NIVEIS.map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        {campo("familia", "Trilha", { lista: familias, placeholder: "Ex.: Dados" })}
        {campo("area", "Área", { lista: areas })}
        {campo("time", "Time", { lista: times })}
        {campo("lider", "Líder", { lista: lideres })}
        {campo("piso", "Piso (R$)", { inputMode: "numeric", placeholder: "3000" })}
        {campo("teto", "Teto (R$)", { inputMode: "numeric", placeholder: "5000" })}
        {campo("papel", "Papel", { placeholder: "Execução assistida" })}
        {campo("complexidade", "Complexidade")}
        {campo("autonomia", "Autonomia")}
        {area("descricao", "Descrição", 6)}
        {area("foco", "Foco da função", 5)}
        {area("requisitos", "Requisitos (separe com ponto e vírgula)", 5)}
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="painel-rodape">
        <button type="button" className="btn ghost" onClick={onCancelar}>Cancelar</button>
        <button className="btn primary" disabled={salvando}>{salvando ? "Salvando…" : cargo ? "Salvar cargo" : "Criar cargo"}</button>
      </div>
    </form>
  );
}

function FormMob({
  mob, origemInicial, cargos, onSalvar, onExcluir, onCancelar,
}: {
  mob?: Mobilidade; origemInicial?: number; cargos: Cargo[];
  onSalvar: (d: Partial<Mobilidade>) => Promise<void>; onExcluir?: () => Promise<void>; onCancelar: () => void;
}) {
  const [origem, setOrigem] = useState(String(mob?.origem_id ?? origemInicial ?? ""));
  const [destino, setDestino] = useState(String(mob?.destino_id ?? ""));
  const [tipo, setTipo] = useState(mob?.tipo ?? "Direta");
  const [obs, setObs] = useState(mob?.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const ordenados = [...cargos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null); setSalvando(true);
    try { await onSalvar({ origem_id: Number(origem), destino_id: Number(destino), tipo, observacao: obs }); }
    catch (err) { setErro((err as Error).message); }
    finally { setSalvando(false); }
  }

  return (
    <form onSubmit={enviar} className="form">
      <div className="painel-cab">
        <h2>{mob ? "Editar mobilidade" : "Nova mobilidade"}</h2>
        <button type="button" className="fechar" onClick={onCancelar} aria-label="Cancelar">×</button>
      </div>
      <div className="grade">
        <label className="campo largo">
          <span>Cargo de origem</span>
          <select value={origem} onChange={(e) => setOrigem(e.target.value)} required>
            <option value="">Escolha um cargo</option>
            {ordenados.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label className="campo largo">
          <span>Cargo de destino</span>
          <select value={destino} onChange={(e) => setDestino(e.target.value)} required>
            <option value="">Escolha um cargo</option>
            {ordenados.filter((c) => String(c.id) !== origem).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <fieldset className="campo largo tipos">
          <legend>Tipo de mobilidade</legend>
          {TIPOS_MOBILIDADE.map((t) => (
            <label key={t}>
              <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} /> {t}
            </label>
          ))}
          <small className="muted">
            {tipo === "Direta" && "A maior parte das competências já está presente."}
            {tipo === "Condicionada" && "Há competências transferíveis, mas é preciso desenvolver conhecimentos técnicos."}
            {tipo === "Nova Trilha" && "A mudança exige formação ou experiência bem diferente."}
          </small>
        </fieldset>
        <label className="campo largo">
          <span>Competências transferíveis</span>
          <textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: Dados e indicadores" />
        </label>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="painel-rodape">
        {onExcluir ? <BotaoExcluir rotulo="Excluir mobilidade" onConfirmar={onExcluir} /> : <button type="button" className="btn ghost" onClick={onCancelar}>Cancelar</button>}
        <button className="btn primary" disabled={salvando}>{salvando ? "Salvando…" : mob ? "Salvar mobilidade" : "Criar mobilidade"}</button>
      </div>
    </form>
  );
}
