# Fitness Orbit V2.2 — Fit Music multiplataforma

O módulo Música aceita quatro origens: **YouTube, SoundCloud, Spotify e Audius**, além dos arquivos de áudio locais. A seleção da plataforma fica acima do campo para colar links.

## Reprodução no próprio site
- **YouTube:** player incorporado com IFrame Player API; navegador pode exigir ação do usuário e alguns vídeos não permitem incorporação.
- **SoundCloud:** widget oficial com controles de reproduzir/pausar, volume e posição da faixa. Use links públicos de faixas ou playlists do SoundCloud.
- **Spotify:** player incorporado oficial. Use links `open.spotify.com/track/...`, `playlist/...`, `album/...`, `episode/...` ou `show/...`. A reprodução completa depende da plataforma e da conta; controles no próprio widget.
- **Audius:** player incorporado com links oficiais `/embed/track/...` ou `/embed/playlist/...`. Para links normais, o app tenta obter a incorporação via oEmbed; se não conseguir, copie o link de incorporação no Audius. Controles dentro do widget.
- **Áudio local:** arquivos temporários do dispositivo, selecionados a cada sessão.

**Salvar uma playlist não interrompe o player ativo.** A reprodução muda somente ao clicar em "Ouvir aqui" em outra faixa.

## Atualização no GitHub Pages
1. Exporte um backup no Meu perfil.
2. Substitua o arquivo `index.html` por este.
3. Acesse o site publicado via HTTPS e recarregue com Ctrl+F5.

O armazenamento usa a chave original `fitness-orbit-v1`; playlists antigas do YouTube continuam identificadas como YouTube mesmo sem o novo campo `service`.

**Testes:** sintaxe JavaScript verificada com `node --check`. A reprodução real dos serviços não foi confirmada no navegador por limitações do ambiente; depende da conexão, regras da plataforma e permissões de incorporação.


## V2.3 — Pesquisar músicas
- Nova busca direta no catálogo público do Audius e busca interna das músicas salvas.
- Os resultados têm Ouvir e Salvar, sem interromper o player ao salvar.
- YouTube, SoundCloud e Spotify continuam aceitando links. Busca direta neles exige autenticação/API específica.
- Para obter resultados do Audius é necessário conexão com a internet. Nem todas as faixas permitem incorporação.
