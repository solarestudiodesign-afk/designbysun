# Núcleo · Studio Sun

Sistema de gestão do Studio Sun: clientes, serviços, projetos, aprovações, contratos, financeiro, relatórios, SUNtendências, agenda, biblioteca e configurações.

Feito só com HTML, CSS e JavaScript — não precisa instalar nada.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie todos os arquivos desta pasta (o `index.html` precisa ficar na raiz).
2. No repositório: **Settings › Pages › Build and deployment › Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)` e salve.
3. Em 1 ou 2 minutos o site fica no ar em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Testar no computador
```bash
python3 -m http.server 5173
```
Depois abra `http://localhost:5173`.

## Importante
- Os dados ficam salvos no navegador de quem usa (localStorage). Use **Configurações › Backup** para exportar e levar para outro aparelho.
- O leitor de brand kit funciona sem IA. Para a leitura com IA, cole sua chave da API da Anthropic em "ligar IA" — ela fica salva só no seu navegador. Se o repositório for público, nunca coloque a chave dentro do código.
- `assets/teste-manual.pdf` é um manual de exemplo para testar o leitor de brand kit.
