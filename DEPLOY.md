# 🚀 Checklist de Deploy - Minha Tize

Use este checklist antes de fazer deploy para produção.

## ✅ Pré-Deploy

- [ ] Todos os testes passam: `npm test`
- [ ] Sem warnings de TypeScript: `npm run type-check`
- [ ] Build local sucesso: `npm run build`
- [ ] Nenhuma console.log de debug no código
- [ ] Nenhuma variável de ambiente sensível no código
- [ ] README.md atualizado
- [ ] Ícone e PWA manifest verificados
- [ ] Service Worker funcionando
- [ ] Testado em mobile (iPhone e Android)

## 🌐 Deploy no Vercel

### Primeira vez

1. Fazer login em [vercel.com](https://vercel.com)
2. Conectar repositório GitHub
3. Vercel detecta automaticamente:
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Cada Push

- [ ] Fazer commit com mensagem clara
- [ ] Push para GitHub
- [ ] Vercel automaticamente faz deploy
- [ ] Verificar URL do deploy nos emails

### Configurações Recomendadas

- **Framework**: React (autodetectado)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

## 🔐 Segurança

- [ ] HTTPS ativado (automático no Vercel)
- [ ] Headers de segurança configurados (`vercel.json`)
- [ ] Sem dados sensíveis em `.env`
- [ ] `.env` adicionado ao `.gitignore`

## 📊 Pós-Deploy

### Verificações

- [ ] Acessar URL do Vercel
- [ ] Testar em mobile
- [ ] Testar offline (PWA)
- [ ] Verificar ícone
- [ ] Verificar manifest.json
- [ ] Testar calculadora com todos os valores

### Performance

- [ ] Vercel Analytics ativado (opcional)
- [ ] Lighthouse score verificado
- [ ] Bundle size aceitável

### PWA

- [ ] Ícone aparece na tela inicial
- [ ] Aplicativo funciona offline
- [ ] Manifest carrega corretamente
- [ ] Service Worker registrado

## 🐛 Troubleshooting

### Build falha

```bash
# Limpar cache local
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de deploy

1. Verificar logs no Vercel Dashboard
2. Verificar `.env` e `.env.local`
3. Verificar Node.js version
4. Redeployar do Vercel Dashboard

### PWA não funciona

1. Verificar `/public/manifest.json`
2. Verificar `/public/sw.js`
3. Verificar `/public/icon-*.png` existem
4. Verificar `index.html` link para manifest

## 📝 Versionamento

Usar [Semantic Versioning](https://semver.org/):

- `1.0.0` - Release inicial
- `1.0.1` - Bug fixes
- `1.1.0` - Nova feature
- `2.0.0` - Breaking changes

## 📧 Comunicação

Após deploy bem-sucedido:

- [ ] Testar em produção
- [ ] Confirmar funcionamento
- [ ] Notificar usuários (se houver mailing)

## 🔄 Processo Contínuo

### Rollback (se necessário)

1. Ir para Vercel Dashboard
2. Deployments → Select version
3. Click "Redeploy"

### Monitor em Produção

- Verificar Vercel Analytics
- Monitorar erro de usuários
- Coletar feedback

## 📚 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Criado em**: Junho 2026
**Última revisão**: Junho 2026
