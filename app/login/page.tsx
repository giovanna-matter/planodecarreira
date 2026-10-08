export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string; next?: string; modo?: string }> }) {
  const { erro, next = "/", modo } = await searchParams;
  const editar = modo === "editar";
  return (
    <main className="s-pagina s-login">
      <form method="post" action="/api/login" className="s-login-cartao">
        <div className="s-login-topo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/matter-logo.png" alt="Matter" />
        </div>
        <h1>{editar ? "Área de edição" : "Cargos e salários"}</h1>
        <p className="s-mudo">
          {editar
            ? "Para alterar cargos, faixas e mobilidades, digite a senha de edição."
            : "Esta página tem faixas salariais. Digite a senha de acesso."}
        </p>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="modo" value={editar ? "editar" : "ver"} />
        <label htmlFor="senha">{editar ? "Senha de edição" : "Senha"}</label>
        <input id="senha" name="senha" type="password" autoFocus required autoComplete="current-password" />
        {erro && <p className="s-login-erro" role="alert">Senha incorreta. Confira e tente de novo.</p>}
        <button type="submit">Entrar</button>
        {editar && <a href="/">Voltar para o site</a>}
      </form>
    </main>
  );
}
