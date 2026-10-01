# Prompt: Sistema de Geração de Escalas para Conjunto Musical

> Este prompt pode ser usado diretamente em uma ferramenta de IA de desenvolvimento (ex: Claude Code) para gerar o sistema descrito abaixo.

## Objetivo
Criar um sistema web que permita cadastrar os integrantes de um conjunto musical, classificá-los segundo critérios vocais, e gerar automaticamente um número configurável de escalas (rosters) balanceadas, respeitando regras de prioridade definidas pelo usuário.

## 1. Cadastro e Classificação dos Integrantes
Cada integrante deve ser cadastrado com:
- Nome
- Voz: Masculino | Feminino
- Afinação (1 a 4): 1-Pouco afinado, 2-Afinado sem muita precisão nas notas, 3-Afinado sem extensão vocal, 4-Afinado com extensão vocal
- Tipo de Voz: Contralto, Mezzo-soprano, Soprano, Baixo, Barítono, Tenor
- Lead Vocal: SIM, NÃO, SIM com ressalvas
- Backing Vocal: Sabe cantar em vozes, Não sabe cantar em vozes, Consegue decorar voz com treino, Consegue decorar voz mas sem muita afinação

Esses parâmetros (nomes das escalas de valores, rótulos, etc.) devem ser **configuráveis** via cadastro, para que o sistema não fique travado apenas para este conjunto específico e possa ser reaproveitado por outros grupos com outros critérios.

## 2. Parâmetros de Geração das Escalas
Antes de gerar, o usuário define:
- **Quantidade de escalas** desejada (N)
- **Quantidade de componentes por escala** (M) — validar que N × M seja compatível com o total de integrantes ativos (permitir sobra configurável: descartar, distribuir extra, ou avisar o usuário)
- **Critérios de balanceamento**, que podem ser ativados/desativados e ordenados por prioridade (o usuário decide o que pesa mais quando os critérios entram em conflito):
  1. **Âncora obrigatória** — toda escala deve ter ao menos 1 integrante de "nível mais alto", definido como Lead Vocal = SIM **e** Backing Vocal = Sabe cantar em vozes (regra configurável: o usuário pode redefinir o que conta como "nível alto")
  2. **Distribuição de gênero** — tentar garantir ao menos 1 homem por escala; se não houver homens suficientes para cobrir todas as escalas, distribuir o máximo possível e sinalizar quais escalas ficaram sem
  3. **Diversidade de tipos de voz** — maximizar a quantidade de tipos de voz distintos dentro de cada escala, evitando repetir tipo quando houver tipos alternativos disponíveis no pool
  4. **Nivelamento de afinação** — minimizar a diferença entre a soma (ou média) de afinação das escalas, evitando que uma fique muito mais "fraca" que as outras

## 3. Algoritmo de Montagem (sugestão)
1. Selecionar os "candidatos a âncora" (que atendem à regra 1) e distribuir 1 por escala (round-robin), até esgotar âncoras ou escalas.
2. Se houver mais escalas que âncoras disponíveis, marcar as escalas restantes como "sem âncora" e sinalizar ao usuário — ou permitir escolher manualmente uma âncora "substituta" com critério mais flexível (ex: só Lead = SIM, ignorando Backing).
3. Distribuir os integrantes restantes com uma alocação gulosa (greedy): a cada novo integrante a alocar, escolher a escala que:
   - ainda precisa de homem (se a regra 2 estiver ativa e houver homens no pool restante);
   - ainda não tem o tipo de voz do candidato (se a regra 3 estiver ativa);
   - tem a menor soma de afinação atual (se a regra 4 estiver ativa);
   combinando os critérios ativos conforme a ordem de prioridade definida pelo usuário (ex: regra 1 > regra 2 > regra 4 > regra 3, ou qualquer outra ordem escolhida na tela de configuração).
4. Ao final, calcular métricas por escala — soma/média de afinação, quantidade de tipos de voz distintos, presença de homem, presença de âncora — e exibir um resumo comparativo entre as escalas geradas.

## 4. Funcionalidades da Interface
- CRUD de integrantes (cadastro, edição, inativação/soft delete)
- CRUD/configuração dos parâmetros de classificação (para reaproveitar o sistema com outros grupos ou critérios)
- Tela de geração de escalas: escolher quantidade de escalas, ativar e priorizar critérios de balanceamento, gerar e visualizar o resultado
- Ajuste manual pós-geração: permitir trocar/mover integrantes entre escalas, recalculando as métricas de balanceamento em tempo real
- Histórico de escalas geradas (guardar versões anteriores para consulta)

## 5. Stack Sugerida
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js
- Cache/filas (se necessário para otimizar o algoritmo com muitos integrantes): Redis
- Deploy: Docker
