# Guia de Desenvolvimento - Minha Tize

## 🚀 Como Começar

### 1. Setup Inicial

```bash
# Clonar ou abrir o repositório
cd MinhaTize

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

A aplicação abre em `http://localhost:3000`

## 📝 Workflow de Desenvolvimento

### Criar um Novo Componente

1. **Criar arquivo em `src/components/`**

```tsx
// src/components/MyComponent.tsx
import { FC } from 'react'

interface MyComponentProps {
  title: string
}

const MyComponent: FC<MyComponentProps> = ({ title }) => {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}

export default MyComponent
```

2. **Adicionar testes em `src/__tests__/`**

```tsx
// src/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import MyComponent from '../components/MyComponent'

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

3. **Rodar testes**

```bash
npm test
```

4. **Usar no App.tsx**

```tsx
import MyComponent from './components/MyComponent'

export default function App() {
  return (
    <div>
      <MyComponent title="Hello" />
    </div>
  )
}
```

## 🎨 Estilização com Tailwind

### Usar Classes Tailwind

```tsx
<div className="bg-tize-blue text-white p-4 rounded-lg">
  <h2 className="text-xl font-bold">Título</h2>
</div>
```

### Cores Personalizadas (Definidas em tailwind.config.js)

- `bg-tize-blue` - Azul principal (#0A2F7A)
- `bg-tize-dark` - Azul escuro (#041F5A)
- `bg-tize-gold` - Dourado (#C89B3C)
- `bg-tize-light` - Fundo claro (#F5F7FB)

### Componentes Reutilizáveis (Tailwind)

```tsx
// Botão primário
<button className="btn-primary">Clique aqui</button>

// Botão secundário
<button className="btn-secondary">Cancelar</button>

// Campo input
<input className="input-field" />

// Select
<select className="select-field">...</select>

// Card
<div className="card">...</div>
```

## 🧪 Testes

### Rodar Testes

```bash
# Testes em watch mode
npm test

# Testes com interface UI
npm test:ui

# Cobertura de testes
npm test:coverage
```

### Escrever Testes

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Feature', () => {
  it('should do something', async () => {
    render(<Component />)
    const button = screen.getByRole('button', { name: /click/i })
    await userEvent.click(button)
    expect(screen.getByText(/result/i)).toBeInTheDocument()
  })
})
```

## 📦 Adicionar Dependências

**Importante**: Esta aplicação foi construída para minimizar dependências. Antes de adicionar uma nova lib:

1. Verificar se é realmente necessária
2. Considerar alternativas nativas
3. Avaliar impacto no tamanho do bundle

Para adicionar:

```bash
npm install pacote-novo
npm install --save-dev pacote-dev-novo
```

Atualizar `package.json` manualmente se necessário.

## 🔍 Verificação de Qualidade

```bash
# Type checking
npm run type-check

# Linting (quando configurado)
npm run lint

# Build local
npm run build

# Preview do build
npm run preview
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Conectar repositório no [Vercel](https://vercel.com)
3. Deploy automático em cada push

### Build Manual

```bash
# Gerar build otimizado
npm run build

# Arquivo dist/ está pronto para upload
```

## 🐛 Debugging

### VS Code

1. Abrir `.vscode/launch.json`
2. Usar configuração de debugging

### Browser

```tsx
// Adicionar logs
console.log('Debug info:', value)

// Usar React DevTools
// Extensão Chrome/Firefox recomendada
```

## 📱 Testes em Mobile

### iPhone
1. Mesmo WiFi que o PC
2. Abrir Safari em `http://<seu-ip>:3000`
3. Adicionar à tela inicial

### Android
1. Mesmo WiFi que o PC
2. Abrir Chrome em `http://<seu-ip>:3000`
3. Menu → "Adicionar à tela inicial"

## 🔒 Acessibilidade

Sempre verificar:

- ✅ Labels em inputs/selects
- ✅ Contraste de cores (WCAG AA)
- ✅ Navegação por teclado (Tab)
- ✅ Semântica HTML (roles, aria-labels)
- ✅ Testes com screen readers

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)

## 💡 Boas Práticas

1. **Commits claros**: Use mensagens descritivas
2. **PR pequenas**: Mudanças focadas são mais fáceis de revisar
3. **Testes primeiro**: Escreva testes junto com o código
4. **Mobile first**: Sempre pensar em celular primeiro
5. **Sem prematurização**: Não adicione features não requisitadas
6. **Documentação**: Mantenha README atualizado

---

**Última atualização**: Junho 2026
