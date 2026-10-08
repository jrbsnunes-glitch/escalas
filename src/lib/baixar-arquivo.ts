export async function baixarArquivoSemSair(url: string, nome: string) {
  const destino = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
  const resposta = await fetch(destino, { credentials: "same-origin" });
  if (!resposta.ok) {
    throw new Error("Não foi possível baixar o arquivo.");
  }

  const blob = await resposta.blob();
  const objeto = URL.createObjectURL(blob);
  try {
    const ancora = document.createElement("a");
    ancora.href = objeto;
    ancora.download = nome;
    ancora.rel = "noopener";
    ancora.style.display = "none";
    document.body.appendChild(ancora);
    ancora.click();
    ancora.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objeto), 1500);
  }
}
