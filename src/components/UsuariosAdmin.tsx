"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "./ui";
import { PERFIS_USUARIO, rotuloPerfil } from "@/lib/perfis";
import type { PerfilIntegrante, PerfilUsuario } from "@/lib/types";

type Usuario = {
  id: string;
  integranteId: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  papelMinisterio: string;
};

type IntegranteOpcao = {
  id: string;
  nome: string;
  perfil: PerfilIntegrante;
  ativo: boolean;
};

function rotuloMinisterio(perfil: string) {
  if (perfil === "MUSICO") return "Músico";
  if (perfil === "AMBOS") return "Cantor e músico";
  return "Cantor";
}

export function UsuariosAdmin({
  usuarios,
  integrantes,
  usuarioAtualId,
}: {
  usuarios: Usuario[];
  integrantes: IntegranteOpcao[];
  usuarioAtualId: string;
}) {
  const router = useRouter();
  const [integranteId, setIntegranteId] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>("MEMBRO");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const idsComAcesso = useMemo(
    () => new Set(usuarios.map((usuario) => usuario.integranteId)),
    [usuarios],
  );

  const integrantesDisponiveis = integrantes.filter(
    (item) => item.ativo && !idsComAcesso.has(item.id),
  );

  const editando = usuarios.find((usuario) => usuario.id === editandoId);

  function limpar() {
    setIntegranteId("");
    setSenha("");
    setPerfil("MEMBRO");
    setEditandoId(null);
    setErro("");
  }

  function comecarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setIntegranteId(usuario.integranteId);
    setSenha("");
    setPerfil(usuario.perfil);
    setErro("");
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch(
        editandoId ? `/api/usuarios/${editandoId}` : "/api/usuarios",
        {
          method: editandoId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            integranteId,
            perfil,
            ...(senha ? { senha } : {}),
          }),
        },
      );
      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível salvar o acesso.");
        return;
      }
      limpar();
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(usuario: Usuario) {
    if (
      !window.confirm(
        `Remover o acesso de "${usuario.nome}"? O cadastro no ministério permanece.`,
      )
    ) {
      return;
    }
    const resposta = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "DELETE",
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      window.alert(dados.erro ?? "Não foi possível remover o acesso.");
      return;
    }
    if (editandoId === usuario.id) limpar();
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted">
        O login no sistema usa o <strong className="text-cream">nome do integrante</strong> (como
        cadastrado em Componentes) e a senha definida aqui.
      </p>
      <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
        <Campo label="Cantor ou músico">
          {editando ? (
            <input className="field" value={editando.nome} disabled />
          ) : (
            <select
              className="field"
              value={integranteId}
              onChange={(e) => setIntegranteId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {integrantesDisponiveis.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} · {rotuloMinisterio(item.perfil)}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo label={editandoId ? "Nova senha (opcional)" : "Senha de acesso"}>
          <input
            className="field"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required={!editandoId}
            minLength={editandoId ? undefined : 6}
            autoComplete="new-password"
          />
        </Campo>
        <Campo label="Perfil no sistema">
          <select
            className="field"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
          >
            {PERFIS_USUARIO.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        {erro && <p className="text-sm text-danger sm:col-span-2">{erro}</p>}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Botao type="submit" disabled={enviando || (!editandoId && integrantesDisponiveis.length === 0)}>
            {editandoId ? "Salvar acesso" : "Liberar acesso"}
          </Botao>
          {editandoId && (
            <Botao type="button" variant="ghost" onClick={limpar}>
              Cancelar
            </Botao>
          )}
        </div>
      </form>

      {integrantesDisponiveis.length === 0 && !editandoId && (
        <p className="text-sm text-muted">
          Todos os cantores e músicos ativos já têm acesso, ou ainda não há cadastro no ministério.
        </p>
      )}

      <ul className="divide-y divide-line">
        {usuarios.map((usuario) => (
          <li
            key={usuario.id}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {usuario.nome}
                {usuario.id === usuarioAtualId && (
                  <span className="ml-2 text-xs text-muted">(você)</span>
                )}
              </p>
              <p className="text-sm text-muted">
                Login: <strong className="text-cream">{usuario.nome}</strong> ·{" "}
                {rotuloMinisterio(usuario.papelMinisterio)} · {rotuloPerfil(usuario.perfil)}
              </p>
            </div>
            <div className="flex gap-2">
              <Botao
                type="button"
                variant="ghost"
                onClick={() => comecarEdicao(usuario)}
              >
                Editar
              </Botao>
              <Botao
                type="button"
                variant="danger"
                onClick={() => excluir(usuario)}
                disabled={usuario.id === usuarioAtualId}
              >
                Remover acesso
              </Botao>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
