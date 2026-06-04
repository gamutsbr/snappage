# SnapPage — Full Page Screenshot

> Full page screenshot capture tool for Chrome & Chromium browsers — by Gamuts

![SnapPage popup](docs/screenshot.png)

---

Desenvolvida pela [Gamuts](https://gamuts.com.br) — apps, ferramentas e jogos digitais independentes.

---

## Instalação

### Via Chrome Web Store

_(em breve)_

### Manual via GitHub Releases

> No GitHub Releases, baixe o asset `snappage-vX.X.X.zip`. Os arquivos automáticos "Source code" são voltados para desenvolvedores.

1. Baixe o arquivo `snappage-vX.X.X.zip` no [último release](../../releases/latest) e descompacte
2. Abra `chrome://extensions` (ou `brave://extensions`, `edge://extensions`)
3. Ative **Modo do desenvolvedor** → **Carregar sem compactação**
4. Selecione a pasta `src/` dentro da pasta descompactada

---

## Funcionalidades

- **Página completa** — captura tudo, incluindo o que está abaixo do fold
- **Visível apenas** — captura somente a área visível na tela
- **PNG, JPEG ou WebP** — escolha o formato da captura
- **Resolução 1× ou 2×** — capture em tamanho normal ou alta resolução
- **Delay configurável** — 1s, 3s ou 5s antes de capturar (útil para hover states e animações)
- **Download** com nome automático: `titulo-da-pagina_2026-05-31_14-22-05.png`
- **Copiar para clipboard** — cola direto no Figma, Notion, onde quiser
- **Prévia** — visualiza a captura com dimensões antes de decidir o que fazer
- **Persistência** — suas configurações são lembradas entre sessões

---

## Compatibilidade

| Navegador             | Suporte                |
| --------------------- | ---------------------- |
| Chrome                | ✅                     |
| Brave                 | ✅                     |
| Edge                  | ✅                     |
| Opera / Vivaldi / Arc | ✅                     |
| Firefox               | ❌ (API diferente)     |
| Safari                | ❌ (sistema diferente) |

---

## Como funciona

Usa a **Chrome Debugger API** com `Page.captureScreenshot` e `captureBeyondViewport: true` — o mesmo mecanismo interno do DevTools. O Chrome renderiza a página inteira sem precisar rolar nada.

> Observação: a captura de página completa é validada com o zoom do navegador em 100%. Em alguns sites, zoom diferente de 100% pode causar corte ou sobra de área no final da imagem.

> Durante a captura aparece brevemente a barra "DevTools conectado". É normal e desaparece em menos de 1 segundo.

---

## Documentação do projeto

- [Roadmap](docs/ROADMAP.md) — direção de produto, próximas fases e épicos futuros
- [Checklist de release](docs/RELEASE_CHECKLIST.md) — processo de QA, empacotamento e publicação
- [Changelog](CHANGELOG.md) — histórico de versões publicadas

---

## Roadmap resumido

- [x] v1.0.0 — MVP: captura completa, formatos, delay, download, clipboard, persistência
- [x] v1.0.1 — Correções de ícone, versão no popup e empacotamento
- [x] v1.1.0 — QA baseline, checklist e automação de release
- [ ] Futuro — WebP, captura 2×, atalhos, captura por elemento, seleção livre, anotações e Chrome Web Store

Veja o roadmap completo em [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Licença

[PolyForm Noncommercial](LICENSE) — use e modifique livremente para fins pessoais e não-comerciais. Monetização não é permitida. Para uso comercial, entre em contato.

---

## Contato

Dúvidas, sugestões ou feedback:

- Site: [gamuts.com.br](https://gamuts.com.br)
- E-mail: [contato@gamuts.com.br](mailto:contato@gamuts.com.br)
- Issues: [github.com/gamutsbr/snappage/issues](https://github.com/gamutsbr/snappage/issues)

---

_Feito com atenção pela [Gamuts](https://gamuts.com.br)_
