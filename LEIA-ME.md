# Fitness Orbit V2.6 — alinhamento e pesquisa musical

## Mudanças
- Correções de responsividade em cards, formulários, grades, Fit Music, listas e controles para desktop e celular.
- Pesquisa por Audius, YouTube, SoundCloud, Spotify, Todas e Minha biblioteca.
- Audius: pesquisa pública (disponibilidade depende do serviço).
- YouTube: requer chave YouTube Data API v3 com restrição de origem HTTP (referer) e API ativada.
- Spotify: requer token OAuth de acesso válido. Para uso público consistente, implementar autorização OAuth PKCE ou backend de credenciais.
- SoundCloud: requer token OAuth válido, sujeito às permissões da API e políticas CORS.
- Credenciais não ficam persistidas e não são incluídas no backup. Não inserir client secret no frontend.
- Resultados com Ouvir/Salvar; salvar não interrompe a faixa atual. Reprodução segue limites de incorporação de cada serviço.

## Publicar
1. Faça backup dos dados no perfil.
2. Atualize `index.html` no GitHub Pages.
3. Recarregue com Ctrl+F5 e abra Fit Music.
4. Para YouTube, Spotify e SoundCloud, abra Configurar pesquisa nas plataformas e informe a credencial apropriada.

Observação: verificações de sintaxe e layout local não comprovam funcionamento de APIs externas; teste no domínio publicado.
