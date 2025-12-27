# 🗄️ Como Configurar o Banco de Dados

## ⚠️ Erro Atual

O servidor está mostrando: `Database not available`

Isso acontece porque o `DATABASE_URL` não está configurado no arquivo `.env`.

## 📋 Solução Rápida

### Opção 1: MySQL Local

Se você tem MySQL instalado localmente:

1. Crie um arquivo `.env` na raiz de `michels-travel/`
2. Adicione:
   ```env
   DATABASE_URL=mysql://usuario:senha@localhost:3306/michels_travel
   ```
3. Substitua:
   - `usuario` - seu usuário MySQL (geralmente `root`)
   - `senha` - sua senha MySQL
   - `michels_travel` - nome do banco de dados (pode ser qualquer nome)

4. Crie o banco de dados:
   ```sql
   CREATE DATABASE michels_travel;
   ```

5. Execute a migração:
   ```bash
   pnpm db:push
   ```

6. Reinicie o servidor:
   ```bash
   pnpm dev
   ```

### Opção 2: SQLite (Mais Simples para Desenvolvimento)

Se você não tem MySQL, podemos configurar SQLite (mais fácil para começar):

1. Instale o driver SQLite:
   ```bash
   pnpm add better-sqlite3
   pnpm add -D @types/better-sqlite3
   ```

2. Configure o `DATABASE_URL`:
   ```env
   DATABASE_URL=sqlite:./database.db
   ```

3. Execute a migração:
   ```bash
   pnpm db:push
   ```

### Opção 3: Usar Banco de Dados Online (Gratuito)

Você pode usar serviços gratuitos como:
- **PlanetScale** (MySQL gratuito)
- **Supabase** (PostgreSQL gratuito)
- **Railway** (MySQL/PostgreSQL gratuito)

## 🔧 Configuração Mínima para Testar Login

Para testar o login sem banco de dados completo, você precisa pelo menos:

```env
DATABASE_URL=mysql://root:senha@localhost:3306/michels_travel
JWT_SECRET=qualquer-string-secreta-aqui-minimo-32-caracteres
```

## ✅ Depois de Configurar

1. Reinicie o servidor
2. Tente fazer login novamente
3. O erro "Database not available" deve desaparecer

---

**Precisa de ajuda?** Me diga qual opção você prefere e eu ajudo a configurar!

