# Fitness Orbit V2.4 — Correções do Fit Music

## Ajustes
- Spotify: integrado à API oficial Spotify iFrame para conectar o botão principal Play/Pausa e acompanhar a posição quando o serviço fornece os eventos. Se não carregar, permanece o player Spotify incorporado.
- SoundCloud: a Widget API agora é carregada antes da criação do iframe, para reduzir erros de inicialização. Play/Pausa, volume e progresso usam os eventos do SoundCloud.
- YouTube: mantida a API IFrame com player interno e identificação de origem HTTPS.
- Audius: mantido o player oficial incorporado. A reprodução é acionada dentro dele; seus comandos não são expostos à página como no SoundCloud.
- MP3: segue com reprodução local.
- Salvar uma faixa ou playlist não recria o player em execução. Adicionar MP3 também não inicia automaticamente uma música.
- Mantida a chave `fitness-orbit-v1` do localStorage para preservar os registros existentes.

## Atualizar
1. Exporte o backup no site atual.
2. Substitua `index.html` no repositório GitHub Pages.
3. Abra o site por HTTPS e recarregue com Ctrl+F5.
4. Adicione links válidos de cada plataforma, abra uma faixa e teste Play/Pausa.

## Limitações
- Navegadores podem bloquear reprodução automática de conteúdo com áudio.
- Algumas faixas/vídeos não permitem incorporação ou exigem login/assinatura. O Spotify pode oferecer apenas prévias em certos contextos.
- Audius exige usar o Play do próprio iframe. Não há um controle universal que substitua as regras de cada serviço.
- O ambiente de validação bloqueou navegação no navegador automatizado, então a reprodução real dos serviços deve ser conferida no endereço HTTPS publicado.
