# Tirzepatida Frontend Skill

## Sobre

Esta skill fornece estrutura, padrões, templates e referências de tipos para o desenvolvimento do frontend de uma aplicação de controle e gerenciamento de aplicação de tirzepatida.

## Arquivos da Skill

- **SKILL.md** - Documentação completa da skill com especificações, estrutura de pastas e padrões
- **types-reference.ts** - Tipos TypeScript reutilizáveis para a aplicação
- **README.md** - Este arquivo

## Como Usar Esta Skill

### 1. Referência Rápida de Estrutura
Quando criando novos componentes, siga a estrutura sugerida em `SKILL.md` na seção "Estrutura de Pastas Recomendada"

### 2. Tipos TypeScript
Importe tipos do arquivo `types-reference.ts` para manter consistência:
```typescript
import { User, MedicationApplication, HealthMetric } from '@/types';
```

### 3. Padrões de Desenvolvimento
Consulte `SKILL.md` para:
- Padrões de componentes React
- Gerenciamento de estado
- Tratamento de API
- Testes

## Funcionalidades Esperadas

A aplicação deve incluir (confirmação pendente):

- ✅ Autenticação segura
- ✅ Dashboard com visão geral
- ✅ Agendamento e rastreamento de doses
- ✅ Monitoramento de saúde
- ✅ Perfil e configurações

## Próximas Etapas

Aguardando as especificações completas do projeto para:
1. Finalizar requisitos funcionais
2. Definir fluxos de usuário
3. Iniciar implementação

## Contato e Notas

- Projeto criado em: 1 de junho de 2026
- Stack: React 18+ com TypeScript (sugerido)
- Prioridade de segurança: Alta (dados de saúde)
