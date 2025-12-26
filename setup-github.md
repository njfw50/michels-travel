# 🚀 Guia para Enviar Projeto para o GitHub

## Passo 1: Criar Repositório no GitHub

1. Acesse [GitHub.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Preencha:
   - **Repository name**: `michels-travel` (ou o nome que preferir)
   - **Description**: (opcional) Descrição do projeto
   - **Visibility**: Escolha **Public** ou **Private**
   - **NÃO marque** "Initialize this repository with a README" (já temos arquivos)
4. Clique em **"Create repository"**

## Passo 2: Copiar a URL do Repositório

Após criar, o GitHub mostrará uma página com instruções. Copie a URL do repositório:
- **HTTPS**: `https://github.com/SEU-USUARIO/michels-travel.git`
- **SSH**: `git@github.com:SEU-USUARIO/michels-travel.git`

## Passo 3: Executar os Comandos

Execute os comandos abaixo no terminal do Cursor (no diretório do projeto):

```powershell
# Adicionar o repositório remoto (substitua pela sua URL)
git remote add origin https://github.com/SEU-USUARIO/michels-travel.git

# Verificar se foi adicionado
git remote -v

# Fazer push dos commits para o GitHub
git push -u origin main
```

## ⚠️ Se der erro de autenticação:

Se pedir usuário/senha, você precisará usar um **Personal Access Token**:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Dê um nome e selecione as permissões: `repo` (todas)
4. Copie o token gerado
5. Use o token como senha quando o Git pedir

## ✅ Verificar

Após o push, acesse seu repositório no GitHub e você verá todos os arquivos!

