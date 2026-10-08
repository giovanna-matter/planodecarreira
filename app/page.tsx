import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/site/Moldura";
import { Nivel, Tipo } from "@/components/site/Pecas";
import {
  carregar, DESCRICAO_AREAS, faixa, faixaMaisComum, ordenarAreas, pct, slug, trilhas, brl,
} from "@/lib/dados";
import { NIVEIS } from "@/lib/types";
import ErroBanco from "@/components/site/ErroBanco";

export const dynamic = "force-dynamic";

const NIVEIS_TEXTO = [
  ["Aprendizado", "Execução assistida, com acompanhamento de pessoas mais experientes."],
  ["Autonomia", "Execução autônoma, propondo melhorias no próprio trabalho."],
  ["Referência", "Execução e estratégia, orientando quem está começando."],
  ["Estratégia e inovação", "Referência técnica da área, sem gestão direta de pessoas."],
  ["Gestão e aperfeiçoamento", "Execução, gestão de pessoas e estratégia do time."],
];
const PERFIS: [string, string[]][] = [
  ["Operacional", ["Foco na meta da operação", "Qualidade", "Produtividade"]],
  ["Especialista", ["Domínio técnico", "Autonomia", "Execução consistente"]],
  ["Dono de B.U.", ["Gestão de pessoas", "Gestão de prioridades", "Gestão de resultado"]],
  ["Sócio da holding", ["Visão macro", "Coordenação de squads", "Estratégia, validação e visão de negócio"]],
];
const MARCAS = ["0", "3k", "6k", "9k", "12k", "15k"];

export default async function Inicio() {
  let dados;
  try { dados = await carregar(); } catch (e) { return <ErroBanco erro={e} />; }
  const { cargos, mobilidades } = dados;
  const ts = trilhas(cargos);
  const areas = ordenarAreas(cargos.map((c) => c.area || "Sem área"));
  const escada = faixaMaisComum(cargos);
  const porTipo = (t: string) => mobilidades.filter((m) => m.tipo === t).length;

  return (
    <div className="s-pagina">
      <Cabecalho />

      <section id="inicio" className="s-hero">
        <div aria-hidden="true" className="s-bola s-bola-1" />
        <div aria-hidden="true" className="s-bola s-bola-2" />
        <div aria-hidden="true" className="s-bola s-bola-3" />
        <div aria-hidden="true" className="s-bola s-bola-4" />
        <div aria-hidden="true" className="s-bola s-bola-5" />
        <div className="s-hero-in">
          <div className="s-hero-texto">
            <h1>Onde você está e para onde pode ir</h1>
            <p>
              O plano de cargos e salários da Matter reúne os {cargos.length} cargos da empresa em {ts.length} trilhas,
              com o piso e o teto de cada cargo e os {mobilidades.length} caminhos possíveis de uma função para outra.
            </p>
            <div className="s-botoes">
              <a href="#faixas" className="s-btn s-btn-laranja">Ver as faixas salariais</a>
              <a href="#niveis" className="s-btn s-btn-contorno">Como os níveis funcionam</a>
            </div>
          </div>
          {escada.length > 0 && (
            <figure className="s-escada">
              <figcaption>Faixa mais comum em cada nível (R$ por mês)</figcaption>
              {escada.map((d) => (
                <div className="s-escada-linha" key={d.nivel}>
                  <span>{d.nivel}</span>
                  <div className="s-escada-trilho">
                    <div className={`s-escada-barra nv-${d.i}`} style={{ left: pct(d.piso), width: pct(d.teto - d.piso) }}>
                      <span>{d.piso / 1000}–{d.teto / 1000}k</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="s-escada-linha s-escada-escala"><span /><div>{MARCAS.map((m) => <span key={m}>{m}</span>)}</div></div>
            </figure>
          )}
        </div>
      </section>

      <section id="niveis" className="s-faixa-branca">
        <div className="s-sec">
          <h2>Cinco níveis, uma palavra para cada</h2>
          <p className="s-intro">Cada nível muda o grau de autonomia e o tipo de entrega esperada. Depois do Sênior, a carreira se divide: o Especialista aprofunda a técnica, o Coordenador passa a cuidar de pessoas.</p>
          <ol className="s-niveis">
            {NIVEIS.map((n, i) => (
              <li key={n}>
                <span className={`s-traco nv-${i}`} />
                <h3>{n}</h3>
                <p className="s-palavra">{NIVEIS_TEXTO[i][0]}</p>
                <p>{NIVEIS_TEXTO[i][1]}</p>
              </li>
            ))}
          </ol>
          <h3 className="s-sub">O que se espera em cada perfil de atuação</h3>
          <div className="s-perfis">
            {PERFIS.map(([n, xs]) => (
              <div key={n}><p><strong>{n}</strong></p><ul>{xs.map((x) => <li key={x}>{x}</li>)}</ul></div>
            ))}
          </div>
        </div>
      </section>

      <section id="areas" className="s-sec">
        <h2>{areas.length === 5 ? "Cinco áreas de negócio" : "Áreas de negócio"}</h2>
        <p className="s-intro">Cada cargo pertence a uma área e a um time. A área define o contexto da função; o time, com quem ela trabalha no dia a dia.</p>
        <div className="s-areas">
          {areas.map((a) => {
            const cs = cargos.filter((c) => (c.area || "Sem área") === a);
            const nTr = new Set(cs.map((c) => c.familia)).size;
            const times = [...new Set(cs.map((c) => c.time).filter(Boolean))].sort().join(", ");
            const lid = [...new Set(cs.map((c) => c.lider).filter(Boolean))].sort().join(", ");
            return (
              <div className="s-cartao" key={a}>
                <p className="s-cartao-titulo">{a}</p>
                <p className="s-mudo">{DESCRICAO_AREAS[a] ? DESCRICAO_AREAS[a] + ". " : ""}{cs.length} {cs.length === 1 ? "cargo" : "cargos"} em {nTr} {nTr === 1 ? "trilha" : "trilhas"}.</p>
                <p className="s-rotulo">Times</p><p>{times || "—"}</p>
                <p className="s-rotulo">Liderança</p><p>{lid || "—"}</p>
                <p className="s-mais"><Link href={`/cargos/${slug(a)}`}>Ver cargos</Link></p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="faixas" className="s-faixa-lavanda">
        <div className="s-sec">
          <h2>Faixas salariais de todos os cargos</h2>
          <p className="s-intro">Piso e teto mensais de cada cargo, agrupados por trilha. Todas as barras usam a mesma escala, de R$ 0 a R$ 15.000, então dá para comparar trilhas diferentes lado a lado.</p>
          <div className="s-legenda">
            {NIVEIS.map((n, i) => <span key={n}><i className={`nv-${i}`} />{n}</span>)}
          </div>
          <div className="s-trilhas">
            {ts.map((t) => {
              const com = t.cargos.filter((c) => c.piso != null && c.teto != null);
              const resumo = com.length ? `${brl(Math.min(...com.map((c) => c.piso!)))} a ${brl(Math.max(...com.map((c) => c.teto!)))}` : "Faixas a definir";
              const times = [...new Set(t.cargos.map((c) => c.time).filter(Boolean))].join(", ");
              return (
                <div className="s-cartao s-trilha" key={t.nome}>
                  <div className="s-trilha-cab">
                    <h3>{t.nome}</h3>
                    <span>{t.area}{times ? `, ${times}` : ""}. {resumo}</span>
                  </div>
                  <div className="s-grade s-grade-cab">
                    <span>Cargo</span>
                    <div className="s-marcas">{MARCAS.map((m) => <span key={m}>{m}</span>)}</div>
                    <span className="s-dir">Piso a teto</span>
                  </div>
                  {t.cargos.map((c) => (
                    <div className="s-grade s-grade-linha" key={c.id}>
                      <div className="s-cargo">
                        <span className="s-cargo-nome">{c.nome}</span>
                        <span className="s-cargo-meta"><Nivel nivel={c.nivel} />{c.position && <small>{c.position}</small>}</span>
                      </div>
                      <div className="s-trilho">
                        {c.piso != null && c.teto != null && (
                          <div className={`nv-${NIVEIS.indexOf(c.nivel as (typeof NIVEIS)[number])}`} style={{ left: pct(c.piso), width: pct(c.teto - c.piso) }} />
                        )}
                      </div>
                      <span className={"s-dir" + (c.piso == null ? " s-mudo" : " s-valor")}>{faixa(c)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cargos" className="s-sec">
        <h2>Cargos em detalhe</h2>
        <p className="s-intro">Cada área tem uma página com a descrição completa dos cargos: foco da função, papel, complexidade, autonomia, requisitos, time, liderança e faixa salarial.</p>
        <ul className="s-lista-areas">
          {areas.map((a) => {
            const n = cargos.filter((c) => (c.area || "Sem área") === a).length;
            return <li key={a}><Link href={`/cargos/${slug(a)}`}>{a}</Link><span className="s-mudo">{n} {n === 1 ? "cargo" : "cargos"}</span></li>;
          })}
        </ul>
      </section>

      <section id="mobilidade" className="s-sec s-sec-final">
        <h2>Mobilidade entre cargos</h2>
        <p className="s-intro">Além de subir na própria trilha, dá para mudar de função. O plano mapeia {mobilidades.length} caminhos entre cargos e classifica cada um pelo esforço da mudança.</p>
        <div className="s-tipos">
          <div className="s-cartao"><Tipo tipo="Direta" /><p>A maior parte das competências já está presente. A mudança pode acontecer com pouco desenvolvimento adicional.</p><p className="s-mudo">{porTipo("Direta")} caminhos no plano</p></div>
          <div className="s-cartao"><Tipo tipo="Condicionada" /><p>Há competências transferíveis, mas é preciso desenvolver conhecimentos técnicos específicos antes da mudança.</p><p className="s-mudo">{porTipo("Condicionada")} caminhos no plano</p></div>
          <div className="s-cartao"><Tipo tipo="Nova Trilha" /><p>A mudança exige formação ou experiência substancialmente diferente da atual.</p><p className="s-mudo">{porTipo("Nova Trilha") ? `${porTipo("Nova Trilha")} caminhos no plano` : "Avaliada caso a caso"}</p></div>
        </div>
        <p className="s-mais"><Link href="/mobilidade">Ver os {mobilidades.length} caminhos, de qual cargo para qual</Link></p>
      </section>

      <Rodape />
    </div>
  );
}
