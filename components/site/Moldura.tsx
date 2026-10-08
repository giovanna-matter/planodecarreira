import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE_EDITAR, podeEditar, senhaVer, senhaEditar } from "@/lib/auth";

export async function Cabecalho() {
  const editar = await podeEditar((await cookies()).get(COOKIE_EDITAR)?.value);
  return (
    <header className="s-topo">
      <nav className="s-nav" aria-label="Seções">
        <Link href="/" className="s-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/matter-logo.png" alt="Matter" />
          <span>Cargos e salários</span>
        </Link>
        <div className="s-links">
          <Link href="/#niveis">Níveis</Link>
          <Link href="/#areas">Áreas</Link>
          <Link href="/#faixas">Faixas salariais</Link>
          <Link href="/#cargos">Cargos em detalhe</Link>
          <Link href="/mobilidade">Mobilidade</Link>
          {editar && <a href="/admin" className="s-editar">Editar dados</a>}
        </div>
      </nav>
    </header>
  );
}

export function Rodape() {
  const contato = process.env.CONTATO_RH || "[contato do RH]";
  const temSenha = !!(senhaVer() || senhaEditar());
  return (
    <footer className="s-rodape">
      <div>
        <div>
          <p className="s-rodape-titulo">Quer conversar sobre a sua trilha?</p>
          <p>Procure sua liderança ou o time de RH: {contato}.</p>
          <p className="s-rodape-links">
            <a href="/admin">Área de edição</a>
            {temSenha && <> <span aria-hidden="true">|</span> <a href="/api/login?sair=1">Sair</a></>}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/matter-logo.png" alt="Matter" />
      </div>
    </footer>
  );
}
