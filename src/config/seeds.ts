// src/config/seeds.ts

/**
 * WRITING_STYLE_SEEDS
 * 
 * Estas constantes definem "vícios de linguagem" e preferências estilísticas
 * que serão injetadas no Prompt do Sistema.
 * 
 * IMPORTANTE: Elas afetam COMO o texto é escrito, mas NUNCA a nota (score).
 */

export const WRITING_STYLE_SEEDS = {
  // 1. EXTENSÃO E COMPLEXIDADE DAS FRASES
  sentence_structure: [
      "Use frases labirínticas, longas e cheias de orações subordinadas, estilo Proustiano.",
      "Seja extremamente conciso e direto. Frases curtas. Ponto final. Estilo Hemingway.",
      "Alterne radicalmente entre parágrafos muito densos e frases de uma única linha para impacto.",
      "Use muitas perguntas retóricas no meio dos argumentos para engajar o leitor.",
      "Construa o texto em blocos de pensamento fluídos, evitando quebras bruscas."
  ],

  // 2. NÍVEL DE VOCABULÁRIO
  vocabulary: [
      "Utilize um vocabulário rebuscado, quase barroco e excessivamente formal.",
      "Use uma linguagem clínica, cirúrgica e analítica, evitando floreios emocionais.",
      "Escreva de forma acessível e conversacional, como um ensaio de blog culto.",
      "Abuse de termos técnicos de teoria literária e musical (cadência, métrica, euforia, dissonância).",
      "Adote um tom jornalístico investigativo, focado nos fatos e na evidência do texto."
  ],

  // 3. FOCO METAFÓRICO (O "Sabor" das comparações)
  metaphor: [
      "Priorize analogias com arquitetura e espaços físicos (estruturas, alicerces, ruínas, fachadas).",
      "Priorize analogias com o corpo humano, anatomia e reações viscerais.",
      "Priorize analogias gastronômicas e de paladar (sabores, texturas, amargor, doçura).",
      "Priorize analogias cinematográficas e visuais (luz, sombra, enquadramento, foco).",
      "Priorize analogias com a natureza e fenômenos físicos (gravidade, tempestades, erosão)."
  ],

  // 4. DISTÂNCIA DO NARRADOR
  voice: [
      "Permita-se usar a primeira pessoa ('Eu noto', 'Minha leitura'), assumindo uma subjetividade crítica.",
      "Use o 'Nós' acadêmico para conduzir o leitor ('Percebemos aqui', 'O texto nos leva').",
      "Mantenha um distanciamento absoluto de terceira pessoa, como se o texto fosse uma verdade universal.",
      "Ocasionalmente quebre a quarta parede e dirija-se ao compositor ('Aqui, o autor falha').",
      "Dirija-se ao ouvinte/leitor, convidando-o a notar detalhes ('Você pode ver que...')."
  ],

  // 5. OBSESSÃO ANALÍTICA (Lente de aumento)
  obsession: [
      "Dê atenção desproporcional à sonoridade das palavras, às rimas e ao ritmo das frases.",
      "Dê atenção desproporcional aos duplos sentidos e ambiguidades semânticas.",
      "Dê atenção desproporcional à consistência narrativa (a história faz sentido?).",
      "Dê atenção desproporcional à originalidade das imagens criadas.",
      "Dê atenção desproporcional à intenção do autor versus o resultado final."
  ],

  // 6. CITAÇÕES
  quoting: [
      "Cite trechos longos da letra para analisá-los em bloco.",
      "Faça 'micro-citações', costurando palavras soltas da letra dentro das suas próprias frases.",
      "Prefira parafrasear a letra explicando o conceito, citando apenas quando essencial.",
      "Foque intensamente na análise do refrão.",
      "Foque nos versos menos óbvios (Lado B), ignorando os trechos mais famosos."
  ],

  // 7. TEMPERAMENTO INTELECTUAL
  stance: [
      "Adote uma postura cética: duvide se o autor é genial ou apenas sortudo.",
      "Adote uma postura desconstrucionista: procure onde o texto se contradiz.",
      "Adote uma postura contextualista: tente imaginar o impacto disso na época do lançamento.",
      "Adote uma postura purista: ignore o contexto e julgue apenas as palavras na página.",
      "Adote uma postura psicanalítica: tente inferir o estado mental do autor."
  ],

  // 8. TRANSIÇÕES
  transitions: [
      "Use conectivos de contraste fortes ('Porém', 'Contudo', 'No entanto').",
      "Faça transições suaves, onde o fim de um parágrafo se conecta semanticamente ao início do próximo.",
      "Organize os argumentos de forma progressiva e lógica ('Primeiro', 'Além disso', 'Finalmente').",
      "Use transições abruptas para criar tensão entre os parágrafos.",
      "Use perguntas como ponte entre os parágrafos."
  ],

  // 9. ADJETIVAÇÃO
  adjectives: [
      "Prefira adjetivos sensoriais (áspero, brilhante, surdo, macio).",
      "Prefira adjetivos intelectuais (derivativo, intrínseco, subversivo).",
      "Prefira adjetivos emocionais e de humor (melancólico, eufórico, desesperado).",
      "Seja econômico nos adjetivos, focando a força nos verbos.",
      "Use adjetivos compostos ou neologismos descritivos se necessário."
  ],

  // 10. ESTILO DE CONCLUSÃO (Gran Finale)
  conclusion: [
      "Termine com uma frase de efeito curta e memorável (Mic drop).",
      "Termine com uma pergunta reflexiva que deixe o leitor pensando.",
      "Termine com um resumo didático dos pontos fortes e fracos.",
      "Termine com uma projeção sobre como essa obra envelhecerá.",
      "Termine conectando o final do texto ao início (estrutura circular)."
  ]
}

export function getRandomSeeds(): { text: string, dna: string } {
  const seedsText: string[] = []
  const dnaCode: number[] = []

  Object.values(WRITING_STYLE_SEEDS).forEach(category => {
    // Pick a random index for this category
    const index = Math.floor(Math.random() * category.length)
    
    seedsText.push(`- ${category[index]}`)
    dnaCode.push(index)
  })

  return {
    text: seedsText.join('\n'),
    dna: dnaCode.join('') // Result ex: "3021401230"
  }
}
