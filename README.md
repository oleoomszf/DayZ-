# Sobrevivência Pós-Apocalipse — Multiplayer

Este projeto mantém o jogo Three.js original e adiciona jogadores online sincronizados por Socket.IO. Cada jogador remoto aparece como um personagem 3D com nome.

## 1. Rodar localmente

Requisitos: Node.js 20 ou superior.

No terminal, entre na pasta `server` e execute:

```bash
npm install
npm start
```

O servidor ficará em `http://localhost:3000`. Em outro terminal, sirva a pasta do jogo com um servidor estático (por exemplo, a extensão Live Server do VS Code) e abra a página. Não abra `index.html` diretamente como `file://`.

O arquivo `server-config.js` já aponta para `http://localhost:3000`. Abra duas abas ou dois navegadores para testar.

## 2. Publicar no GitHub + hospedar o servidor

O GitHub Pages hospeda apenas os arquivos do jogo; ele não mantém um processo Node.js ligado.

1. Envie o conteúdo desta pasta para um repositório GitHub.
2. Publique a pasta principal como site estático pelo GitHub Pages.
3. Publique a pasta `server` em um serviço que execute Node.js (por exemplo, Render, Railway ou Fly.io). Configure o comando de instalação `npm install` e o comando de início `npm start`.
4. Copie a URL HTTPS gerada para o servidor.
5. Edite `server-config.js` e troque `http://localhost:3000` pela URL HTTPS do servidor, sem barra no final.
6. Faça commit e push. Recarregue o GitHub Pages.

Se configurar `CORS_ORIGIN` no servidor, use a URL do seu GitHub Pages, por exemplo `https://SEU-USUARIO.github.io`. Para testes, o padrão permite qualquer origem.

## O que está sincronizado nesta versão

- Entrada/saída de jogadores e lista de jogadores online.
- Nome, posição, altura e rotação dos jogadores em tempo real.
- Avatares 3D dos outros jogadores.

## Limitação importante desta primeira versão

Zumbis, loot, tiros, dano, inventário, fome/sede e ciclo dia/noite ainda são simulados separadamente em cada navegador. Esta entrega implementa o núcleo de presença e movimentação multiplayer; para cooperação completa, a próxima etapa é mover a lógica de zumbis, loot, dano e inventário para o servidor autoritativo.
