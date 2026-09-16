# Echevia (web)

App para gerenciar uma coleção de suculentas. Esta é a interface em React, publicada como PWA: abre no navegador e também pode ser instalada no celular (Android/iOS/tablet) em modo standalone, com aparência de aplicativo nativo.

Os dados desta etapa são **mock** (coleção de exemplo + persistência local). As fotos de exemplo estão em `public/mock` (Pexels). A identificação de espécies chama a API Laravel (`echevia-api`), que por sua vez fala com a PlantNet.

## API

No `.env.local`, `VITE_API_URL` vazio faz o Vite encaminhar `/api` para `http://127.0.0.1:8000`. Em produção (`.env.production`):

`VITE_API_URL=https://marketingcriativa.com.br/clientes/echevia/echevia-api/public`

## Hospedagem (HostGator)

A pasta pública deve receber o **build** (`npm run build` → conteúdo de `dist/`), não o código-fonte React. Sem Node na hospedagem, o build é local.

```bash
npm install
npm run build
```

Envie o conteúdo de `dist/` para `public_html/echevia`. Pasta em 755, arquivos em 644.

URL: https://marketingcriativa.com.br/echevia/

Não clone o repositório fonte nessa pasta: o `index.html` do Git ainda aponta para `/src/main.tsx` e não roda no Apache.

## Stack

- React 19 + Vite + TypeScript
- React Router
- PWA (`manifest.webmanifest` + service worker)
- Paleta: verde (principal), rosa, laranja, lilás, roxo e azul anil

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço local (em geral `http://localhost:5173`). No celular da mesma rede, use o IP que o Vite mostrar, depois **Adicionar à tela inicial**.

## Funcionalidades atuais

- Galeria de fotos em grade (estilo perfil/instagram, com paleta própria)
- Vídeos verticais de até 30s
- Favoritar na ficha da planta (coração na grade)
- Contadores no topo: fotos e vídeos
- Cadastro/edição de planta: nome, espécie, família botânica, identificação alfanumérica, observações
- Até 6 fotos, uma marcada como principal, com slides quando houver 2 ou mais
- Câmera do aparelho (`capture`) ou galeria
- Compartilhar ficha pelo menu nativo do sistema (Web Share) ou copiar link
- Página pública `/p/:identificacao` com fotos protegidas contra download pelo menu do navegador (melhor esforço: prints ainda são possíveis)

## Licença

MIT
