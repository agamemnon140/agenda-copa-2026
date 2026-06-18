# Tarefa do agente — atualizar placares da Copa 2026

Você é um agente que mantém os placares da fase de grupos no `index.html` deste
repositório (`agenda-copa-2026`). Rode os passos abaixo **na ordem** e pare assim
que possível para economizar custo.

## Passo 1 — Sincronizar e detectar (barato, sem web)

```bash
git pull --rebase origin main
node scripts/gen-fixtures.js          # regenera data/fixtures.json a partir do index.html
node scripts/pending-scores.js        # lista jogos de grupo encerrados e SEM placar
node scripts/pending-ko.js            # lista vagas do mata-mata já decididas e SEM time real
```

`pending-scores.js` e `pending-ko.js` imprimem um JSON cada. **Se os dois forem `[]`
(vazios), ENCERRE agora** — não busque nada, não commite. Esse é o caso da maioria
dos disparos.

Cada item pendente tem: `num`, `group`, `home`, `away`, `date`, `brt`.
Importante: `home` é o mandante (1º número do placar) e `away` o visitante (2º).

## Passo 2 — Buscar e confirmar o placar (só para os pendentes)

Para **cada** jogo da lista:

1. `WebSearch` por algo como:
   `"<home> x <away> Copa do Mundo 2026 resultado <date>"`
   (e/ou em inglês: `"<home> vs <away> World Cup 2026 final score"`).
2. Aceite o placar **somente se**:
   - o jogo está **ENCERRADO** (não "ao vivo"/"agendado"); e
   - **pelo menos 2 fontes independentes e confiáveis concordam** no placar final
     (ex.: ESPN, FIFA.com, ge.globo, CNN Brasil, Sofascore, FOX Sports).
3. Se não houver confirmação clara (jogo em andamento, fontes divergentes),
   **pule** esse jogo — ele será tentado de novo no próximo disparo.
4. Defina `golsCasa` = gols do `home`, `golsFora` = gols do `away`
   (atenção à ordem: o mandante é o `home` do fixture, não necessariamente o time
   citado primeiro na manchete).

## Passo 3 — Gravar cada placar confirmado

Para cada jogo confirmado:

```bash
node scripts/apply-score.js <num> <golsCasa> <golsFora>
```

O script mescla no objeto `SCORES` do `index.html`, preserva os existentes e
ordena por número do jogo. **Nunca** sobrescreva um placar já presente.

## Passo 3.5 — Preencher times do mata-mata já classificados (3ª rodada em diante)

`pending-ko.js` lista as **vagas** do mata-mata cuja origem já está decidida e que
ainda não têm o time real em `KO_TEAMS`. Cada item tem: `num` (jogo), `side`
(`h` = mandante, `a` = visitante), `phase` e `desc` (ex.: "1º colocado do Grupo K",
"vencedor do jogo M74 (Brasil x ...)").

Uma vaga só aparece quando dá para resolvê-la:
- **pos** (1º/2º de um grupo): quando todos os jogos daquele grupo têm placar;
- **3rd** (melhor terceiro): quando **todos** os 12 grupos terminaram;
- **win/lose** (vencedor/perdedor de Mx): quando Mx já tem os dois times e já foi
  disputado (inclusive pênaltis).

Para **cada** vaga da lista:

1. `WebSearch` para descobrir qual seleção a ocupa (ex.: "1º colocado Grupo K Copa
   2026", "quem venceu M74 / oitavas ..."). Para vencedor/perdedor, o jogo precisa
   estar **ENCERRADO** (conte o vencedor de pênaltis como o classificado).
2. Aceite **somente** com pelo menos 2 fontes confiáveis concordando (FIFA.com,
   ESPN, ge.globo, CNN Brasil, Sofascore). Na dúvida, **pule** — tenta no próximo.
3. Grave com o **código** do time (chave em inglês de `PT`/`FL`, ex.: `Colombia`,
   `Brazil`, `Italy`), não o nome em português:

```bash
node scripts/apply-ko-team.js <num> <homeCode> <awayCode>
# preencha só um lado com "-" no outro, ex.:  node scripts/apply-ko-team.js 89 Brazil -
```

O script valida o código contra `PT`, mescla em `KO_TEAMS`, preserva as vagas já
gravadas e ordena por nº do jogo. **Nunca** sobrescreva uma vaga já preenchida.

## Passo 4 — Publicar (só se algo mudou)

```bash
git diff --quiet index.html && echo "nada mudou; sem commit" && exit 0
git add index.html
git commit -m "Update scores: <resumo, ex.: M3 Canadá 1-1 Bósnia>"
git push origin main
```

Se nenhum placar foi confirmado neste disparo, **não** faça commit nem push.

## Regras

- **Escopo:** placares da fase de grupos (jogos 1–72) **e** os times reais das
  vagas do mata-mata já decididas (`KO_TEAMS`, da 3ª rodada em diante). Não invente
  placares de mata-mata aqui — só os times que avançam.
- **Idempotência:** os detectores já excluem o que está pronto; nunca sobrescreva
  um placar ou uma vaga já gravada.
- **Conservador:** na dúvida (placar ou classificado), pule — é melhor faltar por
  um disparo do que publicar algo errado.
- **Orientação casa/fora:** sempre use `home`/`away` do `fixtures.json` (placares) e
  o `side` `h`/`a` do `pending-ko.js` (vagas do mata-mata).
- **Códigos de time:** `KO_TEAMS` usa o código em inglês (chave de `PT`/`FL`), não o
  nome em português.
