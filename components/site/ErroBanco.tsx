export default function ErroBanco({ erro }: { erro: unknown }) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  return (
    <main className="s-erro">
      <h1>Falta conectar o banco</h1>
      <p>A página não conseguiu ler os cargos: <code>{msg}</code></p>
      <ol>
        <li>Na Vercel, abra o projeto, vá em Storage e conecte um banco Postgres (Neon), com o prefixo vazio, para a variável se chamar <code>DATABASE_URL</code>.</li>
        <li>Em Deployments, faça um Redeploy do último deploy.</li>
        <li>Recarregue esta página. As tabelas e os dados da planilha são criados sozinhos no primeiro acesso.</li>
      </ol>
    </main>
  );
}
