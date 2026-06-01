# releases/

Esta pasta é local — os arquivos ZIP aqui não são commitados no repositório.

Os releases oficiais ficam em:
→ https://github.com/gamutsbr/snappage/releases

## Como gerar um release

1. Certifique que `src/manifest.json` está com a versão correta
2. Crie o ZIP: `zip -r releases/snappage-vX.X.X.zip src/`
3. Crie a tag: `git tag vX.X.X && git push origin vX.X.X`
4. No GitHub: Releases → Draft a new release → anexe o ZIP
