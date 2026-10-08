import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Rodape } from "@/components/site/Moldura";
import { Nivel } from "@/components/site/Pecas";
import ErroBanco from "@/components/site/ErroBanco";
import { carregar, faixa, focoComum, listaRequisitos, partesFoco, slug, trilhas } from "@/lib/dados";
import type { Cargo } from "@/lib/types";

export const dynamic = "force-dynamic";

function Foco({ texto, compacto }: { texto: string; compacto?: boolean }) {
  const { lead, partes } = partesFoco(texto);
  if (!partes.length) return <p>{texto}</p>;
  return (
    <>
      {lead && <p className="s-foco-lead">{lead}</p>}
      <div className={compacto ? "s-foco s-foco-compacto" : "s-foco"}>
        {partes.map(([k, v]) => <div key={k}><p className="s-rotulo">{k}</p><p>{v}</p></div>)}
      </div>
    </>
  );
}

function Ficha({ c, foco }: { c: Cargo; foco: string | null }) {
  const reqs = listaRequisitos(c.requisitos);
  const meta: [string, string | null][] = [["Time", c.time], ["Líder", c.lider], ["Papel", c.papel], ["Complexidade", c.complexidade], ["Autonomia", c.autonomia]];
  return (
    <article className="s-cartao s-ficha" id={slug(c.nome)}>
      <div className="s-ficha-cab">
        <div><h3>{c.nome}</h3>{c.position && <p className="s-mudo">{c.position}</p>}</div>
        <Nivel nivel={c.nivel} />
      </div>
      <p className={"s-ficha-faixa" + (c.piso == null ? " s-mudo" : "")}>{faixa(c)}</p>
      <dl className="s-ficha-meta">
        {meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>)}
      </dl>
      <p className="s-rotulo-forte">Descrição</p>
      <p>{c.descricao || "Não preenchido."}</p>
      {c.foco && c.foco !== foco && (<><p className="s-rotulo-forte">Foco da função</p><Foco texto={c.foco} compacto /></>)}
      <p className="s-rotulo-forte">Requisitos</p>
      {reqs.length ? <ul>{reqs.map((r, i) => <li key={i}>{r}</li>)}</ul> : <p>{c.requisitos || "Não preenchido."}</p>}
    </article>
  );
}

export default async function PaginaArea({ params }: { params: Promise<{ area: string }> }) {
  const { area: alvo } = await params;
  let dados;
  try { dados = await carregar(); } catch (e) { return <ErroBanco erro={e} />; }
  const cs = dados.cargos.filter((c) => slug(c.area || "Sem área") === alvo);
  if (!cs.length) notFound();
  const area = cs[0].area || "Sem área";
  const ts = trilhas(cs);
  const times = [...new Set(cs.map((c) => c.time).filter(Boolean))].sort().join(", ");
  const lid = [...new Set(cs.map((c) => c.lider).filter(Boolean))].sort().join(", ");

  return (
    <div className="s-pagina">
      <Cabecalho />
      <main className="s-sec s-interna">
        <Link href="/#cargos">Voltar para todas as áreas</Link>
        <p className="s-sobretitulo">Cargos em detalhe</p>
        <h1>{area}</h1>
        <p className="s-intro">{cs.length} {cs.length === 1 ? "cargo" : "cargos"} em {ts.length} {ts.length === 1 ? "trilha" : "trilhas"}. Times: {times || "—"}. Liderança: {lid || "—"}.</p>
        {ts.length > 1 && (
          <nav className="s-indice" aria-label="Trilhas desta área">
            {ts.map((t) => <a key={t.nome} href={`#trilha-${slug(t.nome)}`}>{t.nome}</a>)}
          </nav>
        )}
        {ts.map((t) => {
          const foco = focoComum(t.cargos);
          return (
            <section key={t.nome} id={`trilha-${slug(t.nome)}`} className="s-bloco-trilha">
              <h2>Trilha de {t.nome}</h2>
              {foco && <div className="s-cartao s-foco-cartao"><p className="s-rotulo-forte">Foco da função</p><Foco texto={foco} /></div>}
              <div className="s-fichas">{t.cargos.map((c) => <Ficha key={c.id} c={c} foco={foco} />)}</div>
            </section>
          );
        })}
      </main>
      <Rodape />
    </div>
  );
}
