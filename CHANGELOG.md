# Changelog

Todas as mudanças notáveis do SnapPage são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/).

---

## [Não lançado]

### Planejado para v1.1.0

- Atalho de teclado global (`Alt+Shift+S`)
- Formato WebP
- Opção de captura em alta resolução (2×)

---

## [1.0.1] — 2026-06-01

### Corrigido

- Adicionado bloco top-level `icons` no `src/manifest.json` para exibir corretamente o ícone do SnapPage em `chrome://extensions`.
- Corrigida a versão exibida no popup para acompanhar automaticamente a versão do `src/manifest.json`.

### Documentação e empacotamento

- Adicionado `LEIA-ME.txt` com instruções de instalação manual para usuários que baixam o pacote da release.
- Padronizada a estrutura recomendada do pacote de release para incluir a pasta `src/` e instruções na raiz.

---

## [1.0.0] — 2026-05-31

### Lançamento público inicial

- Licença PolyForm Noncommercial — uso livre, monetização não permitida
- Captura de página inteira via Chrome Debugger API (`captureBeyondViewport`)
- Captura de área visível apenas
- Formatos PNG e JPEG com slider de qualidade (10–100%)
- Delay configurável antes da captura: 1s, 3s, 5s
- Download automático com nome inteligente (`titulo_data_hora.ext`)
- Cópia direto para área de transferência
- Prévia da captura com dimensões em pixels
- Persistência de todas as configurações entre sessões (`chrome.storage.local`)
- Status visual animado (pronto / aguardando / capturando)
- Compatível com Chrome, Brave, Edge e demais navegadores Chromium
