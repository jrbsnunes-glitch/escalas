# Escalas ministeriais

Repositório: [github.com/jrbsnunes-glitch/escalas](https://github.com/jrbsnunes-glitch/escalas)

Sistema web para cadastrar cantores, gerar escalas automáticas com critérios vocais ou montar cultos manualmente, e exportar no formato do WhatsApp ou em PDF. Inclui PWA instalável no celular, anexos por música na escala e layout responsivo.

## Como iniciar

```bash
npm install
cp .env.example .env   # no Windows: copy .env.example .env
npm run db:setup
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

- **Usuário:** `Jarbas`
- **Senha:** `admin123`

O administrador libera outros acessos em **Usuários** (nome do integrante + senha).

## O que o sistema faz

- Login com sessão
- Cadastro de cantores (voz, afinação, tipo de voz, lead, backing e funções)
- Parâmetros de classificação configuráveis
- Funções do culto (bateria, baixo, teclado, vocal, etc.)
- Geração automática com âncora, gênero, diversidade de vozes e nivelamento de afinação
- Montagem manual sem critérios
- Histórico, ajuste posterior, cópia para WhatsApp e PDF
- Layout adaptado para celular, notebook e computador
