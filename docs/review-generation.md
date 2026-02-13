# 🤖 Sistema de Geração Automática de Reviews

Sistema completo para gerar reviews de letras de músicas usando Gemini API.

---

## 📋 Pré-requisitos

1. **Chave da API Gemini**
   - Obtenha em: https://makersuite.google.com/app/apikey
   - Crie arquivo `.env` na raiz:
   ```bash
   cp .env.example .env
   ```
   - Adicione sua chave:
   ```
   GEMINI_API_KEY=AIza...
   ```

2. **Dependências instaladas**
   ```bash
   pnpm install
   ```

---

## 🎯 Modos de Uso

### **Modo 1: Review Única**

```bash
# Sintaxe
pnpm generate single <artist> <song> <language> <lyrics-file>

# Exemplo
pnpm generate single "Tool" "Parabola" "English" lyrics/parabola.txt
```

**O que acontece:**
1. ✅ Gemini gera a review completa
2. ✅ Salva em `src/content/reviews/tool/parabola.md`
3. ✅ Processa automaticamente (cria artist/album, converte IDs)

---

### **Modo 2: Batch (Múltiplas Reviews)**

```bash
# Sintaxe
pnpm generate batch <input.json>

# Exemplo
pnpm generate batch batch-input.json
```

**Formato do JSON:**
```json
[
  {
    "artist": "Tool",
    "song": "Parabola",
    "album": "Lateralus",
    "year": "2001",
    "genre": "Progressive Metal",
    "language": "English",
    "lyrics": "So familiar and overwhelmingly warm..."
  },
  {
    "artist": "Radiohead",
    "song": "Paranoid Android",
    "album": "OK Computer",
    "year": "1997",
    "genre": "Alternative Rock",
    "language": "English",
    "lyrics": "Please could you stop the noise..."
  }
]
```

**Vantagens do batch:**
- ✅ Processa múltiplas reviews em paralelo (3 por vez por padrão)
- ✅ Respeita rate limits da API
- ✅ Relatório final de sucessos/falhas
- ✅ Continua mesmo se uma review falhar

---

## ⚙️ Configuração Avançada

Edite `scripts/generate-reviews.ts` para ajustar:

```typescript
const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.0-flash-exp',  // Modelo a usar
  outputDir: 'src/content/reviews',
  processScriptPath: 'scripts/process-review.mjs',
}

// Ajustar concorrência no batch
await processBatch(inputs, 3) // 3 reviews simultâneas
```

---

## 📊 Output Esperado

### Console durante geração:

```
📦 Processing batch of 2 reviews (max 3 concurrent)...

🤖 Generating review for "Parabola" by Tool...
💾 Saved to: src/content/reviews/tool/parabola.md
🔄 Processing with conversion script...
✓ Created artist: tool
✓ Created album: lateralus
✅ Converted successfully!
✅ Successfully created review: tool/parabola

🤖 Generating review for "Paranoid Android" by Radiohead...
💾 Saved to: src/content/reviews/radiohead/paranoid-android.md
🔄 Processing with conversion script...
✓ Created artist: radiohead
✓ Created album: ok-computer
✅ Converted successfully!
✅ Successfully created review: radiohead/paranoid-android

📊 Batch Results:
   ✅ Success: 2
   ❌ Failed: 0
```

### Arquivos criados:

```
src/content/
  artists/
    tool.json
    radiohead.json
  albums/
    lateralus.json
    ok-computer.json
  reviews/
    tool/
      parabola.md
    radiohead/
      paranoid-android.md
```

---

## 🔧 Uso Programático

```typescript
import { processReview, processBatch } from './scripts/generate-reviews'

// Single review
await processReview({
  artist: 'Tool',
  song: 'Parabola',
  language: 'English',
  lyrics: '...',
  album: 'Lateralus',
  year: '2001',
  genre: 'Progressive Metal'
})

// Batch
await processBatch([
  { artist: '...', song: '...', ... },
  { artist: '...', song: '...', ... },
], 5) // 5 concurrent
```

---

## 📝 Campos do Input

### Obrigatórios:
- `artist` (string) - Nome do artista
- `song` (string) - Nome da música
- `language` (string) - Idioma ("English", "Portuguese", "French", etc)
- `lyrics` (string) - Letra completa da música

### Opcionais:
- `album` (string) - Nome do álbum
- `year` (string) - Ano de lançamento
- `genre` (string) - Gênero musical

---

## ⚡ Rate Limits & Performance

**Gemini API limits (free tier):**
- 15 requisições/minuto
- 1 milhão tokens/minuto
- 1.500 requisições/dia

**Nosso controle:**
- Máximo 3 reviews simultâneas
- Pausa de 2s entre batches
- ~20-30 reviews/hora com segurança

**Para processar centenas de reviews:**
```bash
# Divida em arquivos menores
pnpm generate batch batch-01.json
# Aguarde 1 minuto
pnpm generate batch batch-02.json
```

---

## 🐛 Troubleshooting

**Erro: "API key not found"**
```bash
# Verifique se .env existe e tem a chave
cat .env
export GEMINI_API_KEY=AIza...
```

**Erro: "Rate limit exceeded"**
- Aguarde 1 minuto
- Reduza concorrência: `processBatch(inputs, 2)`

**Review gerada está incompleta:**
- Aumente timeout no generateContent
- Verifique se a letra não está muito longa (< 5000 chars recomendado)

**Artista/álbum criado com slug errado:**
- Edite manualmente o JSON em `src/content/artists/`
- Delete a review e reprocesse

---

## 🎨 Personalização do Prompt

Edite `SYSTEM_PROMPT` em `generate-reviews.ts`:

```typescript
const SYSTEM_PROMPT = `
# Ajuste cynicism_level
cynicism_level: 7  // Mais cínico

# Altere pesos
emotional_impact: 30%  // Maior peso emocional
thematic_depth: 15%
...
`
```

---

## 📦 Exemplo Completo

```bash
# 1. Configure API key
echo "GEMINI_API_KEY=AIza..." > .env

# 2. Crie arquivo com letras
cat > batch.json << 'EOF'
[{
  "artist": "Pink Floyd",
  "song": "Comfortably Numb",
  "album": "The Wall",
  "year": "1979",
  "genre": "Progressive Rock",
  "language": "English",
  "lyrics": "Hello, is there anybody in there?..."
}]
EOF

# 3. Gera reviews
pnpm generate batch batch.json

# 4. Verifica resultados
ls src/content/reviews/pink-floyd/
cat src/content/artists/pink-floyd.json
```

---

## ✨ Workflow Recomendado

### Para criação manual intensiva:

1. **Prepare letras**
   ```bash
   mkdir lyrics-raw
   # Cole letras em .txt files
   ```

2. **Crie JSON batch**
   ```typescript
   // Pode usar script helper para gerar JSON das letras
   ```

3. **Execute em background**
   ```bash
   nohup pnpm generate batch large-batch.json > generation.log 2>&1 &
   tail -f generation.log
   ```

4. **Revise outputs**
   - Check scores fazem sentido
   - Valide se artist/album estão corretos
   - Edite manualmente se necessário

---

Pronto para gerar reviews em escala! 🚀
