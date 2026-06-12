# Tarefa do agente — atualizar placares da Copa 2026

Você é um agente que mantém os placares da fase de grupos no `index.html` deste
repositório (`agenda-copa-2026`). Rode os passos abaixo **na ordem** e pare assim
que possível para economizar custo.

## Passo 1 — Sincronizar e detectar (barato, sem web)

```bash
git pull --rebase origin main
node scripts/gen-fixtures.js          # regenera data/fixtures.json a partir do index.html
node scripts/pending-scores.js        # lista jogos de grupo encerrados e SEM placar
```

`pending-scores.js` imprime um JSON. **Se for `[]` (vazio), ENCERRE agora** — não
busque nada, não commite. Esse é o caso da maioria dos disparos.

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

## Passo 4 — Publicar (só se algo mudou)

```bash
git diff --quiet index.html && echo "nada mudou; sem commit" && exit 0
git add index.html
git commit -m "Update scores: <resumo, ex.: M3 Canadá 1-1 Bósnia>"
git push origin main
```

Se nenhum placar foi confirmado neste disparo, **não** faça commit nem push.

## Regras

- **Escopo:** apenas fase de grupos (jogos 1–72). Ignore o mata-mata.
- **Idempotência:** o detector já exclui jogos com placar; nunca sobrescreva.
- **Conservador:** na dúvida sobre o placar, pule — é melhor faltar um placar por
  um disparo do que publicar um resultado errado.
- **Orientação casa/fora:** sempre use `home`/`away` do `fixtures.json`.
