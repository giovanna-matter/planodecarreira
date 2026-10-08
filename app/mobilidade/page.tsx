import Link from "next/link";
import { Cabecalho, Rodape } from "@/components/site/Moldura";
import { Tipo } from "@/components/site/Pecas";
import ErroBanco from "@/components/site/ErroBanco";
import { carregar, ordemNivel, slug } from "@/lib/dados";

export const dynamic = "force-dynamic";

export default async function Mobilidade() {
  let dados;
  try { dados = await carregar(); } catch (e) { return <ErroBanco erro={e} />; }
  const porId = new Map(dados.cargos.map((c) => [c.id, c]));
  const ms = dados.mobilidades
    .filter((m) => porId.has(m.origem_id) && porId.has(m.destino_id))
    .sort((a, b) => {
      const oa = porId.get(a.origem_id)!, ob = porId.get(b.origem_id)!;
      return (oa.familia || "").localeCompare(ob.familia || "", "pt-BR") || ordemNivel(oa.nivel) - ordemNivel(ob.nivel)
        || oa.nome.localeCompare(ob.nome, "pt-BR") || porId.get(a.destino_id)!.nome.localeCompare(porId.get(b.destino_id)!.nome, "pt-BR");
    });
  const n = (t: string) => ms.filter((m) => m.tipo === t).length;
  const link = (id: number) => { const c = porId.get(id)!; return <Link href={`/cargos/${slug(c.area || "Sem área")}#${slug(c.nome)}`}>{c.nome}</Link>; };

  return (
    <div className="s-pagina">
      <Cabecalho />
      <main className="s-sec s-interna">
        <Link href="/#mobilidade">Voltar para a página inicial</Link>
        <h1>Mobilidade entre cargos</h1>
        <p className="s-intro">Todos os {ms.length} caminhos mapeados no plano: {n("Direta")} diretos e {n("Condicionada")} condicionados{n("Nova Trilha") ? `, além de ${n("Nova Trilha")} de nova trilha` : ""}. Para cada um, as competências que o profissional já leva do cargo de origem.</p>
        <dl className="s-tipos">
          <div className="s-cartao"><dt><Tipo tipo="Direta" /></dt><dd>Maior parte das competências já está presente; a mudança pode ocorrer com pouco desenvolvimento adicional.</dd></div>
          <div className="s-cartao"><dt><Tipo tipo="Condicionada" /></dt><dd>Há competências transferíveis, mas são necessários conhecimentos técnicos específicos.</dd></div>
          <div className="s-cartao"><dt><Tipo tipo="Nova Trilha" /></dt><dd>Mudança exige formação ou experiência substancialmente diferente.</dd></div>
        </dl>
        <div className="s-cartao s-tabela">
          <table>
            <thead><tr><th>Cargo de origem</th><th>Pode ir para</th><th>Tipo</th><th>Competências transferíveis</th></tr></thead>
            <tbody>
              {ms.map((m) => (
                <tr key={m.id}>
                  <td>{link(m.origem_id)}</td>
                  <td className="s-forte">{link(m.destino_id)}</td>
                  <td><Tipo tipo={m.tipo} /></td>
                  <td className="s-mudo">{m.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Rodape />
    </div>
  );
}
